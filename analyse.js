// Analyse d'un programme hebdomadaire : volume par groupe musculaire, fréquence,
// durée estimée des séances. Plus la génération de fichiers calendrier (.ics).
//
// Aucune dépendance externe, aucun appel réseau : tout est calculé à partir du
// document `programs/{clientId}` déjà chargé.

import { EXERCICES } from './exercices.js';

export const JOURS = [
  ['lundi','Lundi'],['mardi','Mardi'],['mercredi','Mercredi'],['jeudi','Jeudi'],
  ['vendredi','Vendredi'],['samedi','Samedi'],['dimanche','Dimanche']
];

// ── Hypothèses de durée, assumées et centralisées ─────────────────────────
// Ce sont des ordres de grandeur, pas une vérité : un débutant qui cherche sa
// charge met plus longtemps qu'un habitué. Elles servent à comparer des séances
// entre elles, pas à promettre une heure de fin.
export const DUREE = {
  echauffementSec: 480,      // 8 min si un échauffement est prévu
  serieSec: 40,              // exécution d'une série
  reposDefautSec: 75,        // quand le coach n'a rien précisé
  transitionSec: 60          // changement d'exercice, déplacement, installation
};

export function norm(str){
  return (str||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
}

// Nombre de séries à partir du champ « séries » : premier nombre trouvé.
export function parseSetCount(str){
  if(!str) return 1;
  const m = String(str).match(/\d+/);
  return m ? Math.min(12, Math.max(1, parseInt(m[0], 10))) : 1;
}

export function parseRestSeconds(str){
  if(!str) return null;
  const s = String(str).trim().toLowerCase();
  let m = s.match(/(\d+)\s*:\s*(\d+)/); if(m) return (+m[1])*60 + (+m[2]);
  m = s.match(/(\d+(?:[.,]\d+)?)\s*min/); if(m) return Math.round(parseFloat(m[1].replace(',','.'))*60);
  m = s.match(/(\d+)\s*s/); if(m) return +m[1];
  m = s.match(/^(\d+)$/); if(m) return +m[1];
  return null;
}

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

/* ─────────────────────────── Calendrier (.ics) ─────────────────────────── */

function echapIcs(s){
  return String(s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');
}
function horodatageUTC(d){
  return d.getUTCFullYear()
    + String(d.getUTCMonth()+1).padStart(2,'0')
    + String(d.getUTCDate()).padStart(2,'0') + 'T'
    + String(d.getUTCHours()).padStart(2,'0')
    + String(d.getUTCMinutes()).padStart(2,'0')
    + String(d.getUTCSeconds()).padStart(2,'0') + 'Z';
}

/**
 * Événement calendrier pour une séance en présentiel.
 * Les heures sont écrites en UTC (suffixe Z) : c'est le format le mieux supporté,
 * et il évite d'embarquer une définition de fuseau horaire dans le fichier.
 * @param {Object} o {date:'YYYY-MM-DD', heure:'HH:MM', dureeMin, titre, lieu, notes, uid}
 */
export function creerIcs({ date, heure, dureeMin = 60, titre, lieu = '', notes = '', uid }){
  const debut = new Date(`${date}T${heure}:00`);
  if(isNaN(debut)) return null;
  const fin = new Date(debut.getTime() + dureeMin * 60000);
  const lignes = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ARD Coaching//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${echapIcs(uid || (date + heure + '@ard-coaching'))}`,
    `DTSTAMP:${horodatageUTC(new Date())}`,
    `DTSTART:${horodatageUTC(debut)}`,
    `DTEND:${horodatageUTC(fin)}`,
    `SUMMARY:${echapIcs(titre)}`,
    lieu ? `LOCATION:${echapIcs(lieu)}` : null,
    notes ? `DESCRIPTION:${echapIcs(notes)}` : null,
    // Deux rappels : la veille au soir, et une heure avant.
    'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY',
    `DESCRIPTION:${echapIcs(titre)}`, 'END:VALARM',
    'BEGIN:VALARM', 'TRIGGER:-PT12H', 'ACTION:DISPLAY',
    `DESCRIPTION:${echapIcs(titre)}`, 'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean);
  // Le format impose des fins de ligne CRLF.
  return lignes.join('\r\n') + '\r\n';
}

/** Déclenche le téléchargement du .ics (le téléphone propose de l'ajouter). */
export function telechargerIcs(contenu, nomFichier){
  const blob = new Blob([contenu], { type:'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomFichier || 'seance.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(()=> URL.revokeObjectURL(url), 4000);
}

/** Lien Google Agenda — repli universel quand le .ics ne s'ouvre pas. */
export function lienGoogleAgenda({ date, heure, dureeMin = 60, titre, lieu = '', notes = '' }){
  const debut = new Date(`${date}T${heure}:00`);
  if(isNaN(debut)) return '#';
  const fin = new Date(debut.getTime() + dureeMin * 60000);
  const f = d => horodatageUTC(d);
  const p = new URLSearchParams({
    action:'TEMPLATE', text:titre || 'Séance', dates:`${f(debut)}/${f(fin)}`,
    details:notes || '', location:lieu || ''
  });
  return 'https://calendar.google.com/calendar/render?' + p.toString();
}
