# Convertit la table Ciqual de l'ANSES (Excel) en ciqual.json pour la recherche d'aliments.
# Usage : python3 outils/ciqual2json.py "Table Ciqual 2020_FR_2020 07 07.xls" ciqual.json   (pip install xlrd==2.0.1)
# Source : https://www.data.gouv.fr/ (jeu « Table de composition nutritionnelle des aliments Ciqual »), Licence Ouverte.

import xlrd, json, sys, collections
src, out = sys.argv[1], sys.argv[2]
s = xlrd.open_workbook(src).sheet_by_index(0)
def v(x):
    x = str(x).strip().replace(',', '.')
    if x in ('', '-'): return None
    if x.lower() == 'traces' or x.startswith('<'): return 0.0
    try: return float(x)
    except: return None
stats = collections.Counter(); groupes = []; rows = []
for i in range(1, s.nrows):
    r = s.row_values(i)
    nom = str(r[7]).strip()
    kcal = v(r[10]); src_k = 'ue'
    if kcal is None: kcal = v(r[12]); src_k = 'jones'
    p = v(r[14]);  p = v(r[15]) if p is None else p
    g, l, f = v(r[16]), v(r[17]), v(r[26])
    calc = 0
    if kcal is None and None not in (p, g, l):
        # Règlement UE 1169/2011, annexe XIV : protéines 4, glucides 4, lipides 9, fibres 2,
        # alcool 7, polyols 2,4, acides organiques 3 kcal/g. Composant inconnu = 0.
        z = lambda x: x or 0
        kcal = 4*p + 4*g + 9*l + 2*z(f) + 7*z(v(r[29])) + 2.4*z(v(r[27])) + 3*z(v(r[30]))
        calc = 1; stats['kcal_calculee'] += 1
    if kcal is None: stats['sans_kcal'] += 1; continue
    for k, x in (('p',p),('g',g),('l',l)):
        if x is None: stats['manque_'+k] += 1
    grp = str(r[3]).strip() or 'divers'
    if grp not in groupes: groupes.append(grp)
    r1 = lambda x: None if x is None else round(x, 1)
    rows.append([int(r[6]), nom, round(kcal), r1(p), r1(g), r1(l), r1(f), groupes.index(grp), calc])
json.dump({'source': 'ANSES, Table de composition nutritionnelle des aliments Ciqual 2020 (Licence Ouverte Etalab)',
           'colonnes': ['code','nom','kcal','proteines','glucides','lipides','fibres','groupe','kcalCalculee'],
           'groupes': groupes, 'aliments': rows}, open(out, 'w'), ensure_ascii=False, separators=(',',':'))
print(len(rows), dict(stats), groupes)
