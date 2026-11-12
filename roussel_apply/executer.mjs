// Exécute les versions du prompt de contenu sur tous les cas de test, chacune dans une conversation neuve.
// Utilise le CLI Claude Code en mode « print » : aucun historique, aucune mémoire, aucun outil, aucun fichier du projet.
//
//   node roussel_apply/executer.mjs              → v1, v2 et v3 sur tous les cas
//   node roussel_apply/executer.mjs v3 final     → une version, un cas
//
// Réponses brutes : roussel_apply/resultats/<version>/<cas>.json (+ resultats/execution.json : modèle et date).
// Puis : node roussel_apply/valider.mjs

import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = join(ICI, "..");
const CLAUDE = process.env.CLAUDE_BIN || "claude";
const attendus = JSON.parse(readFileSync(join(ICI, "cas", "attendus.json"), "utf8"));
const lire = (p) => readFileSync(join(ICI, "prompt", p), "utf8").replace(/\r\n/g, "\n");

// Construction du prompt de chaque version, à partir des fichiers committés, sans les modifier.
const VERSIONS = {
  // v1 : le prompt s'arrête à « Retourne un JSON… » ; le texte de Madame Roussel y est écrit en dur
  // entre « Données : » et cette dernière ligne, on le remplace par le texte du cas.
  v1: (texte) => {
    const brut = lire("prompt v1.1.txt");
    const fin = brut.indexOf("Retourne un JSON");
    const finLigne = brut.indexOf("\n", fin);
    const debutDonnees = brut.indexOf("Données :") + "Données :".length;
    return `${brut.slice(0, debutDonnees)}\n\n${texte.trim()}\n${brut.slice(fin, finLigne === -1 ? undefined : finLigne)}`;
  },
  // v2 : fichier committé tel quel (tronqué, sans emplacement prévu pour le texte) ; le texte est ajouté à la suite.
  v2: (texte) => `${lire("promt2.1").trimEnd()}\n\n${texte.trim()}\n`,
  // v3 : modèle rempli, seule la variable [DONNEES] est remplacée.
  v3: (texte) => lire("prompt v3.txt").replace("[DONNEES]", texte.trim()),
  // v4 : même modèle, consignes de fidélité ajoutées.
  v4: (texte) => lire("prompt v4.txt").replace("[DONNEES]", texte.trim()),
  // v5 : vouvoiement obligatoire dans chaque description + une seule réponse sans auto-correction.
  v5: (texte) => lire("prompt v5.txt").replace("[DONNEES]", texte.trim()),
};

function appeler(prompt) {
  const vide = mkdtempSync(join(tmpdir(), "roussel-"));
  return new Promise((resolve, reject) => {
    const p = spawn(CLAUDE, ["-p", "--no-session-persistence", "--output-format", "json",
      "--system-prompt", "Tu es un assistant.", "--tools", "", "--setting-sources", ""],
      { cwd: vide, stdio: ["pipe", "pipe", "pipe"] });
    let out = "", err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("error", reject);
    p.on("close", (code) => {
      try {
        const j = JSON.parse(out);
        // Modèle principal = celui qui a produit le plus de texte (le CLI peut utiliser un petit modèle annexe)
        const usage = Object.entries(j.modelUsage || {}).sort((a, b) => (b[1].outputTokens || 0) - (a[1].outputTokens || 0));
        resolve({ texte: j.result ?? "", modele: usage[0]?.[0] || "inconnu", erreur: j.is_error });
      } catch { reject(new Error(`code ${code} : ${err || out}`)); }
    });
    p.stdin.end(prompt);
  });
}

const [vFiltre, cFiltre] = process.argv.slice(2);
const taches = [];
for (const v of Object.keys(VERSIONS)) {
  if (vFiltre && v !== vFiltre) continue;
  for (const cas of Object.keys(attendus)) {
    if (cFiltre && cas !== cFiltre) continue;
    taches.push({ v, cas });
  }
}

const modeles = new Set();
let i = 0;
async function ouvrier() {
  while (i < taches.length) {
    const { v, cas } = taches[i++];
    const texte = readFileSync(join(RACINE, attendus[cas].texte), "utf8").replace(/\r\n/g, "\n");
    const prompt = VERSIONS[v](texte);
    mkdirSync(join(ICI, "resultats", v), { recursive: true });
    try {
      const r = await appeler(prompt);
      modeles.add(r.modele);
      writeFileSync(join(ICI, "resultats", v, `${cas}.json`), r.texte);
      console.log(`${v} / ${cas} : ${r.erreur ? "ERREUR " : ""}${r.texte.length} caractères`);
    } catch (e) {
      console.log(`${v} / ${cas} : échec de l'appel — ${e.message}`);
    }
  }
}
await Promise.all(Array.from({ length: 4 }, ouvrier));
// Journal des exécutions : une entrée par lancement
const fichierExec = join(ICI, "resultats", "execution.json");
let historique = [];
try { historique = JSON.parse(readFileSync(fichierExec, "utf8")); if (!Array.isArray(historique)) historique = [historique]; } catch {}
historique.push({
  date: new Date().toISOString(),
  versions: [...new Set(taches.map((t) => t.v))],
  cas: [...new Set(taches.map((t) => t.cas))],
  outil: "Claude Code CLI (claude -p), conversation neuve par exécution, sans outils ni mémoire",
  modeles: [...modeles],
});
writeFileSync(fichierExec, JSON.stringify(historique, null, 2) + "\n");
console.log("Modèle(s) :", [...modeles].join(", "));
