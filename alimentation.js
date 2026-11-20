/* ═══════════════════════════════════════════════════════════════════════════
   ALIMENTATION — logique commune à s.html (journal du client) et coach.html
   ═══════════════════════════════════════════════════════════════════════════
   Aucune dépendance Firebase ici : les pages passent leurs propres fonctions.

   Sources d'aliments :
   - `ciqual.json` : table Ciqual 2020 de l'ANSES (Licence Ouverte), ~3 100 aliments
     génériques, valeurs pour 100 g. Fichier statique : la recherche ne coûte aucune
     lecture Firestore et marche hors ligne une fois chargée. Régénéré par
     `outils/ciqual2json.py` (voir PROJET.md).
   - `aliments/coach` : les aliments et recettes ajoutés par le coach (un seul document,
     lisible par le lien client), proposés en premier dans la recherche.

   Une ligne du journal recopie ses valeurs pour 100 g : le journal reste juste même
   si la base change ensuite (comme une facture recopie l'identité du client).
*/
import { norm } from './commun.js';

export const REPAS = [
  ['petitdej',  'Petit-déjeuner'],
  ['dejeuner',  'Déjeuner'],
  ['collation', 'Collation'],
  ['diner',     'Dîner'],
];

/** Ce que le client voit, réglé par le coach sur sa fiche. */
export const AFFICHAGES = [
  ['complet',   'Calories et macros'],
  ['proteines', 'Calories et protéines'],
  ['journal',   'Aucun chiffre (seulement le journal)'],
];

export const journalVide = () => Object.fromEntries(REPAS.map(([k]) => [k, []]));

/* ────────────────────────────── Base Ciqual ────────────────────────────── */

let ciqualPromesse = null;
/** Charge la table une seule fois. Renvoie [] si le fichier est inaccessible. */
export function chargerCiqual(){
  if(!ciqualPromesse){
    ciqualPromesse = fetch('./ciqual.json')
      .then(r => { if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(d => d.aliments.map(([code, nom, kcal, p, g, l, f, grp, calc]) => ({
        id: 'c' + code, nom, kcal, p: p ?? 0, g: g ?? 0, l: l ?? 0, f: f ?? 0,
        groupe: d.groupes[grp] || '', kcalCalculee: !!calc, src: 'ciqual', cle: norm(nom)
      })))
      .catch(e => { console.error('[ARD] Table Ciqual inaccessible', e); ciqualPromesse = null; return []; });
  }
  return ciqualPromesse;
}

/** Aliments du coach, prêts pour la recherche. `liste` = aliments/coach.liste */
export function alimentsCoach(liste){
  return (liste || []).map(a => ({ ...a, src: 'coach', cle: norm(a.nom) }));
}

/* ─────────────────────────────── Recherche ─────────────────────────────── */

// Mots qui ne disent rien de l'aliment : les ignorer évite que « pâtes au thon »
// exige le mot « au » dans le nom.
const VIDES = new Set(['de','du','des','la','le','les','au','aux','a','en','et','un','une','d','l']);
const mots = t => norm(t).split(/[^a-z0-9]+/).filter(m => m && !VIDES.has(m));

/**
 * Tous les mots tapés doivent se trouver (en début de mot) dans le nom.
 * Classement : aliments du coach d'abord, puis le nom qui COMMENCE par le premier mot
 * (« riz » → « Riz blanc, cuit » avant « Galette de riz »), puis les formes simples
 * (« cru », « cuit ») et les noms les plus courts : le plus générique remonte.
 */
export function rechercher(texte, bases, max = 40){
  const ms = mots(texte);
  if(!ms.length) return [];
  const res = [];
  for(const a of bases){
    const ws = a.cle.split(/[^a-z0-9]+/);
    let ok = true;
    for(const m of ms){
      if(!ws.some(w => w.startsWith(m))){ ok = false; break; }
    }
    if(!ok) continue;
    let score = 0;
    if(a.src === 'coach') score -= 1000;
    if(ws[0].startsWith(ms[0])) score -= 100;
    if(ws[0] === ms[0] || ws[0] === ms[0] + 's') score -= 20;
    if(/\b(cru|cuit|cuite|cuites|nature)\b/.test(a.cle)) score -= 8;
    // Ciqual marque ainsi l'aliment de référence (« Pâtes sèches standard », « Pain, baguette, courante »).
    if(/\b(standard|courant|courante)\b/.test(a.cle)) score -= 8;
    if(/asiatique|infantile|bebe/.test(a.cle)) score += 6;
    if(/preemballe|prelevee|appertise|surgele/.test(a.cle)) score += 6;
    score += a.cle.length / 6;
    res.push([score, a]);
  }
  res.sort((x, y) => x[0] - y[0]);
  return res.slice(0, max).map(x => x[1]);
}

/* ─────────────────────────────── Calculs ───────────────────────────────── */

const n = v => Number(v) || 0;

/** Valeurs d'une ligne du journal pour la quantité mangée. */
export function valeursLigne(ligne){
  const k = n(ligne.q) / 100;
  return { kcal: n(ligne.kcal) * k, p: n(ligne.p) * k, g: n(ligne.g) * k, l: n(ligne.l) * k };
}

export function totauxRepas(lignes){
  const t = { kcal: 0, p: 0, g: 0, l: 0 };
  (lignes || []).forEach(li => {
    const v = valeursLigne(li);
    t.kcal += v.kcal; t.p += v.p; t.g += v.g; t.l += v.l;
  });
  return t;
}

/** Totaux de la journée. `journal` = { petitdej: [...], dejeuner: [...], ... } */
export function totauxJour(journal){
  const t = { kcal: 0, p: 0, g: 0, l: 0, lignes: 0 };
  REPAS.forEach(([k]) => {
    const r = totauxRepas(journal && journal[k]);
    t.kcal += r.kcal; t.p += r.p; t.g += r.g; t.l += r.l;
    t.lignes += ((journal && journal[k]) || []).length;
  });
  return t;
}

/** Ligne du journal à partir d'un aliment de la base et d'une quantité en grammes. */
export function nouvelleLigne(aliment, q, portion){
  return {
    id: Math.random().toString(36).slice(2, 10),
    nom: aliment.nom, src: aliment.src || 'manuel', ref: aliment.id || '',
    q: Math.round(n(q) * 10) / 10,
    kcal: n(aliment.kcal), p: n(aliment.p), g: n(aliment.g), l: n(aliment.l),
    ...(portion ? { portion } : {}),
  };
}

/** Pour l'affichage : 12,5 → « 12,5 » ; 12 → « 12 ». */
export function fmt(v, dec = 0){
  const x = Math.round(n(v) * 10 ** dec) / 10 ** dec;
  return String(x).replace('.', ',');
}
export const kcal = v => fmt(v) + ' kcal';
export const grammes = v => fmt(v, n(v) < 10 ? 1 : 0) + ' g';

/** Lecture d'un nombre saisi (« 12,5 » accepté). null si vide ou invalide. */
export function lireNombre(str){
  const s = String(str ?? '').trim().replace(',', '.');
  if(!s) return null;
  const v = parseFloat(s);
  return isFinite(v) && v >= 0 ? v : null;
}

/** Objectifs exploitables (au moins un nombre), ou null. */
export function objectifsDe(nutrition){
  if(!nutrition) return null;
  const o = { kcal: n(nutrition.kcal), p: n(nutrition.p), g: n(nutrition.g), l: n(nutrition.l) };
  return (o.kcal || o.p || o.g || o.l) ? o : null;
}
