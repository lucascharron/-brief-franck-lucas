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
