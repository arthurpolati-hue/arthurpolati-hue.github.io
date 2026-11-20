/* ═══════════════════════════════════════════════════════════════════════════
   ONGLET ALIMENTATION DU CLIENT (s.html)
   ═══════════════════════════════════════════════════════════════════════════
   Journal du jour, repas par repas, dans `alimentation/{clientId}_{AAAA-MM-JJ}` :
     { clientId, date, repas: { petitdej: [ligne…], dejeuner, collation, diner }, majLe }
   Une ligne : { id, nom, src ('ciqual'|'coach'|'manuel'), ref, q (g), kcal, p, g, l (pour 100 g) }

   Ce module n'importe PAS Firebase : s.html lui passe ses fonctions (ctx). C'est ce
   qui permet à la démo de remplacer Firestore sans toucher à ce fichier.

   Règles d'affichage (PROJET.md §5) : rien d'obligatoire, aucun jugement. Dépasser un
   objectif ne colore rien en rouge et n'affiche aucun message : la barre est pleine,
   c'est tout. Le coach choisit ce que le client voit (`clients.nutrition.affichage`).
*/
import { REPAS, journalVide, chargerCiqual, alimentsCoach, rechercher, totauxJour, totauxRepas,
         valeursLigne, nouvelleLigne, fmt, kcal as fmtKcal, grammes, lireNombre, objectifsDe } from './alimentation.js';
import { escapeHtml as esc, isoLocal, addDays } from './commun.js';

const JOURS_MODIFIABLES = 7;     // aujourd'hui et les 6 jours d'avant
const JOURS_VISIBLES = 30;

let ctx = null;
let dateVue = null;
let journal = journalVide();
let chargeToken = 0;
let baseCoach = [];
let baseCiqual = [];
let pret = false;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

/**
 * ctx = { db, doc, getDoc, setDoc, envoyer, clientId, today, nutrition,
 *         consent: () => objet consentement, enregistrerConsentement(maj) }
 */
export function initAlimentation(c){
  ctx = c;
  dateVue = ctx.today;
  injecterStyles();
}

/** Appelée à chaque ouverture de l'onglet. */
export async function ouvrirAlimentation(){
  const pane = $('#paneAlimentation');
  const cons = ctx.consent() || {};
  if(!cons.alimentation){ afficherAccord(pane); return; }
  if(!pret){
    pane.innerHTML = `<div class="card" style="text-align:center;color:var(--fog);">Chargement…</div>`;
    const [coach, ciq] = await Promise.all([
      ctx.getDoc(ctx.doc(ctx.db, 'aliments', 'coach')).then(s => s.exists() ? s.data().liste : [])
        .catch(e => { console.warn('[ARD] Aliments du coach illisibles (code:', e && e.code, ')'); return []; }),
      chargerCiqual(),
    ]);
    baseCoach = alimentsCoach(coach);
    baseCiqual = ciq;
    pret = true;
  }
  construire(pane);
  chargerJour(dateVue);
}

/* ──────────────────────────────── Accord ──────────────────────────────── */

function afficherAccord(pane){
  pane.innerHTML = `<div class="card">
    <h2>Ton journal alimentaire</h2>
    <p class="al-txt">Tu peux noter ce que tu manges, repas par repas. Arthur le voit et s'en sert pour
    t'accompagner. <b>C'est entièrement facultatif</b> : ton programme fonctionne très bien sans,
    et tu peux arrêter quand tu veux.</p>
    <p class="al-txt">Ce que tu manges peut en dire beaucoup sur ta santé : il faut donc ton accord pour l'enregistrer.</p>
    <label class="consent-check"><input type="checkbox" id="alAccordCheck">
      <span>J'accepte que mon journal alimentaire soit enregistré quand je choisis de le remplir,
      et visible uniquement par Arthur.</span></label>
    <button class="btn btn-blue btn-full" id="alAccordBtn" type="button" disabled>Commencer mon journal</button>
    <p class="sante-accord"><a class="lien-conf" href="confidentialite.html" target="_blank" rel="noopener">Politique de confidentialité</a></p>
  </div>`;
  const btn = $('#alAccordBtn');
  $('#alAccordCheck').addEventListener('change', e => { btn.disabled = !e.target.checked; });
  btn.addEventListener('click', async () => {
    btn.disabled = true; btn.textContent = '…';
    await ctx.enregistrerConsentement({ alimentation: ctx.today, alimentationRetire: '' });
    ouvrirAlimentation();
  });
}

async function retirerAccord(){
  if(!confirm("Arrêter ton journal alimentaire ? Plus rien ne sera enregistré, et Arthur effacera "
    + "ce que tu as déjà noté. Tu pourras le reprendre quand tu veux.")) return;
  await ctx.enregistrerConsentement({ alimentation: '', alimentationRetire: ctx.today });
  ouvrirAlimentation();
}

/* ──────────────────────────────── Page ──────────────────────────────── */

const affichage = () => (ctx.nutrition && ctx.nutrition.affichage) || 'complet';
const avecChiffres = () => affichage() !== 'journal';
const modifiable = iso => iso <= ctx.today && iso >= isoLocal(addDays(new Date(ctx.today + 'T12:00:00'), -(JOURS_MODIFIABLES - 1)));

function libelleJour(iso){
  if(iso === ctx.today) return "Aujourd'hui";
  if(iso === isoLocal(addDays(new Date(ctx.today + 'T12:00:00'), -1))) return 'Hier';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function construire(pane){
  pane.innerHTML = `
    <div class="al-nav">
      <button type="button" class="al-fl" id="alPrec" aria-label="Jour précédent">‹</button>
      <div class="al-jour" id="alJour"></div>
      <button type="button" class="al-fl" id="alSuiv" aria-label="Jour suivant">›</button>
    </div>
    <div id="alResume"></div>
    <div id="alRepas"></div>
    <p class="al-source">Valeurs : table Ciqual de l'ANSES et aliments de ton coach. Ce sont des repères,
    pas des mesures au gramme près.</p>
    <button type="button" class="revoir-tuto" id="alRetirer">Arrêter mon journal alimentaire</button>
    <div class="al-sheet" id="alSheet" role="dialog" aria-modal="true"><div class="al-sheet-in" id="alSheetIn"></div></div>`;
  $('#alPrec').addEventListener('click', () => changerJour(-1));
  $('#alSuiv').addEventListener('click', () => changerJour(1));
  $('#alRetirer').addEventListener('click', retirerAccord);
  $('#alSheet').addEventListener('click', e => { if(e.target.id === 'alSheet') fermerSheet(); });
}

function changerJour(delta){
  const d = isoLocal(addDays(new Date(dateVue + 'T12:00:00'), delta));
  const min = isoLocal(addDays(new Date(ctx.today + 'T12:00:00'), -(JOURS_VISIBLES - 1)));
  if(d > ctx.today || d < min) return;
  dateVue = d;
  chargerJour(d);
}

async function chargerJour(iso){
  const token = ++chargeToken;
  $('#alJour').textContent = libelleJour(iso);
  $('#alSuiv').disabled = iso >= ctx.today;
  $('#alRepas').innerHTML = `<div class="card" style="text-align:center;color:var(--fog);">Chargement…</div>`;
  $('#alResume').innerHTML = '';
  let j = journalVide();
  try{
    const s = await ctx.getDoc(ctx.doc(ctx.db, 'alimentation', `${ctx.clientId}_${iso}`));
    if(s.exists() && s.data().repas) j = { ...journalVide(), ...s.data().repas };
  } catch(e){
    console.error('[ARD] Lecture du journal impossible (code:', e && e.code, ')', e);
  }
  if(token !== chargeToken) return;
  journal = j;
  dessiner();
}

function dessiner(){
  dessinerResume();
  const edit = modifiable(dateVue);
  const chiffres = avecChiffres();
  $('#alRepas').innerHTML = REPAS.map(([k, nom]) => {
    const lignes = journal[k] || [];
    const t = totauxRepas(lignes);
    return `<div class="card al-repas">
      <div class="al-repas-h"><h2>${nom}</h2>${chiffres && lignes.length ? `<span>${fmtKcal(t.kcal)}</span>` : ''}</div>
      ${lignes.map(li => `<button type="button" class="al-ligne" data-repas="${k}" data-id="${esc(li.id)}" ${edit ? '' : 'disabled'}>
          <span class="al-nom">${esc(li.nom)}</span>
          <span class="al-q">${grammes(li.q)}${li.portion ? ' · ' + esc(li.portion) : ''}${chiffres ? ' · ' + fmtKcal(valeursLigne(li).kcal) : ''}</span>
        </button>`).join('')}
      ${edit ? `<button type="button" class="al-ajout" data-repas="${k}">+ Ajouter</button>`
             : (lignes.length ? '' : '<p class="al-vide">Rien de noté.</p>')}
    </div>`;
  }).join('') + (edit ? '' : `<p class="al-source">Ce jour n'est plus modifiable.</p>`);
  $$('.al-ajout').forEach(b => b.addEventListener('click', () => ouvrirRecherche(b.dataset.repas)));
  $$('.al-ligne').forEach(b => b.addEventListener('click', () => {
    const li = (journal[b.dataset.repas] || []).find(x => x.id === b.dataset.id);
    if(li) ouvrirQuantite(b.dataset.repas, li, li);
  }));
}

function barre(label, val, cible, unite){
  const pct = cible ? Math.min(100, (val / cible) * 100) : 0;
  return `<div class="al-barre">
    <div class="al-barre-h"><span>${label}</span><b>${fmt(val)}${cible ? ` <small>/ ${fmt(cible)}</small>` : ''} ${unite}</b></div>
    ${cible ? `<div class="al-piste"><div class="al-plein" style="width:${pct}%"></div></div>` : ''}
  </div>`;
}

function dessinerResume(){
  const t = totauxJour(journal);
  const el = $('#alResume');
  if(!avecChiffres()){
    el.innerHTML = t.lignes ? `<div class="cheer"><b>${t.lignes}</b> aliment${t.lignes > 1 ? 's' : ''} noté${t.lignes > 1 ? 's' : ''} ce jour-là. Merci, ça aide Arthur à t'accompagner.</div>` : '';
    return;
  }
  const o = objectifsDe(ctx.nutrition) || {};
  let html = `<div class="card al-resume">` + barre('Calories', t.kcal, o.kcal, 'kcal');
  if(affichage() === 'complet'){
    html += `<div class="al-macros">${barre('Protéines', t.p, o.p, 'g')}${barre('Glucides', t.g, o.g, 'g')}${barre('Lipides', t.l, o.l, 'g')}</div>`;
  } else {
    html += barre('Protéines', t.p, o.p, 'g');
  }
  el.innerHTML = html + `</div>`;
}

/* ─────────────────────────────── Enregistrement ─────────────────────────────── */

async function enregistrer(){
  const iso = dateVue;
  const data = { clientId: ctx.clientId, date: iso, repas: journal, majLe: new Date().toISOString() };
  try{
    await ctx.envoyer(ctx.setDoc(ctx.doc(ctx.db, 'alimentation', `${ctx.clientId}_${iso}`), data), 'ton journal');
  } catch(e){
    alert("L'enregistrement a échoué. Vérifie ta connexion et réessaie.");
  }
}

/* ──────────────────────────────── Récents ──────────────────────────────── */
// Sur le téléphone seulement : les 30 derniers aliments choisis, avec la quantité.
const cleRecents = () => 'ard:alim:recents:' + ctx.clientId;
function lireRecents(){
  try{ return JSON.parse(localStorage.getItem(cleRecents()) || '[]'); }catch(e){ return []; }
}
function memoriser(ligne){
  const r = lireRecents().filter(x => !(x.nom === ligne.nom && x.src === ligne.src));
  r.unshift({ nom: ligne.nom, src: ligne.src, id: ligne.ref, kcal: ligne.kcal, p: ligne.p, g: ligne.g, l: ligne.l, q: ligne.q });
  try{ localStorage.setItem(cleRecents(), JSON.stringify(r.slice(0, 30))); }catch(e){}
}

/* ─────────────────────────────── Feuille d'ajout ─────────────────────────────── */

function ouvrirSheet(html){
  $('#alSheetIn').innerHTML = html;
  $('#alSheet').classList.add('show');
  document.body.style.overflow = 'hidden';
}
function fermerSheet(){
  $('#alSheet').classList.remove('show');
  document.body.style.overflow = '';
}
const nomRepas = k => (REPAS.find(r => r[0] === k) || [, ''])[1].toLowerCase();

function ligneResultat(a, i){
  const info = avecChiffres() ? `${fmt(a.kcal)} kcal / ${a.portion ? esc(a.portion.nom) : '100 g'}` : '';
  const badge = a.src === 'coach' ? '<span class="al-badge">Arthur</span>' : '';
  const kcalAff = a.portion ? a.kcal * a.portion.g / 100 : a.kcal;
  return `<button type="button" class="al-res" data-i="${i}">
    <span class="al-nom">${badge}${esc(a.nom)}</span>
    ${info ? `<span class="al-q">${a.portion ? `${fmt(kcalAff)} kcal / ${esc(a.portion.nom)}` : info}</span>` : ''}
  </button>`;
}

function ouvrirRecherche(repas){
  ouvrirSheet(`
    <div class="al-sheet-h"><h2>Ajouter au ${esc(nomRepas(repas))}</h2><button type="button" class="al-x" id="alFermer" aria-label="Fermer">✕</button></div>
    <input type="text" id="alCherche" placeholder="Rechercher : riz, poulet, yaourt…" autocomplete="off" enterkeyhint="search">
    <div class="al-liste" id="alResultats"></div>
    <button type="button" class="al-manuel" id="alManuel">Pas trouvé ? Saisir à la main</button>`);
  $('#alFermer').addEventListener('click', fermerSheet);
  $('#alManuel').addEventListener('click', () => ouvrirManuel(repas));
  const input = $('#alCherche');
  let courants = [];
  const afficher = () => {
    const t = input.value.trim();
    if(!t){
      const rec = lireRecents();
      courants = rec;
      $('#alResultats').innerHTML = rec.length
        ? `<p class="al-titre">Récents</p>` + rec.map(ligneResultat).join('')
        : `<p class="al-vide">Tape le nom d'un aliment. Les aliments ajoutés par Arthur apparaissent en premier.</p>`;
    } else {
      courants = rechercher(t, baseCoach.concat(baseCiqual));
      $('#alResultats').innerHTML = courants.length
        ? courants.map(ligneResultat).join('')
        : `<p class="al-vide">Aucun aliment trouvé. Essaie un autre mot, ou saisis-le à la main.</p>`;
    }
    $$('.al-res').forEach(b => b.addEventListener('click', () => {
      const a = courants[+b.dataset.i];
      if(a) ouvrirQuantite(repas, a, null);
    }));
  };
  let minuterie = null;
  input.addEventListener('input', () => { clearTimeout(minuterie); minuterie = setTimeout(afficher, 120); });
  afficher();
  setTimeout(() => input.focus(), 50);
}

/**
 * Choix de la quantité. `existante` : la ligne modifiée (sinon ajout).
 * `a` porte les valeurs pour 100 g, et éventuellement `portion: { nom, g }` (aliment du coach).
 */
function ouvrirQuantite(repas, a, existante){
  const portion = a.portion && a.portion.g ? a.portion : null;
  const qDepart = existante ? existante.q : (a.q || (portion ? portion.g : 100));
  const chiffres = avecChiffres();
  ouvrirSheet(`
    <div class="al-sheet-h"><h2>${esc(a.nom)}</h2><button type="button" class="al-x" id="alFermer" aria-label="Fermer">✕</button></div>
    ${chiffres ? `<p class="al-info">Pour 100 g : <b>${fmt(a.kcal)} kcal</b> · protéines ${fmt(a.p, 1)} g · glucides ${fmt(a.g, 1)} g · lipides ${fmt(a.l, 1)} g${a.kcalCalculee ? '<br><small>Calories calculées à partir des protéines, glucides et lipides (non mesurées par l\'ANSES).</small>' : ''}</p>` : ''}
    <label for="alQ">Quantité</label>
    <div class="al-qte"><input type="text" inputmode="decimal" id="alQ" value="${fmt(qDepart, 1)}"><span>g</span></div>
    ${portion ? `<div class="al-portions">
        <button type="button" class="coach-opt" data-q="${portion.g}">1 ${esc(portion.nom)}</button>
        <button type="button" class="coach-opt" data-q="${portion.g / 2}">½ ${esc(portion.nom)}</button>
        <button type="button" class="coach-opt" data-q="${portion.g * 2}">2 × ${esc(portion.nom)}</button></div>` : ''}
    ${chiffres ? `<p class="al-calc" id="alCalc"></p>` : ''}
    <button type="button" class="btn btn-blue btn-full" id="alValider">${existante ? 'Enregistrer' : 'Ajouter'}</button>
    ${existante ? `<button type="button" class="al-manuel al-suppr" id="alSuppr">Retirer du ${esc(nomRepas(repas))}</button>` : ''}`);
  $('#alFermer').addEventListener('click', fermerSheet);
  const input = $('#alQ');
  const calc = () => {
    const q = lireNombre(input.value);
    $('#alValider').disabled = !q;
    if(chiffres) $('#alCalc').innerHTML = q ? `= <b>${fmt(a.kcal * q / 100)} kcal</b> · P ${fmt(a.p * q / 100, 1)} g · G ${fmt(a.g * q / 100, 1)} g · L ${fmt(a.l * q / 100, 1)} g` : '';
  };
  input.addEventListener('input', calc);
  $$('[data-q]').forEach(b => b.addEventListener('click', () => { input.value = fmt(+b.dataset.q, 1); calc(); }));
  calc();
  $('#alValider').addEventListener('click', () => {
    const q = lireNombre(input.value);
    if(!q) return;
    const unePortion = portion && Math.abs(q - portion.g) < 0.01 ? '1 ' + portion.nom : '';
    if(existante){
      existante.q = Math.round(q * 10) / 10;
      if(unePortion) existante.portion = unePortion; else delete existante.portion;
      memoriser(existante);
    } else {
      const li = nouvelleLigne(a, q, unePortion);
      (journal[repas] = journal[repas] || []).push(li);
      memoriser(li);
    }
    fermerSheet(); dessiner(); enregistrer();
  });
  if(existante){
    $('#alSuppr').addEventListener('click', () => {
      journal[repas] = (journal[repas] || []).filter(x => x.id !== existante.id);
      fermerSheet(); dessiner(); enregistrer();
    });
  }
  setTimeout(() => { input.focus(); input.select(); }, 50);
}

function ouvrirManuel(repas){
  ouvrirSheet(`
    <div class="al-sheet-h"><h2>Saisir un aliment</h2><button type="button" class="al-x" id="alFermer" aria-label="Fermer">✕</button></div>
    <div class="field"><label for="alMNom">Nom</label><input type="text" id="alMNom" placeholder="Ex. : barre protéinée chocolat"></div>
    <p class="al-info">Recopie l'étiquette, colonne <b>pour 100 g</b>. Seules les calories sont indispensables.</p>
    <div class="al-grille">
      <div class="field"><label for="alMK">Calories (kcal)</label><input type="text" inputmode="decimal" id="alMK"></div>
      <div class="field"><label for="alMP">Protéines (g)</label><input type="text" inputmode="decimal" id="alMP"></div>
      <div class="field"><label for="alMG">Glucides (g)</label><input type="text" inputmode="decimal" id="alMG"></div>
      <div class="field"><label for="alML">Lipides (g)</label><input type="text" inputmode="decimal" id="alML"></div>
    </div>
    <button type="button" class="btn btn-blue btn-full" id="alMSuite" disabled>Choisir la quantité</button>`);
  $('#alFermer').addEventListener('click', fermerSheet);
  const ok = () => { $('#alMSuite').disabled = !($('#alMNom').value.trim() && lireNombre($('#alMK').value) !== null); };
  ['#alMNom', '#alMK'].forEach(s => $(s).addEventListener('input', ok));
  $('#alMSuite').addEventListener('click', () => {
    ouvrirQuantite(repas, {
      nom: $('#alMNom').value.trim().slice(0, 80), src: 'manuel', id: '',
      kcal: lireNombre($('#alMK').value) || 0, p: lireNombre($('#alMP').value) || 0,
      g: lireNombre($('#alMG').value) || 0, l: lireNombre($('#alML').value) || 0,
    }, null);
  });
  setTimeout(() => $('#alMNom').focus(), 50);
}

/* ──────────────────────────────── Styles ──────────────────────────────── */

function injecterStyles(){
  if(document.getElementById('alStyles')) return;
  const s = document.createElement('style');
  s.id = 'alStyles';
  s.textContent = `
  .al-txt{font-size:0.88rem;color:#D6D8DA;line-height:1.55;margin:0 0 10px;}
  .al-nav{display:flex;align-items:center;gap:10px;margin-bottom:14px;}
  .al-fl{width:42px;height:42px;border-radius:10px;background:var(--steel);border:1px solid var(--steel-line);
    color:var(--paper);font-size:1.4rem;cursor:pointer;flex:0 0 auto;}
  .al-fl:disabled{opacity:0.3;cursor:default;}
  .al-jour{flex:1;text-align:center;font-family:'Bebas Neue',sans-serif;font-size:1.35rem;text-transform:capitalize;}
  .al-resume{padding:16px 18px;}
  .al-macros{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px;}
  .al-barre-h{display:flex;justify-content:space-between;align-items:baseline;gap:6px;font-size:0.78rem;color:var(--fog);margin-bottom:6px;}
  .al-barre-h b{color:var(--paper);font-size:0.95rem;white-space:nowrap;}
  .al-barre-h small{color:var(--fog);font-weight:500;}
  .al-macros .al-barre-h{flex-direction:column;align-items:flex-start;gap:2px;}
  .al-macros .al-barre-h b{font-size:0.85rem;}
  .al-piste{height:6px;border-radius:3px;background:var(--steel-line);overflow:hidden;}
  .al-plein{height:100%;background:var(--blue);border-radius:3px;transition:width .3s ease;}
  .al-repas{padding:14px 16px;}
  .al-repas-h{display:flex;justify-content:space-between;align-items:baseline;}
  .al-repas-h h2{margin:0 0 8px;}
  .al-repas-h span{font-size:0.82rem;color:var(--fog);}
  .al-ligne,.al-res{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;text-align:left;
    background:none;border:none;border-top:1px solid var(--steel-line);padding:10px 0;color:var(--paper);
    font-family:'Work Sans',sans-serif;cursor:pointer;}
  .al-ligne:disabled{cursor:default;}
  .al-nom{font-size:0.92rem;font-weight:600;line-height:1.35;}
  .al-q{font-size:0.78rem;color:var(--fog);}
  .al-ajout{width:100%;margin-top:6px;background:var(--ink);border:1.5px dashed var(--steel-line);border-radius:10px;
    color:var(--blue-soft);font-weight:700;font-size:0.88rem;padding:11px;cursor:pointer;font-family:'Work Sans',sans-serif;}
  .al-vide{color:var(--fog);font-size:0.84rem;margin:6px 0 2px;line-height:1.5;}
  .al-source{color:var(--fog);font-size:0.74rem;line-height:1.5;text-align:center;margin:4px 6px 0;}
  .al-sheet{position:fixed;inset:0;z-index:80;background:rgba(6,9,12,0.8);display:none;align-items:flex-end;justify-content:center;}
  .al-sheet.show{display:flex;}
  .al-sheet-in{background:var(--steel);border:1px solid var(--steel-line);border-radius:18px 18px 0 0;width:100%;max-width:600px;
    max-height:88vh;overflow-y:auto;padding:16px 18px calc(18px + var(--safe-b));}
  .al-sheet-h{display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;}
  .al-sheet-h h2{flex:1;font-family:'Bebas Neue',sans-serif;font-size:1.3rem;margin:0;line-height:1.1;}
  .al-x{background:none;border:none;color:var(--fog);font-size:1.2rem;cursor:pointer;padding:2px 4px;}
  .al-liste{margin-top:8px;min-height:120px;}
  .al-titre{font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--fog);margin:10px 0 2px;}
  .al-badge{display:inline-block;background:var(--blue-dim);color:var(--blue-soft);font-size:0.66rem;font-weight:700;
    border-radius:5px;padding:1px 5px;margin-right:6px;vertical-align:1px;}
  .al-manuel{display:block;width:100%;margin-top:12px;background:none;border:none;color:var(--blue-soft);
    text-decoration:underline;font-size:0.86rem;cursor:pointer;font-family:'Work Sans',sans-serif;padding:8px;}
  .al-suppr{color:var(--fog);}
  .al-info{font-size:0.84rem;color:#D6D8DA;line-height:1.5;margin:0 0 14px;}
  .al-info small{color:var(--fog);}
  .al-qte{display:flex;align-items:center;gap:8px;margin-bottom:12px;}
  .al-qte input{font-size:1.3rem;font-weight:700;text-align:center;max-width:140px;}
  .al-qte span{color:var(--fog);font-weight:700;}
  .al-portions{display:flex;gap:8px;margin-bottom:12px;}
  .al-portions .coach-opt{padding:10px 6px;font-size:0.82rem;}
  .al-calc{font-size:0.86rem;color:var(--blue-soft);margin:0 0 14px;min-height:1.3em;}
  .al-grille{display:grid;grid-template-columns:1fr 1fr;gap:0 10px;}
  `;
  document.head.appendChild(s);
}
