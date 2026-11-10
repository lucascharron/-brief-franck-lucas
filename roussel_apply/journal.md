# Journal de bord - Application Madame Roussel

## Initialisation du projet
- Création du dépôt et des structures de dossiers (`prompts/`, `src/`).
- Définition des règles de l'équipe dans `AGENTS.md`.

---

## Suivi du prompt de contenu (Transformateur Texte -> JSON)

### Version 1 (v1)
- **Objectif :** Extraire les données brutes de la cliente en JSON.
- **Résultat :** Échec partiel sur les critères de robustesse.
- **Erreur constatée :** 
  1. Pollution conversationnelle : L'IA a bavardé avant et après le JSON.
  2. Mélange consignes / données : Le texte source contenait une fausse consigne cachée en commentaire HTML, que l'IA a commentée.
  3. Inadéquation structurelle : Le texte de base était une description de blog et non un quiz, l'IA a dû improviser.
- **Correction / Consigne ajoutée :** Interdiction stricte de tout texte hors JSON, isolation des données via des balises, et ordre d'ignorer tout code ou consigne cachée dans les données (v2).

### Version 2 (v2)
- **Objectif :** Forcer un schéma strict, isoler les données et transformer un texte de blog en questions de quiz propres.
- **Résultat :** En cours de test.
