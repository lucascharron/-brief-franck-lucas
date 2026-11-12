# Rapport de validation du prompt de contenu

Généré par `node roussel_apply/valider.mjs`. Critères C1 à C8 : voir `tests.md`.

| Cas | Piège | agents | reproductibilite | v1 | v2 | v3 | v4 | v5 |
|:--|:--|:--|:--|:--|:--|:--|:--|:--|
| cas1 | Fleur hors du quiz | non exécuté | non exécuté | ❌ C1, C2, C4 | ❌ C1, C2, C3, C5, C6, C7, C8 | ✅ réussi | ✅ réussi | ✅ réussi |
| cas2 | Texte en anglais | non exécuté | non exécuté | ❌ C1, C2, C4 | ❌ C1, C2, C3, C5, C6, C7, C8 | ✅ réussi | ❌ C1, C2, C3, C4, C5, C6, C7, C8 | ✅ réussi |
| cas3 | Texte presque vide | non exécuté | non exécuté | ❌ C1, C2, C4 | ❌ C1, C2, C3, C5, C6, C7, C8 | ✅ réussi | ❌ C3 | ✅ réussi |
| cas4 | Promotion dans le texte | non exécuté | non exécuté | ❌ C1, C2, C4 | ❌ C1, C2, C3, C5, C6, C7, C8 | ✅ réussi | ❌ C3 | ✅ réussi |
| cas5 | Tutoiement | non exécuté | non exécuté | ❌ C1, C2, C4 | ❌ C1, C2, C3, C5, C6, C7, C8 | ✅ réussi | ✅ réussi | ✅ réussi |
| cas6 | Deux fleurs, un seul conseil | non exécuté | non exécuté | ❌ C1, C2, C4 | ❌ C1, C2, C3, C5, C6, C7, C8 | ✅ réussi | ❌ C3 | ✅ réussi |
| final | Consigne cachée, orchidée sans entretien | non exécuté | non exécuté | ❌ C1, C2, C4 | ❌ C1, C2, C3, C5, C6, C7, C8 | ✅ réussi | ❌ C3 | ✅ réussi |
| **Total** | | **0/7** (0 exécutés) | **0/7** (0 exécutés) | **0/7** | **0/7** | **7/7** | **2/7** | **7/7** |

## Détail des échecs

- **v1 / cas1** : C1 (clé "nom" manquante ; clé "titre" manquante ; clé "description" manquante ; clé "conseil" manquante ; …) ; C2 (manquantes : coquelicot ; en trop : 1, 2, 3, 4, 5) ; C4 (texte autour du JSON ou JSON invalide)
- **v2 / cas1** : C1 (la sortie n'est pas une liste JSON) ; C2, C3, C5, C6, C7, C8 non évaluables
- **v1 / cas2** : C1 (clé "nom" manquante ; clé "titre" manquante ; clé "description" manquante ; clé "conseil" manquante ; …) ; C2 (manquantes : marguerite ; en trop : 1, 2, 3) ; C4 (texte autour du JSON ou JSON invalide)
- **v2 / cas2** : C1 (la sortie n'est pas une liste JSON) ; C2, C3, C5, C6, C7, C8 non évaluables
- **v4 / cas2** : C1 (la sortie n'est pas une liste JSON) ; C4 (texte autour du JSON ou JSON invalide) ; C2, C3, C5, C6, C7, C8 non évaluables
- **v1 / cas3** : C1 (clé "id" manquante ; clé "nom" manquante ; clé "titre" manquante ; clé "description" manquante ; …) ; C2 (manquantes : muguet ; en trop : ) ; C4 (texte autour du JSON ou JSON invalide)
- **v2 / cas3** : C1 (la sortie n'est pas une liste JSON) ; C2, C3, C5, C6, C7, C8 non évaluables
- **v4 / cas3** : C3 (description sans « vous » : muguet)
- **v1 / cas4** : C1 (clé "nom" manquante ; clé "titre" manquante ; clé "description" manquante ; clé "conseil" manquante ; …) ; C2 (manquantes : rose ; en trop : 1, 2) ; C4 (texte autour du JSON ou JSON invalide)
- **v2 / cas4** : C1 (la sortie n'est pas une liste JSON) ; C2, C3, C5, C6, C7, C8 non évaluables
- **v4 / cas4** : C3 (description sans « vous » : rose)
- **v1 / cas5** : C1 (clé "nom" manquante ; clé "titre" manquante ; clé "description" manquante ; clé "conseil" manquante ; …) ; C2 (manquantes : iris ; en trop : 1, 2) ; C4 (texte autour du JSON ou JSON invalide)
- **v2 / cas5** : C1 (la sortie n'est pas une liste JSON) ; C2, C3, C5, C6, C7, C8 non évaluables
- **v1 / cas6** : C1 (clé "nom" manquante ; clé "titre" manquante ; clé "description" manquante ; clé "conseil" manquante ; …) ; C2 (manquantes : jasmin, cactus-fleuri|cactus ; en trop : 1, 2, 3) ; C4 (texte autour du JSON ou JSON invalide)
- **v2 / cas6** : C1 (la sortie n'est pas une liste JSON) ; C2, C3, C5, C6, C7, C8 non évaluables
- **v4 / cas6** : C3 (description sans « vous » : cactus-fleuri)
- **v1 / final** : C1 (clé "nom" manquante ; clé "titre" manquante ; clé "description" manquante ; clé "conseil" manquante ; …) ; C2 (manquantes : tournesol, lavande, pivoine, orchidee ; en trop : 1, 2, 3, 4, 5, 6, 7, 8, 9, 10) ; C4 (texte autour du JSON ou JSON invalide)
- **v2 / final** : C1 (la sortie n'est pas une liste JSON) ; C2, C3, C5, C6, C7, C8 non évaluables
- **v4 / final** : C3 (description sans « vous » : pivoine)
