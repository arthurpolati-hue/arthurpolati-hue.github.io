// Graphiques ARD Coaching — SVG écrit à la main, sans librairie externe.
//
// Pourquoi pas Chart.js ou D3 : le site est 100% statique, sans build ni npm, et
// une dépendance CDN de 200 Ko pour tracer trois courbes serait absurde. Le SVG
// inline suit aussi exactement la charte (bleu #3E8EFF sur fond sombre).
//
// Règles de rendu respectées ici, ne pas les défaire :
//   · ligne 2px, bouts arrondis · points r>=4 avec anneau 2px couleur du fond
//   · aire de remplissage à 10% d'opacité (jamais un aplat saturé)
//   · grille en filets pleins 1px (jamais pointillés), une teinte au-dessus du fond
//   · une seule valeur étiquetée : le dernier point (jamais un nombre sur chaque point)
//   · une seule échelle Y par graphique — jamais deux axes Y sur un même tracé
//   · chaque graphique a son équivalent tableau (bouton « chiffres »)

const NS = 'http://www.w3.org/2000/svg';

// Mesures suivies, partagées par coach.html (affichage) et s.html (saisie).
// Source unique : ajouter une ligne ici l'ajoute des deux côtés.
export const MESURES = [
  { k:'poids',    l:'Poids',            u:'kg', pas:'0.1', min:20,  max:300 },
  { k:'taille',   l:'Tour de taille',   u:'cm', pas:'0.5', min:30,  max:250 },
  { k:'hanches',  l:'Tour de hanches',  u:'cm', pas:'0.5', min:30,  max:250 },
  { k:'poitrine', l:'Tour de poitrine', u:'cm', pas:'0.5', min:30,  max:250 },
  { k:'bras',     l:'Tour de bras',     u:'cm', pas:'0.5', min:10,  max:100 },
  { k:'cuisse',   l:'Tour de cuisse',   u:'cm', pas:'0.5', min:20,  max:150 }
];

export const VIZ_COLORS = {
  ligne:      '#3E8EFF',
  progression:'#3E8EFF',
  stagnation: '#B8862F',
  regression: '#B34B4B'
};

function el(nom, attrs = {}){
  const n = document.createElementNS(NS, nom);
  for(const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
}
function fmtNombre(v){
  if(v === null || v === undefined || isNaN(v)) return '—';
  const arrondi = Math.round(v * 10) / 10;
  return String(arrondi).replace('.', ',');
}
function fmtDateCourte(iso){
  const p = String(iso).split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}` : iso;
}

// Bornes d'axe « propres » : on ne part pas de zéro pour un poids de corps ou une
// charge (l'écart utile serait écrasé), mais on garde une marge des deux côtés.
function bornes(valeurs){
  let min = Math.min(...valeurs), max = Math.max(...valeurs);
  if(min === max){ min -= 1; max += 1; }
  const marge = (max - min) * 0.15;
  min -= marge; max += marge;
  const span = max - min;
  const pas = Math.pow(10, Math.floor(Math.log10(span / 3)));
  const pasArrondi = [1, 2, 2.5, 5, 10].map(m => m * pas).find(p => span / p <= 4) || pas * 10;
  return {
    min: Math.floor(min / pasArrondi) * pasArrondi,
    max: Math.ceil(max / pasArrondi) * pasArrondi,
    pas: pasArrondi
  };
}

/**
 * Courbe d'évolution, une seule série.
 * @param {HTMLElement} hote      conteneur (vidé)
 * @param {Object} opts
 *   points  [{x:'YYYY-MM-DD', y:Number}]  triés du plus ancien au plus récent
 *   unite   'kg', 'cm'…
 *   libelle nom de la mesure (sert au tableau et à l'infobulle)
 *   couleur hex
 *   fond    couleur de surface, pour les anneaux des points
 *   hauteur px de la zone traçée (la bande de l'axe X s'ajoute par-dessus)
 */
export function courbe(hote, opts){
  const {
    points = [], unite = '', libelle = 'Valeur',
    couleur = VIZ_COLORS.ligne, fond = '#1B1F22', hauteur = 150
  } = opts;

  hote.innerHTML = '';
  hote.style.position = 'relative';

  if(points.length === 0){
    hote.innerHTML = '<p class="viz-vide">Pas encore de données.</p>';
    return;
  }
  if(points.length === 1){
    // Un seul point ne fait pas une courbe : on affiche la valeur, pas un tracé.
    hote.innerHTML = `<div class="viz-solo"><span class="viz-solo-v">${fmtNombre(points[0].y)}<small>${unite}</small></span>`
      + `<span class="viz-solo-k">${fmtDateCourte(points[0].x)} · une seule mesure, la courbe démarre à la deuxième</span></div>`;
    return;
  }

  const L = hote.clientWidth || 320;
  const padG = 42, padD = 54, padH = 14, padB = 24;
  const H = hauteur + padB;
  const w = Math.max(60, L - padG - padD);
  const h = hauteur - padH;

  const ys = points.map(p => p.y);
  const b = bornes(ys);
  const px = i => padG + (points.length === 1 ? w / 2 : (i / (points.length - 1)) * w);
  const py = v => padH + h - ((v - b.min) / (b.max - b.min)) * h;

  const svg = el('svg', { width:'100%', height:H, viewBox:`0 0 ${L} ${H}`, role:'img',
                          'aria-label':`${libelle} : ${points.length} mesures, de ${fmtNombre(ys[0])}${unite} à ${fmtNombre(ys[ys.length-1])}${unite}` });

  // --- grille + graduations Y (filets pleins, récessifs) ---
  for(let v = b.min; v <= b.max + 1e-9; v += b.pas){
    const y = py(v);
    svg.appendChild(el('line', { x1:padG, y1:y, x2:padG + w, y2:y, stroke:'#2C3134', 'stroke-width':1 }));
    const t = el('text', { x:padG - 8, y:y + 4, 'text-anchor':'end', class:'viz-tick' });
    t.textContent = fmtNombre(v);
    svg.appendChild(t);
  }

  // --- aire de remplissage à 10% ---
  const d = points.map((p,i) => `${i ? 'L' : 'M'}${px(i)},${py(p.y)}`).join(' ');
  svg.appendChild(el('path', {
    d: `${d} L${px(points.length-1)},${padH+h} L${padG},${padH+h} Z`,
    fill: couleur, 'fill-opacity': 0.10
  }));
  // --- ligne 2px ---
  svg.appendChild(el('path', { d, fill:'none', stroke:couleur, 'stroke-width':2,
                               'stroke-linejoin':'round', 'stroke-linecap':'round' }));

  // --- points, avec anneau couleur du fond ---
  points.forEach((p,i)=>{
    svg.appendChild(el('circle', { cx:px(i), cy:py(p.y), r:4, fill:couleur,
                                   stroke:fond, 'stroke-width':2 }));
  });

  // --- une seule étiquette : la dernière valeur ---
  const dernier = points.length - 1;
  const lab = el('text', { x:px(dernier) + 10, y:py(points[dernier].y) + 4, class:'viz-endlabel' });
  lab.textContent = fmtNombre(points[dernier].y) + unite;
  svg.appendChild(lab);

  // --- dates aux extrémités ---
  const d1 = el('text', { x:padG, y:H - 6, class:'viz-tick' });
  d1.textContent = fmtDateCourte(points[0].x);
  svg.appendChild(d1);
  const d2 = el('text', { x:padG + w, y:H - 6, 'text-anchor':'end', class:'viz-tick' });
  d2.textContent = fmtDateCourte(points[dernier].x);
  svg.appendChild(d2);

  // --- survol : trait vertical + point actif + infobulle ---
  const viseur = el('line', { y1:padH, y2:padH + h, stroke:'#4a5257', 'stroke-width':1, opacity:0 });
  svg.appendChild(viseur);
  const actif = el('circle', { r:6, fill:couleur, stroke:fond, 'stroke-width':2, opacity:0 });
  svg.appendChild(actif);
  const zone = el('rect', { x:padG, y:0, width:w, height:H, fill:'transparent', style:'cursor:crosshair' });
  svg.appendChild(zone);

  const bulle = document.createElement('div');
  bulle.className = 'viz-tip';
  bulle.hidden = true;
  hote.appendChild(bulle);

  const viser = (clientX)=>{
    const r = svg.getBoundingClientRect();
    const xRel = (clientX - r.left) * (L / r.width);
    let i = 0, dmin = Infinity;
    points.forEach((p,k)=>{ const dd = Math.abs(px(k) - xRel); if(dd < dmin){ dmin = dd; i = k; } });
    viseur.setAttribute('x1', px(i)); viseur.setAttribute('x2', px(i)); viseur.setAttribute('opacity', 1);
    actif.setAttribute('cx', px(i)); actif.setAttribute('cy', py(points[i].y)); actif.setAttribute('opacity', 1);
    bulle.innerHTML = `<b>${fmtNombre(points[i].y)}${unite}</b><span>${fmtDateCourte(points[i].x)}</span>`;
    bulle.hidden = false;
    const gauche = (px(i) / L) * hote.clientWidth;
    bulle.style.left = Math.min(Math.max(gauche, 40), hote.clientWidth - 40) + 'px';
    bulle.style.top = ((py(points[i].y) / H) * (hote.clientHeight || H)) + 'px';
  };
  const cacher = ()=>{ viseur.setAttribute('opacity',0); actif.setAttribute('opacity',0); bulle.hidden = true; };
  zone.addEventListener('pointermove', e => viser(e.clientX));
  zone.addEventListener('pointerdown', e => viser(e.clientX));
  zone.addEventListener('pointerleave', cacher);

  hote.appendChild(svg);

  // --- équivalent tableau : aucune valeur n'est accessible uniquement au survol ---
  const bascule = document.createElement('button');
  bascule.type = 'button';
  bascule.className = 'viz-tablebtn';
  bascule.textContent = 'Voir les chiffres';
  const tbl = document.createElement('div');
  tbl.className = 'viz-table';
  tbl.hidden = true;
  tbl.innerHTML = `<table><thead><tr><th>Date</th><th>${libelle}</th></tr></thead><tbody>`
    + points.slice().reverse().map(p => `<tr><td>${fmtDateCourte(p.x)}</td><td>${fmtNombre(p.y)}${unite}</td></tr>`).join('')
    + `</tbody></table>`;
  bascule.addEventListener('click', ()=>{
    tbl.hidden = !tbl.hidden;
    bascule.textContent = tbl.hidden ? 'Voir les chiffres' : 'Masquer les chiffres';
  });
  hote.appendChild(bascule);
  hote.appendChild(tbl);
}

/**
 * Mini-courbe sans axes, pour les petits multiples (mensurations).
 * Chaque mesure garde sa propre échelle : superposer un tour de bras (35cm) et un
 * poids (78kg) sur un même axe inventerait une corrélation inexistante.
 */
export function mini(hote, points, couleur = VIZ_COLORS.ligne){
  hote.innerHTML = '';
  if(points.length < 2) return;
  const L = hote.clientWidth || 120, H = 34, p = 4;
  const ys = points.map(v => v.y);
  const min = Math.min(...ys), max = Math.max(...ys), span = (max - min) || 1;
  const px = i => p + (i / (points.length - 1)) * (L - 2*p);
  const py = v => p + (1 - (v - min) / span) * (H - 2*p);
  const svg = el('svg', { width:'100%', height:H, viewBox:`0 0 ${L} ${H}`, 'aria-hidden':'true' });
  const d = points.map((v,i) => `${i ? 'L' : 'M'}${px(i)},${py(v.y)}`).join(' ');
  svg.appendChild(el('path', { d, fill:'none', stroke:couleur, 'stroke-width':2,
                               'stroke-linejoin':'round', 'stroke-linecap':'round' }));
  svg.appendChild(el('circle', { cx:px(points.length-1), cy:py(ys[ys.length-1]), r:3.5,
                                 fill:couleur }));
  hote.appendChild(svg);
}

/**
 * Verdict de progression sur une série de mesures.
 * `sensPositif` = +1 quand monter est un progrès (charge soulevée),
 *                 -1 quand descendre est un progrès (poids de corps en sèche).
 * `semaines` = fenêtre au-delà de laquelle l'absence d'évolution devient une stagnation.
 */
export function verdict(points, { sensPositif = 1, semaines = 5, seuilPct = 2 } = {}){
  if(points.length < 2) return { code:'neuf', libelle:'Pas assez de données', couleur:'#9AA0A6', icone:'·' };

  const premier = points[0], dernier = points[points.length - 1];
  const jours = (new Date(dernier.x) - new Date(premier.x)) / 86400000;
  const ecart = (dernier.y - premier.y) * sensPositif;
  const pct = premier.y ? (ecart / Math.abs(premier.y)) * 100 : 0;

  // Meilleure valeur atteinte et depuis quand : c'est ce qui distingue une vraie
  // stagnation d'une simple mauvaise séance en fin de série.
  let iMeilleur = 0;
  points.forEach((p,i)=>{ if((p.y - points[iMeilleur].y) * sensPositif > 0) iMeilleur = i; });
  const joursDepuisMeilleur = (new Date(dernier.x) - new Date(points[iMeilleur].x)) / 86400000;

  if(pct <= -seuilPct){
    return { code:'regression', libelle:'Régression', couleur:VIZ_COLORS.regression, icone:'↘',
             detail:`${fmtNombre(Math.abs(pct))} % sous le point de départ` };
  }
  if(jours >= semaines * 7 && joursDepuisMeilleur >= semaines * 7){
    return { code:'stagnation', libelle:'Stagnation', couleur:VIZ_COLORS.stagnation, icone:'→',
             detail:`aucun record depuis ${Math.round(joursDepuisMeilleur / 7)} semaines` };
  }
  if(pct >= seuilPct){
    return { code:'progression', libelle:'Progression', couleur:VIZ_COLORS.progression, icone:'↗',
             detail:`+${fmtNombre(pct)} % depuis le début` };
  }
  return { code:'stable', libelle:'Stable', couleur:'#9AA0A6', icone:'·',
           detail: jours < semaines * 7 ? `suivi depuis ${Math.round(jours / 7)} semaine(s)` : 'variation faible' };
}

// Styles communs aux deux pages, injectés une fois.
export function injecterStylesViz(){
  if(document.getElementById('viz-styles')) return;
  const s = document.createElement('style');
  s.id = 'viz-styles';
  s.textContent = `
  .viz-tick{fill:#9AA0A6;font-size:10px;font-family:'Work Sans',sans-serif;font-variant-numeric:tabular-nums;}
  .viz-endlabel{fill:#F6F4EF;font-size:12px;font-weight:700;font-family:'Work Sans',sans-serif;}
  .viz-vide{color:#9AA0A6;font-size:0.85rem;margin:6px 0;}
  .viz-solo{display:flex;flex-direction:column;gap:3px;padding:6px 0 2px;}
  .viz-solo-v{font-family:'Bebas Neue',sans-serif;font-size:1.9rem;line-height:1;color:#F6F4EF;}
  .viz-solo-v small{font-size:1rem;margin-left:2px;color:#9AA0A6;}
  .viz-solo-k{font-size:0.76rem;color:#9AA0A6;}
  .viz-tip{position:absolute;transform:translate(-50%,-140%);background:#0B0E11;border:1px solid #2C3134;
    border-radius:8px;padding:5px 9px;pointer-events:none;white-space:nowrap;z-index:5;
    box-shadow:0 6px 18px rgba(0,0,0,0.5);}
  .viz-tip b{display:block;font-size:0.88rem;color:#F6F4EF;font-variant-numeric:tabular-nums;}
  .viz-tip span{font-size:0.72rem;color:#9AA0A6;}
  .viz-tablebtn{background:none;border:none;color:#3E8EFF;font-size:0.78rem;font-weight:700;
    cursor:pointer;padding:4px 0 0;font-family:'Work Sans',sans-serif;}
  .viz-table{margin-top:6px;max-height:190px;overflow-y:auto;}
  .viz-table table{width:100%;border-collapse:collapse;font-size:0.8rem;}
  .viz-table th{text-align:left;color:#9AA0A6;font-weight:700;font-size:0.68rem;text-transform:uppercase;
    letter-spacing:0.05em;padding:4px 6px;border-bottom:1px solid #2C3134;}
  .viz-table td{padding:4px 6px;border-bottom:1px solid #2C3134;color:#F6F4EF;font-variant-numeric:tabular-nums;}
  .viz-badge{display:inline-flex;align-items:center;gap:5px;font-size:0.74rem;font-weight:700;
    padding:3px 9px;border-radius:20px;border:1px solid;white-space:nowrap;}
  `;
  document.head.appendChild(s);
}
