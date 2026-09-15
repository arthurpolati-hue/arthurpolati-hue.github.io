// Trame du bilan, rempli par le coach pendant l'entretien (jamais par le client).
//
// L'ordre suit le déroulé d'Arthur : comprendre le quotidien, l'alimentation, les
// objectifs, puis les contraintes (passé sportif, expériences de coaching, santé).
// Types de champ :
//   texte — une ligne        zone  — texte libre sur plusieurs lignes
//   choix — boutons exclusifs (re-cliquer désélectionne)
//   liste — plusieurs lignes courtes (ex. objectifs annexes)
// ⚠️ Les clés (`k`) sont enregistrées dans Firestore : en renommer une fait
// « disparaître » les réponses déjà saisies sous l'ancienne clé.

export const SECTIONS_BILAN = [
  {
    k: 'quotidien', titre: 'Vie & quotidien',
    intro: 'Comprendre la journée type de la personne.',
    champs: [
      { k: 'travail', l: 'Travail / activité', type: 'zone', aide: 'Métier, assis ou physique, télétravail, déplacements…' },
      { k: 'horaires', l: 'Horaires', type: 'texte', aide: 'Ex. 8h–17h, horaires décalés, travail le week-end…' },
      { k: 'sommeil', l: 'Sommeil', type: 'zone', aide: 'Coucher, lever, nombre d\'heures, qualité, réveils…' },
      { k: 'activite', l: 'Activité au quotidien', type: 'choix', options: ['Sédentaire', 'Peu actif', 'Actif', 'Très actif'] },
      { k: 'stress', l: 'Stress', type: 'choix', options: ['Faible', 'Moyen', 'Élevé'] },
      { k: 'quotidienAutre', l: 'Le reste du quotidien', type: 'zone', large: true, aide: 'Famille, enfants, trajets, temps libre, pas par jour…' }
    ]
  },
  {
    k: 'alimentation', titre: 'Alimentation',
    intro: 'Habitudes réelles, sans jugement.',
    champs: [
      { k: 'repas', l: 'Repas', type: 'texte', aide: 'Nombre par jour, horaires, repas sautés…' },
      { k: 'grignotage', l: 'Grignotage', type: 'choix', options: ['Non', 'Parfois', 'Souvent'] },
      { k: 'grignotageDetail', l: 'Grignotage : quoi, quand, pourquoi', type: 'zone', aide: 'Sucré ou salé, le soir, ennui, stress…' },
      { k: 'habitudes', l: 'Habitudes alimentaires', type: 'zone', large: true, aide: 'Petit-déjeuner, repas type, fait maison ou non, restaurant, fast-food…' },
      { k: 'boissons', l: 'Boissons', type: 'texte', aide: 'Eau, sodas, café, alcool…' },
      { k: 'particularites', l: 'Régime, allergies, intolérances', type: 'texte' }
    ]
  },
  {
    k: 'objectifs', titre: 'Objectifs',
    intro: 'Un objectif principal, et ce qui compte à côté.',
    champs: [
      { k: 'objectifPrincipal', l: 'Objectif principal', type: 'zone', aide: 'Ex. perdre 8 kg, reprendre le sport après une grossesse…' },
      { k: 'objectifsAnnexes', l: 'Objectifs annexes', type: 'liste', exemple: 'Ex. gagner en force, réussir une traction…' },
      { k: 'motivation', l: 'Pourquoi, et pourquoi maintenant ?', type: 'zone' },
      { k: 'echeance', l: 'Échéance / date importante', type: 'texte', aide: 'Mariage, vacances, compétition…' }
    ]
  },
  {
    k: 'passeSportif', titre: 'Passé sportif',
    intro: 'Ce qui a déjà été tenté pour atteindre ces objectifs.',
    champs: [
      { k: 'sports', l: 'Sports pratiqués', type: 'zone', aide: 'Avant et aujourd\'hui, niveau, fréquence…' },
      { k: 'tentatives', l: 'A déjà essayé d\'atteindre ses objectifs ?', type: 'zone', aide: 'Comment, pendant combien de temps, avec quel résultat…' },
      { k: 'aMarche', l: 'Ce qui a marché', type: 'zone' },
      { k: 'pasMarche', l: 'Ce qui n\'a pas marché', type: 'zone' },
      { k: 'aAime', l: 'Ce qu\'elle ou il a aimé', type: 'zone' },
      { k: 'pasAime', l: 'Ce qu\'elle ou il n\'a pas aimé', type: 'zone' }
    ]
  },
  {
    k: 'coaching', titre: 'Expérience de coaching',
    champs: [
      { k: 'dejaSuivi', l: 'Déjà suivi(e) par un coach ?', type: 'choix', options: ['Oui', 'Non'] },
      { k: 'typeSuivi', l: 'Quel suivi, combien de temps ?', type: 'texte', aide: 'En salle, en ligne, application, programme acheté…' },
      { k: 'coachAime', l: 'Ce qu\'elle ou il a aimé', type: 'zone' },
      { k: 'coachPasAime', l: 'Ce qu\'elle ou il n\'a pas aimé', type: 'zone' },
      { k: 'attentes', l: 'Ce qu\'elle ou il attend de ton coaching', type: 'zone', large: true }
    ]
  },
  {
    k: 'contraintes', titre: 'Santé & contraintes',
    intro: 'Tout ce qui est essentiel au bon déroulement du coaching.',
    champs: [
      { k: 'blessures', l: 'Blessures', type: 'zone', aide: 'Actuelles ou passées, opérations…' },
      { k: 'pathologies', l: 'Pathologies, traitements', type: 'zone' },
      { k: 'douleurs', l: 'Douleurs, gênes, mouvements à éviter', type: 'zone' },
      { k: 'avisMedical', l: 'Avis médical / certificat', type: 'texte' },
      { k: 'disponibilites', l: 'Disponibilités', type: 'zone', aide: 'Jours, créneaux, nombre de séances possibles par semaine…' },
      { k: 'lieu', l: 'Lieu et matériel', type: 'texte', aide: 'Salle (laquelle), maison, extérieur…' },
      { k: 'autresContraintes', l: 'Autres contraintes', type: 'zone', large: true }
    ]
  },
  {
    k: 'synthese', titre: 'Ta synthèse',
    champs: [
      { k: 'synthese', l: 'Synthèse et pistes pour le programme', type: 'zone', large: true },
      { k: 'offreProposee', l: 'Offre proposée', type: 'choix', options: ['Digital', 'Hybride', 'Full', 'À réfléchir'] }
    ]
  }
];
