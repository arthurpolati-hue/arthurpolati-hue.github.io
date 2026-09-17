// Facturation — calculs et mise en forme. Aucun appel réseau, aucun DOM ici.
//
// Ce que dit la loi et qu'on applique (sources : service-public.gouv.fr, fiches
// « Mentions obligatoires sur une facture » et « Franchise en base de TVA », lues le
// 17/09/2026) — ce n'est pas un conseil juridique, Arthur fait valider par son comptable :
//  - identité du vendeur : nom précédé de « Entrepreneur individuel » ou « EI », adresse, SIREN ;
//  - identité du client : nom et adresse ;
//  - numéro de facture UNIQUE et SÉQUENTIEL, sans trou dans la suite ;
//  - date d'émission et date (ou période) de la prestation ;
//  - désignation, quantité, prix unitaire, total ;
//  - en franchise en base : « TVA non applicable, art. 293 B du CGI » et aucune TVA facturée
//    (seuils 2026 pour les services : 37 500 €, seuil majoré 41 250 €) ;
//  - date de règlement, escompte (ou « néant »), pénalités de retard ;
//  - l'indemnité forfaitaire de 40 € ne concerne QUE les clients professionnels.
// Tout ce qui peut changer (mentions, délais, numérotation) est dans les réglages, modifiables
// depuis l'espace coach : rien n'est figé dans le code.

import { offreDe, tarifClient, tarifBase, REMISE_PARTENAIRE, VENTES, venteDe, fmtEuros } from './offres.js';

/* ───────────────────────── Réglages de l'émetteur ───────────────────────── */
// Rangés dans Firestore (`reglages/facturation`), lisibles du seul coach : le dépôt
// GitHub est public, le SIREN et l'adresse n'ont donc rien à y faire.
export const REGLAGES_DEFAUT = {
  nom: '',                                   // « Arthur POLATI »
  statut: 'Entrepreneur individuel',         // mention obligatoire devant le nom
  adresse: '',
  siren: '',
  email: '',
  tel: '',
  activite: 'Coaching sportif',
  mentionTva: 'TVA non applicable, art. 293 B du CGI',
  delaiPaiement: 'À réception de la facture',
  moyenPaiement: 'Virement bancaire',
  escompte: "Pas d'escompte pour paiement anticipé",
  penalites: "En cas de retard de paiement : pénalités au taux d'intérêt légal en vigueur",
  prefixe: 'F',
  prochainNumero: 1
};

/** Ce qui manque pour émettre une facture valable. Renvoie un tableau de libellés. */
export function manquesReglages(r){
  const m = [];
  if(!r || !(r.nom || '').trim()) m.push('ton nom');
  if(!r || !(r.adresse || '').trim()) m.push('ton adresse');
  if(!r || !(r.siren || '').trim()) m.push('ton SIREN');
  if(!r || !(r.mentionTva || '').trim()) m.push('la mention de TVA');
  return m;
}
export const manquesClient = c => (c && (c.adresse || '').trim()) ? [] : ['son adresse'];

/* ───────────────────────────── Numérotation ───────────────────────────── */
// Séquentielle et sans trou : on prend toujours le plus grand numéro déjà émis pour
// l'année, +1. `prochainNumero` des réglages sert seulement de point de départ (utile
// si des factures ont été émises ailleurs avant).
export function numeroSuivant(reglages, factures, date = new Date()){
  const r = { ...REGLAGES_DEFAUT, ...(reglages || {}) };
  const annee = String(date.getFullYear());
  const prefixe = (r.prefixe || '').trim();
  const debut = `${prefixe}${annee}-`;
  let max = Math.max(0, (Number(r.prochainNumero) || 1) - 1);
  (factures || []).forEach(f => {
    const num = String(f.numero || '');
    if(!num.startsWith(debut)) return;
    const n = parseInt(num.slice(debut.length), 10);
    if(!isNaN(n) && n > max) max = n;
  });
  return `${debut}${String(max + 1).padStart(4, '0')}`;
}

/* ─────────────────────────────── Lignes ─────────────────────────────── */
const arrondi = n => Math.round((Number(n) || 0) * 100) / 100;
const MOIS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

/** 'YYYY-MM' -> « septembre 2026 » */
export function moisLibelle(mois){
  const [a, m] = String(mois || '').split('-');
  const i = parseInt(m, 10) - 1;
  return (MOIS[i] ? MOIS[i] : '') + ' ' + a;
}
/** Dernier jour du mois, en 'YYYY-MM-DD' (date de prestation d'un abonnement mensuel). */
export function finDuMois(mois){
  const [a, m] = String(mois || '').split('-').map(Number);
  const d = new Date(a, m, 0);
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const ligne = (libelle, quantite, prixUnitaire) => ({
  libelle, quantite: Number(quantite) || 0, prixUnitaire: arrondi(prixUnitaire),
  total: arrondi((Number(quantite) || 0) * (Number(prixUnitaire) || 0))
});

/** Ligne d'abonnement du mois, remise partenaire comprise. Null si le client n'a pas d'offre. */
export function ligneAbonnement(client, mois){
  const o = offreDe(client && client.offre);
  if(!o) return null;
  const base = tarifBase(client);
  const remise = client.partenaire ? ` — remise partenaire ${Math.round(REMISE_PARTENAIRE * 100)} %` : '';
  return ligne(`Coaching ${o.l} — ${moisLibelle(mois)}${remise}`, 1, tarifClient(client));
}

// Prestations ponctuelles proposées en cases à cocher. Reprend les tarifs des ventes à
// l'unité, plus la séance supplémentaire de l'offre Hybride.
export const LIGNES_RAPIDES = [
  ...VENTES.map(v => ({ k: v.k, libelle: v.l, prix: v.prix })),
  { k: 'supp_hybride', libelle: 'Séance supplémentaire (Hybride)',
    prix: (offreDe('hybride') || {}).seanceSupp || 30 }
];

/** Ventes à l'unité déjà enregistrées pour ce client sur le mois. */
export function lignesVentes(ventes, clientId, mois){
  return (ventes || [])
    .filter(v => v.clientId === clientId && String(v.date || '').slice(0, 7) === mois)
    .map(v => ligne(((venteDe(v.type) || {}).l || v.libelle || 'Prestation') + ' du ' + fmtJour(v.date), 1, v.prix));
}
const fmtJour = iso => { const s = String(iso || ''); return s.length >= 10 ? `${s.slice(8, 10)}/${s.slice(5, 7)}` : s; };

export const totalLignes = lignes => arrondi((lignes || []).reduce((n, l) => n + (Number(l.total) || 0), 0));

/* ─────────────────────────────── Facture ─────────────────────────────── */
/**
 * Construit le document à enregistrer dans `factures/{id}`.
 * L'identité de l'émetteur et du client est RECOPIÉE dedans : une facture doit rester
 * fidèle à ce qui a été émis, même si la fiche client change ensuite.
 */
export function construireFacture({ numero, client, reglages, mois, lignes, dateEmission, note }){
  const r = { ...REGLAGES_DEFAUT, ...(reglages || {}) };
  const l = (lignes || []).filter(x => x && x.libelle && x.total >= 0);
  return {
    numero,
    clientId: (client && client.id) || '',
    clientNom: (client && client.name) || '',
    clientAdresse: (client && client.adresse) || '',
    emetteur: { nom: r.nom, statut: r.statut, adresse: r.adresse, siren: r.siren, email: r.email, tel: r.tel, activite: r.activite },
    mentionTva: r.mentionTva,
    delaiPaiement: r.delaiPaiement,
    moyenPaiement: r.moyenPaiement,
    escompte: r.escompte,
    penalites: r.penalites,
    mois: mois || '',
    periode: mois ? moisLibelle(mois) : '',
    datePrestation: mois ? finDuMois(mois) : (dateEmission || ''),
    dateEmission: dateEmission || '',
    lignes: l,
    total: totalLignes(l),
    note: (note || '').slice(0, 300),
    statut: 'emise',
    cree: Date.now()
  };
}

/** Version texte (pour WhatsApp ou un mail), quand le PDF n'est pas pratique. */
export function factureEnTexte(f){
  const lignes = [
    `FACTURE ${f.numero}`,
    `${f.emetteur.statut} ${f.emetteur.nom} — SIREN ${f.emetteur.siren}`,
    f.emetteur.adresse,
    '',
    `Client : ${f.clientNom}`,
    f.clientAdresse,
    '',
    `Émise le ${fmtJourComplet(f.dateEmission)}${f.periode ? ` · Prestations : ${f.periode}` : ''}`,
    ''
  ];
  f.lignes.forEach(l => lignes.push(`- ${l.libelle} : ${l.quantite} × ${fmtEuros(l.prixUnitaire)} = ${fmtEuros(l.total)}`));
  lignes.push('', `TOTAL : ${fmtEuros(f.total)}`, f.mentionTva, `Règlement : ${f.delaiPaiement} · ${f.moyenPaiement}`);
  if(f.note) lignes.push('', f.note);
  return lignes.filter(x => x !== undefined && x !== null).join('\n');
}
const fmtJourComplet = iso => { const s = String(iso || ''); return s.length >= 10 ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : s; };

/** Nom de fichier propre : « Facture-F2026-0007-Camille-Ferrand.pdf ». */
export function nomFichier(f){
  const slug = String(f.clientNom || 'client').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `Facture-${f.numero}-${slug}.pdf`;
}
