// Bilan de fin de cycle — le texte que le client lit à la fin de ses 4 semaines.
//
// ⚠️ RÈGLE ABSOLUE : on ne montre au client QUE ce qui est positif.
// Ce bilan n'est pas un diagnostic, c'est une reconnaissance de ce qu'il a fait.
// Un chiffre qui va dans le mauvais sens n'est pas « tourné positivement » —
// il est simplement OMIS. L'analyse de ce qui ne va pas est le travail du coach,
// en direct, pas celui d'un encart automatique.
//
// Si rien de chiffré n'est positif, il reste toujours un fait vrai et valorisant :
// être venu s'entraîner. C'est le repli garanti.

import { estim1RM } from './viz.js';

export const OBJECTIFS = [
  { k:'perte',  l:'Perte de poids' },
  { k:'masse',  l:'Prise de masse' },
  { k:'forme',  l:'Forme & santé' }
];

const CM_PAR_TAILLE = 4;   // ordre de grandeur admis pour le tour de taille

const nb = (v, d = 1) => {
  const r = Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
  return String(r).replace('.', ',');
};
const jours = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

/**
 * @param {Object} o
 *   sessions  toutes les séances du client [{date, status, results:[…]}]
 *   entries   mesures [{date, poids, taille, …}]
 *   debut     'YYYY-MM-DD' début du cycle
 *   fin       'YYYY-MM-DD' (aujourd'hui en général)
 *   objectif  'perte' | 'masse' | 'forme'
 *   prenom    pour le titre
 * @returns {null|Object} null s'il n'y a pas de quoi faire un bilan honnête
 */
export function bilanCycle({ sessions = [], entries = [], debut, fin, objectif = 'forme', prenom = '' }){
  const dans = d => d && d >= debut && d <= fin;
  const seances = sessions.filter(s => s.status === 'completed' && dans(s.date))
                          .sort((a,b)=> a.date.localeCompare(b.date));
  if(seances.length < 2) return null;          // pas de quoi raconter quoi que ce soit

  const faits = [];

  // ── 1. L'assiduité : toujours vraie, toujours positive ────────────────────
  const semaines = Math.max(1, Math.round(jours(debut, fin) / 7));
  const parSemaine = seances.length / semaines;
  faits.push({
    cle:'seances', fort:`${seances.length} séances`,
    texte: parSemaine >= 2.5
      ? `bouclées en ${semaines} semaines, soit ${nb(parSemaine)} par semaine. C'est un rythme que peu de gens tiennent.`
      : `bouclées en ${semaines} semaines. Chacune compte, et tu es venu.`
  });

  // ── 2. Le tonnage : un gros chiffre concret, jamais négatif ───────────────
  let tonnage = 0, repsTotal = 0;
  seances.forEach(s => (s.results || []).forEach(r=>{
    const sets = Array.isArray(r.sets) && r.sets.length ? r.sets : [{ reps:r.reps, charge:r.charge }];
    sets.forEach(st=>{
      const rp = parseFloat(String(st.reps || '').replace(',', '.')) || 0;
      const ch = parseFloat(String(st.charge || '').replace(',', '.')) || 0;
      repsTotal += rp;
      tonnage += rp * ch;
    });
  }));
  if(tonnage > 500){
    const tonnes = tonnage / 1000;
    faits.push({
      cle:'tonnage', fort: tonnes >= 1 ? `${nb(tonnes)} tonnes soulevées` : `${nb(tonnage, 0)} kg soulevés`,
      texte: `au total sur le cycle, en ${nb(repsTotal, 0)} répétitions. Mis bout à bout, c'est ce que ton corps a réellement déplacé.`
    });
  }

  // ── 3. La force : moyenne des progressions de charge max estimée ──────────
  // Seuls les exercices en progression sont comptés — voir la règle en tête de
  // fichier. On indique sur combien d'exercices porte la moyenne, pour rester honnête.
  const parExo = new Map();
  seances.forEach(s => (s.results || []).forEach(r=>{
    if(!r.nom) return;
    const sets = Array.isArray(r.sets) && r.sets.length ? r.sets : [{ reps:r.reps, charge:r.charge }];
    let meilleur = null;
    sets.forEach(st=>{
      const e = estim1RM(parseFloat(String(st.charge || '').replace(',', '.')),
                         parseFloat(String(st.reps || '').replace(',', '.')));
      if(e !== null && (meilleur === null || e > meilleur)) meilleur = e;
    });
    if(meilleur === null) return;
    if(!parExo.has(r.nom)) parExo.set(r.nom, []);
    parExo.get(r.nom).push({ date:s.date, e:meilleur });
  }));

  const gains = [];
  let gainKgTotal = 0, exosComparables = 0;
  parExo.forEach(arr=>{
    if(arr.length < 2) return;
    exosComparables++;
    const d = arr[0].e, f = arr[arr.length - 1].e;
    if(f <= d) return;                          // on n'affiche pas les reculs
    gains.push(((f - d) / d) * 100);
    gainKgTotal += f - d;
  });
  if(gains.length){
    const moy = gains.reduce((a,b)=> a + b, 0) / gains.length;
    // On dit explicitement « les exercices où tu as progressé » et on rappelle le
    // total suivi : sans ça, « +6 % sur 2 exercices » laisserait croire que les
    // 9 autres ont progressé aussi. Un bilan positif ne doit pas être un bilan flou.
    const portee = gains.length === exosComparables
      ? `sur l'ensemble de tes ${gains.length} exercices suivis`
      : `sur les ${gains.length} exercice${gains.length > 1 ? 's' : ''} où tu as progressé (sur ${exosComparables} suivis)`;
    faits.push({
      cle:'force', fort:`+${nb(moy)} % de force`,
      texte: `en moyenne ${portee}, soit ${nb(gainKgTotal, 0)} kg de charge maximale gagnés au total. `
        + `Une force qui monte, c'est un muscle qui travaille mieux — et souvent un muscle qui se construit.`
    });
  }

  // ── 4. Les mesures, cadrées par l'objectif fixé par le coach ──────────────
  const mes = entries.filter(e => dans(e.date)).sort((a,b)=> a.date.localeCompare(b.date));
  const premier = k => { const e = mes.find(x => typeof x[k] === 'number'); return e ? e[k] : null; };
  const dernier = k => { const l = mes.filter(x => typeof x[k] === 'number'); return l.length ? l[l.length-1][k] : null; };

  const taille0 = premier('taille'), taille1 = dernier('taille');
  if(taille0 !== null && taille1 !== null && taille0 - taille1 >= 1){
    const perdu = taille0 - taille1;
    const tailles = perdu / CM_PAR_TAILLE;
    faits.push({
      cle:'taille', fort:`−${nb(perdu)} cm de tour de taille`,
      texte: tailles >= 0.8
        ? `soit environ ${tailles >= 1.8 ? nb(tailles, 0) + ' tailles' : 'une taille'} de vêtement (on compte en gros 4 cm par taille). Ça, ça se voit dans le miroir avant de se voir sur la balance.`
        : `Le tour de taille bouge souvent avant la balance : c'est l'un des meilleurs signaux.`
    });
  }

  const poids0 = premier('poids'), poids1 = dernier('poids');
  if(poids0 !== null && poids1 !== null){
    const delta = poids1 - poids0;
    if(objectif === 'perte' && delta <= -0.5){
      faits.push({ cle:'poids', fort:`−${nb(Math.abs(delta))} kg`,
        texte:`sur le cycle, sans à-coups. C'est le rythme qui tient dans la durée.` });
    } else if(objectif === 'masse' && delta >= 0.5){
      faits.push({ cle:'poids', fort:`+${nb(delta)} kg`,
        texte:`sur le cycle, pendant que tes charges montaient. C'est exactement ce qu'on cherche.` });
    }
    // Objectif « forme », ou variation dans l'autre sens : on ne dit rien du poids.
  }

  const bras0 = premier('bras'), bras1 = dernier('bras');
  if(objectif === 'masse' && bras0 !== null && bras1 !== null && bras1 - bras0 >= 0.5){
    faits.push({ cle:'bras', fort:`+${nb(bras1 - bras0)} cm de tour de bras`,
      texte:`Le mètre ruban confirme ce que disent les charges.` });
  }

  const restants = Math.max(0, 28 - jours(debut, fin));
  return {
    titre: prenom ? `${prenom}, ton bilan des 4 semaines` : 'Ton bilan des 4 semaines',
    debut, fin, seances: seances.length, faits,
    joursRestants: restants,
    phraseFinale: choisirFinale(faits, restants, objectif)
  };
}

function choisirFinale(faits, restants, objectif){
  const a = c => faits.some(f => f.cle === c);
  if(restants > 0 && restants <= 7){
    return `Il te reste ${restants} jour${restants > 1 ? 's' : ''} sur ce cycle. `
      + (a('force') ? `Ne lâche pas maintenant : c'est précisément au moment où le corps s'adapte que tout se joue.`
                    : `Termine-le proprement, c'est la régularité qui paie.`);
  }
  if(a('force') && a('taille')) return `Plus fort et plus sec sur le même cycle : c'est la combinaison la plus difficile à obtenir. Continue sur cette lancée.`;
  if(a('force')) return objectif === 'masse'
    ? `Les charges montent, le corps suit. On enchaîne sur le cycle suivant.`
    : `Cette force gagnée ne se perd pas en une semaine. Le prochain cycle part de plus haut.`;
  if(a('taille')) return `Le corps change avant la balance. Garde le cap, la suite arrive.`;
  return `Le plus dur est fait : tu as installé l'habitude. Tout le reste en découle.`;
}

/** Version texte brut, pour coller dans WhatsApp. */
export function bilanTexte(b, prenom){
  if(!b) return '';
  const l = [`${prenom ? 'Salut ' + prenom + ' ! ' : ''}Petit bilan de tes 4 dernières semaines :`, ''];
  b.faits.forEach(f => l.push(`• ${f.fort} — ${f.texte}`));
  l.push('', b.phraseFinale);
  return l.join('\n');
}
