// Messages types envoyés aux prospects. Pas de DOM, pas de réseau ici.
//
// Ils sont écrits pour être ENVOYÉS TELS QUELS, mais Arthur les relit et les
// retouche dans le panneau avant d'envoyer : ses retouches ne modifient pas le
// modèle (elles ne valent que pour cet envoi).
//
// Étiquettes remplacées automatiquement : {prenom} {nom} {format} {objectif} {ville}
// Une étiquette sans valeur disparaît proprement, sans laisser « {prenom} » dans le
// texte : c'est le rôle de `remplirMessage()`.

export const MODELES = [
  {
    k: 'bilan',
    l: 'Bilan offert — premier contact',
    texte:
`Salut {prenom} ! C'est Arthur, d'ARD Coaching.

J'ai vu que tu avais demandé ton bilan offert. Il sert à deux choses :

— que je puisse te connaître, ton quotidien, tes objectifs et tes contraintes, pour adapter au mieux mon accompagnement ;
— et que toi, tu voies comment je travaille et ce qui te conviendrait le mieux.

Il faut compter entre 30 min et 1 h. L'idéal est qu'on s'appelle : dis-moi tes disponibilités et je m'adapte.

À très vite,
Arthur`
  },
  {
    k: 'relance',
    l: 'Relance (sans réponse)',
    texte:
`Salut {prenom}, c'est Arthur d'ARD Coaching.

Je reviens vers toi pour ton bilan offert — je ne voudrais pas te laisser sans nouvelles. Si c'est toujours d'actualité, donne-moi deux ou trois créneaux qui t'arrangent et on cale ça.

Et si le moment n'est pas le bon, dis-le-moi simplement, ça ne me dérange pas du tout.

Arthur`
  },
  {
    k: 'rdv',
    l: 'Confirmation du rendez-vous',
    texte:
`Salut {prenom} ! C'est noté pour notre bilan : ____ à ____.

Je t'appelle sur ce numéro. Prévois 30 min à 1 h au calme, et note d'ici là tout ce qui te passe par la tête : tes objectifs, tes contraintes, tes questions.

Rien à préparer d'autre, on fait le tour ensemble.

Arthur`
  },
  {
    k: 'apres',
    l: 'Après le bilan',
    texte:
`Salut {prenom}, merci pour cet échange, c'était un plaisir.

Comme convenu, je te récapitule ce qu'on s'est dit et ce que je te propose :

— ____
— ____

Prends le temps d'y réfléchir, et pose-moi toutes les questions que tu veux d'ici là.

Arthur`
  }
];

/** Modèle par sa clé, ou le premier de la liste. */
export const modeleDe = k => MODELES.find(m => m.k === k) || MODELES[0];

/**
 * Remplit les étiquettes d'un modèle avec les données du prospect.
 * Une étiquette sans valeur est retirée avec l'espace qui la précède, pour ne jamais
 * envoyer « Salut  ! » avec un trou ni « {prenom} » en clair.
 */
export function remplirMessage(texte, prospect){
  const p = prospect || {};
  const valeurs = {
    prenom: (p.prenom || '').trim(),
    nom: (p.nom || '').trim(),
    format: (p.format || '').trim(),
    objectif: (p.objectif || '').trim(),
    ville: (p.ville || '').trim()
  };
  return String(texte || '')
    .replace(/ ?\{(\w+)\}/g, (brut, cle) => {
      if(!(cle in valeurs)) return brut;              // étiquette inconnue : on n'y touche pas
      return valeurs[cle] ? (brut.startsWith(' ') ? ' ' : '') + valeurs[cle] : '';
    })
    // Filet de sécurité contre une espace en trop laissée par une étiquette vide.
    // ⚠️ Seulement devant la virgule et le point : en français, « ! », « ? », « : » et
    // « ; » gardent une espace avant — sinon on envoyait « Salut Léo! ».
    .replace(/[ \t]+([,.])/g, '$1');
}

/**
 * Numéro au format attendu par WhatsApp (indicatif, sans + ni espaces).
 * Un numéro français commençant par 0 devient 33…
 */
export function telWhatsApp(tel){
  const t = String(tel || '').replace(/[\s.\-()]/g, '');
  return t.startsWith('0') ? '33' + t.slice(1) : t.replace(/^\+/, '');
}
