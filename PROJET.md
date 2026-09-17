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
- PDF fabriqué dans le navigateur avec jsPDF, chargé **à la demande** depuis jsDelivr.
- Facturation électronique : réception obligatoire au 01/09/2026, émission au 01/09/2027 pour les
  micro-entreprises ; les ventes aux particuliers relèvent du **e-reporting**, pas de la facture
  électronique. À reprendre avant septembre 2027.

## 8. La suite

- Suggestion de charge à partir du RPE, quand il y aura assez de clients.
- Suppression automatique des données d'un client en pause depuis plus de 3 ans.
