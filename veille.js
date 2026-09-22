// Actualités scientifiques — contenu de l'onglet « Actualités » de l'espace coach.
//
// Deux choses vivent ici :
//  1. THEMES[].requete : les requêtes du flux automatique, envoyées à Europe PMC
//     (qui indexe PubMed) et filtrées par REQUETE_FILTRE sur les méta-analyses et
//     revues systématiques. Testées le 15/09/2026 : les versions trop larges
//     ramenaient « hypertrophie ventriculaire gauche » ou « C-reactive protein ».
//  2. THEMES[].synthese : « Ce qu'on sait aujourd'hui », écrit POUR UN COACH (chiffres,
//     fourchettes, conditions des études) à partir des RÉSUMÉS COMPLETS récupérés dans
//     Europe PMC le 15/09/2026. Chaque référence de REFERENCES a été vérifiée (titre,
//     auteurs, revue, année, DOI).
//
// ⚠️ Règles pour toute mise à jour :
//  - ne jamais ajouter une référence de mémoire : la retrouver dans Europe PMC ou
//    PubMed, vérifier son DOI et lire son résumé COMPLET avant d'écrire dessus ;
//  - aucun chiffre qui ne figure pas dans le résumé : pas de « 10 à 20 séries » ou de
//    « 3 à 6 mg/kg » repris de la culture générale si l'étude citée ne le dit pas ;
//  - toujours donner les CONDITIONS d'un résultat (séries à l'échec, population, durée)
//    et les limites que les auteurs signalent eux-mêmes ;
//  - quand deux méta-analyses divergent, le dire plutôt que choisir ;
//  - mettre à jour `maj` du thème concerné.

// Syntaxe PubMed (E-utilities du NCBI) depuis le 22/09/2026 : Europe PMC a cessé d'envoyer
// les en-têtes CORS, son API est inutilisable depuis un navigateur (voir pubmed.js).
export const REQUETE_FILTRE =
  ' AND (meta-analysis[pt] OR systematic review[pt]) NOT retracted publication[pt]';

// Exclusions communes aux 4 thèmes, en syntaxe PubMed. Sans elles, « créatine » remonte
// la créatine kinase en cardiologie, et les compléments envahissent les thèmes d'entraînement.
const CLINIQUE = ' NOT (patients[ti] OR cancer[ti] OR stroke[ti] OR "heart failure"[ti] OR diabetes[ti] '
  + 'OR COPD[ti] OR dialysis[ti] OR dementia[ti] OR "COVID-19"[ti] OR children[ti] OR adolescents[ti] '
  + 'OR falls[ti] OR surgery[ti])';
const SUPPLEMENTS = ' NOT (supplementation[ti] OR supplement[ti] OR supplements[ti] OR polyphenol[ti] '
  + 'OR ashwagandha[ti] OR creatine[ti] OR caffeine[ti] OR nitrate[ti] OR probiotic[ti])';

export const REFERENCES = {
  // ── Hypertrophie et force ──
  '10.1080/02640414.2016.1210197': { auteurs:'Schoenfeld et al.', annee:2017, revue:'J Sports Sci', type:'Méta-analyse (15 études)',
    titre:'Dose-response relationship between weekly resistance training volume and increases in muscle mass' },
  '10.1007/s40279-025-02344-w': { auteurs:'Pelland et al.', annee:2026, revue:'Sports Med', type:'Méta-régressions (67 études)',
    titre:'The Resistance Training Dose Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency on Muscle Hypertrophy and Strength Gains' },
  '10.1519/jsc.0000000000002776': { auteurs:'Baz-Valle et al.', annee:2021, revue:'J Strength Cond Res', type:'Revue systématique (14 études)',
    titre:'Total Number of Sets as a Training Volume Quantification Method for Muscle Hypertrophy' },
  '10.1007/s40279-016-0543-8': { auteurs:'Schoenfeld et al.', annee:2016, revue:'Sports Med', type:'Méta-analyse (10 études)',
    titre:'Effects of Resistance Training Frequency on Measures of Muscle Hypertrophy' },
  '10.1249/mss.0000000000002585': { auteurs:'Lopez et al.', annee:2021, revue:'Med Sci Sports Exerc', type:'Méta-analyse en réseau (28 études) — erratum publié en 2022',
    titre:'Resistance Training Load Effects on Muscle Hypertrophy and Strength Gain: Systematic Review and Network Meta-analysis' },
  '10.1519/jsc.0000000000002200': { auteurs:'Schoenfeld et al.', annee:2017, revue:'J Strength Cond Res', type:'Méta-analyse (21 études)',
    titre:'Strength and Hypertrophy Adaptations Between Low- vs. High-Load Resistance Training' },
  '10.1007/s40279-022-01784-y': { auteurs:'Refalo et al.', annee:2023, revue:'Sports Med', type:'Méta-analyse (15 études)',
    titre:'Influence of Resistance Training Proximity-to-Failure on Skeletal Muscle Hypertrophy' },
  '10.1007/s40279-024-02069-2': { auteurs:'Robinson et al.', annee:2024, revue:'Sports Med', type:'Méta-régressions exploratoires',
    titre:'Exploring the Dose-Response Relationship Between Estimated Resistance Training Proximity to Failure, Strength Gain, and Muscle Hypertrophy' },
  '10.3389/fspor.2024.1429789': { auteurs:'Singer et al.', annee:2024, revue:'Front Sports Act Living', type:'Méta-analyse bayésienne (9 études)',
    titre:'Give it a rest: a systematic review with Bayesian meta-analysis on the effect of inter-set rest interval duration on muscle hypertrophy' },
  '10.1007/s40279-015-0304-0': { auteurs:'Schoenfeld et al.', annee:2015, revue:'Sports Med', type:'Méta-analyse (8 études)',
    titre:'Effect of repetition duration during resistance training on muscle hypertrophy' },
  '10.1111/sms.14006': { auteurs:'Pallarés et al.', annee:2021, revue:'Scand J Med Sci Sports', type:'Méta-analyse (16 études)',
    titre:'Effects of range of motion on resistance training adaptations' },
  '10.1055/a-2615-4935': { auteurs:'Varovic et al.', annee:2025, revue:'Int J Sports Med', type:'Méta-analyse bayésienne (12 études)',
    titre:'Does Muscle Length Influence Regional Hypertrophy? A Systematic Review and Meta-Analysis' },
  '10.1186/s40798-026-01012-1': { auteurs:'Havers et al.', annee:2026, revue:'Sports Med Open', type:'Méta-analyse (12 études)',
    titre:'Acute and Chronic Effects of Drop-Set Training: A Meta-Analysis and Systematic Review' },
  '10.1007/s40279-025-02176-8': { auteurs:'Zhang et al.', annee:2025, revue:'Sports Med', type:'Méta-analyse (19 études)',
    titre:'Superset Versus Traditional Resistance Training Prescriptions' },
  '10.1007/s40279-026-02428-1': { auteurs:'Cowley et al.', annee:2026, revue:'Sports Med', type:'Méta-analyse en réseau bayésienne',
    titre:'The Effects of Advanced Resistance Training Prescription Methods on Strength, Power, Hypertrophy, and Performance Adaptations in Healthy Adults' },
  '10.1007/s40279-021-01587-7': { auteurs:'Schumann et al.', annee:2022, revue:'Sports Med', type:'Méta-analyse (43 études)',
    titre:'Compatibility of Concurrent Aerobic and Strength Training for Skeletal Muscle Size and Function' },
  '10.1519/jsc.0000000000003521': { auteurs:'Roberts et al.', annee:2020, revue:'J Strength Cond Res', type:'Méta-analyse',
    titre:'Sex Differences in Resistance Training: A Systematic Review and Meta-Analysis' },
  '10.1016/j.jsams.2026.03.002': { auteurs:'Isenmann et al.', annee:2026, revue:'J Sci Med Sport', type:'Méta-analyse (126 études, 4 019 femmes)',
    titre:"It's never too late: The impact of resistance training on strength and body composition in females across the lifespan" },

  // ── Perte de gras ──
  '10.1111/obr.13256': { auteurs:'Bellicha et al.', annee:2021, revue:'Obes Rev', type:'Synthèse de 12 revues systématiques (149 études)',
    titre:'Effect of exercise training on weight loss, body composition changes, and weight maintenance in adults with overweight or obesity' },
  '10.1111/obr.12532': { auteurs:'Wewege et al.', annee:2017, revue:'Obes Rev', type:'Méta-analyse (13 études)',
    titre:'The effects of high-intensity interval training vs. moderate-intensity continuous training on body composition in overweight and obese adults' },
  '10.3390/nu10040423': { auteurs:'Sardeli et al.', annee:2018, revue:'Nutrients', type:'Méta-analyse (6 essais)',
    titre:'Resistance Training Prevents Muscle Loss Induced by Caloric Restriction in Obese Elderly Individuals' },
  '10.1111/sms.14075': { auteurs:'Murphy & Koehler', annee:2022, revue:'Scand J Med Sci Sports', type:'Méta-analyse et méta-régression',
    titre:'Energy deficiency impairs resistance training gains in lean mass but not strength' },
  '10.3945/ajcn.112.044321': { auteurs:'Wycherley et al.', annee:2012, revue:'Am J Clin Nutr', type:'Méta-analyse (24 essais)',
    titre:'Effects of energy-restricted high-protein, low-fat compared with standard-protein, low-fat diets' },
  '10.1186/s12967-018-1748-4': { auteurs:'Cioffi et al.', annee:2018, revue:'J Transl Med', type:'Méta-analyse (11 essais)',
    titre:'Intermittent versus continuous energy restriction on weight loss and cardiometabolic outcomes' },

  // ── Nutrition et compléments ──
  '10.1136/bjsports-2017-097608': { auteurs:'Morton et al.', annee:2018, revue:'Br J Sports Med', type:'Méta-analyse (49 études, 1 863 participants)',
    titre:'Effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults' },
  '10.1002/jcsm.12922': { auteurs:'Nunes et al.', annee:2022, revue:'J Cachexia Sarcopenia Muscle', type:'Méta-analyse (74 essais)',
    titre:'Systematic review and meta-analysis of protein intake to support muscle mass and function in healthy adults' },
  '10.1186/1550-2783-10-53': { auteurs:'Schoenfeld et al.', annee:2013, revue:'J Int Soc Sports Nutr', type:'Méta-régression (23 études)',
    titre:'The effect of protein timing on muscle strength and hypertrophy: a meta-analysis' },
  '10.1016/j.nut.2022.111791': { auteurs:'Delpino et al.', annee:2022, revue:'Nutrition', type:'Méta-analyse (35 études, 1 192 participants)',
    titre:'Influence of age, sex, and type of exercise on the efficacy of creatine supplementation on lean body mass' },
  '10.1080/15502783.2026.2668435': { auteurs:'Naddafha et al.', annee:2026, revue:'J Int Soc Sports Nutr', type:'Méta-analyse (7 essais, 608 femmes)',
    titre:'Creatine monohydrate for lean mass, strength, and bone density in postmenopausal women' },
  '10.1136/bjsports-2018-100278': { auteurs:'Grgic et al.', annee:2020, revue:'Br J Sports Med', type:'Synthèse de 21 méta-analyses',
    titre:'Wake up and smell the coffee: caffeine supplementation and exercise performance' },
  '10.1186/s12970-018-0216-0': { auteurs:'Grgic et al.', annee:2018, revue:'J Int Soc Sports Nutr', type:'Méta-analyse (20 études)',
    titre:'Effects of caffeine intake on muscle strength and power: a systematic review and meta-analysis' },

  // ── Récupération et santé ──
  '10.1007/s40279-022-01706-y': { auteurs:'Craven et al.', annee:2022, revue:'Sports Med', type:'Méta-analyse (69 publications)',
    titre:'Effects of Acute Sleep Loss on Physical Performance' },
  '10.1002/14651858.cd009790.pub2': { auteurs:'Hayden et al. (Cochrane)', annee:2021, revue:'Cochrane Database Syst Rev', type:'Revue Cochrane (249 essais)',
    titre:'Exercise therapy for chronic low back pain' },
  '10.1007/s40279-015-0385-9': { auteurs:'Borde et al.', annee:2015, revue:'Sports Med', type:'Méta-analyse (25 essais)',
    titre:'Dose-Response Relationships of Resistance Training in Healthy Old Adults' },
  '10.1007/s40279-022-01769-x': { auteurs:'Marques et al.', annee:2023, revue:'Sports Med', type:'Méta-analyse (15 études)',
    titre:'Manipulating the Resistance Training Volume in Middle-Aged and Older Adults' },
  '10.3390/ijerph192114048': { auteurs:'Grgic', annee:2022, revue:'Int J Environ Res Public Health', type:'Méta-analyse (6 études)',
    titre:'Use It or Lose It? A Meta-Analysis on the Effects of Resistance Training Cessation (Detraining) on Muscle Size in Older Adults' }
};

export const THEMES = [
  {
    k:'hypertrophie', l:'Hypertrophie et force', emoji:'💪',
    requete: '((("resistance training"[ti] OR "strength training"[ti] OR "resistance exercise"[ti]) '
      + 'AND (hypertrophy[ti] OR strength[ti] OR "muscle mass"[ti] OR volume[ti] OR frequency[ti] OR load[ti] '
      + 'OR failure[ti] OR "range of motion"[ti])) OR "muscle hypertrophy"[ti])' + SUPPLEMENTS + CLINIQUE,
    synthese: {
      maj: '2026-09-15',
      intro: `Repères chiffrés tirés des méta-analyses. Ce qu'il faut garder en tête : <b>aucune
        ne fixe un « nombre magique » de séries</b>. Elles décrivent des relations dose-réponse,
        souvent sur des populations jeunes et majoritairement masculines.`,
      points: [
        { titre: 'Volume hebdomadaire par muscle',
          texte: `<b>Chaque série hebdomadaire en plus</b> ≈ <b>+0,37 %</b> de gain de masse
            musculaire. Au sein d'une même étude, le groupe à volume élevé gagne en moyenne
            <b>3,9 %</b> de plus que le groupe à volume faible. En catégories (&lt; 5, 5–9, ≥ 10
            séries/muscle/semaine), la tendance favorise ≥ 10 séries sans être significative
            (p = 0,074) (2017).<br>
            <b>2026, 67 études, 2 058 participants :</b> hypertrophie et force progressent avec
            le volume, avec des <b>rendements décroissants, beaucoup plus marqués pour la
            force</b>. La méthode de décompte la mieux étayée : <b>série directe = 1, série
            indirecte = 0,5</b> (ex. un développé couché compte 0,5 série pour les triceps).<br>
            <b>Condition :</b> le décompte en séries n'est un bon indicateur de volume que si les
            séries sont menées <b>à l'échec ou près</b>, sur une plage de <b>6 à 20+
            répétitions</b>, les autres variables étant égales (revue 2021).`,
          sources: ['10.1080/02640414.2016.1210197', '10.1007/s40279-025-02344-w', '10.1519/jsc.0000000000002776'] },
        { titre: 'Fréquence',
          texte: `<b>À volume égal</b>, entraîner un muscle <b>2×/semaine</b> donne plus
            d'hypertrophie qu'1× (taille d'effet 0,49 contre 0,30) ; 3× contre 2× n'est pas
            tranché (2016, 10 études).<br>
            <b>2026 :</b> l'effet propre de la fréquence sur l'hypertrophie est <b>compatible avec
            un effet négligeable</b> ; sur la <b>force</b>, il est net (probabilité 100 %), avec
            des rendements décroissants.<br>
            Chez les pratiquants <b>déjà entraînés</b>, faire <b>plus de séances</b> donne plus
            d'hypertrophie (2021). En pratique : la fréquence sert surtout à <b>répartir le
            volume</b> et à développer la force.`,
          sources: ['10.1007/s40279-016-0543-8', '10.1007/s40279-025-02344-w', '10.1249/mss.0000000000002585'] },
        { titre: 'Charges et zones de répétitions',
          texte: `<b>28 études, séries à l'échec :</b> hypertrophie <b>identique</b> à ≤ 8 RM,
            9–15 RM et &gt; 15 RM. En <b>force</b>, ≤ 8 RM et 9–15 RM font mieux que &gt; 15 RM
            (tailles d'effet 0,60–0,63 et 0,34–0,35) ; ≤ 8 RM fait un peu mieux que 9–15 RM, sans
            être significatif (0,26–0,28 ; p = 0,068). Les <b>débutants</b> gagnent plus de
            muscle quelle que soit la charge (2021, erratum publié en 2022).<br>
            Même conclusion avec le seuil de <b>60 % du 1RM</b> : plus de 1RM avec les charges
            lourdes, hypertrophie équivalente (2017, 21 études, séries à l'échec).`,
          sources: ['10.1249/mss.0000000000002585', '10.1519/jsc.0000000000002200'] },
        { titre: "Proximité de l'échec (RIR)",
          texte: `<b>Échec contre non-échec :</b> aucun avantage démontré pour l'hypertrophie
            (taille d'effet 0,12 ; IC 95 % −0,13 à 0,37). Toutes définitions d'« échec »
            confondues, l'avantage est <b>trivial</b> (0,19). Une perte de vitesse &gt; 25 % ne
            fait pas mieux que 20–25 % (2023, 15 études).<br>
            <b>En continu (RIR) :</b> l'hypertrophie <b>augmente à mesure que le RIR diminue</b>,
            alors que la <b>force est similaire sur une large plage de RIR</b> (2024). Limites
            signalées par les auteurs : RIR <b>estimé</b> a posteriori, analyse exploratoire.<br>
            En pratique : pour l'hypertrophie, finir les séries <b>près de l'échec</b> ; l'échec
            total n'apporte rien de démontré. Pour la force, un RIR plus élevé suffit.`,
          sources: ['10.1007/s40279-022-01784-y', '10.1007/s40279-024-02069-2'] },
        { titre: 'Repos entre séries',
          texte: `<b>&gt; 60 s</b> apporte un <b>léger</b> bénéfice pour l'hypertrophie,
            probablement parce qu'un repos court fait baisser la charge totale soulevée.
            <b>Au-delà de 90 s</b>, plus de différence notable. Résultat identique que les séries
            soient menées à l'échec ou non (2024, 9 études).`,
          sources: ['10.3389/fspor.2024.1429789'] },
        { titre: 'Tempo',
          texte: `Hypertrophie <b>similaire pour des répétitions de 0,5 à 8 s</b>. Un tempo
            volontairement très lent (<b>&gt; 10 s par répétition</b>) semble inférieur, mais peu
            d'études contrôlées l'ont testé (2015, 8 études, séries à l'échec).`,
          sources: ['10.1007/s40279-015-0304-0'] },
        { titre: 'Amplitude et longueur musculaire',
          texte: `<b>Amplitude complète &gt; partielle</b> pour la force (taille d'effet 0,56) et
            l'hypertrophie des <b>membres inférieurs</b> (0,88). Pas de différence nette sur
            l'architecture musculaire (2021, 16 études).<br>
            <b>Position étirée ou raccourcie :</b> hypertrophie régionale <b>similaire</b> (effets
            triviaux, avec une légère tendance en faveur de l'étiré sur les zones distales). Les
            auteurs appellent à la prudence : l'écart de longueur entre conditions n'était que de
            21,8 % en moyenne (2025, 12 études).`,
          sources: ['10.1111/sms.14006', '10.1055/a-2615-4935'] },
        { titre: 'Drop sets, supersets, méthodes avancées',
          texte: `<b>Drop sets :</b> mêmes gains d'hypertrophie et de force que les séries
            classiques, mais <b>effort perçu nettement plus élevé</b> (taille d'effet 1,62) et plus
            de lactate — à prévoir dans la récupération (2026, 12 études).<br>
            <b>Supersets :</b> même nombre de répétitions et même charge totale, <b>séance plus
            courte</b>, mêmes adaptations à long terme. En <b>agoniste-antagoniste</b>, plus de
            répétitions (0,68) ; entre exercices <b>biomécaniquement proches</b>, moins de charge
            totale soulevée (−1,08) (2025, 19 études).<br>
            <b>Sept méthodes avancées comparées :</b> aucune ne fait mieux que l'entraînement
            classique en force, puissance ou hypertrophie chez des pratiquants <b>débutants à
            intermédiaires</b> (2026). Ce sont des outils de <b>gain de temps</b>, pas des
            accélérateurs.`,
          sources: ['10.1186/s40798-026-01012-1', '10.1007/s40279-025-02176-8', '10.1007/s40279-026-02428-1'] },
        { titre: 'Cardio et musculation',
          texte: `Ajouter du cardio <b>ne freine ni l'hypertrophie</b> (taille d'effet −0,01)
            <b>ni la force maximale</b> (−0,06). Seule la <b>force explosive</b> est diminuée
            (−0,28), surtout quand cardio et musculation sont faits <b>dans la même séance</b> ;
            séparés d'<b>au moins 3 h</b>, l'effet n'est plus significatif. Résultat indépendant
            du type de cardio (vélo ou course), de la fréquence, du niveau et de l'âge (2022,
            43 études).`,
          sources: ['10.1007/s40279-021-01587-7'] },
        { titre: 'Femmes',
          texte: `Mêmes <b>hypertrophie</b> et force du bas du corps que les hommes ; gain de
            <b>force relative du haut du corps plus grand</b> chez les femmes (taille d'effet
            0,60) (2020).<br>
            <b>126 études, 4 019 femmes :</b> gains de force <b>identiques avant et après la
            ménopause</b> (tailles d'effet 1,50 et 1,46), masse fonctionnelle en hausse et masse
            grasse en baisse, sans lien avec l'âge, la durée ou la fréquence. Les auteurs concluent que
            les <b>recommandations générales s'appliquent aux femmes</b> (2026).`,
          sources: ['10.1519/jsc.0000000000003521', '10.1016/j.jsams.2026.03.002'] }
      ]
    }
  },
  {
    k:'gras', l:'Perte de gras', emoji:'🔥',
    requete: '("fat loss"[ti] OR "fat mass"[ti] OR "body fat"[ti] OR "intermittent fasting"[ti] '
      + 'OR "caloric restriction"[ti] OR "energy restriction"[ti] '
      + 'OR ("weight loss"[ti] AND (exercise[ti] OR training[ti] OR diet[ti] OR protein[ti])))' + SUPPLEMENTS + CLINIQUE,
    synthese: {
      maj: '2026-09-15',
      intro: `En sèche, les leviers les mieux documentés pour garder le muscle sont un
        <b>déficit modéré</b>, la <b>musculation</b> et un apport <b>riche en protéines</b>. Le
        choix du type de cardio ou de régime (jeûne ou non) compte peu sur le résultat.`,
      points: [
        { titre: 'Taille du déficit',
          texte: `En déficit calorique, les gains de <b>masse maigre sont freinés</b> (taille
            d'effet −0,57) alors que la <b>force progresse autant</b> (−0,31, non significatif).
            Recommandation des auteurs : pour <b>préserver la masse maigre</b> pendant une perte
            de poids, <b>éviter les déficits &gt; 500 kcal/jour</b> ; pour en <b>prendre</b>,
            éviter tout déficit prolongé (2022).`,
          sources: ['10.1111/sms.14075'] },
        { titre: 'Musculation pendant la sèche',
          texte: `Chez des personnes âgées en obésité (6 essais, <b>3 séances/semaine</b>,
            12–24 semaines), la musculation a évité <b>93,5 % de la perte de masse maigre</b>
            causée par le régime (<b>0,82 kg</b> préservés), sans changer la perte de gras ni de
            poids (2018).<br>
            Sur 12 revues : <b>0,8 kg de masse maigre préservée</b> (IC 95 % 0,4–1,3) (2021).`,
          sources: ['10.3390/nu10040423', '10.1111/obr.13256'] },
        { titre: 'Protéines en déficit',
          texte: `24 essais, 1 063 personnes, <b>12 semaines</b> en moyenne, calories et lipides
            identiques : le régime <b>riche en protéines</b> fait perdre <b>−0,79 kg</b> de poids
            et <b>−0,87 kg</b> de gras de plus, <b>préserve 0,43 kg</b> de masse maigre, et limite
            la baisse du métabolisme de repos d'environ <b>596 kJ/jour (≈ 142 kcal)</b>. Satiété
            meilleure dans 3 études sur 5 (2012).`,
          sources: ['10.3945/ajcn.112.044321'] },
        { titre: "Ce que l'exercice apporte seul",
          texte: `Chez l'adulte en surpoids : <b>−1,5 à −3,5 kg</b> de poids, <b>−1,3 à −2,6 kg</b>
            de gras, baisse de la <b>graisse viscérale</b>. En revanche, <b>aucun effet
            significatif sur le maintien du poids</b> après la perte (2021, 149 études).<br>
            Chez la femme, la musculation seule réduit la masse grasse à tout âge, avant comme
            après la ménopause (2026, 126 études).`,
          sources: ['10.1111/obr.13256', '10.1016/j.jsams.2026.03.002'] },
        { titre: 'HIIT ou cardio continu',
          texte: `13 études, en moyenne <b>10 semaines × 3 séances</b> : HIIT et cardio modéré
            réduisent autant la masse grasse et le tour de taille, mais le <b>HIIT demande environ
            40 % de temps en moins</b>. La <b>course</b> a de gros effets sur la masse grasse
            (tailles d'effet −0,82 en HIIT, −0,85 en continu) ; le <b>vélo n'a pas fait perdre de
            gras</b> dans ces études (2017).<br>
            À <b>dépense énergétique égale</b>, aucune différence entre les deux (2021).`,
          sources: ['10.1111/obr.12532', '10.1111/obr.13256'] },
        { titre: 'Jeûne intermittent',
          texte: `11 essais de 8 à 24 semaines, jours de jeûne à <b>≤ 25 % des besoins</b> (5:2
            ou autres) : perte de poids <b>comparable</b> à une restriction continue (écart
            −0,61 kg, non significatif). Légère baisse de l'insuline à jeun, de pertinence
            clinique incertaine. Les études de long terme manquent (2018).`,
          sources: ['10.1186/s12967-018-1748-4'] },
        { titre: 'Le cardio ne coûte pas de muscle',
          texte: `Ajouter du cardio à la musculation ne réduit ni l'hypertrophie ni la force
            maximale ; seule la force explosive baisse, surtout dans la même séance. Au moins
            <b>3 h d'écart</b> suffisent à éviter cet effet (2022, 43 études).`,
          sources: ['10.1007/s40279-021-01587-7'] }
      ]
    }
  },
  {
    k:'nutrition', l:'Nutrition et compléments', emoji:'🥗',
    requete: '("protein supplementation"[ti] OR "protein intake"[ti] OR "dietary protein"[ti] OR whey[ti] '
      + 'OR creatine[ti] OR caffeine[ti] OR "sports nutrition"[ti] OR beta-alanine[ti] OR "sodium bicarbonate"[ti]) '
      + 'AND (performance[ti] OR strength[ti] OR hypertrophy[ti] OR "body composition"[ti] OR exercise[ti] '
      + 'OR muscle[ti] OR adults[ti])' + CLINIQUE,
    synthese: {
      maj: '2026-09-15',
      intro: `Les chiffres les plus solides portent sur la <b>quantité de protéines</b> et la
        <b>créatine</b>. Les résumés consultés sur la caféine confirment un effet, mais ne
        donnent <b>pas de dose</b> : aucune n'est donc indiquée ici.`,
      points: [
        { titre: 'Protéines : combien',
          texte: `<b>49 études, 1 863 participants :</b> au-delà de <b>1,62 g/kg/jour</b>
            d'apport <b>total</b>, plus aucun gain supplémentaire de masse maigre. L'effet d'un
            apport accru <b>diminue avec l'âge</b> et est <b>plus grand chez les pratiquants
            entraînés</b> (+0,75 kg) (2018).<br>
            <b>74 essais :</b> gain de masse maigre significatif en musculation à <b>≥ 1,6 g/kg/jour
            chez les moins de 65 ans</b> et dès <b>1,2 à 1,59 g/kg/jour chez les 65 ans et plus</b>.
            Force du bas du corps légèrement meilleure à ≥ 1,6 g/kg/jour (niveau de preuve
            faible) (2022).`,
          sources: ['10.1136/bjsports-2017-097608', '10.1002/jcsm.12922'] },
        { titre: 'Protéines : quand',
          texte: `Sans ajustement, un <b>petit effet</b> apparaît sur l'hypertrophie (aucun sur la
            force) ; une fois pris en compte les autres facteurs, <b>plus aucune différence</b>, ni
            en force ni en hypertrophie. Le <b>meilleur prédicteur</b> du gain musculaire est l'<b>apport
            total</b> de la journée (2013, 23 études).`,
          sources: ['10.1186/1550-2783-10-53'] },
        { titre: 'Créatine',
          texte: `<b>35 études :</b> avec musculation, <b>+1,10 kg de masse maigre</b> (IC 95 %
            0,56–1,65) quel que soit l'âge ; <b>sans exercice, aucun effet</b> (+0,03 kg).
            Hommes <b>+1,46 kg</b>, femmes +0,29 kg (non significatif) (2022).<br>
            <b>Femmes ménopausées (7 essais, 608 femmes, durée médiane 38 semaines) :</b>
            <b>+0,37 kg</b> de masse maigre et <b>+7,5 kg au 1RM de presse</b>. Bénéfice constaté
            avec <b>≥ 5 g/jour associés à la musculation</b> ; les essais à ≤ 3 g/jour et sans
            musculation n'ont montré aucun effet. Densité osseuse inchangée, effets indésirables
            légers et comparables au placebo, fonction rénale inchangée (2026).`,
          sources: ['10.1016/j.nut.2022.111791', '10.1080/15502783.2026.2668435'] },
        { titre: 'Caféine',
          texte: `<b>21 méta-analyses :</b> effet positif sur l'endurance aérobie, la force,
            l'endurance musculaire, la puissance, le saut et la vitesse ; niveau de preuve
            <b>modéré</b>, effet généralement <b>plus marqué en endurance</b>. Études surtout
            menées sur de jeunes hommes (2020).<br>
            <b>Force et puissance :</b> 1RM amélioré (taille d'effet 0,20), significatif pour le
            <b>haut du corps</b> (0,21) mais <b>pas pour le bas du corps</b> (0,15) ; saut vertical
            amélioré (0,17) (2018, 20 études).`,
          sources: ['10.1136/bjsports-2018-100278', '10.1186/s12970-018-0216-0'] }
      ]
    }
  },
  {
    k:'sante', l:'Récupération et santé', emoji:'😴',
    requete: '(((sleep[ti] OR recovery[ti] OR "muscle damage"[ti] OR "muscle soreness"[ti] OR stretching[ti] '
      + 'OR "foam rolling"[ti] OR "cold water immersion"[ti] OR "low back pain"[ti] OR menopause[ti] OR sarcopenia[ti]) '
      + 'AND (exercise[ti] OR training[ti] OR athletes[ti] OR "resistance training"[ti] OR "physical activity"[ti] '
      + 'OR performance[ti])) OR "delayed onset muscle soreness"[ti])' + SUPPLEMENTS + CLINIQUE,
    synthese: {
      maj: '2026-09-15',
      intro: `Repères pratiques sur le sommeil, le mal de dos et les seniors. Pour les seniors,
        les paramètres chiffrés viennent d'études de <b>qualité méthodologique faible</b> :
        ce sont des pistes, pas des normes.`,
      points: [
        { titre: 'Sommeil',
          texte: `Perte de sommeil (≤ 6 h sur 24 h) : performance <b>−7,56 % en moyenne</b>, dans
            <b>toutes</b> les catégories d'effort (force, puissance, endurance, HIIT…). Effets
            constants en cas de <b>nuit blanche</b> ou de <b>réveil plus tôt que d'habitude</b> ;
            environ <b>−0,4 % par heure passée éveillé</b> avant l'effort. Les séances de
            l'<b>après-midi</b> sont touchées, celles du <b>matin</b> largement épargnées (2022,
            69 publications, 89 % d'hommes).`,
          sources: ['10.1007/s40279-022-01706-y'] },
        { titre: 'Mal de dos chronique',
          texte: `<b>249 essais :</b> par rapport à rien, aux soins habituels ou à un placebo,
            l'exercice réduit la <b>douleur de 15,2 points sur 100</b> — seuil jugé cliniquement
            important — avec une certitude modérée. Sur les <b>limitations fonctionnelles</b> :
            −6,8 points, sous le seuil de 10 jugé important. Plus efficace que l'<b>éducation
            seule</b> (−12,2) ou la kinésithérapie sans exercice (−10,4) ; <b>pas mieux que la
            thérapie manuelle</b>. Effets indésirables surtout mineurs, type courbatures (2021).`,
          sources: ['10.1002/14651858.cd009790.pub2'] },
        { titre: 'Seniors : paramètres de musculation',
          texte: `25 essais, 65 ans et plus : gains de <b>force importants</b> (taille d'effet
            1,57), gains de <b>masse musculaire faibles</b> (0,42).<br>
            <b>Pour la force</b>, meilleurs résultats avec : <b>50–53 semaines</b> de programme,
            <b>70–79 % du 1RM</b>, <b>2 séances/semaine</b>, <b>2–3 séries</b> de <b>7–9
            répétitions</b>, 60 s de repos entre séries (tendance).<br>
            <b>Pour la masse musculaire :</b> <b>3 séances/semaine</b>, 2–3 séries de 7–9
            répétitions, <b>51–69 % du 1RM</b>, <b>120 s</b> de repos entre séries.<br>
            Limites signalées par les auteurs : qualité méthodologique faible (PEDro 4,6/10),
            forte hétérogénéité, et seulement 9 études pour la masse musculaire (2015).`,
          sources: ['10.1007/s40279-015-0385-9'] },
        { titre: 'Seniors : volume et arrêt de l’entraînement',
          texte: `À partir de 50 ans, <b>plusieurs séries par exercice</b> font mieux qu'une seule
            pour la force du bas du corps (+1,91 kg en moyenne) (2023, 15 études, 93 % de
            femmes).<br>
            <b>Arrêt de la musculation</b> chez les seniors : pas de perte de masse musculaire
            significative après <b>12 à 24 semaines</b>, perte significative après <b>31 à 52
            semaines</b> (2022, 6 études).`,
          sources: ['10.1007/s40279-022-01769-x', '10.3390/ijerph192114048'] },
        { titre: 'Femmes ménopausées',
          texte: `La musculation fait progresser la force <b>autant après la ménopause
            qu'avant</b> (tailles d'effet 1,46 et 1,50) et réduit la masse grasse (2026, 126
            études).<br>
            <b>Créatine :</b> ≥ 5 g/jour associés à la musculation apportent +0,37 kg de masse
            maigre et +7,5 kg au 1RM de presse, sans effet indésirable notable ; effet sur la
            densité osseuse non démontré (2026).`,
          sources: ['10.1016/j.jsams.2026.03.002', '10.1080/15502783.2026.2668435'] }
      ]
    }
  }
];
