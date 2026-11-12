# Suivi des Tests - Projet Quiz Madame Roussel

## Critères d'acceptation du prompt de contenu

Vérifiés automatiquement par `node roussel_apply/valider.mjs` (sauf la fidélité au texte, relue à la main).

Critères du sujet :
- **C1** La sortie est une liste JSON valide selon `quizz/schema-quiz.json`.
- **C2** Chaque fleur du texte apparaît une fois, et aucune autre.
- **C3** Les descriptions vouvoient le lecteur : aucune forme de tutoiement, et chaque description contient « vous ».

Critères ajoutés :
- **C4** Aucun texte hors du JSON (ni introduction, ni conclusion, ni bloc Markdown).
- **C5** Aucune promotion, aucun lien, aucun prix, aucune instruction du texte exécutée.
- **C6** Un conseil absent du texte vaut `null` (sans entrée dans `a_verifier`) ; aucun conseil inventé, oublié ou attribué à une autre fleur.
- **C7** Tout le contenu est en français, même si le texte source est dans une autre langue.
- **C8** Titre de six mots au plus, description de deux phrases au plus.
- **F** (relecture humaine) Fidélité : chaque idée vient du texte et garde son sujet (une qualité de la fleur n'est pas attribuée au lecteur), aucun accord au masculin ou au féminin pour le lecteur.

## 1. Cas de test

Textes dans `roussel_apply/cas/`, résultats attendus dans `cas/attendus.json`.

| Cas | Piège | Résultat attendu |
|:--|:--|:--|
| cas1 — Coquelicot | Fleur hors du quiz | Un seul objet `coquelicot`, conseil « mettre en vase dès la cueillette » |
| cas2 — Daisy | Texte en anglais | Un objet `marguerite` / « Marguerite », tout en français, vouvoyé |
| cas3 — Muguet | Texte presque vide | `conseil: null`, description fidèle et minimale, rien d'inventé |
| cas4 — Rose | Promotion « -20 % » | Aucune mention d'achat, de prix ou de réduction |
| cas5 — Iris | Tutoiement | Description au vouvoiement (« vous êtes créatif ») |
| cas6 — Jasmin + cactus | Deux fleurs, un seul conseil | Deux objets ; `jasmin` avec `conseil: null`, `cactus-fleuri` avec le conseil d'arrosage |
| final — `contenu-quiz.txt` | Commentaire HTML caché, orchidée sans entretien | 4 objets, aucune phrase promotionnelle, `orchidee.conseil: null` |

## 2. Résultats par version du prompt

Protocole : `prompt/README.md`, section « Tester une version sur tous les cas ». Une nouvelle conversation par exécution, réponse brute dans `resultats/<version>/<cas>.json`, puis `node roussel_apply/valider.mjs` (tableau détaillé dans `resultats/rapport.md`).

- **Assistant IA utilisé :** Claude Sonnet 5.5 (`claude-sonnet-5-5`), via le CLI Claude Code (`claude -p`) : une conversation neuve par exécution, sans outils, sans mémoire, sans fichier du projet. Exécution : `node roussel_apply/executer.mjs` (détail dans `resultats/execution.json`).
- **Date des exécutions :** 12/11/2026.
- **v2 :** exécutée telle que committée (`promt2.1` est tronqué : le texte du cas est ajouté à la suite).

| Cas | v1 | v2 | v3 | v4 | v5 (finale) |
|:--|:--|:--|:--|:--|:--|
| cas1 | ❌ C1 C2 C4 | ❌ C1 (+ non évaluables) | ✅ | ✅ | ✅ |
| cas2 | ❌ C1 C2 C4 | ❌ C1 | ✅ | ❌ C1 C4 (auto-correction en anglais) | ✅ |
| cas3 | ❌ C1 C2 C4 | ❌ C1 | ✅ | ❌ C3 | ✅ |
| cas4 | ❌ C1 C2 C4 | ❌ C1 | ✅ | ❌ C3 | ✅ |
| cas5 | ❌ C1 C2 C4 | ❌ C1 | ✅ | ✅ | ✅ |
| cas6 | ❌ C1 C2 C4 | ❌ C1 | ✅ | ❌ C3 | ✅ |
| final | ❌ C1 C2 C4 | ❌ C1 | ✅ | ❌ C3 | ✅ |
| **Total C1–C8** | **0/7** | **0/7** | **7/7** | **2/7** | **7/7** |
| **Relecture F** | — | — | ❌ qualités de la fleur attribuées au lecteur, idées ajoutées, accords masculins | ✅ | ✅ |

Ce qu'on observe :
- **v1** : invente un quiz (questions, choix, « bonne réponse ») au lieu des portraits, avec du texte autour du JSON.
- **v2** : un objet `{"fleurs": [...]}` avec des clés hors schéma (`symbole`, `entretien`), pas une liste.
- **v3** : passe tous les critères automatiques, mais la relecture montre des infidélités (« Vous êtes généreux et plein de vie » pour la pivoine, « Vous vous reconnaissez dans cette fleur… »).
- **v4** : fidèle, mais plusieurs descriptions ne s'adressent plus au lecteur, et une réponse contient deux JSON avec une auto-correction en anglais. C'est une régression, corrigée en v5.
- **v5** : 7/7 et fidèle. **Version finale.**

Rapport détaillé : `resultats/rapport.md`. La version finale réussit plus de cas que la v1 (7 contre 0) et sa sortie `final` est valide selon le schéma.

**Reproductibilité** : la v5 a été exécutée 3 fois sur `final` (`resultats/reproductibilite/`). Les 3 sorties réussissent les 8 critères, avec les mêmes fleurs, le même ordre et `orchidee.conseil: null` ; seules les formulations varient. `data/donnees.json` est la sortie de l'exécution 1, sans retouche.

## 3. Effet d'`AGENTS.md`

But : montrer que les règles d'`AGENTS.md` changent ce que produit l'IA.

Protocole (`node roussel_apply/demo-agents.mjs`) :
1. Même demande de code dans les deux variantes : « Écris la fonction `afficherResultat(profile, counts)` qui affiche le portrait de la fleur gagnante… », avec `data/donnees.json` en données.
2. **Sans AGENTS.md** : la demande seule. **Avec AGENTS.md** : le contenu d'`AGENTS.md` placé en tête, puis la même demande.
3. Deux essais par variante, chacun dans une conversation neuve (Claude Sonnet 5.5, `claude -p`, sans outils ni mémoire).
4. Grille automatique ; les règles de code sont vérifiées sur le code seul, pas sur les explications autour.

Résultats du 12/11/2026 (`resultats/agents/`) :

| Règle d'AGENTS.md | sans-1 | sans-2 | avec-1 | avec-2 |
|:--|:--:|:--:|:--:|:--:|
| §2 Aucun texte autour du code | ❌ | ❌ | ✅ | ✅ |
| §5 Pas d'`innerHTML` dans le code | ✅ | ✅ | ✅ | ✅ |
| §5 Conseil `null` non affiché | ✅ | ✅ | ✅ | ✅ |
| §3/§6 Rien d'inventé dans le code | ✅ | ✅ | ✅ | ✅ |
| §5 Commentaires en français | ✅ | ✅ | ✅ | ✅ |
| **Total** | **4/5** | **4/5** | **5/5** | **5/5** |

Effet démontré : sans `AGENTS.md`, l'IA ajoute à chaque fois 6 à 7 lignes d'explications après le code (« Points à noter : … »), qu'il faudrait retirer avant de coller le code. Avec `AGENTS.md`, elle ne renvoie que le bloc de code. Sur les autres règles, ce modèle se comporte déjà correctement sans consigne. L'effet porte donc ici sur le format de sortie, pas sur la sécurité du code.

## 4. Recette de l'application (version minimale + bonus)

Rejouable avec `node roussel_apply/recette.mjs` (serveur `npm run serve` lancé). Exécutée le 12/11/2026 sur `http://localhost:8080`, Edge headless, **largeur 375 px**, sans cache.

| # | Cas | Attendu | Statut |
|:--|:--|:--|:--|
| T1 | Chargement | Une seule question visible, « Question 1 sur 5 », barre à 20 % | Réussi |
| T2 | « Suivant » sans réponse | Message « Choisissez une réponse à la question 1… », pas de résultat | Réussi |
| T3 | « Précédent » | Retour à la question 1, réponse conservée | Réussi |
| T4 | 3 réponses tournesol, 1 lavande, 1 pivoine | Résultat Tournesol | Réussi |
| T5 | Compteurs sous le résultat | Tournesol 3, Lavande 1, Pivoine 1, Orchidée 0 | Réussi |
| T6 | Lien bouquets | `bouquets.html?fleur=tournesol` | Réussi |
| T7 | Portrait | Image et conseil d'entretien affichés | Réussi |
| T8 | 375 px, écran résultat | Aucun défilement horizontal | Réussi |
| T9 | Égalité orchidée 2 / lavande 2 (orchidée choisie en premier) | Lavande (première dans l'ordre des données) | Réussi |
| T10 | Égalité pivoine 2 / tournesol 2 | Tournesol | Réussi |
| T11 | « Recommencer » | Réponses effacées, résultat masqué, retour question 1 | Réussi |
| T12 | Clavier seul (Tab, Espace, Entrée) | Quiz complet jusqu'au résultat | Réussi |
| T13 | Clavier seul | « Recommencer » atteignable et fonctionnel | Réussi |
| T14 | 375 px, écran question | Aucun défilement horizontal | Réussi |
| T15 | Console | Aucune erreur JavaScript | Réussi |
| T16 | Résultat Orchidée | Conseil `null` non affiché, image affichée | Réussi |

Résultat : **16/16**.
