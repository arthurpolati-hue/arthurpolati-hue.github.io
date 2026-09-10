// Catalogue d'exercices proposé en autocomplétion dans coach.html.
//
// n = nom affiché · g = groupe musculaire · s = séries · r = répétitions · p = repos
// Les valeurs s/r/p sont des valeurs de départ raisonnables : elles ne pré-remplissent
// un champ que s'il est encore vide, et restent librement modifiables ensuite.
//
// Pour ajouter un exercice : il suffit de l'écrire dans un programme et de
// l'enregistrer — coach.html apprend automatiquement les noms déjà utilisés dans
// les programmes existants et les propose ensuite en priorité. Ce fichier ne sert
// qu'à ne pas partir d'une liste vide.

export const EXERCICES = [
  /* ---------------------------------------------------------- Pectoraux */
  { n:"Développé couché",            g:"Pectoraux", s:"4", r:"8-10", p:"120s" },
  { n:"Développé couché haltères",         g:"Pectoraux", s:"4", r:"8-12", p:"90s" },
  { n:"Développé incliné",           g:"Pectoraux", s:"4", r:"8-10", p:"120s" },
  { n:"Développé incliné haltères",        g:"Pectoraux", s:"4", r:"8-12", p:"90s" },
  { n:"Développé décliné",                 g:"Pectoraux", s:"3", r:"10-12", p:"90s" },
  { n:"Développé militaire",               g:"Épaules",   s:"4", r:"6-10", p:"120s" },
  { n:"Écarté haltères",                   g:"Pectoraux", s:"3", r:"12-15", p:"60s" },
  { n:"Écarté incliné haltères",           g:"Pectoraux", s:"3", r:"12-15", p:"60s" },
  { n:"Écarté à la poulie vis-à-vis",      g:"Pectoraux", s:"3", r:"12-15", p:"60s" },
  { n:"Pec deck",                          g:"Pectoraux", s:"3", r:"12-15", p:"60s" },
  { n:"Pompes",                            g:"Pectoraux", s:"4", r:"max", p:"60s" },
  { n:"Pompes surélevées",                 g:"Pectoraux", s:"3", r:"12-15", p:"60s" },
  { n:"Pompes diamant",                    g:"Triceps",   s:"3", r:"10-15", p:"60s" },
  { n:"Dips (pectoraux)",                  g:"Pectoraux", s:"3", r:"8-12", p:"90s" },
  { n:"Pull-over haltère",                 g:"Pectoraux", s:"3", r:"12-15", p:"60s" },

  /* ---------------------------------------------------------------- Dos */
  { n:"Traction pronation",                g:"Dos", s:"4", r:"6-10", p:"120s" },
  { n:"Traction supination",               g:"Dos", s:"4", r:"6-10", p:"120s" },
  { n:"Traction assistée",                 g:"Dos", s:"4", r:"8-12", p:"90s" },
  { n:"Tirage vertical poitrine",          g:"Dos", s:"4", r:"10-12", p:"90s" },
  { n:"Tirage vertical prise serrée",      g:"Dos", s:"3", r:"10-12", p:"90s" },
  { n:"Tirage horizontal poulie basse",    g:"Dos", s:"4", r:"10-12", p:"90s" },
  { n:"Rowing barre",                      g:"Dos", s:"4", r:"8-10", p:"120s" },
  { n:"Rowing haltère unilatéral",         g:"Dos", s:"3", r:"10-12", p:"75s" },
  { n:"Rowing T-bar",                      g:"Dos", s:"4", r:"8-12", p:"120s" },
  { n:"Rowing machine",                    g:"Dos", s:"3", r:"10-12", p:"90s" },
  { n:"Soulevé de terre",                  g:"Dos", s:"4", r:"5-6", p:"180s" },
  { n:"Soulevé de terre roumain",          g:"Ischios & fessiers", s:"4", r:"8-10", p:"120s" },
  { n:"Soulevé de terre sumo",             g:"Dos", s:"4", r:"5-6", p:"180s" },
  { n:"Shrug haltères",                    g:"Dos", s:"3", r:"12-15", p:"60s" },
  { n:"Face pull",                         g:"Épaules", s:"3", r:"15-20", p:"60s" },
  { n:"Extension lombaire (banc)",         g:"Dos", s:"3", r:"12-15", p:"60s" },
  { n:"Good morning",                      g:"Ischios & fessiers", s:"3", r:"10-12", p:"90s" },

  /* ------------------------------------------------------------ Épaules */
  { n:"Développé haltères assis",          g:"Épaules", s:"4", r:"8-12", p:"90s" },
  { n:"Développé Arnold",                  g:"Épaules", s:"3", r:"10-12", p:"75s" },
  { n:"Élévation latérale",                g:"Épaules", s:"4", r:"12-15", p:"60s" },
  { n:"Élévation latérale poulie",         g:"Épaules", s:"3", r:"12-15", p:"60s" },
  { n:"Élévation frontale",                g:"Épaules", s:"3", r:"12-15", p:"60s" },
  { n:"Oiseau (élévation buste penché)",   g:"Épaules", s:"3", r:"12-15", p:"60s" },
  { n:"Rowing menton",                     g:"Épaules", s:"3", r:"10-12", p:"75s" },
  { n:"Rotation externe élastique",        g:"Épaules", s:"3", r:"15-20", p:"45s" },

  /* ------------------------------------------------------------- Biceps */
  { n:"Curl barre",                        g:"Biceps", s:"4", r:"8-12", p:"75s" },
  { n:"Curl haltères",                     g:"Biceps", s:"3", r:"10-12", p:"60s" },
  { n:"Curl marteau",                      g:"Biceps", s:"3", r:"10-12", p:"60s" },
  { n:"Curl incliné",                      g:"Biceps", s:"3", r:"10-12", p:"60s" },
  { n:"Curl pupitre (Larry Scott)",        g:"Biceps", s:"3", r:"10-12", p:"60s" },
  { n:"Curl poulie basse",                 g:"Biceps", s:"3", r:"12-15", p:"60s" },
  { n:"Curl concentré",                    g:"Biceps", s:"3", r:"12-15", p:"45s" },

  /* ------------------------------------------------------------ Triceps */
  { n:"Dips (triceps)",                    g:"Triceps", s:"3", r:"8-12", p:"90s" },
  { n:"Extension poulie haute corde",      g:"Triceps", s:"4", r:"12-15", p:"60s" },
  { n:"Extension poulie haute barre",      g:"Triceps", s:"3", r:"10-12", p:"60s" },
  { n:"Barre au front",                    g:"Triceps", s:"4", r:"8-12", p:"90s" },
  { n:"Extension nuque haltère",           g:"Triceps", s:"3", r:"10-12", p:"60s" },
  { n:"Kickback haltère",                  g:"Triceps", s:"3", r:"12-15", p:"45s" },
  { n:"Développé couché prise serrée",     g:"Triceps", s:"4", r:"8-10", p:"120s" },

  /* --------------------------------------------------------- Quadriceps */
  { n:"Squat",                       g:"Quadriceps", s:"4", r:"6-10", p:"180s" },
  { n:"Squat avant (front squat)",         g:"Quadriceps", s:"4", r:"6-8", p:"180s" },
  { n:"Squat gobelet",                     g:"Quadriceps", s:"3", r:"10-12", p:"90s" },
  { n:"Squat bulgare",                     g:"Quadriceps", s:"3", r:"10-12", p:"90s" },
  { n:"Presse à cuisses",                  g:"Quadriceps", s:"4", r:"10-12", p:"120s" },
  { n:"Hack squat",                        g:"Quadriceps", s:"4", r:"8-12", p:"120s" },
  { n:"Fentes avant",                      g:"Quadriceps", s:"3", r:"10-12", p:"90s" },
  { n:"Fentes marchées",                   g:"Quadriceps", s:"3", r:"12 par jambe", p:"90s" },
  { n:"Leg extension",                     g:"Quadriceps", s:"3", r:"12-15", p:"60s" },
  { n:"Step-up sur banc",                  g:"Quadriceps", s:"3", r:"10-12", p:"75s" },
  { n:"Wall sit (chaise)",                 g:"Quadriceps", s:"3", r:"45s", p:"60s" },

  /* ------------------------------------------------ Ischios & fessiers */
  { n:"Leg curl allongé",                  g:"Ischios & fessiers", s:"3", r:"12-15", p:"60s" },
  { n:"Leg curl assis",                    g:"Ischios & fessiers", s:"3", r:"12-15", p:"60s" },
  { n:"Hip thrust",                        g:"Ischios & fessiers", s:"4", r:"8-12", p:"120s" },
  { n:"Pont fessier au sol",               g:"Ischios & fessiers", s:"3", r:"15-20", p:"60s" },
  { n:"Kickback fessier poulie",           g:"Ischios & fessiers", s:"3", r:"12-15", p:"60s" },
  { n:"Abduction machine",                 g:"Ischios & fessiers", s:"3", r:"15-20", p:"60s" },
  { n:"Fentes arrière",                    g:"Ischios & fessiers", s:"3", r:"10-12", p:"90s" },

  /* -------------------------------------------------------- Mollets */
  { n:"Mollets debout",                    g:"Mollets", s:"4", r:"15-20", p:"45s" },
  { n:"Mollets assis",                     g:"Mollets", s:"4", r:"15-20", p:"45s" },
  { n:"Mollets à la presse",               g:"Mollets", s:"3", r:"15-20", p:"45s" },

  /* --------------------------------------------------- Abdos & gainage */
  { n:"Gainage planche",                   g:"Abdos & gainage", s:"3", r:"45s", p:"45s" },
  { n:"Gainage latéral",                   g:"Abdos & gainage", s:"3", r:"30s par côté", p:"45s" },
  { n:"Crunch",                            g:"Abdos & gainage", s:"3", r:"15-20", p:"45s" },
  { n:"Crunch à la poulie",                g:"Abdos & gainage", s:"3", r:"12-15", p:"60s" },
  { n:"Relevé de jambes suspendu",         g:"Abdos & gainage", s:"3", r:"10-15", p:"60s" },
  { n:"Relevé de jambes au sol",           g:"Abdos & gainage", s:"3", r:"15-20", p:"45s" },
  { n:"Russian twist",                     g:"Abdos & gainage", s:"3", r:"20 (10 par côté)", p:"45s" },
  { n:"Mountain climber",                  g:"Abdos & gainage", s:"3", r:"30s", p:"45s" },
  { n:"Hollow hold",                       g:"Abdos & gainage", s:"3", r:"30s", p:"45s" },
  { n:"Roulette abdominale (ab wheel)",    g:"Abdos & gainage", s:"3", r:"8-12", p:"60s" },
  { n:"Bird dog",                          g:"Abdos & gainage", s:"3", r:"10 par côté", p:"45s" },
  { n:"Dead bug",                          g:"Abdos & gainage", s:"3", r:"10 par côté", p:"45s" },

  /* -------------------------------------------------------- Full body */
  { n:"Burpees",                           g:"Full body", s:"4", r:"10", p:"60s" },
  { n:"Thruster",                          g:"Full body", s:"4", r:"8-10", p:"90s" },
  { n:"Kettlebell swing",                  g:"Full body", s:"4", r:"15-20", p:"60s" },
  { n:"Clean (épaulé)",                    g:"Full body", s:"5", r:"3-5", p:"180s" },
  { n:"Snatch (arraché)",                  g:"Full body", s:"5", r:"3", p:"180s" },
  { n:"Farmer walk",                       g:"Full body", s:"3", r:"30m", p:"90s" },
  { n:"Battle rope",                       g:"Full body", s:"4", r:"30s", p:"60s" },
  { n:"Box jump",                          g:"Full body", s:"4", r:"8-10", p:"90s" },

  /* ---------------------------------------------------------- Cardio */
  { n:"Vélo (endurance)",                  g:"Cardio", s:"1", r:"20min", p:"" },
  { n:"Rameur",                            g:"Cardio", s:"1", r:"10min", p:"" },
  { n:"Tapis de course",                   g:"Cardio", s:"1", r:"20min", p:"" },
  { n:"Elliptique",                        g:"Cardio", s:"1", r:"20min", p:"" },
  { n:"Corde à sauter",                    g:"Cardio", s:"4", r:"60s", p:"60s" },
  { n:"Sprint fractionné",                 g:"Cardio", s:"8", r:"30s", p:"90s" },
  { n:"Marche rapide",                     g:"Cardio", s:"1", r:"30min", p:"" },

  /* --------------------------------------------- Échauffement & mobilité */
  { n:"Vélo échauffement",                 g:"Échauffement", s:"1", r:"5min", p:"" },
  { n:"Rotations d'épaules",               g:"Échauffement", s:"2", r:"15", p:"" },
  { n:"Cercles de bras",                   g:"Échauffement", s:"2", r:"15", p:"" },
  { n:"Mobilité hanches",                  g:"Échauffement", s:"2", r:"10 par côté", p:"" },
  { n:"Mobilité thoracique",               g:"Échauffement", s:"2", r:"10 par côté", p:"" },
  { n:"Chat-vache",                        g:"Échauffement", s:"2", r:"10", p:"" },
  { n:"Étirement ischios",                 g:"Étirement", s:"2", r:"30s par jambe", p:"" },
  { n:"Étirement quadriceps",              g:"Étirement", s:"2", r:"30s par jambe", p:"" },
  { n:"Étirement pectoraux",               g:"Étirement", s:"2", r:"30s", p:"" },
  { n:"Étirement dorsaux",                 g:"Étirement", s:"2", r:"30s", p:"" }
];
