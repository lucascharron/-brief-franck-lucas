# Effet d'AGENTS.md — démonstration

Même demande, 2 essais par variante, conversation neuve à chaque essai (`node roussel_apply/demo-agents.mjs`).
Les règles de code sont vérifiées sur le code seul, pas sur les explications autour.

| Règle | sans-1 | sans-2 | avec-1 | avec-2 |
|:--|:--:|:--:|:--:|:--:|
| §2 Aucun texte autour du code | ❌ | ❌ | ✅ | ✅ |
| §5 Pas d'innerHTML dans le code | ✅ | ✅ | ✅ | ✅ |
| §5 Conseil null non affiché (test explicite) | ✅ | ✅ | ✅ | ✅ |
| §3/§6 Rien d'inventé dans le code (emoji, promotion, lien) | ✅ | ✅ | ✅ | ✅ |
| §5 Commentaires en français | ✅ | ✅ | ✅ | ✅ |
| **Total** | **4/5** | **4/5** | **5/5** | **5/5** |
