/* ═══════════════════════════════════════════════════════════════════════════
   ONGLET ALIMENTATION DE LA FICHE CLIENT (coach.html)
   ═══════════════════════════════════════════════════════════════════════════
   - Réglages du client : `clients/{id}.nutrition = { actif, affichage, kcal, p, g, l }`.
     `actif` fait apparaître l'onglet sur son lien ; rien ne s'affiche sans lui.
   - Son journal, jour par jour (`alimentation/{id}_{date}`, lu par ID : 7 lectures
     pour une semaine, jamais une collection entière).
   - « Mes aliments » : `aliments/coach = { liste: [...] }`, un seul document commun à
     tous les clients, lu par leur lien (recherche). Valeurs toujours rangées pour 100 g ;
     une portion (« 1 bol = 250 g ») sert seulement de raccourci de saisie.

   Pas d'import Firebase : coach.html passe ses fonctions (même principe que s.html).
*/
import { REPAS, AFFICHAGES, totauxJour, totauxRepas, valeursLigne, fmt, lireNombre, objectifsDe } from './alimentation.js';
import { escapeHtml as esc, isoLocal, addDays, fmtJourLong } from './commun.js';

let ctx = null;
let client = null;
let mesAliments = null;       // null = pas encore lu
let joursCharges = 0;
let ouvertureToken = 0;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

/** ctx = { db, doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, query, collection, where, showToast, spinner } */
export function initAlimentationCoach(c){ ctx = c; injecterStyles(); }

export async function ouvrirAlimentationCoach(cl){
  client = cl;
  const token = ++ouvertureToken;
  const nu = client.nutrition || {};
  const pane = $('#paneAlimentation');
  pane.innerHTML = `
    <div class="card">
      <h2>Alimentation</h2>
      <label class="check-partenaire"><input type="checkbox" id="nuActif" ${nu.actif ? 'checked' : ''}>
        Afficher l'onglet « Alimentation » sur son lien</label>
      <p class="sub" id="nuAccord" style="margin:0 0 12px;font-size:0.8rem;"></p>
      <div class="row">
        <div class="field"><label>Ce qu'il voit</label><select id="nuAffichage">
          ${AFFICHAGES.map(([k, l]) => `<option value="${k}" ${(nu.affichage || 'complet') === k ? 'selected' : ''}>${l}</option>`).join('')}
        </select></div>
      </div>
      <div class="row">
        <div class="field"><label>Calories / jour</label><input type="text" inputmode="decimal" id="nuKcal" value="${nu.kcal || ''}" placeholder="ex. 2200"></div>
        <div class="field"><label>Protéines (g)</label><input type="text" inputmode="decimal" id="nuP" value="${nu.p || ''}"></div>
        <div class="field"><label>Glucides (g)</label><input type="text" inputmode="decimal" id="nuG" value="${nu.g || ''}"></div>
        <div class="field"><label>Lipides (g)</label><input type="text" inputmode="decimal" id="nuL" value="${nu.l || ''}"></div>
      </div>
      <p class="sub" id="nuCoherence" style="margin:0 0 12px;font-size:0.8rem;"></p>
      <p class="sub" style="margin:0 0 12px;font-size:0.8rem;">Tous les objectifs sont facultatifs : sans eux, le client voit
      seulement ses totaux. Dépasser un objectif n'affiche jamais d'alerte chez lui.</p>
      <button class="btn btn-ghost btn-sm" id="nuSave" type="button">Enregistrer</button>
    </div>

    <div class="card">
      <div class="card-head"><h2>Son journal</h2></div>
      <div id="nuMoyenne"></div>
      <div id="nuJournal"><p class="sub">Chargement…</p></div>
      <button class="btn btn-ghost btn-sm" id="nuPlus" type="button" style="margin-top:10px;">7 jours de plus</button>
    </div>

    <div class="card">
      <h2>Mes aliments</h2>
      <p class="sub" style="margin:0 0 12px;font-size:0.8rem;">Communs à <b>tous tes clients</b> : ils sortent en premier
      dans leur recherche, marqués « Arthur ». Pour tes recettes, plats types, ou un produit absent de la table Ciqual.</p>
      <div id="nuListe"><p class="sub">Chargement…</p></div>
      <div class="nu-form" id="nuForm">
        <input type="hidden" id="nuAId">
        <div class="row">
          <div class="field" style="flex:2 1 220px;"><label>Nom</label><input type="text" id="nuANom" maxlength="80" placeholder="ex. Bowl poulet-riz d'Arthur"></div>
          <div class="field"><label>Valeurs pour</label><select id="nuAPour"><option value="100">100 g</option><option value="portion">1 portion</option></select></div>
        </div>
        <div class="row" id="nuAPortion" style="display:none;">
          <div class="field"><label>Nom de la portion</label><input type="text" id="nuAPNom" maxlength="30" placeholder="bol, part, barre…"></div>
          <div class="field"><label>Poids d'une portion (g)</label><input type="text" inputmode="decimal" id="nuAPG"></div>
        </div>
        <div class="row">
          <div class="field"><label>Calories</label><input type="text" inputmode="decimal" id="nuAK"></div>
          <div class="field"><label>Protéines (g)</label><input type="text" inputmode="decimal" id="nuAP"></div>
          <div class="field"><label>Glucides (g)</label><input type="text" inputmode="decimal" id="nuAG"></div>
          <div class="field"><label>Lipides (g)</label><input type="text" inputmode="decimal" id="nuAL"></div>
        </div>
        <div class="row">
          <button class="btn btn-ghost btn-sm" id="nuASave" type="button">Ajouter à mes aliments</button>
          <button class="btn btn-ghost btn-sm" id="nuAAnnuler" type="button" style="display:none;">Annuler</button>
        </div>
      </div>
    </div>`;

  ['#nuKcal', '#nuP', '#nuG', '#nuL'].forEach(s => $(s).addEventListener('input', coherence));
  coherence();
  $('#nuSave').addEventListener('click', enregistrerReglages);
  $('#nuPlus').addEventListener('click', () => chargerJours(7));
  $('#nuAPour').addEventListener('change', () => { $('#nuAPortion').style.display = $('#nuAPour').value === 'portion' ? '' : 'none'; });
  $('#nuASave').addEventListener('click', enregistrerAliment);
  $('#nuAAnnuler').addEventListener('click', viderForm);

  joursCharges = 0;
  $('#nuJournal').innerHTML = '';
  lireAccord(token);
  chargerJours(7);
  chargerMesAliments();
}

/* ─────────────────────────────── Réglages ─────────────────────────────── */

function coherence(){
  const p = lireNombre($('#nuP').value), g = lireNombre($('#nuG').value), l = lireNombre($('#nuL').value);
  const k = lireNombre($('#nuKcal').value);
  if(p === null || g === null || l === null){ $('#nuCoherence').textContent = ''; return; }
  const total = p * 4 + g * 4 + l * 9;
  $('#nuCoherence').innerHTML = `Ces macros font <b>${fmt(total)} kcal</b> (4 / 4 / 9 kcal par gramme)`
    + (k ? (Math.abs(total - k) > k * 0.05 ? ` — écart de ${fmt(total - k)} kcal avec l'objectif calories.` : ', cohérent avec l\'objectif.') : '.');
}

async function enregistrerReglages(){
  const num = s => { const v = lireNombre($(s).value); return v === null ? null : Math.round(v); };
  const nutrition = {
    actif: $('#nuActif').checked, affichage: $('#nuAffichage').value,
    kcal: num('#nuKcal'), p: num('#nuP'), g: num('#nuG'), l: num('#nuL'),
  };
  ctx.spinner(true);
  try{
    await ctx.updateDoc(ctx.doc(ctx.db, 'clients', client.id), { nutrition });
    client.nutrition = nutrition;
    ctx.showToast('Alimentation enregistrée ✓');
  } catch(e){
    console.error('[ARD] Réglages alimentation refusés (code:', e && e.code, ')', e);
    ctx.showToast('Enregistrement impossible — voir la console.', true);
  } finally { ctx.spinner(false); }
}

async function lireAccord(token){
  let c = null;
  try{
    const s = await ctx.getDoc(ctx.doc(ctx.db, 'consentements', client.id));
    if(s.exists()) c = s.data();
  } catch(e){ console.warn('[ARD] Consentement illisible (code:', e && e.code, ')'); }
  if(token !== ouvertureToken) return;
  const jj = iso => iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '';
  $('#nuAccord').innerHTML = c && c.alimentation
    ? `Accord du client pour son journal : donné le ${jj(c.alimentation)}.`
    : (c && c.alimentationRetire
      ? `Le client a <b>arrêté</b> son journal le ${jj(c.alimentationRetire)}. Il peut le reprendre depuis son lien.`
        + (c.alimentationTraite && c.alimentationTraite >= c.alimentationRetire
          ? ` Journal effacé le ${jj(c.alimentationTraite)}.`
          : ` <b>Son journal doit être effacé</b> (promis dans la politique de confidentialité).
             <button class="btn btn-danger btn-sm" id="nuEffacer" type="button" style="margin-top:8px;">Effacer son journal</button>`)
      : `Le client n'a pas encore donné son accord : il lui sera demandé à l'ouverture de l'onglet.`);
  const b = $('#nuEffacer');
  if(b) b.addEventListener('click', effacerJournal);
}

// Retrait de l'accord : tout le journal du client est effacé (le coach peut lister).
async function effacerJournal(){
  if(!confirm(`Effacer définitivement tout le journal alimentaire de ${client.name || 'ce client'} ?`)) return;
  ctx.spinner(true);
  try{
    const snap = await ctx.getDocs(ctx.query(ctx.collection(ctx.db, 'alimentation'), ctx.where('clientId', '==', client.id)));
    const refs = [];
    snap.forEach(d => refs.push(ctx.doc(ctx.db, 'alimentation', d.id)));
    const res = await Promise.allSettled(refs.map(r => ctx.deleteDoc(r)));
    const echecs = res.filter(r => r.status === 'rejected').length;
    if(echecs){ ctx.showToast(`${echecs} jour(s) non effacé(s) — recommence.`, true); return; }
    const today = isoLocal(new Date());
    await ctx.setDoc(ctx.doc(ctx.db, 'consentements', client.id), { alimentationTraite: today }, { merge: true });
    ctx.showToast(`Journal effacé (${refs.length} jour${refs.length > 1 ? 's' : ''}) ✓`);
    ouvrirAlimentationCoach(client);
  } catch(e){
    console.error('[ARD] Effacement du journal refusé (code:', e && e.code, ')', e);
    ctx.showToast('Effacement impossible — voir la console.', true);
  } finally { ctx.spinner(false); }
}

/* ─────────────────────────────── Journal ─────────────────────────────── */

const joursLus = [];   // { iso, repas } dans l'ordre affiché

async function chargerJours(n){
  const token = ouvertureToken;
  const debut = joursCharges;
  if(debut === 0) joursLus.length = 0;
  const auj = new Date(); auj.setHours(12, 0, 0, 0);
  const dates = Array.from({ length: n }, (_, i) => isoLocal(addDays(auj, -(debut + i))));
  joursCharges += n;
  const snaps = await Promise.all(dates.map(d =>
    ctx.getDoc(ctx.doc(ctx.db, 'alimentation', `${client.id}_${d}`)).catch(() => null)));
  if(token !== ouvertureToken) return;
  dates.forEach((d, i) => {
    const s = snaps[i];
    joursLus.push({ iso: d, repas: s && s.exists() ? (s.data().repas || null) : null });
  });
  dessinerJournal();
}

function dessinerJournal(){
  const remplis = joursLus.filter(j => j.repas && totauxJour(j.repas).lignes);
  const o = objectifsDe(client.nutrition);
  if(remplis.length){
    const m = { kcal: 0, p: 0, g: 0, l: 0 };
    remplis.forEach(j => { const t = totauxJour(j.repas); m.kcal += t.kcal; m.p += t.p; m.g += t.g; m.l += t.l; });
    Object.keys(m).forEach(k => m[k] /= remplis.length);
    const vs = (v, c) => c ? ` <small>(objectif ${fmt(c)})</small>` : '';
    $('#nuMoyenne').innerHTML = `<p class="nu-moy">Moyenne sur <b>${remplis.length}</b> jour${remplis.length > 1 ? 's' : ''} noté${remplis.length > 1 ? 's' : ''}
      sur ${joursLus.length} : <b>${fmt(m.kcal)} kcal</b>${vs(m.kcal, o && o.kcal)} · P <b>${fmt(m.p)} g</b>${vs(m.p, o && o.p)}
      · G <b>${fmt(m.g)} g</b>${vs(m.g, o && o.g)} · L <b>${fmt(m.l)} g</b>${vs(m.l, o && o.l)}</p>
      <p class="sub" style="margin:0 0 10px;font-size:0.76rem;">Un jour noté à moitié tire la moyenne vers le bas : regarde le détail avant d'en conclure quoi que ce soit.</p>`;
  } else {
    $('#nuMoyenne').innerHTML = '';
  }
  $('#nuJournal').innerHTML = `<div class="nu-table">
    <div class="nu-tr nu-th"><span>Jour</span><span>kcal</span><span>P</span><span>G</span><span>L</span></div>
    ${joursLus.map((j, i) => {
      const t = j.repas ? totauxJour(j.repas) : null;
      if(!t || !t.lignes) return `<div class="nu-tr nu-vide"><span>${esc(fmtJourLong(j.iso, true))}</span><span class="nu-rien">rien de noté</span></div>`;
      return `<button type="button" class="nu-tr nu-jour" data-i="${i}"><span>${esc(fmtJourLong(j.iso, true))}</span>
        <span>${fmt(t.kcal)}</span><span>${fmt(t.p)}</span><span>${fmt(t.g)}</span><span>${fmt(t.l)}</span></button>
        <div class="nu-detail" id="nuDet${i}" style="display:none;">${detailJour(j.repas)}</div>`;
    }).join('')}</div>`;
  $$('.nu-jour').forEach(b => b.addEventListener('click', () => {
    const d = $('#nuDet' + b.dataset.i);
    d.style.display = d.style.display === 'none' ? 'block' : 'none';
  }));
}

function detailJour(repas){
  return REPAS.map(([k, nom]) => {
    const lignes = repas[k] || [];
    if(!lignes.length) return '';
    const t = totauxRepas(lignes);
    return `<div class="nu-rep"><b>${nom}</b> <span>${fmt(t.kcal)} kcal</span></div>`
      + lignes.map(li => {
        const v = valeursLigne(li);
        const src = li.src === 'manuel' ? ' <em>(saisi à la main)</em>' : '';
        return `<div class="nu-al">${esc(li.nom)}${src} — ${fmt(li.q)} g · ${fmt(v.kcal)} kcal · P ${fmt(v.p, 1)} · G ${fmt(v.g, 1)} · L ${fmt(v.l, 1)}</div>`;
      }).join('');
  }).join('');
}

/* ─────────────────────────────── Mes aliments ─────────────────────────────── */

async function chargerMesAliments(){
  if(mesAliments === null){
    try{
      const s = await ctx.getDoc(ctx.doc(ctx.db, 'aliments', 'coach'));
      mesAliments = s.exists() ? (s.data().liste || []) : [];
    } catch(e){
      console.error('[ARD] Lecture de mes aliments impossible (code:', e && e.code, ')', e);
      $('#nuListe').innerHTML = `<p class="sub">Lecture impossible (règles Firestore à jour ?).</p>`;
      return;
    }
  }
  dessinerListe();
}

function dessinerListe(){
  const liste = [...mesAliments].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  $('#nuListe').innerHTML = liste.length ? liste.map(a => `<div class="nu-item">
      <button type="button" class="nu-item-nom" data-id="${esc(a.id)}">${esc(a.nom)}
        <small>${fmt(a.kcal)} kcal · P ${fmt(a.p, 1)} · G ${fmt(a.g, 1)} · L ${fmt(a.l, 1)} pour 100 g${a.portion ? ` · 1 ${esc(a.portion.nom)} = ${fmt(a.portion.g)} g` : ''}</small></button>
      <button type="button" class="nu-item-x" data-id="${esc(a.id)}" aria-label="Supprimer">✕</button>
    </div>`).join('') : `<p class="sub" style="font-size:0.84rem;">Aucun aliment pour l'instant.</p>`;
  $$('.nu-item-nom').forEach(b => b.addEventListener('click', () => remplirForm(mesAliments.find(a => a.id === b.dataset.id))));
  $$('.nu-item-x').forEach(b => b.addEventListener('click', async () => {
    const a = mesAliments.find(x => x.id === b.dataset.id);
    if(!a || !confirm(`Supprimer « ${a.nom} » de tes aliments ? Les journaux qui l'utilisent déjà ne changent pas.`)) return;
    await sauverListe(mesAliments.filter(x => x.id !== a.id), 'Aliment supprimé ✓');
  }));
}

function remplirForm(a){
  if(!a) return;
  $('#nuAId').value = a.id;
  $('#nuANom').value = a.nom;
  $('#nuAPour').value = '100';
  $('#nuAPortion').style.display = 'none';
  $('#nuAPNom').value = a.portion ? a.portion.nom : '';
  $('#nuAPG').value = a.portion ? a.portion.g : '';
  $('#nuAK').value = a.kcal; $('#nuAP').value = a.p; $('#nuAG').value = a.g; $('#nuAL').value = a.l;
  if(a.portion){ $('#nuAPour').value = 'portion'; $('#nuAPortion').style.display = '';
    // Affiché pour une portion, comme il a été saisi.
    const k = a.portion.g / 100;
    $('#nuAK').value = r1(a.kcal * k); $('#nuAP').value = r1(a.p * k); $('#nuAG').value = r1(a.g * k); $('#nuAL').value = r1(a.l * k);
  }
  $('#nuASave').textContent = 'Enregistrer les modifications';
  $('#nuAAnnuler').style.display = '';
  $('#nuForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function viderForm(){
  ['#nuAId', '#nuANom', '#nuAPNom', '#nuAPG', '#nuAK', '#nuAP', '#nuAG', '#nuAL'].forEach(s => { $(s).value = ''; });
  $('#nuAPour').value = '100';
  $('#nuAPortion').style.display = 'none';
  $('#nuASave').textContent = 'Ajouter à mes aliments';
  $('#nuAAnnuler').style.display = 'none';
}

const r1 = v => Math.round(v * 10) / 10;

async function enregistrerAliment(){
  const nom = $('#nuANom').value.trim();
  const k = lireNombre($('#nuAK').value);
  if(!nom || k === null){ ctx.showToast('Il faut au moins un nom et les calories.', true); return; }
  const parPortion = $('#nuAPour').value === 'portion';
  const pNom = $('#nuAPNom').value.trim(), pG = lireNombre($('#nuAPG').value);
  if(parPortion && (!pNom || !pG)){ ctx.showToast('Indique le nom et le poids de la portion.', true); return; }
  // Toujours rangé pour 100 g ; une portion saisie est convertie.
  const f = parPortion ? 100 / pG : 1;
  const v = s => r1((lireNombre($(s).value) || 0) * f);
  const id = $('#nuAId').value || Math.random().toString(36).slice(2, 10);
  const aliment = { id, nom, kcal: r1(k * f), p: v('#nuAP'), g: v('#nuAG'), l: v('#nuAL'),
    ...((pNom && pG) ? { portion: { nom: pNom, g: pG } } : {}) };
  const liste = mesAliments.filter(a => a.id !== id).concat(aliment);
  if(await sauverListe(liste, $('#nuAId').value ? 'Aliment modifié ✓' : 'Aliment ajouté ✓')) viderForm();
}

async function sauverListe(liste, message){
  ctx.spinner(true);
  try{
    await ctx.setDoc(ctx.doc(ctx.db, 'aliments', 'coach'), { liste });
    mesAliments = liste;
    dessinerListe();
    ctx.showToast(message);
    return true;
  } catch(e){
    console.error('[ARD] Enregistrement de mes aliments refusé (code:', e && e.code, ')', e);
    ctx.showToast('Enregistrement impossible — règles Firestore à jour ?', true);
    return false;
  } finally { ctx.spinner(false); }
}

/* ─────────────────────────────── Styles ─────────────────────────────── */

function injecterStyles(){
  if(document.getElementById('nuStyles')) return;
  const s = document.createElement('style');
  s.id = 'nuStyles';
  s.textContent = `
  .nu-moy{font-size:0.86rem;line-height:1.6;margin:0 0 4px;}
  .nu-moy small{color:var(--fog);}
  .nu-table{display:flex;flex-direction:column;}
  .nu-tr{display:grid;grid-template-columns:minmax(0,2.2fr) repeat(4,minmax(0,1fr));gap:6px;align-items:center;
    padding:9px 4px;border:none;border-top:1px solid var(--steel-line);background:none;color:var(--paper);
    font-family:inherit;font-size:0.84rem;text-align:left;width:100%;}
  .nu-th{font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:var(--fog);border-top:none;}
  .nu-jour{cursor:pointer;}
  .nu-jour:hover{background:rgba(62,142,255,0.06);}
  .nu-vide{color:var(--fog);}
  .nu-rien{grid-column:2 / span 4;font-size:0.78rem;}
  .nu-detail{padding:4px 6px 12px;font-size:0.8rem;line-height:1.55;}
  .nu-rep{margin-top:8px;}
  .nu-rep span{color:var(--fog);font-size:0.76rem;}
  .nu-al{color:#D6D8DA;padding-left:10px;}
  .nu-al em{color:var(--fog);}
  .nu-item{display:flex;align-items:center;gap:8px;border-top:1px solid var(--steel-line);}
  .nu-item-nom{flex:1;min-width:0;background:none;border:none;color:var(--paper);text-align:left;padding:9px 0;
    font-family:inherit;font-size:0.88rem;font-weight:600;cursor:pointer;}
  .nu-item-nom small{display:block;font-weight:400;color:var(--fog);font-size:0.76rem;margin-top:2px;}
  .nu-item-x{background:none;border:none;color:var(--fog);cursor:pointer;font-size:0.95rem;padding:6px;}
  .nu-form{margin-top:14px;padding-top:14px;border-top:1px solid var(--steel-line);}
  `;
  document.head.appendChild(s);
}
