// Analyse d'un programme hebdomadaire : volume par groupe musculaire, fréquence,
// durée estimée des séances. Plus la génération de fichiers calendrier (.ics).
//
// Aucune dépendance externe, aucun appel réseau : tout est calculé à partir du
// document `programs/{clientId}` déjà chargé.

import { EXERCICES } from './exercices.js';
import { norm, parseSetCount, parseRestSeconds } from './commun.js';

export { parseSetCount, parseRestSeconds };   // réexport, pour n'avoir qu'un import côté pages

export const JOURS = [
  ['lundi','Lundi'],['mardi','Mardi'],['mercredi','Mercredi'],['jeudi','Jeudi'],
  ['vendredi','Vendredi'],['samedi','Samedi'],['dimanche','Dimanche']
];

// Hypothèses de durée, assumées et centralisées. Ce sont des ordres de grandeur :
// un débutant qui cherche sa charge met plus longtemps qu'un habitué. Elles servent
// à comparer des séances entre elles, pas à promettre une heure de fin.
export const DUREE = {
  echauffementSec: 480,      // 8 min si un échauffement est prévu
  serieSec: 40,              // exécution d'une série
  reposDefautSec: 75,        // quand le coach n'a rien précisé
  transitionSec: 60          // changement d'exercice, installation
};

// Groupe musculaire d'un exercice, d'après le catalogue. Les exercices écrits à
// la main que le catalogue ne connaît pas tombent dans « Non classé » — c'est
// affiché tel quel plutôt que deviné, pour que le coach sache quoi corriger.
const PAR_NOM = new Map(EXERCICES.map(e => [norm(e.n), e.g]));
export function groupeDe(nom){
  const k = norm(nom);
  if(PAR_NOM.has(k)) return PAR_NOM.get(k);
  // Tolérance : « Développé couché barre » retrouve « Développé couché ».
  for(const [cle, g] of PAR_NOM){
    if(k.startsWith(cle) || cle.startsWith(k)) return g;
  }
  return 'Non classé';
}

// Groupes qui ne représentent pas un volume de musculation à comptabiliser.
const HORS_VOLUME = new Set(['Cardio','Échauffement','Étirement']);

/** Durée estimée d'une journée, en secondes. */
export function dureeJour(jour){
  if(!jour || !jour.exercises || jour.exercises.length === 0) return 0;
  let t = (jour.echauffement && jour.echauffement.trim()) ? DUREE.echauffementSec : 0;
  jour.exercises.forEach((ex, i)=>{
    const n = parseSetCount(ex.series);
    const repos = parseRestSeconds(ex.repos) ?? DUREE.reposDefautSec;
    // n séries : n exécutions, mais seulement n-1 repos entre elles.
    t += n * DUREE.serieSec + Math.max(0, n - 1) * repos;
    if(i < jour.exercises.length - 1) t += DUREE.transitionSec;
  });
  return Math.round(t);
}

export function fmtDuree(sec){
  if(!sec) return '—';
  const m = Math.round(sec / 60);
  return m >= 60 ? `${Math.floor(m/60)}h${String(m%60).padStart(2,'0')}` : `${m} min`;
}

/**
 * Vue d'ensemble d'un programme hebdomadaire.
 * @returns {{jours:Array, groupes:Array, totalSeances:number, totalSeries:number,
 *            dureeTotale:number, dureeMoyenne:number, nonClasses:Array}}
 */
export function apercuSemaine(program){
  const jours = [], parGroupe = new Map();
  let totalSeries = 0, dureeTotale = 0;
  const nonClasses = new Set();

  JOURS.forEach(([cle, label])=>{
    const j = (program && program[cle]) || {};
    const exos = j.exercises || [];
    if(exos.length === 0){ jours.push({ cle, label, repos:true, series:0, duree:0, exos:0 }); return; }

    let seriesJour = 0;
    const groupesDuJour = new Set();
    exos.forEach(ex=>{
      const n = parseSetCount(ex.series);
      const g = groupeDe(ex.nom);
      if(g === 'Non classé' && (ex.nom||'').trim()) nonClasses.add(ex.nom.trim());
      if(HORS_VOLUME.has(g)) return;              // cardio et mobilité hors volume
      seriesJour += n;
      groupesDuJour.add(g);
      if(!parGroupe.has(g)) parGroupe.set(g, { series:0, jours:new Set() });
      parGroupe.get(g).series += n;
      parGroupe.get(g).jours.add(cle);
    });

    const d = dureeJour(j);
    dureeTotale += d;
    totalSeries += seriesJour;
    jours.push({ cle, label, repos:false, series:seriesJour, duree:d, exos:exos.length,
                 groupes:[...groupesDuJour] });
  });

  const actifs = jours.filter(j => !j.repos);
  const groupes = [...parGroupe.entries()]
    .map(([nom, v])=> ({ nom, series:v.series, frequence:v.jours.size }))
    .sort((a,b)=> b.series - a.series);

  return {
    jours, groupes,
    totalSeances: actifs.length,
    totalSeries,
    dureeTotale,
    dureeMoyenne: actifs.length ? Math.round(dureeTotale / actifs.length) : 0,
    nonClasses: [...nonClasses]
  };
}
