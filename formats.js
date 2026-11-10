// Formats de séance — la table de référence, lue par l'espace coach ET par le lien client.
//
// Un format décrit trois choses d'un coup :
//   1. ce que le coach remplit (`champs`, et `postes` s'il y a des exercices enchaînés) ;
//   2. comment la durée de la séance se calcule (`duree`) ;
//   3. CE QUE LE CLIENT NOTE à la fin (`score`) — c'est le point important : un AMRAP se
//      note en tours, un « pour le temps » en minutes, un EMOM en minutes tenues. Sans ça,
//      le client doit deviner quoi écrire, et le coach reçoit des séances inexploitables.
//
// Repères des formats (recherche du 10/11/2026) :
//  - Tabata : 8 tours de 20 s d'effort / 10 s de récupération (protocole d'origine).
//  - Intervalles : nommés par leur ratio, 30/30 et 40/20 étant les plus courants.
//  - EMOM : un travail fixe au début de chaque minute, le reste de la minute sert de repos.
//  - AMRAP : le plus de tours possible dans un temps donné, le score EST le nombre de tours.
//  - Pour le temps : le travail est fixe, le score est le chronomètre.
//  - Course : fractionné (VMA), seuil, côtes, sortie longue et footing se décrivent tous
//    avec une durée (ou distance) et une allure ; le détail va dans les consignes.
// ⚠️ Ces chiffres sont des valeurs de départ pré-remplies, pas des prescriptions : le coach
// les modifie à chaque fois. Les sources sont des articles de coaching, pas des études.

import { parseSetCount, parseRestSeconds } from './commun.js';

const sec = (v, defaut) => parseRestSeconds(v) ?? defaut;

/** Exercices enchaînés dans un bloc, un par ligne. */
export const postesDe = ex => String((ex && ex.postes) || '')
  .split('\n').map(s => s.trim()).filter(Boolean);

const nbPostes = ex => Math.max(1, postesDe(ex).length);

export const FORMATS = [
  {
    k: 'muscu', l: 'Musculation', court: 'Muscu',
    aide: 'Séries, répétitions, charge et RPE.',
    classique: true                      // garde l'interface d'origine, inchangée
  },
  {
    k: 'gainage', l: 'Gainage / isométrie', court: 'Gainage',
    aide: 'Des séries de tenue, en secondes : planche, chaise, gainage latéral.',
    champs: [
      { f: 'series',  l: 'Séries',       ph: '3' },
      { f: 'travail', l: 'Tenue',        ph: '45s' },
      { f: 'repos',   l: 'Récup',        ph: '30s' }
    ],
    postes: true, postesLabel: 'Positions enchaînées (une par ligne)',
    score: { type: 'tours', l: 'Séries tenues', ph: 'ex. 3' },
    duree: ex => parseSetCount(ex.series) * (nbPostes(ex) * sec(ex.travail, 45)
                 + Math.max(0, nbPostes(ex) - 1) * sec(ex.repos, 30))
  },
  {
    k: 'circuit', l: 'Circuit training', court: 'Circuit',
    aide: 'Plusieurs exercices enchaînés, répétés en tours.',
    champs: [
      { f: 'series',  l: 'Tours',  ph: '3' },
      { f: 'travail', l: 'Effort par exercice', ph: '45s' },
      { f: 'repos',   l: 'Récup',  ph: '15s' }
    ],
    postes: true,
    score: { type: 'tours', l: 'Tours réalisés', ph: 'ex. 3' },
    duree: ex => parseSetCount(ex.series) * (nbPostes(ex) * sec(ex.travail, 45)
                 + Math.max(0, nbPostes(ex) - 1) * sec(ex.repos, 15))
                 + Math.max(0, parseSetCount(ex.series) - 1) * sec(ex.repos, 15)
  },
  {
    k: 'tabata', l: 'Tabata', court: 'Tabata',
    aide: "Le protocole d'origine : 8 tours de 20 s d'effort et 10 s de récupération.",
    defauts: { series: '8', travail: '20s', repos: '10s' },
    champs: [
      { f: 'series',  l: 'Tours',  ph: '8' },
      { f: 'travail', l: 'Effort', ph: '20s' },
      { f: 'repos',   l: 'Récup',  ph: '10s' }
    ],
    postes: true,
    score: { type: 'tours', l: 'Tours tenus', ph: 'ex. 8' },
    duree: ex => parseSetCount(ex.series) * (nbPostes(ex) * sec(ex.travail, 20)
                 + sec(ex.repos, 10))
  },
  {
    k: 'intervalles', l: 'Intervalles (30/30, 40/20…)', court: 'Intervalles',
    aide: "Effort et récupération alternés. Les formats courants sont 30/30 et 40/20.",
    defauts: { series: '10', travail: '30s', repos: '30s' },
    champs: [
      { f: 'series',  l: 'Répétitions', ph: '10' },
      { f: 'travail', l: 'Effort',      ph: '30s' },
      { f: 'repos',   l: 'Récup',       ph: '30s' }
    ],
    postes: true,
    score: { type: 'tours', l: 'Répétitions tenues', ph: 'ex. 10' },
    duree: ex => parseSetCount(ex.series) * (sec(ex.travail, 30) + sec(ex.repos, 30))
  },
  {
    k: 'emom', l: 'EMOM — à chaque début de minute', court: 'EMOM',
    aide: 'Le travail démarre à chaque minute ; ce qui reste de la minute sert de repos.',
    defauts: { series: '12' },
    champs: [
      { f: 'series',      l: 'Minutes',            ph: '12' },
      { f: 'repetitions', l: 'À faire par minute', ph: '10 burpees' }
    ],
    postes: true, postesLabel: 'Si ça alterne, une consigne par ligne (minute 1, minute 2…)',
    score: { type: 'minutes', l: 'Minutes tenues', ph: 'ex. 12' },
    duree: ex => parseSetCount(ex.series) * 60
  },
  {
    k: 'amrap', l: 'AMRAP — max de tours en temps limité', court: 'AMRAP',
    aide: 'Durée fixe, le client fait le plus de tours possible. Son score, ce sont les tours.',
    defauts: { travail: '12min' },
    champs: [
      { f: 'travail',     l: 'Durée',          ph: '12min' },
      { f: 'repetitions', l: 'Répét. par tour', ph: '10-10-10' }
    ],
    postes: true,
    score: { type: 'tours', l: 'Tours réalisés', ph: 'ex. 7 tours + 5 reps' },
    duree: ex => sec(ex.travail, 720)
  },
  {
    k: 'chrono', l: 'Pour le temps (For Time)', court: 'Pour le temps',
    aide: 'Le travail est fixe, le client va le plus vite possible. Son score, c\'est le temps.',
    defauts: { series: '3' },
    champs: [
      { f: 'series',      l: 'Tours',           ph: '3' },
      { f: 'repetitions', l: 'Répét. par tour', ph: '10-15-20' },
      { f: 'travail',     l: 'Temps limite',    ph: '15min' }
    ],
    postes: true,
    score: { type: 'temps', l: 'Ton temps', ph: 'ex. 11min40' },
    duree: ex => sec(ex.travail, 900)
  },
  {
    k: 'cardio', l: 'Cardio continu (vélo, rameur…)', court: 'Cardio',
    aide: 'Un effort continu : durée et intensité, sans séries à compter.',
    defauts: { travail: '30min' },
    champs: [
      { f: 'travail',     l: 'Durée',             ph: '30min' },
      { f: 'repetitions', l: 'Intensité / allure', ph: 'RPE 6, 120 bpm' }
    ],
    score: { type: 'duree', l: 'Durée réelle', ph: 'ex. 30min' },
    duree: ex => sec(ex.travail, 1800)
  },
  {
    k: 'course', l: 'Course à pied', court: 'Course',
    aide: 'Footing, sortie longue, seuil, côtes ou fractionné : durée ou distance, et allure.',
    defauts: { travail: '45min' },
    champs: [
      { f: 'travail',     l: 'Durée',             ph: '45min' },
      { f: 'repetitions', l: 'Distance / allure', ph: '8 km, 5:30/km' }
    ],
    postes: true, postesLabel: 'Si c\'est du fractionné, le détail (une ligne par bloc)',
    score: { type: 'distance', l: 'Distance et temps', ph: 'ex. 8,2 km en 46min' },
    duree: ex => sec(ex.travail, 2700)
  },
  {
    k: 'mobilite', l: 'Mobilité / étirements', court: 'Mobilité',
    aide: 'Séance douce : une durée, rien à mesurer.',
    defauts: { travail: '15min' },
    champs: [ { f: 'travail', l: 'Durée', ph: '15min' } ],
    postes: true, postesLabel: 'Mouvements (un par ligne)',
    score: { type: 'fait', l: '' },
    duree: ex => sec(ex.travail, 900)
  }
];

export const formatDe = k => FORMATS.find(f => f.k === k) || FORMATS[0];

/** Un bloc qui n'est pas de la musculation classique. */
export const estAuTemps = ex => !!ex && !!ex.type && ex.type !== 'muscu';

/** Durée d'un bloc, en secondes, selon son format. */
export function dureeBloc(ex){
  const f = formatDe(ex && ex.type);
  return f.duree ? Math.round(f.duree(ex)) : 0;
}

/** Phrase de prescription montrée au client (« 8 tours · 20s d'effort · 10s de récup »). */
export function resumeBloc(ex){
  const f = formatDe(ex && ex.type);
  if(!f.champs) return '';
  return f.champs
    .map(c => {
      const v = String(ex[c.f] || '').trim();
      if(!v) return '';
      // « 8 tours », « effort 20s », « récup 10s » : sans le mot, le client lit trois
      // durées à la suite sans savoir laquelle est laquelle.
      if(c.f === 'series') return v + ' ' + (f.k === 'emom' ? 'minutes' : f.k === 'gainage' ? 'séries' : 'tours');
      if(c.f === 'repetitions') return v;
      return c.l.toLowerCase() + ' ' + v;
    })
    .filter(Boolean).join(' · ');
}
