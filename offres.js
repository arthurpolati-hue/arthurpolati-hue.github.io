// Offres, prospects et chiffre d'affaires — la partie « business » de l'espace coach.
//
// Aucun appel réseau ici : uniquement les données des offres et les calculs, à
// partir des documents `clients` et `prospects` déjà chargés par coach.html.

import { isoLocal } from './commun.js';

/* ─────────────────────────────── Offres ─────────────────────────────── */
// Reprises de la grille tarifaire. `prix` est le tarif proposé par défaut quand on
// attribue l'offre à un client ; le tarif réel reste modifiable sur la fiche (Full
// sur devis, séances en présentiel supplémentaires en Hybride).
export const OFFRES = [
  { k:'digital', l:'Digital', prix:120, prixMin:120, prixMax:120,
    detail:'Programme individualisé, suivi à distance, support WhatsApp' },
  { k:'hybride', l:'Hybride', prix:180, prixMin:180, prixMax:null, seanceSupp:30,
    detail:'1 séance/semaine en présentiel incluse, +30 € par séance supplémentaire' },
  { k:'full', l:'Full', prix:300, prixMin:300, prixMax:500,
    detail:'Sur devis selon le volume de séances (300 à 500 €)' }
];
export const offreDe = k => OFFRES.find(o => o.k === k) || null;

// Adhérents de la salle partenaire : remise sur le tarif mensuel.
export const REMISE_PARTENAIRE = 0.20;
export const fmtRemise = () => `−${Math.round(REMISE_PARTENAIRE * 100)} %`;

/** Tarif mensuel AVANT remise : le tarif saisi, sinon le prix de l'offre. */
export function tarifBase(c){
  if(!c || !c.offre) return 0;
  if(typeof c.tarif === 'number' && c.tarif >= 0) return c.tarif;
  const o = offreDe(c.offre);
  return o ? o.prix : 0;
}
/** Montant appliqué au tarif, arrondi au centime. */
export const avecRemise = (montant, partenaire) =>
  partenaire ? Math.round(montant * (1 - REMISE_PARTENAIRE) * 100) / 100 : montant;

/**
 * Tarif mensuel effectif (celui qui compte dans le CA). `c.tarif` est TOUJOURS le prix
 * avant remise : la remise partenaire s'applique ici, jamais dans le champ saisi,
 * sinon elle serait déduite deux fois à chaque enregistrement de la fiche.
 */
export function tarifClient(c){
  return avecRemise(tarifBase(c), !!(c && c.partenaire));
}

/* ───────────────────────────── Prospects ───────────────────────────── */
export const ETAPES = [
  { k:'nouveau',        l:'Nouveau contact' },
  { k:'appele',         l:'Appelé' },
  { k:'bilan_planifie', l:'Bilan planifié' },
  { k:'bilan_fait',     l:'Bilan fait' },
  { k:'client',         l:'Devenu client' },
  { k:'perdu',          l:'Perdu' }
];
export const etapeDe = k => ETAPES.find(e => e.k === k) || ETAPES[0];

export const SOURCES = [
  { k:'site',    l:'Site (QR code)' },
  { k:'bouche',  l:'Bouche-à-oreille' },
  { k:'salle',   l:'Rencontré en salle' },
  { k:'reseaux', l:'Réseaux sociaux' },
  { k:'autre',   l:'Autre' }
];
export const sourceDe = k => SOURCES.find(s => s.k === k) || SOURCES[SOURCES.length - 1];

// Date du jour où chaque étape a été atteinte, posée par coach.html au changement
// de statut. Les étapes atteintes se déduisent de ces dates ET du statut courant :
// un prospect « perdu » APRÈS son bilan doit continuer à compter comme bilan fait,
// sinon le taux bilan → coaching serait faussé à chaque refus.
const ORDRE = ['nouveau','appele','bilan_planifie','bilan_fait','client'];
const CLE_DATE = { appele:'appele', bilan_planifie:'bilanPlanifie', bilan_fait:'bilanFait', client:'converti', perdu:'perdu' };
export { CLE_DATE };

export function etapesAtteintes(p){
  const d = (p && p.dates) || {};
  const rang = ORDRE.indexOf(p && p.statut);
  const atteint = (etape, cle) => !!d[cle] || (rang >= 0 && rang >= ORDRE.indexOf(etape));
  const client = atteint('client', 'converti');
  const bilan  = client || atteint('bilan_fait', 'bilanFait');
  const appele = bilan || !!d.bilanPlanifie || atteint('appele', 'appele');
  return { appele, bilan, client, perdu: p && p.statut === 'perdu' };
}

/**
 * Tunnel de conversion sur une période.
 * @param {Array} prospects
 * @param {string|null} depuis  'YYYY-MM-DD' (date de contact) ou null pour tout
 */
export function tunnel(prospects, depuis){
  const liste = (prospects || []).filter(p => !depuis || (p.createdAt || '') >= depuis);
  let appeles = 0, bilans = 0, clients = 0, perdus = 0;
  const parSource = new Map();
  liste.forEach(p=>{
    const e = etapesAtteintes(p);
    if(e.appele) appeles++;
    if(e.bilan) bilans++;
    if(e.client) clients++;
    if(e.perdu) perdus++;
    const s = sourceDe(p.source).k;
    if(!parSource.has(s)) parSource.set(s, { total:0, bilans:0, clients:0 });
    const v = parSource.get(s);
    v.total++; if(e.bilan) v.bilans++; if(e.client) v.clients++;
  });
  const pct = (a, b) => b ? Math.round((a / b) * 100) : null;
  return {
    total: liste.length, appeles, bilans, clients, perdus,
    enCours: liste.length - clients - perdus,
    tauxBilan: pct(bilans, liste.length),      // prospect -> bilan offert
    tauxClient: pct(clients, bilans),          // bilan offert -> coaching
    tauxGlobal: pct(clients, liste.length),
    parSource: [...parSource.entries()]
      .map(([k, v]) => ({ k, l: sourceDe(k).l, ...v }))
      .sort((a, b) => b.total - a.total)
  };
}

/* ─────────────────────────── Chiffre d'affaires ─────────────────────────── */

function isoDe(v){
  if(!v) return null;
  if(typeof v === 'string') return v.slice(0, 10);
  const d = (typeof v.toDate === 'function') ? v.toDate() : new Date(v);
  return isNaN(d) ? null : isoLocal(d);
}
/** Date de début de l'offre : saisie par le coach, sinon date de création du client. */
export const debutOffre = c => (c && (c.offreDepuis || isoDe(c.createdAt))) || null;

/** CA mensuel actuel : clients actifs ayant une offre. */
export function caMensuel(clients){
  const actifs = (clients || []).filter(c => c.actif !== false);
  const avecOffre = actifs.filter(c => offreDe(c.offre));
  const parOffre = OFFRES.map(o=>{
    const cs = avecOffre.filter(c => c.offre === o.k);
    return { k:o.k, l:o.l, nb:cs.length, ca: cs.reduce((n, c) => n + tarifClient(c), 0) };
  });
  const total = parOffre.reduce((n, o) => n + o.ca, 0);
  const partenaires = avecOffre.filter(c => c.partenaire);
  return {
    total,
    nbPartenaires: partenaires.length,
    remises: Math.round(partenaires.reduce((n, c) => n + tarifBase(c) - tarifClient(c), 0) * 100) / 100,
    annuel: total * 12,
    nbPayants: avecOffre.length,
    panierMoyen: avecOffre.length ? Math.round(total / avecOffre.length) : 0,
    parOffre,
    sansOffre: actifs.filter(c => !offreDe(c.offre))
  };
}

const MOIS = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];

/**
 * CA théorique mois par mois, sur les `nbMois` derniers mois (mois en cours inclus).
 * Un client compte dans un mois passé s'il a une offre, qu'elle a commencé avant la fin
 * du mois, et qu'il n'était pas déjà en pause au début du mois.
 * Le MOIS EN COURS suit la règle de caMensuel() (clients actifs aujourd'hui) : le
 * dernier point de la courbe doit être égal au CA mensuel affiché. Sans ça, un client
 * mis en pause le 1er du mois gonflait la courbe par rapport au chiffre du dessus.
 * ⚠️ Estimation : le tarif actuel est appliqué à tout l'historique (un changement de
 * tarif n'est pas daté), et une pause suivie d'une reprise n'est pas retirée des
 * mois intermédiaires.
 */
export function caHistorique(clients, nbMois = 12, reference = new Date()){
  const out = [];
  for(let i = nbMois - 1; i >= 0; i--){
    const debutMois = new Date(reference.getFullYear(), reference.getMonth() - i, 1);
    const finMois = new Date(reference.getFullYear(), reference.getMonth() - i + 1, 0);
    const d0 = isoLocal(debutMois), d1 = isoLocal(finMois);
    let ca = 0, nb = 0;
    (clients || []).forEach(c=>{
      if(!offreDe(c.offre)) return;
      const debut = debutOffre(c);
      if(!debut || debut > d1) return;
      if(i === 0 && c.actif === false) return;
      if(c.actif === false && c.pauseLe && c.pauseLe < d0) return;
      ca += tarifClient(c); nb++;
    });
    out.push({ mois: d0.slice(0, 7), x: d1, libelle: `${MOIS[debutMois.getMonth()]} ${String(debutMois.getFullYear()).slice(2)}`, ca, nb });
  }
  return out;
}

export const fmtEuros = n => `${Math.round(n || 0).toLocaleString('fr-FR')} €`;
