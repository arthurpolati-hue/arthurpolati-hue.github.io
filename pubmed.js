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

const pause = ms => new Promise(r => setTimeout(r, ms));

// Le NCBI bride à 3 requêtes par seconde et par adresse IP : au-delà, la connexion est
// refusée et `fetch` échoue sans code HTTP. On espace donc les appels et on réessaie une
// fois après une seconde, plutôt que d'afficher une erreur à l'utilisateur.
async function lire(methode, params, texte, essai = 0){
  try{
    const r = await fetch(url(methode, params));
    if(r.status === 429) throw new Error('429');
    if(!r.ok) throw new Error(methode + ' HTTP ' + r.status);
    return texte ? r.text() : r.json();
  } catch(e){
    if(essai >= 1) throw e;
    await pause(1200);
    return lire(methode, params, texte, essai + 1);
  }
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
 * Mots à ignorer dans le classement : ils ne disent rien du sujet.
 */
const MOTS_FAIBLES = new Set(['training', 'exercise', 'exercises', 'performance', 'effects', 'effect',
  'adults', 'athletes', 'muscle', 'muscles', 'study', 'review', 'meta']);

/**
 * Termes de recherche -> mots simples, pour juger si un article parle vraiment du sujet.
 * « "vertical jump" » et « jump* » donnent tous deux « jump ».
 */
export function motsCles(termes){
  const out = new Set();
  (termes || []).forEach(t => {
    String(t).toLowerCase().replace(/"/g, ' ').replace(/\*/g, ' ').split(/[^a-z0-9]+/)
      .filter(m => m.length > 2 && !MOTS_FAIBLES.has(m))
      .forEach(m => out.add(m));
  });
  return [...out];
}

/**
 * Classe les articles par pertinence : un article dont le TITRE contient un mot-clé
 * passe devant, la conclusion compte moins, et à score égal le plus récent gagne.
 * Sans cela, une recherche « pliométrie ou musculation » remontait des études sur
 * l'ashwagandha ou la créatine, simplement parce qu'elles étaient récentes.
 */
export function classer(items, mots){
  if(!mots || !mots.length) return items;
  const score = it => {
    const titre = (it.titre || '').toLowerCase();
    const concl = (it.conclusion || '').toLowerCase();
    let n = 0;
    mots.forEach(m => {
      if(titre.includes(m)) n += 3;
      else if(concl.includes(m)) n += 1;
    });
    return n;
  };
  return items
    .map(it => ({ it, s: score(it) }))
    .sort((a, b) => b.s - a.s || String(b.it.date).localeCompare(String(a.it.date)))
    .map(x => Object.assign(x.it, { pertinence: x.s }));
}

/**
 * Comparaison « A vs B » : on alterne entre les groupes de mots-clés pour que chaque
 * côté soit représenté.
 * ⚠️ Ne suffit pas seul : si PubMed ne renvoie aucun article du côté le moins étudié,
 * il n'y a rien à équilibrer. D'où `chercherComparaison()`, qui interroge chaque côté
 * séparément.
 * @param groupes tableau de listes de termes (un par idée cherchée)
 */
export function equilibrer(items, groupes, nb){
  const listes = (groupes || []).map(g => {
    const mots = motsCles(g);
    return items.filter(it => mots.some(m => (it.titre || '').toLowerCase().includes(m)));
  }).filter(l => l.length);
  if(listes.length < 2) return items.slice(0, nb);
  const choisis = [];
  const vus = new Set();
  // Tourniquet : un article du premier groupe, un du deuxième, et ainsi de suite.
  for(let tour = 0; choisis.length < nb && tour < 50; tour++){
    let ajoute = false;
    for(const liste of listes){
      const suivant = liste.find(it => !vus.has(it.pmid));
      if(suivant){
        vus.add(suivant.pmid);
        choisis.push(suivant);
        ajoute = true;
        if(choisis.length >= nb) break;
      }
    }
    if(!ajoute) break;
  }
  // On complète avec le reste si un côté manque d'articles.
  items.forEach(it => { if(choisis.length < nb && !vus.has(it.pmid)){ vus.add(it.pmid); choisis.push(it); } });
  return choisis;
}

/**
 * Recherche complète.
 * @param {string} requete  requête en syntaxe PubMed, filtres compris
 * @param {object} options  { nb, tri: 'pertinence'|'date', termes: [], groupes: [[...]], equilibre: bool }
 * @returns {{total:number, items:Array}}
 */
export async function chercher(requete, options = {}){
  const { nb = 10, tri = 'date', termes = [], groupes = [], equilibre = false } =
    (typeof options === 'number') ? { nb: options } : options;
  // PubMed sait trier par pertinence : on le laisse faire le gros du travail, puis on
  // reclasse nous-mêmes sur les mots effectivement cherchés.
  const rech = await lire('esearch.fcgi', {
    retmode: 'json', retmax: String(tri === 'pertinence' ? Math.max(nb, 25) : nb),
    sort: tri === 'pertinence' ? 'relevance' : 'date', term: requete
  });
  const res = (rech && rech.esearchresult) || {};
  const ids = res.idlist || [];
  const total = parseInt(res.count, 10) || 0;
  if(!ids.length) return { total, items: [] };

  // Les deux appels suivants sont faits L'UN APRÈS L'AUTRE, avec une pause : en parallèle,
  // trois requêtes partaient dans la même seconde et le NCBI coupait la connexion.
  await pause(350);
  const resume = await lire('esummary.fcgi', { retmode: 'json', id: ids.join(',') });
  await pause(350);
  const xml = await lire('efetch.fcgi', { retmode: 'xml', id: ids.join(',') }, true);

  let conclusions = new Map();
  try{ conclusions = resumesDepuisXml(xml); }
  catch(e){ console.warn('[ARD] Résumés PubMed illisibles', e); }

  const r = (resume && resume.result) || {};
  let items = ids.map(id => {
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

  if(tri === 'pertinence'){
    const mots = motsCles(termes);
    items = classer(items, mots);
    // Un article dont le titre ne contient aucun mot cherché n'a rien à faire en tête :
    // on ne le garde que s'il n'y a pas mieux.
    const bons = items.filter(x => x.pertinence >= 3);
    items = bons.length >= 3 ? bons : items;
    items = equilibre ? equilibrer(items, groupes, nb) : items.slice(0, nb);
  }
  return { total, items };
}

/**
 * Comparaison : une recherche PAR CÔTÉ, puis on entrelace.
 * « pliométrie vs musculation » interrogé en une seule requête OU ne ramenait que de la
 * musculation, bien plus étudiée : les articles de pliométrie n'apparaissaient nulle part.
 * Les recherches sont faites À LA SUITE (limite de 3 requêtes par seconde du NCBI).
 * @param {string[]} requetes une requête complète par côté
 */
export async function chercherComparaison(requetes, options = {}){
  const { nb = 10, termes = [] } = options;
  const parCote = [];
  let total = 0;
  for(const r of requetes){
    try{
      const res = await chercher(r, { nb: Math.max(4, Math.ceil(nb / requetes.length) + 2), tri: 'pertinence', termes });
      total += res.total;
      if(res.items.length) parCote.push(res.items);
    } catch(e){
      console.warn('[veille] un côté de la comparaison a échoué', e);
    }
    await pause(400);
  }
  if(!parCote.length) return { total: 0, items: [] };
  // Tourniquet : un article de chaque côté, à tour de rôle.
  const items = [];
  const vus = new Set();
  for(let i = 0; items.length < nb && i < 40; i++){
    let ajoute = false;
    for(const liste of parCote){
      const suivant = liste.find(x => !vus.has(x.pmid));
      if(suivant){
        vus.add(suivant.pmid);
        items.push(suivant);
        ajoute = true;
        if(items.length >= nb) break;
      }
    }
    if(!ajoute) break;
  }
  return { total, items };
}

/** Lien vers l'article : le DOI si on l'a, sinon la fiche PubMed. */
export const lienArticle = it => it.doi
  ? 'https://doi.org/' + encodeURI(it.doi)
  : 'https://pubmed.ncbi.nlm.nih.gov/' + encodeURIComponent(it.pmid) + '/';
