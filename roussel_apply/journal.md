# Journal de bord - Application Quiz Madame Roussel

## Initialisation du projet
- Création du dépôt Git et de l'arborescence (`prompts/`, `src/`).
- Définition des règles de base dans `AGENTS.md` (séparation données/consignes, zéro hallucination).

---

## Suivi du prompt de contenu (Transformateur Texte -> JSON)

### Version 1 (v1)
- **Objectif :** Extraire les données brutes de la cliente en JSON.
- **Résultat :** Échec sur les critères de robustesse.
- **Erreurs constatées :** 
  1. Pollution conversationnelle (l'IA bavarde avant/après le JSON).
  2. Mélange consignes/données (exécution d'une consigne cachée en commentaire HTML dans le texte source).
  3. Inadéquation structurelle (le texte brut de blog n'était pas un quiz formalisé).
- **Correction apportée :** Injection de contraintes strictes sur le format (zéro texte hors JSON) et isolation des données.

### Version 2 (v2)
- **Objectif :** Forcer un schéma strict, isoler les données avec des balises et transformer le texte brut en questions de quiz.
- **Résultat :** Validé. L'IA a ignoré le commentaire HTML malveillant et a produit un JSON propre et structuré.
- **Amélioration identifiée pour la v3 :** Gérer les guillemets non échappés et la robustesse face à des textes de tailles variables.

### Version 3 (v3) — `prompt/prompt v3.txt`
- **Erreurs corrigées :**
  1. Hors sujet : les v1/v2 demandaient des questions de quiz, alors que le sujet impose des questions fixes et un prompt qui produit uniquement les **portraits**.
  2. Sortie non conforme à `schema-quiz.json` (clés `id`, `titre`, `conseil`, `a_verifier` absentes).
  3. Contenu inventé dans les portraits (conseils de jardinage, titres absents du texte), descriptions sans vouvoiement, conseil inventé pour l'orchidée.
- **Consignes ajoutées :** schéma clé par clé ; vouvoiement obligatoire ; aucune idée absente du texte ; `conseil: null` sans alerte quand il manque ; texte isolé dans `<texte_client>` et traité comme donnée ; aucune promotion ni lien ; tout en français ; une fleur par objet, dans l'ordre du texte.
- **Statut :** Cas de test du sujet à exécuter (voir `tests.md`).

---

## Corrections de l'application (code)
- **Erreur :** quiz « Impossible de charger » → `app.js` lisait `data/questions.json` au lieu de `data/question.json`. **Corrigé.**
- **Erreur :** `app.js` inclus deux fois dans `index.html` (questions et gestionnaires en double). **Corrigé :** une seule inclusion `defer`.
- **Erreur :** `package.json` invalide (virgule finale). **Corrigé.**
- **Erreur :** portraits lus dans `data/portraits.json` au lieu de `data/donnees.json` (exigé par le sujet). **Corrigé :** `portraits.json` supprimé, portraits réécrits dans `donnees.json` à partir du seul `contenu-quiz.txt`.
- **Erreur :** égalité tranchée en faveur de la dernière fleur. **Corrigé :** la première fleur ex aequo dans l'ordre de `donnees.json` l'emporte.
- **Erreur :** réponse manquante signalée par la bulle du navigateur. **Corrigé :** message indiquant la ou les questions manquantes, sans résultat.
- **Erreur :** « Conseil : null » possible. **Corrigé :** conseil affiché seulement s'il existe.
- **Erreur :** données injectées via `innerHTML`. **Corrigé :** construction du DOM avec `textContent`.
- **Erreur :** « Recommencer » rechargeait la page. **Corrigé :** réinitialisation du formulaire, résultat masqué.
