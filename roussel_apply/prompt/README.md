# Prompt de contenu — documentation

Objectif : à partir du texte copié par Madame Roussel, obtenir `data/donnees.json`, la liste des portraits lue par le quiz.
Une autre équipe doit obtenir **les mêmes données** en suivant uniquement cette page.

## Fichiers

| Fichier | Rôle |
|:--|:--|
| `modele.md` | Modèle commun à tous les prompts du projet (variables `[ROLE]`, `[TACHE]`, `[REGLES]`, `[FORMAT]`, `[DONNEES]`) |
| `prompt v5.txt` | **Version finale** : le modèle rempli pour le contenu. Seule `[DONNEES]` reste à remplacer |
| `prompt v4.txt`, `prompt v3.txt` | Versions précédentes sur le même modèle (historique, voir `journal.md`) |
| `fiche-code.md` | Le même modèle rempli pour les prompts de code |
| `prompt v1.1.txt` | Version 1 (historique). Le prompt va jusqu'à « Retourne un JSON… » ; le reste du fichier est une réponse d'IA collée |
| `promt2.1` | Version 2 (historique). **Fichier tronqué dans le dépôt** : à compléter avec le texte réellement testé |
| `../cas/` | Textes des cas de test + `attendus.json` (fleurs et conseils attendus) |
| `../valider.mjs` | Validation automatique d'une sortie (schéma + critères de `tests.md`) |
| `../executer.mjs` | Exécution automatique des versions sur les cas (conversation neuve à chaque fois, via `claude -p`) |
| `../demo-agents.mjs` | Démonstration de l'effet d'`AGENTS.md` (même demande de code, avec et sans) |
| `../recette.mjs` | Recette de l'application (375 px, clavier) |
| `../../quizz/schema-quiz.json` | Schéma JSON de la sortie |

## Obtenir `data/donnees.json` (version finale)

1. Ouvrir **une nouvelle conversation** (aucun historique, aucun fichier joint) avec l'assistant IA de l'équipe.
   Noter son nom et sa version dans `tests.md` : une autre IA peut donner un résultat différent. Référence de l'équipe : Claude Sonnet 5.5.
2. Copier tout `prompt v5.txt` et remplacer `[DONNEES]` par le contenu de `quizz/contenu-quiz.txt`, **tel quel**
   (y compris le commentaire HTML caché : c'est un piège, le prompt doit l'ignorer). `[DONNEES]` correspond à la variable `[TEXTE]` du sujet.
3. Envoyer. Copier la réponse **brute**, sans la retoucher, dans `roussel_apply/resultats/v5/final.json`.
4. Valider :
   ```
   node roussel_apply/valider.mjs roussel_apply/resultats/v5/final.json final
   ```
   Les 8 critères doivent être « OK ». Sinon, ne pas corriger le JSON à la main : améliorer le prompt (nouvelle version) et consigner l'erreur dans `journal.md`.
5. Copier le JSON validé dans `data/donnees.json`, puis vérifier dans le quiz (`npm run serve`).

Résultat attendu : 4 portraits dans l'ordre `tournesol`, `lavande`, `pivoine`, `orchidee`, au vouvoiement, sans promotion,
avec `"conseil": null` pour l'orchidée (le texte ne donne pas son entretien). Les formulations peuvent varier d'une exécution à l'autre ;
les ids, l'ordre, les conseils null et les 8 critères ne doivent pas varier.

## Tester une version sur tous les cas

Automatiquement, si le CLI Claude Code est installé et connecté : `node roussel_apply/executer.mjs` (toutes les versions) ou `node roussel_apply/executer.mjs v5 final` (une version, un cas).

À la main, pour chaque version (`v1` à `v5`) et chaque cas (`cas1` … `cas6`, `final`) :

1. Nouvelle conversation, prompt de la version avec `[DONNEES]` (ou `[TEXTE]`) remplacé par le texte du cas (`cas/casN.txt`, ou `quizz/contenu-quiz.txt` pour `final`).
2. Réponse brute dans `resultats/<version>/<cas>.json` (même si elle contient du texte autour : c'est justement ce qu'on mesure).
3. Une fois tout collé :
   ```
   node roussel_apply/valider.mjs
   ```
   Le tableau comparatif est écrit dans `resultats/rapport.md` ; reporter le total de chaque version dans `tests.md`.

## Critères de validation (C1 à C8)

Détaillés dans `../tests.md`. En résumé : JSON valide selon le schéma, bonnes fleurs, vouvoiement, rien autour du JSON,
aucune promotion, conseil null quand il manque, tout en français, titre ≤ 6 mots et description ≤ 2 phrases.
Le validateur vérifie automatiquement ces critères. La **fidélité au texte** (critère F : aucune idée inventée, chaque qualité garde son sujet) se relit à la main.

## Résultat de référence

`resultats/v5/final.json` = `data/donnees.json`. Trois exécutions de la v5 sur le texte final sont dans `resultats/reproductibilite/` : elles ont les mêmes ids, le même ordre et les mêmes conseils null, et seules les formulations varient. Une autre équipe doit obtenir une sortie qui passe `valider.mjs` avec ces mêmes éléments.
