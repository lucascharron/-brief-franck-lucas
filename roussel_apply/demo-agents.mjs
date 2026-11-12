// Démonstration de l'effet d'AGENTS.md : même demande de code, avec et sans AGENTS.md,
// chaque essai dans une conversation neuve (claude -p, sans outils ni mémoire).
//
//   node roussel_apply/demo-agents.mjs            → 2 essais par variante (appelle l'IA)
//   node roussel_apply/demo-agents.mjs 3          → 3 essais par variante
//   node roussel_apply/demo-agents.mjs --noter    → note les sorties déjà enregistrées, sans rappeler l'IA
//
// Sorties brutes : roussel_apply/resultats/agents/{sans,avec}-N.txt ; grille dans resultats/agents/rapport.md

import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = join(ICI, "..");
const args = process.argv.slice(2);
const NOTER = args.includes("--noter");
const N = Number(args.find((a) => /^\d+$/.test(a)) || 2);
const SORTIE = join(ICI, "resultats", "agents");
mkdirSync(SORTIE, { recursive: true });

const agents = readFileSync(join(ICI, "AGENTS.md"), "utf8");
const donnees = readFileSync(join(RACINE, "data", "donnees.json"), "utf8");

// La demande est identique dans les deux variantes ; seule la présence d'AGENTS.md change.
const demande = `Tu es un intégrateur front-end pour le site de Fleurs Roussel.

Écris la fonction JavaScript afficherResultat(profile, counts) qui affiche, dans l'élément #result-container,
le portrait de la fleur gagnante (nom, titre, description, conseil d'entretien) puis le nombre de réponses
obtenues par chaque fleur. profile est un objet de la liste ci-dessous ; counts associe un id de fleur à un nombre.
La liste complète des portraits est disponible dans la variable globale portraits.

Données (data/donnees.json) :
${donnees}`;

const VARIANTES = {
  sans: demande,
  avec: `Règles de l'équipe à respecter (fichier AGENTS.md) :\n\n${agents}\n\n---\n\n${demande}`,
};

function appeler(prompt) {
  const vide = mkdtempSync(join(tmpdir(), "roussel-"));
  return new Promise((resolve, reject) => {
    const p = spawn(process.env.CLAUDE_BIN || "claude", ["-p", "--no-session-persistence", "--output-format", "json",
      "--system-prompt", "Tu es un assistant.", "--tools", "", "--setting-sources", ""], { cwd: vide });
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.on("error", reject);
    p.on("close", () => { try { resolve(JSON.parse(out).result ?? ""); } catch { reject(new Error(out)); } });
    p.stdin.end(prompt);
  });
}

// Le code seul (contenu des blocs ```), pour ne pas compter ce que l'IA écrit dans ses explications
const code = (t) => {
  const blocs = [...t.matchAll(/```[a-z]*\n([\s\S]*?)```/g)].map((m) => m[1]);
  return blocs.length ? blocs.join("\n") : t;
};

// Grille : une ligne par règle d'AGENTS.md vérifiable automatiquement
const GRILLE = [
  ["§2 Aucun texte autour du code", (t) => /^\s*```(js|javascript)?\s*\n[\s\S]*\n```\s*$/.test(t) || !/```/.test(t)],
  ["§5 Pas d'innerHTML dans le code", (t) => !/innerHTML/.test(code(t))],
  ["§5 Conseil null non affiché (test explicite)", (t) => /if\s*\(\s*[\w.]*conseil|conseil\s*(!==?|===?)\s*null|conseil\s*\?|conseil\s*&&/.test(code(t))],
  ["§3/§6 Rien d'inventé dans le code (emoji, promotion, lien)", (t) => !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(code(t)) && !/(promo|achetez|https?:)/i.test(code(t))],
  ["§5 Commentaires en français", (t) => {
    const c = (code(t).match(/\/\/.*|\/\*[\s\S]*?\*\//g) || []).join(" ");
    return !/\b(the|and|display|create|add|each|if)\b/i.test(c);
  }],
];

const essais = Object.keys(VARIANTES).flatMap((v) => Array.from({ length: N }, (_, i) => ({ v, nom: `${v}-${i + 1}` })));
const sorties = {};
await Promise.all(essais.map(async ({ v, nom }) => {
  const fichier = join(SORTIE, `${nom}.txt`);
  if (NOTER) {
    if (!existsSync(fichier)) throw new Error(`${fichier} absent : lancer sans --noter`);
    sorties[nom] = readFileSync(fichier, "utf8");
    return;
  }
  sorties[nom] = await appeler(VARIANTES[v]);
  writeFileSync(fichier, sorties[nom]);
}));

const lignes = ["# Effet d'AGENTS.md — démonstration", "",
  `Même demande, ${N} essais par variante, conversation neuve à chaque essai (\`node roussel_apply/demo-agents.mjs\`).`,
  "Les règles de code sont vérifiées sur le code seul, pas sur les explications autour.", "",
  `| Règle | ${essais.map((e) => e.nom).join(" | ")} |`,
  `|:--|${essais.map(() => ":--:").join("|")}|`];
const totaux = {};
for (const [regle, test] of GRILLE) {
  lignes.push(`| ${regle} | ${essais.map(({ nom }) => {
    const ok = test(sorties[nom]);
    totaux[nom] = (totaux[nom] || 0) + (ok ? 1 : 0);
    return ok ? "✅" : "❌";
  }).join(" | ")} |`);
}
lignes.push(`| **Total** | ${essais.map(({ nom }) => `**${totaux[nom]}/${GRILLE.length}**`).join(" | ")} |`);
const rapport = lignes.join("\n") + "\n";
writeFileSync(join(SORTIE, "rapport.md"), rapport);
console.log(rapport);
