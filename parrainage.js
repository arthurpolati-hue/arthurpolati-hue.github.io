// Parrainage — un client envoie son lien, la personne arrive sur le bilan offert
// avec « parrainé par … » déjà rempli. Aucun appel réseau, aucun DOM ici.
//
// Règle du jeu, telle qu'annoncée au client dans son espace :
//   – 10 % pour lui sur sa prochaine mensualité,
//   – 10 % pour la personne qu'il parraine, sur sa première mensualité.
// La remise du parrain n'est PAS automatique : elle est due quand le filleul devient
// client, et c'est Arthur qui l'applique sur la facture suivante (case dans la
// facturation). Rien ne se déduit tout seul d'un tarif.

export const REMISE_PARRAINAGE = 0.10;
export const fmtRemiseParrainage = () => `−${Math.round(REMISE_PARRAINAGE * 100)} %`;

/** Lien à partager par le client. `origin` sans barre oblique finale. */
export const lienParrainage = (origin, clientId) =>
  `${String(origin || '').replace(/\/+$/, '')}/?p=${encodeURIComponent(clientId || '')}`;

/** Identifiant du parrain lu sur le formulaire public (`?p=`). */
export function parrainDeLUrl(search){
  const p = new URLSearchParams(String(search || '')).get('p');
  const v = (p || '').trim();
  // Les identifiants de clients sont courts et sans espace : on refuse le reste
  // plutôt que d'aller interroger la base avec n'importe quoi.
  return /^[A-Za-z0-9_-]{1,64}$/.test(v) ? v : '';
}

/**
 * Message prêt à envoyer, que le client partage tel quel.
 * Texte voulu court par Arthur : une phrase et le lien, rien d'autre.
 * Tiret ASCII volontaire (« -10 % ») : certains SMS abîment le signe moins typographique.
 */
export const texteInvitation = (prenom, lien) =>
  `Voici ton lien de parrainage, il t'offre -10 % sur toutes les formules de coaching d'Arthur :\n${lien}`;

/** Libellé de la ligne de remise sur la facture du parrain. */
export const libelleRemiseParrain = filleul =>
  `Parrainage${filleul ? ' de ' + filleul : ''}`;
