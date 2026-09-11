// Fonctions partagées par toutes les pages : dates, analyse de texte, calendrier.
//
// ⚠️ Raison d'être de ce fichier : ces helpers existaient en double dans `s.html`
// et `analyse.js`. Deux implémentations de la même règle finissent toujours par
// diverger — le client aurait compté 4 séries là où la vue d'ensemble du coach en
// comptait 3. Une seule source, importée partout.
//
// Aucune dépendance : `s.html` peut l'importer sans tirer le catalogue d'exercices
// (11 Ko) dont il n'a aucun usage.

/* ─────────────────────────────── Dates ─────────────────────────────── */

// `toISOString()` renvoie l'heure UTC : passé minuit heure française, il datait
// la séance de la veille. Toujours passer par ici.
export function isoLocal(d){
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0')
       + '-' + String(d.getDate()).padStart(2,'0');
}
export function addDays(d, n){ const c = new Date(d.getTime()); c.setDate(c.getDate()+n); return c; }
export function startOfToday(){ const d = new Date(); d.setHours(0,0,0,0); return d; }
export function todayISO(){ return isoLocal(new Date()); }

const MOIS_COURT = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
const MOIS_LONG  = ['janvier','février','mars','avril','mai','juin','juillet','août',
                    'septembre','octobre','novembre','décembre'];
const JOURS_SEM  = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];

/** '2026-09-14' -> '14/09' */
export function fmtDateCourte(iso){
  const p = String(iso||'').split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}` : String(iso||'');
}
/** '2026-09-14' -> 'lundi 14 septembre' (ou 'lundi 14 sept.' en version courte) */
export function fmtJourLong(iso, court){
  const d = new Date(iso + 'T12:00:00');
  if(isNaN(d)) return iso;
  return `${JOURS_SEM[d.getDay()]} ${d.getDate()} ${(court ? MOIS_COURT : MOIS_LONG)[d.getMonth()]}`;
}
/** Nombre de jours entiers entre deux dates ISO. */
export function joursEntre(isoA, isoB){
  return Math.round((new Date(isoB + 'T12:00:00') - new Date(isoA + 'T12:00:00')) / 86400000);
}

/* ─────────────────────────── Analyse de texte ─────────────────────────── */

export function norm(str){
  return (str||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
}

/** Premier nombre d'une chaîne, en flottant. '42,5kg' -> 42.5 */
export function nombreDe(str){
  if(str === null || str === undefined) return null;
  const m = String(str).replace(',', '.').match(/\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

/**
 * Nombre de séries d'après le champ « séries » du coach.
 * PREMIER nombre trouvé : "4" -> 4, "3-4" -> 3, "4x10" -> 4 (et non 10).
 * Borné à 12 pour qu'une faute de frappe ne génère pas 300 lignes de saisie.
 */
export function parseSetCount(str){
  if(!str) return 1;
  const m = String(str).match(/\d+/);
  return m ? Math.min(12, Math.max(1, parseInt(m[0], 10))) : 1;
}

/** Secondes de repos. Accepte "90s", "2min", "1:30", "90". */
export function parseRestSeconds(str){
  if(!str) return null;
  const s = String(str).trim().toLowerCase();
  let m = s.match(/(\d+)\s*:\s*(\d+)/); if(m) return (+m[1])*60 + (+m[2]);
  m = s.match(/(\d+(?:[.,]\d+)?)\s*min/); if(m) return Math.round(parseFloat(m[1].replace(',','.'))*60);
  m = s.match(/(\d+)\s*s/); if(m) return +m[1];
  m = s.match(/^(\d+)$/); if(m) return +m[1];
  return null;
}

export function escapeHtml(s){
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
                .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ───────────────────────────── Calendrier ───────────────────────────── */

function echapIcs(s){
  // '\;' vaut ';' en JS : il faut doubler la barre pour obtenir un vrai \; dans le .ics
  return String(s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;')
                      .replace(/,/g,'\\,').replace(/\n/g,'\\n');
}
function horodatageUTC(d){
  const p = n => String(n).padStart(2,'0');
  return `${d.getUTCFullYear()}${p(d.getUTCMonth()+1)}${p(d.getUTCDate())}T`
       + `${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

/**
 * Événement calendrier pour une séance en présentiel.
 * Heures écrites en UTC (suffixe Z) : format le mieux supporté, et qui évite
 * d'embarquer une définition de fuseau horaire dans le fichier.
 */
export function creerIcs({ date, heure, dureeMin = 60, titre, lieu = '', notes = '', uid }){
  const debut = new Date(`${date}T${heure}:00`);
  if(isNaN(debut)) return null;
  const fin = new Date(debut.getTime() + dureeMin * 60000);
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ARD Coaching//FR',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    `UID:${echapIcs(uid || (date + heure + '@ardcoaching'))}`,
    `DTSTAMP:${horodatageUTC(new Date())}`,
    `DTSTART:${horodatageUTC(debut)}`,
    `DTEND:${horodatageUTC(fin)}`,
    `SUMMARY:${echapIcs(titre)}`,
    lieu ? `LOCATION:${echapIcs(lieu)}` : null,
    notes ? `DESCRIPTION:${echapIcs(notes)}` : null,
    'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', `DESCRIPTION:${echapIcs(titre)}`, 'END:VALARM',
    'BEGIN:VALARM', 'TRIGGER:-PT12H', 'ACTION:DISPLAY', `DESCRIPTION:${echapIcs(titre)}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'
  ].filter(Boolean).join('\r\n') + '\r\n';   // le format impose des CRLF
}

export function telechargerIcs(contenu, nomFichier){
  const blob = new Blob([contenu], { type:'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nomFichier || 'seance.ics';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=> URL.revokeObjectURL(url), 4000);
}

/** Repli universel quand le .ics ne s'ouvre pas sur le téléphone. */
export function lienGoogleAgenda({ date, heure, dureeMin = 60, titre, lieu = '', notes = '' }){
  const debut = new Date(`${date}T${heure}:00`);
  if(isNaN(debut)) return '#';
  const fin = new Date(debut.getTime() + dureeMin * 60000);
  return 'https://calendar.google.com/calendar/render?' + new URLSearchParams({
    action:'TEMPLATE', text:titre || 'Séance',
    dates:`${horodatageUTC(debut)}/${horodatageUTC(fin)}`,
    details:notes || '', location:lieu || ''
  }).toString();
}
