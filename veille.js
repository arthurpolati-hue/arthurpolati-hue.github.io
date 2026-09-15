// Actualités scientifiques — contenu de l'onglet « Actualités » de l'espace coach.
//
// Deux choses vivent ici :
//  1. THEMES[].requete : les requêtes du flux automatique, envoyées à Europe PMC
//     (qui indexe PubMed) et filtrées par REQUETE_FILTRE sur les méta-analyses et
//     revues systématiques. Testées le 15/09/2026 : les versions trop larges
//     ramenaient « hypertrophie ventriculaire gauche » ou « C-reactive protein ».
//  2. THEMES[].synthese : « Ce qu'on sait aujourd'hui », rédigé en français à partir
//     des RÉSUMÉS RÉELS des études, récupérés dans Europe PMC le 15/09/2026. Chaque
//     référence de REFERENCES a été vérifiée (titre, auteurs, revue, année, DOI).
//
// ⚠️ Règles pour toute mise à jour :
//  - ne jamais ajouter une référence de mémoire : la retrouver dans Europe PMC ou
//    PubMed, vérifier son DOI et lire son résumé avant d'écrire une phrase dessus ;
//  - ne rien affirmer au-delà de ce que dit le résumé (pas de chiffre inventé) ;
//  - quand deux méta-analyses divergent, le dire plutôt que choisir ;
//  - mettre à jour `maj` du thème concerné.

export const REQUETE_FILTRE =
  ' AND (PUB_TYPE:"Meta-Analysis" OR PUB_TYPE:"Systematic Review") AND SRC:MED NOT PUB_TYPE:"Retracted Publication"';

// Populations cliniques exclues du flux : pertinentes en médecine, hors sujet pour
// le coaching de personnes en bonne santé.
const CLINIQUE = '(TITLE:patients OR TITLE:cancer OR TITLE:"heart failure" OR TITLE:diabet* OR TITLE:osteoarthritis '
  + 'OR TITLE:syndrome OR TITLE:stroke OR TITLE:"spinal cord" OR TITLE:dialysis OR TITLE:COPD OR TITLE:"multiple sclerosis" '
  + 'OR TITLE:parkinson* OR TITLE:HIV OR TITLE:children OR TITLE:adolescents OR TITLE:youth OR TITLE:pregnan* '
  + 'OR TITLE:qualitative OR TITLE:photobiomodulation)';

export const REFERENCES = {
  '10.1080/02640414.2016.1210197': { auteurs:'Schoenfeld et al.', annee:2017, revue:'J Sports Sci', type:'Méta-analyse',
    titre:'Dose-response relationship between weekly resistance training volume and increases in muscle mass' },
  '10.1007/s40279-016-0543-8': { auteurs:'Schoenfeld et al.', annee:2016, revue:'Sports Med', type:'Méta-analyse',
    titre:'Effects of Resistance Training Frequency on Measures of Muscle Hypertrophy' },
  '10.1519/jsc.0000000000002200': { auteurs:'Schoenfeld et al.', annee:2017, revue:'J Strength Cond Res', type:'Méta-analyse',
    titre:'Strength and Hypertrophy Adaptations Between Low- vs. High-Load Resistance Training' },
  '10.1007/s40279-022-01784-y': { auteurs:'Refalo et al.', annee:2023, revue:'Sports Med', type:'Méta-analyse',
    titre:'Influence of Resistance Training Proximity-to-Failure on Skeletal Muscle Hypertrophy' },
  '10.1007/s40279-024-02069-2': { auteurs:'Robinson et al.', annee:2024, revue:'Sports Med', type:'Méta-régressions',
    titre:'Exploring the Dose-Response Relationship Between Estimated Resistance Training Proximity to Failure, Strength Gain, and Muscle Hypertrophy' },
  '10.1007/s40279-025-02344-w': { auteurs:'Pelland et al.', annee:2026, revue:'Sports Med', type:'Méta-régressions',
    titre:'The Resistance Training Dose Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency on Muscle Hypertrophy and Strength Gains' },
  '10.3389/fspor.2024.1429789': { auteurs:'Singer et al.', annee:2024, revue:'Front Sports Act Living', type:'Méta-analyse bayésienne',
    titre:'Give it a rest: a systematic review with Bayesian meta-analysis on the effect of inter-set rest interval duration on muscle hypertrophy' },
  '10.1111/sms.14006': { auteurs:'Pallarés et al.', annee:2021, revue:'Scand J Med Sci Sports', type:'Méta-analyse',
    titre:'Effects of range of motion on resistance training adaptations' },
  '10.1519/jsc.0000000000003521': { auteurs:'Roberts et al.', annee:2020, revue:'J Strength Cond Res', type:'Méta-analyse',
    titre:'Sex Differences in Resistance Training: A Systematic Review and Meta-Analysis' },

  '10.1111/obr.13256': { auteurs:'Bellicha et al.', annee:2021, revue:'Obes Rev', type:'Synthèse de 12 revues systématiques',
    titre:'Effect of exercise training on weight loss, body composition changes, and weight maintenance in adults with overweight or obesity' },
  '10.1111/obr.12532': { auteurs:'Wewege et al.', annee:2017, revue:'Obes Rev', type:'Méta-analyse',
    titre:'The effects of high-intensity interval training vs. moderate-intensity continuous training on body composition in overweight and obese adults' },
  '10.3390/nu10040423': { auteurs:'Sardeli et al.', annee:2018, revue:'Nutrients', type:'Méta-analyse',
    titre:'Resistance Training Prevents Muscle Loss Induced by Caloric Restriction in Obese Elderly Individuals' },
  '10.1111/sms.14075': { auteurs:'Murphy & Koehler', annee:2022, revue:'Scand J Med Sci Sports', type:'Méta-analyse',
    titre:'Energy deficiency impairs resistance training gains in lean mass but not strength' },
  '10.3945/ajcn.112.044321': { auteurs:'Wycherley et al.', annee:2012, revue:'Am J Clin Nutr', type:'Méta-analyse',
    titre:'Effects of energy-restricted high-protein, low-fat compared with standard-protein, low-fat diets' },
  '10.1186/s12967-018-1748-4': { auteurs:'Cioffi et al.', annee:2018, revue:'J Transl Med', type:'Méta-analyse',
    titre:'Intermittent versus continuous energy restriction on weight loss and cardiometabolic outcomes' },

  '10.1136/bjsports-2017-097608': { auteurs:'Morton et al.', annee:2018, revue:'Br J Sports Med', type:'Méta-analyse',
    titre:'Effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults' },
  '10.1002/jcsm.12922': { auteurs:'Nunes et al.', annee:2022, revue:'J Cachexia Sarcopenia Muscle', type:'Méta-analyse',
    titre:'Systematic review and meta-analysis of protein intake to support muscle mass and function in healthy adults' },
  '10.1186/1550-2783-10-53': { auteurs:'Schoenfeld et al.', annee:2013, revue:'J Int Soc Sports Nutr', type:'Méta-analyse',
    titre:'The effect of protein timing on muscle strength and hypertrophy: a meta-analysis' },
  '10.1016/j.nut.2022.111791': { auteurs:'Delpino et al.', annee:2022, revue:'Nutrition', type:'Méta-analyse',
    titre:'Influence of age, sex, and type of exercise on the efficacy of creatine supplementation on lean body mass' },
  '10.1080/15502783.2026.2668435': { auteurs:'Naddafha et al.', annee:2026, revue:'J Int Soc Sports Nutr', type:'Méta-analyse',
    titre:'Creatine monohydrate for lean mass, strength, and bone density in postmenopausal women' },
  '10.1136/bjsports-2018-100278': { auteurs:'Grgic et al.', annee:2020, revue:'Br J Sports Med', type:'Synthèse de 21 méta-analyses',
    titre:'Wake up and smell the coffee: caffeine supplementation and exercise performance' },

  '10.1007/s40279-022-01706-y': { auteurs:'Craven et al.', annee:2022, revue:'Sports Med', type:'Méta-analyse',
    titre:'Effects of Acute Sleep Loss on Physical Performance' },
  '10.1002/14651858.cd009790.pub2': { auteurs:'Hayden et al. (Cochrane)', annee:2021, revue:'Cochrane Database Syst Rev', type:'Revue Cochrane',
    titre:'Exercise therapy for chronic low back pain' },
  '10.1007/s40279-015-0385-9': { auteurs:'Borde et al.', annee:2015, revue:'Sports Med', type:'Méta-analyse',
    titre:'Dose-Response Relationships of Resistance Training in Healthy Old Adults' }
};

export const THEMES = [
  {
    k:'hypertrophie', l:'Hypertrophie et force', emoji:'💪',
    requete: '(TITLE:"resistance training" OR TITLE:"strength training" OR TITLE:"resistance exercise" OR TITLE:"muscle hypertrophy" OR TITLE:"muscle growth") '
      + 'AND (ABSTRACT:hypertrophy OR ABSTRACT:"muscle size" OR ABSTRACT:"muscle thickness" OR ABSTRACT:"lean mass" OR ABSTRACT:"muscle strength" OR ABSTRACT:"1RM") '
      + 'NOT (TITLE:ventricular OR TITLE:cardiac OR TITLE:botulinum) NOT ' + CLINIQUE,
    synthese: {
      maj: '2026-09-15',
      intro: `Les grands principes convergent : <b>assez de volume</b>, des séries terminées
        <b>près de l'échec</b>, une <b>amplitude complète</b>, et des <b>charges lourdes</b>
        si l'objectif est la force maximale. Les débats portent surtout sur les dosages.`,
      points: [
        { titre: 'Volume : plus de séries, plus de muscle — avec des rendements décroissants',
          texte: `Chaque série hebdomadaire supplémentaire par muscle est associée à un gain de
            masse musculaire un peu plus grand : une relation dose-réponse graduée (2017). La
            méta-régression la plus récente (2026) confirme des relations distinctes pour
            l'hypertrophie et la force, la force plafonnant plus vite. Elle souligne aussi qu'il
            faut <b>distinguer les séries directes et indirectes</b> (compter par exemple une
            série de développé comme une fraction de série pour les triceps).`,
          sources: ['10.1080/02640414.2016.1210197', '10.1007/s40279-025-02344-w'] },
        { titre: 'Fréquence : un outil pour caser le volume, surtout utile pour la force',
          texte: `En 2016, à volume égal, entraîner un muscle <b>2 fois par semaine</b> donnait
            plus d'hypertrophie qu'une fois. En 2026, avec beaucoup plus d'études, l'effet propre
            de la fréquence sur l'hypertrophie est <b>compatible avec un effet négligeable</b>,
            alors qu'il est net pour la force, avec des rendements décroissants. Les deux
            analyses ne disent donc pas tout à fait la même chose.`,
          sources: ['10.1007/s40279-016-0543-8', '10.1007/s40279-025-02344-w'] },
        { titre: "Proximité de l'échec : pas besoin d'y aller, mais pas trop loin non plus",
          texte: `Aucune preuve qu'aller <b>jusqu'à l'échec</b> soit supérieur pour l'hypertrophie
            (2023). En revanche, plus les séries se terminent <b>près de l'échec</b>, plus le
            muscle grossit, alors que la force varie peu sur une large plage de répétitions en
            réserve (2024, analyse que les auteurs qualifient eux-mêmes d'exploratoire).`,
          sources: ['10.1007/s40279-022-01784-y', '10.1007/s40279-024-02069-2'] },
        { titre: 'Charges : lourd pour la force, peu importe pour le muscle',
          texte: `Les gains de <b>force maximale</b> sont plus grands avec des charges lourdes
            (plus de 60 % du 1RM). L'<b>hypertrophie est similaire</b> sur une large plage de
            charges. À noter : dans ces études, toutes les séries étaient menées à l'échec.`,
          sources: ['10.1519/jsc.0000000000002200'] },
        { titre: 'Repos entre séries : au moins 60 à 90 secondes',
          texte: `Un léger avantage pour l'hypertrophie au-delà de <b>60 s</b> de repos,
            probablement parce qu'un repos trop court fait baisser la charge totale soulevée.
            Au-delà de <b>90 s</b>, aucune différence notable n'est détectée.`,
          sources: ['10.3389/fspor.2024.1429789'] },
        { titre: 'Amplitude : complète, sauf exception',
          texte: `L'amplitude complète est plus efficace que l'amplitude partielle pour la
            <b>force</b> et pour l'<b>hypertrophie des membres inférieurs</b>. Pas de grande
            différence en revanche sur l'architecture du muscle.`,
          sources: ['10.1111/sms.14006'] },
        { titre: "Femmes et hommes s'adaptent de la même façon",
          texte: `Même ampleur d'<b>hypertrophie</b> et de gain de force du bas du corps. Les
            femmes progressent même davantage en force relative du <b>haut du corps</b>, sans
            que les auteurs sachent encore pourquoi.`,
          sources: ['10.1519/jsc.0000000000003521'] }
      ]
    }
  },
  {
    k:'gras', l:'Perte de gras', emoji:'🔥',
    requete: '(TITLE:"weight loss" OR TITLE:"fat loss" OR TITLE:"fat mass" OR TITLE:"body fat" OR TITLE:"body composition" OR TITLE:"energy restriction" OR TITLE:"caloric restriction" OR TITLE:"intermittent fasting") '
      + 'AND (ABSTRACT:exercise OR ABSTRACT:training OR ABSTRACT:diet) '
      + 'NOT (semaglutide OR tirzepatide OR liraglutide OR bariatric OR TITLE:drug OR TITLE:pharmaco*) NOT ' + CLINIQUE,
    synthese: {
      maj: '2026-09-15',
      intro: `L'entraînement aide à perdre du gras, mais son rôle le plus précieux pendant un
        régime est de <b>préserver le muscle</b>. Côté alimentation, <b>jeûne intermittent et
        restriction continue</b> donnent le même résultat, et <b>plus de protéines</b> aide.`,
      points: [
        { titre: "L'exercice aide, mais ne fait pas tout",
          texte: `Chez les adultes en surpoids, l'entraînement réduit la masse grasse (de
            <b>1,3 à 2,6 kg</b> selon les méta-analyses) et la graisse viscérale, bénéfique pour
            la santé cardiométabolique. En revanche, aucun effet significatif n'a été trouvé sur
            le <b>maintien du poids</b> après la perte.`,
          sources: ['10.1111/obr.13256'] },
        { titre: 'HIIT ou cardio continu : même résultat',
          texte: `Le HIIT et le cardio d'intensité modérée améliorent la composition corporelle
            de façon <b>similaire</b>, parfois sans changement sur la balance. À dépense
            énergétique égale, pas de différence. Le HIIT a surtout l'avantage de prendre
            <b>moins de temps</b>.`,
          sources: ['10.1111/obr.12532', '10.1111/obr.13256'] },
        { titre: 'La musculation protège le muscle pendant le régime',
          texte: `Associée à une restriction calorique, la musculation limite la perte de masse
            maigre (<b>environ 0,8 kg</b> préservés dans une synthèse de revues). Chez des
            personnes âgées en obésité, elle a évité <b>environ 94 %</b> de la perte de muscle
            causée par le régime, sans ralentir la perte de poids.`,
          sources: ['10.1111/obr.13256', '10.3390/nu10040423'] },
        { titre: "Un déficit trop grand coûte du muscle, pas de la force",
          texte: `En déficit calorique, les gains de <b>masse maigre</b> sont freinés, alors que
            la <b>force</b> progresse autant. Pour préserver le muscle pendant une perte de poids,
            les auteurs recommandent d'éviter les déficits supérieurs à <b>500 kcal par jour</b>.`,
          sources: ['10.1111/sms.14075'] },
        { titre: 'Plus de protéines pendant la sèche',
          texte: `À calories égales, un régime <b>riche en protéines</b> fait perdre un peu plus
            de poids et de gras, <b>limite la perte de masse maigre</b> et freine la baisse du
            métabolisme de repos. Des bénéfices modestes, mais tous dans le bon sens.`,
          sources: ['10.3945/ajcn.112.044321'] },
        { titre: 'Jeûne intermittent : ni mieux ni moins bien',
          texte: `Le jeûne intermittent fait perdre <b>autant de poids</b> qu'une restriction
            calorique continue, avec des effets métaboliques comparables. Le choix peut donc se
            faire selon ce que la personne tient le mieux. Les auteurs manquent encore d'études
            de long terme.`,
          sources: ['10.1186/s12967-018-1748-4'] }
      ]
    }
  },
  {
    k:'nutrition', l:'Nutrition et compléments', emoji:'🥗',
    requete: '(TITLE:"protein supplementation" OR TITLE:"protein intake" OR TITLE:"dietary protein" OR TITLE:whey OR TITLE:creatine OR TITLE:caffeine OR TITLE:"sports nutrition" OR TITLE:"dietary supplement*") '
      + 'AND (ABSTRACT:"resistance training" OR ABSTRACT:exercise OR ABSTRACT:"muscle mass" OR ABSTRACT:"exercise performance") NOT ' + CLINIQUE,
    synthese: {
      maj: '2026-09-15',
      intro: `Deux choses ont un effet démontré sur les résultats de l'entraînement :
        <b>assez de protéines</b> et la <b>créatine</b>. La caféine aide la performance du
        jour. Le <b>moment</b> de la prise de protéines compte beaucoup moins que la
        <b>quantité totale</b> sur la journée.`,
      points: [
        { titre: 'Protéines : environ 1,6 g par kilo de poids par jour',
          texte: `Augmenter ses protéines renforce les gains de force et de masse musculaire.
            Au-delà d'environ <b>1,6 g/kg/jour</b>, aucun gain supplémentaire de masse maigre
            n'a été observé. L'effet diminue avec l'âge et augmente avec l'expérience
            d'entraînement (2018). Une méta-analyse plus récente parle de gains
            <b>faibles mais réels</b> (2022).`,
          sources: ['10.1136/bjsports-2017-097608', '10.1002/jcsm.12922'] },
        { titre: 'Le moment compte peu, la quantité totale compte beaucoup',
          texte: `L'effet de la « fenêtre » autour de la séance disparaît une fois les autres
            facteurs pris en compte. Le meilleur prédicteur de la prise de muscle est la
            <b>quantité totale de protéines</b> sur la journée.`,
          sources: ['10.1186/1550-2783-10-53'] },
        { titre: 'Créatine : efficace avec la musculation, y compris chez la femme',
          texte: `Associée à la musculation, la créatine augmente la masse maigre d'environ
            <b>1,1 kg</b>, quel que soit l'âge ; l'effet était plus marqué chez les hommes dans
            cette analyse (2022). Chez la femme ménopausée, <b>5 g/jour ou plus avec de la
            musculation</b> apportent des gains faibles mais significatifs de masse maigre et de
            force, sans effet indésirable ; l'effet sur les os reste incertain (2026).`,
          sources: ['10.1016/j.nut.2022.111791', '10.1080/15502783.2026.2668435'] },
        { titre: 'Caféine : un vrai coup de pouce',
          texte: `Synthèse de 21 méta-analyses : la caféine améliore la performance dans un large
            éventail d'efforts — <b>force, endurance musculaire, puissance, endurance</b> — avec
            un effet généralement plus marqué en endurance. La plupart des études portent sur de
            jeunes hommes.`,
          sources: ['10.1136/bjsports-2018-100278'] }
      ]
    }
  },
  {
    k:'sante', l:'Récupération et santé', emoji:'😴',
    requete: '(TITLE:sleep OR TITLE:"low back pain" OR TITLE:menopaus* OR TITLE:"older adults" OR TITLE:sarcopenia OR TITLE:"sports injur*" OR TITLE:"muscle damage" OR TITLE:recovery) '
      + 'AND (ABSTRACT:"resistance training" OR ABSTRACT:"strength training" OR ABSTRACT:"resistance exercise" OR ABSTRACT:"exercise training") NOT ' + CLINIQUE,
    synthese: {
      maj: '2026-09-15',
      intro: `Le <b>manque de sommeil</b> dégrade la performance, l'<b>exercice</b> soulage
        modestement le mal de dos chronique, et la <b>musculation</b> reste efficace chez les
        personnes âgées comme chez la femme ménopausée.`,
      points: [
        { titre: 'Moins de sommeil, moins de performance',
          texte: `Le manque de sommeil dégrade la performance physique : environ <b>0,4 % de
            moins par heure passée éveillé</b> avant l'effort, en cas de nuit blanche ou de
            coucher tardif. Les séances de l'après-midi sont les plus touchées, celles du matin
            beaucoup moins. Si une mauvaise nuit est inévitable, mieux vaut
            <b>s'entraîner le matin</b>.`,
          sources: ['10.1007/s40279-022-01706-y'] },
        { titre: "Mal de dos chronique : l'exercice aide, modestement",
          texte: `Revue Cochrane : l'exercice est <b>probablement efficace sur la douleur</b>
            (certitude modérée) par rapport à l'absence de traitement ou à un placebo. Son effet
            sur les limitations fonctionnelles est plus faible. Il fait mieux que des conseils
            seuls ou l'électrothérapie, et à peu près comme les thérapies manuelles.`,
          sources: ['10.1002/14651858.cd009790.pub2'] },
        { titre: 'Seniors : la musculation marche, les paramètres comptent',
          texte: `Chez les personnes âgées en bonne santé, la musculation améliore la
            <b>force</b> et la <b>masse musculaire</b>. La durée du programme, l'intensité, le
            temps sous tension et le repos entre les séries font partie des variables qui
            comptent le plus.`,
          sources: ['10.1007/s40279-015-0385-9'] },
        { titre: 'Femmes ménopausées : musculation et créatine',
          texte: `<b>5 g/jour de créatine ou plus, avec de la musculation</b>, apportent des
            gains faibles mais significatifs de masse maigre et de force, sans effet indésirable.
            Les essais à 3 g/jour ou moins et sans musculation n'ont montré aucun effet mesurable.
            L'effet sur la densité osseuse reste incertain.`,
          sources: ['10.1080/15502783.2026.2668435'] }
      ]
    }
  }
];
