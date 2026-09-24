# ARD Coaching — fiche projet

> Rangée **dans `site/`, donc dans git** : elle part en ligne avec le code et ne peut plus se perdre.
> Le détail de chaque écran est commenté **dans le code** ; ici, seulement ce qui ne s'en déduit pas.
> Dernière mise à jour : 17/09/2026.

## 1. À quoi ça sert, et pour qui

Arthur Polati, coach sportif indépendant (ARD Coaching), et ses clients.

- **Le coach** (`coach.html`) : son espace d'organisation — ses clients, leurs programmes, les séances
  reçues, les résultats, son business (prospects, offres, chiffre d'affaires, tâches, ventes), le bilan
  de chaque personne et la veille scientifique.
- **Les coachés** (`s.html?c=<id>`) : chacun reçoit **un lien**. Il y voit sa séance du jour, note ce
  qu'il a fait (répétitions, charge, RPE), et **l'envoie au coach**. Il suit aussi ses résultats
  (poids, mensurations) s'il le souhaite.
- **Les prospects** (`index.html`) : formulaire public « bilan offert », qui crée un prospect.

## 2. Accès

| Quoi | Où |
|---|---|
| Dépôt | `arthurpolati-hue/arthurpolati-hue.github.io` (GitHub Pages, branche `main`) |
| Site | https://arthurpolati-hue.github.io |
| Espace coach | `/coach.html` — connexion Firebase (email + mot de passe) |
| Règles Firestore | https://console.firebase.google.com/project/ard-coaching/firestore/databases/-default-/rules |
| Copie des règles | `site/firestore.rules` (la console reste la source de vérité) |
| GitHub CLI | `/opt/homebrew/bin/gh` (hors PATH). Build Pages bloqué : `gh api -X POST repos/arthurpolati-hue/arthurpolati-hue.github.io/pages/builds` |

Projet Firebase `ard-coaching`, plan gratuit (Spark) : **pas de Storage, pas de notifications push,
pas de fonctions serveur**. Tout ce qui existe tient dans ces limites.

## 3. Sécurité, en une phrase

**Le coach est protégé par mot de passe ; le client n'est jamais connecté** : il s'identifie par
l'identifiant unique contenu dans son lien. Les règles Firestore ne peuvent donc pas l'authentifier,
mais elles exigent que l'identifiant corresponde à un client existant, et lui interdisent tout le
reste (lister, supprimer, relire les photos).

**Données de santé** (poids, mensurations, photos, notes de bilan) : jamais enregistrées sans une
**case cochée** par la personne. Accord révocable à tout moment, et le coach est alerté pour effacer.

## 4. Données Firestore

| Collection | Contenu | Qui écrit |
|---|---|---|
| `clients/{id}` | nom, téléphone, objectif, `cycleStart`, `actif`, offre, tarif, `partenaire` | coach |
| `programs/{id}` | le programme, par jour de la semaine | coach |
| `sessions/{id}_{date}` | séance envoyée : séries (reps, charge, RPE), remarques | client et coach |
| `measures/{id}` | poids et mensurations (historique dans un seul document) + index des photos | client et coach |
| `photos/{id}_{date}`, `photos/avatar-{id}` | photos de suivi et photo de fiche, en base64 | client (écrit), coach (lit) |
| `rdv/{id}`, `reprises/{id}` | rendez-vous proposés/choisis, demandes de reprise | client et coach |
| `consentements/{id}` | accords RGPD (suivi, santé), dates | client et coach |
| `bilans/{id}` | le bilan d'entretien, rempli par le coach | coach |
| `prospects/{id}` | formulaire du site et contacts manuels, étapes et dates | site (création) et coach |
| `ventes/{id}`, `taches/{id}` | ventes à l'unité, liste de tâches | coach |

## 5. Règles de travail (à respecter)

1. **Ne jamais pousser en ligne sans un « go » explicite d'Arthur.**
2. **Règles Firestore** : toujours lui donner le **texte complet à coller** (jamais un extrait), avec
   le lien direct vers la console. C'est lui qui publie.
3. **Pas de vert** dans l'interface : direction artistique bleue.
4. **Aucun chiffre inventé** dans les synthèses scientifiques : lire le résumé complet de l'étude,
   donner les conditions et les limites, signaler les désaccords entre études.
5. **Rien d'obligatoire** côté client pour le poids, les mensurations et les photos.
6. **Le client ne voit jamais l'analyse brute** : ce qui lui est montré est factuel et positif.
7. **Tester dans `demo/`** (données fictives, hors git) avant de proposer une mise en ligne.

## 6. Pièges déjà rencontrés (ne pas les refaire)

- **Dates** : toujours `isoLocal()`. `toISOString()` renvoie l'heure UTC et décale les séances d'un jour.
- **Retirer des balises HTML** avec `<[^>]+>` coupe le texte après un « p < 0,05 » : ne retirer que
  les vraies balises.
- **Fichiers calendrier (.ics)** : le point-virgule doit être échappé `\\;`, sinon le rendez-vous est cassé.
- **Photos** : compressées côté navigateur, 184 Ko au pire. Ne pas augmenter la taille sans refaire
  le calcul (limite Firestore : 1 Mio par document).
- **Quotas de lecture** : ne jamais lire toute une collection sans `limit` (l'alerte d'inactivité lit
  150 séances au maximum).
- **Cycle de 4 semaines** : il démarre le jour où le suivi commence. Une valeur par défaut « il y a
  27 jours » faisait croire à un client tout juste arrivé que son cycle se terminait.
- **Source scientifique : PubMed, plus Europe PMC** (22/09/2026). Europe PMC a cessé d'envoyer
  l'en-tête `Access-Control-Allow-Origin` et répond 403 au preflight OPTIONS : tout navigateur
  bloque la lecture, le flux affichait « Impossible de joindre Europe PMC » alors que l'API
  répondait très bien en ligne de commande. **Leçon : une API sans CORS est inutilisable depuis
  une page web, même si `curl` fonctionne.** Le NCBI (E-utilities) renvoie `Access-Control-Allow-Origin: *`.
  Tout passe par `pubmed.js` (esearch → esummary + efetch) ; les requêtes sont en syntaxe PubMed
  (`"expression"[ti]`, `meta-analysis[pt]`), limite d'usage 3 requêtes/seconde sans clé, d'où le cache 12 h.
- **Mots-clés ambigus dans le lexique** : « crunch » traduisait « hyperpressif » et ramenait des
  articles sur le fait de croquer (pneumomédiastin, incisives). Préférer des expressions entières
  (`"abdominal crunch"`, `"curl-up"`), surtout en mode OU.
- **Couleurs des graphiques** : trio validé pour les daltoniens — `#3E8EFF` progression,
  `#B8862F` stagnation, `#B34B4B` régression. Ne pas les changer sans revalider.

## 7. Facturation (17/09/2026)

- `reglages/facturation` : identité de l'émetteur (nom, statut « Entrepreneur individuel »,
  adresse, SIREN, mentions). **Jamais dans le code** : le dépôt est public.
- `factures/{id}` : l'identité de l'émetteur et du client est **recopiée** dans la facture, qui
  doit rester fidèle à ce qui a été émis.
- Numérotation **séquentielle sans trou** par année (`F2026-0001`), calculée à partir du plus grand
  numéro déjà émis ; `prochainNumero` sert seulement de point de départ.
- Mentions obligatoires appliquées (service-public.gouv.fr, lu le 17/09/2026) : identité, SIREN,
  adresse du client, numéro, dates, désignation, total, mention TVA, règlement, pénalités.
  Franchise en base : « TVA non applicable, art. 293 B du CGI » (seuils services 2026 : 37 500 €,
  majoré 41 250 €). L'indemnité de 40 € ne vise que les clients professionnels : elle n'est pas mise.
- **Deux façons de facturer** : « Préparer les factures » (abonnements du mois, clients engagés,
  ventes du mois reprises) et « **+ Facture à la main** » (client de la liste ou personne hors
  fichier, lignes éditables avec quantité, raccourcis offres/prestations, ligne libre).
- **Remise en ligne séparée et négative** : la facture montre le tarif plein puis la remise
  (`ligneRemise`). Nom réglable (`reglages.nomPartenaire`, ex. « Intensity57 »).
  ⚠️ `construireFacture` doit garder les lignes négatives : un filtre `total >= 0` les supprimait.
- PDF fabriqué dans le navigateur avec jsPDF, chargé **à la demande** depuis jsDelivr, aux couleurs
  d'ARD (logo `icons/icon-192.png`, bleu de la marque, fond blanc pour rester imprimable).
- Facturation électronique : réception obligatoire au 01/09/2026, émission au 01/09/2027 pour les
  micro-entreprises ; les ventes aux particuliers relèvent du **e-reporting**, pas de la facture
  électronique. À reprendre avant septembre 2027.

**Bilan — temps consacré (19/09/2026)** : trois questions dans « Santé & contraintes » (séances par
semaine, dont avec le coach, durée) et un résumé calculé sous la section, repris dans le texte copié.
La trame peut marquer une section avec `resume: 'temps'` pour recevoir cet encart.

**Planning de la semaine (24/09/2026)** — dans l'onglet Entraînement, la bande des jours est
devenue un planning : durée, exercices, séries et groupes par jour.
- **Intervertir deux jours** : glisser-déposer (ordinateur) **ou** appui sur le premier jour puis
  sur le second. ⚠️ Les deux modes sont nécessaires : le glisser-déposer HTML5 ne fonctionne pas
  sur iPhone. L'échange porte sur tout le contenu du jour (`{echauffement, exercises}`).
- `intervertirJours()` appelle `saveCurrentDayToMemory()` **avant** de permuter (sinon la saisie en
  cours à l'écran est perdue), marque les deux jours dans `dirtyDays`, active la barre
  d'enregistrement et recharge le jour affiché. Rien n'est écrit en base sans validation.
- **Avertissement d'espacement** : deux jours qui se suivent et partagent un groupe musculaire sont
  signalés (`conflitsPlanning`), sans être interdits — alterner haut et bas du corps est un choix.
- Sur téléphone, la grille passe à 4 colonnes et les groupes sont masqués dans les cases (trop
  étroites) ; l'encadré d'avertissement les nomme.

**Recherche — classement (22/09/2026)** : les recherches libres demandent à PubMed un tri par
pertinence, puis les articles sont reclassés sur les mots réellement tapés (titre prioritaire) ;
ceux dont le titre ne contient aucun mot cherché sont écartés. Une **comparaison « A vs B »** lance
une recherche **par côté** puis entrelace : en une seule requête OU, le sujet le plus étudié occupait
toute la liste. ⚠️ Limite du NCBI : 3 requêtes/seconde et par IP — `esummary` et `efetch` sont
appelés **à la suite**, avec pauses et un réessai ; en parallèle, la connexion était coupée.

**Actualités — recherche libre (22/09/2026)** : barre de recherche dans l'onglet Actualités.
`traduction.js` (copie enrichie du lexique du site de veille d'un ami) traduit le français en
requête PubMed ; une comparaison (« A vs B », « A ou B ») bascule en **OU**, sinon la recherche
est vide. Sujets épinglables en localStorage, études cliniques écartées par défaut (case pour les
réafficher), élargissement titres → résumés sous 5 résultats.
⚠️ Le site de veille de l'ami (`~/Desktop/Veille Prepa Physique`) utilise encore Europe PMC :
il est cassé par la même panne et attend le même basculement.

## 8. La suite

- Suggestion de charge à partir du RPE, quand il y aura assez de clients.
- Suppression automatique des données d'un client en pause depuis plus de 3 ans.
