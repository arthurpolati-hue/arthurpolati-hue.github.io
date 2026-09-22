// Accès à PubMed (NCBI E-utilities). Aucun DOM ici, uniquement du réseau et du parsing.
//
// POURQUOI PUBMED ET PLUS EUROPE PMC (22/09/2026) : Europe PMC a cessé d'envoyer
// l'en-tête `Access-Control-Allow-Origin`, et sa requête preflight OPTIONS répond 403.
// Tout navigateur bloque donc la lecture de la réponse — le flux affichait « Impossible
// de joindre Europe PMC » chez tout le monde, alors que l'API répond très bien en ligne
// de commande. Les E-utilities du NCBI renvoient `Access-Control-Allow-Origin: *`.
// Si Europe PMC rétablit le CORS un jour, revenir en arrière est possible : seule cette
// couche et la syntaxe des requêtes changent.
//
// Trois appels par recherche :
//   1. esearch  -> nombre total + identifiants (PMID) des articles ;
//   2. esummary -> titre, revue, date, DOI, type de publication ;
//   3. efetch   -> résumé complet, d'où on extrait la conclusion des auteurs.
// Les appels 2 et 3 portent sur TOUS les identifiants d'un coup (pas un par article).
//
// LIMITES D'USAGE (ncbi.nlm.nih.gov/books/NBK25497) : 3 requêtes par seconde et par
// adresse IP sans clé d'API. On en fait 3 par recherche, mises en cache 12 h côté
// appelant : très en dessous. Ne pas paralléliser plusieurs recherches sans attendre.

const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
const OUTIL = 'ard-coaching';

// Méta-analyses et revues systématiques uniquement, articles rétractés exclus.
export const FILTRE_PUBMED = ' AND (meta-analysis[pt] OR systematic review[pt]) NOT retracted publication[pt]';

// Populations cliniques : hors sujet pour un coach qui suit des personnes en bonne santé.
// Sans ce filtre, « créatine » remonte la créatine kinase en cardiologie.
export const EXCLU_CLINIQUE_PUBMED = ' NOT (patients[ti] OR cancer[ti] OR stroke[ti] OR "heart failure"[ti] '
  + 'OR diabetes[ti] OR COPD[ti] OR dialysis[ti] OR dementia[ti] OR "COVID-19"[ti] OR surgery[ti] '
  + 'OR "spinal cord"[ti] OR "multiple sclerosis"[ti] OR parkinson[ti] OR concussion[ti])';

const url = (methode, params) => BASE + methode + '?' + new URLSearchParams({ db: 'pubmed', tool: OUTIL, ...params });

async function lire(methode, params, texte){
  const r = await fetch(url(methode, params));
  if(!r.ok) throw new Error(methode + ' HTTP ' + r.status);
  return texte ? r.text() : r.json();
}

/** Nettoie un texte de résumé : espaces, balises éventuelles. */
const propre = t => String(t || '').replace(/\s+/g, ' ').trim();

/**
 * Conclusion des auteurs : la section « CONCLUSION(S) » du résumé quand elle existe,
 * sinon les deux dernières phrases. Les mentions d'enregistrement et de financement
 * sont coupées : elles n'apprennent rien et allongent la carte.
 */
export function conclusionDe(sections){
  if(!sections || !sections.length) return '';
  const conclusion = sections.find(s => /CONCLUSION|INTERPRETATION/i.test(s.label || ''));
  let t = conclusion ? conclusion.texte : sections.map(s => s.texte).join(' ').split('. ').slice(-2).join('. ');
  t = propre(t).split(/\s(?:Registration|PROSPERO|Trial registration|Systematic review registration|Protocol registration|Funding|This (?:review|study|work|meta-analysis) (?:received|was (?:funded|supported)))\b/i)[0].trim();
  return t.length > 520 ? t.slice(0, 520).replace(/\s+\S*$/, '') + '…' : t;
}

/** Extrait les résumés d'une réponse efetch (XML), par PMID. */
function resumesDepuisXml(xml){
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const out = new Map();
  doc.querySelectorAll('PubmedArticle').forEach(art => {
    const pmid = art.querySelector('MedlineCitation > PMID');
    if(!pmid) return;
    const sections = Array.from(art.querySelectorAll('Abstract > AbstractText'))
      .map(ab => ({ label: ab.getAttribute('Label') || '', texte: propre(ab.textContent) }));
    out.set(propre(pmid.textContent), sections);
  });
  return out;
}

/**
 * Recherche complète.
 * @param {string} requete  requête en syntaxe PubMed, filtres compris
 * @param {number} nb       nombre d'articles à détailler (10 par défaut)
 * @returns {{total:number, items:Array}}
 */
export async function chercher(requete, nb = 10){
  const rech = await lire('esearch.fcgi', { retmode: 'json', retmax: String(nb), sort: 'date', term: requete });
  const res = (rech && rech.esearchresult) || {};
  const ids = res.idlist || [];
  const total = parseInt(res.count, 10) || 0;
  if(!ids.length) return { total, items: [] };

  // Les deux appels suivants portent sur la même liste d'identifiants : on peut les
  // faire ensemble (2 requêtes simultanées, on reste sous la limite de 3 par seconde).
  const [resume, xml] = await Promise.all([
    lire('esummary.fcgi', { retmode: 'json', id: ids.join(',') }),
    lire('efetch.fcgi', { retmode: 'xml', id: ids.join(',') }, true)
  ]);

  let conclusions = new Map();
  try{ conclusions = resumesDepuisXml(xml); }
  catch(e){ console.warn('[ARD] Résumés PubMed illisibles', e); }

  const r = (resume && resume.result) || {};
  const items = ids.map(id => {
    const a = r[id] || {};
    const ids2 = a.articleids || [];
    const doi = (ids2.find(x => x.idtype === 'doi') || {}).value || '';
    const types = a.pubtype || [];
    return {
      pmid: id,
      titre: propre(a.title).replace(/\.$/, ''),
      auteurs: (a.authors || []).map(x => x.name).filter(Boolean),
      revue: propre(a.source),
      // sortpubdate : « 2026/09/04 00:00 » -> « 2026-09-04 »
      date: propre(a.sortpubdate).slice(0, 10).replace(/\//g, '-'),
      doi,
      types,
      metaAnalyse: types.some(t => /meta-analysis/i.test(t)),
      conclusion: conclusionDe(conclusions.get(id))
    };
  }).filter(x => x.titre);
  return { total, items };
}

/** Lien vers l'article : le DOI si on l'a, sinon la fiche PubMed. */
export const lienArticle = it => it.doi
  ? 'https://doi.org/' + encodeURI(it.doi)
  : 'https://pubmed.ncbi.nlm.nih.gov/' + encodeURIComponent(it.pmid) + '/';
