// Recette de l'application quiz : Edge headless (protocole CDP), largeur 375 px, souris et clavier.
// Prérequis : `npm run serve` lancé (http://localhost:8080), Microsoft Edge installé, Node 22+.
//   node roussel_apply/recette.mjs            → résultats dans la console
//   node roussel_apply/recette.mjs captures   → + captures d'écran dans le dossier « captures »
// Chemin d'Edge modifiable : variable d'environnement EDGE.
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const OUT = process.argv[2] || null;
if (OUT) (await import("node:fs")).mkdirSync(OUT, { recursive: true });
const edge = process.env.EDGE || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const prof = mkdtempSync(join(tmpdir(), "edge-"));
const proc = spawn(edge, ["--headless=new", "--disable-gpu", "--remote-debugging-port=9334",
  `--user-data-dir=${prof}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 40; i++) {
  try { targets = await (await fetch("http://127.0.0.1:9334/json")).json(); if (targets.find(t => t.type === "page")) break; } catch {}
  await sleep(250);
}
const ws = new WebSocket(targets.find(t => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0; const pending = new Map(); const errors = [];
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description);
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push(m.params.args.map(a => a.value ?? a.description).join(" "));
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result.result?.value;

const KEYS = { Tab: 9, Enter: 13, " ": 32, ArrowDown: 40 };
async function key(k, shift = false) {
  const base = { key: k, code: k === " " ? "Space" : k, windowsVirtualKeyCode: KEYS[k], modifiers: shift ? 8 : 0 };
  await send("Input.dispatchKeyEvent", { type: "rawKeyDown", ...base });
  if (k === " " || k === "Enter") await send("Input.dispatchKeyEvent", { type: "char", text: k === "Enter" ? "\r" : " ", ...base });
  await send("Input.dispatchKeyEvent", { type: "keyUp", ...base });
  await sleep(60);
}

await send("Runtime.enable");
await send("Page.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });

async function load() { await send("Page.navigate", { url: "http://localhost:8080/" }); await sleep(1500); }
const visible = `[...document.querySelectorAll('#questions-container fieldset')].find(f => !f.classList.contains('hidden'))`;
const etat = () => ev(`({
  visibles: [...document.querySelectorAll('#questions-container fieldset')].filter(f => !f.classList.contains('hidden')).length,
  question: (${visible})?.querySelector('legend').textContent,
  progression: document.getElementById('progress-label').textContent,
  barre: document.getElementById('progress-fill').style.width,
  erreur: document.getElementById('error-message').textContent,
  resultat: document.getElementById('result-container').classList.contains('hidden') ? null : document.querySelector('#result-container h2').textContent,
  compte: [...document.querySelectorAll('#result-container li')].map(l => l.textContent),
  coches: document.querySelectorAll('#questions-container input:checked').length,
  lien: document.querySelector('#result-container a')?.getAttribute('href') ?? null,
  image: document.querySelector('#result-container img')?.naturalWidth ?? 0,
  conseil: [...document.querySelectorAll('#result-container p')].some(p => p.textContent.startsWith("Conseil")),
  debord: document.documentElement.scrollWidth > window.innerWidth,
  focus: document.activeElement?.id || document.activeElement?.tagName
})`);
async function repondreSouris(choix) {
  for (const c of choix) {
    await ev(`(() => { (${visible}).querySelectorAll('input')[${c}].click(); const n = document.getElementById('next-btn'); (n.classList.contains('hidden') ? document.getElementById('submit-btn') : n).click(); })()`);
    await sleep(80);
  }
  await sleep(300);
}

const resultats = [];
function check(nom, ok, detail) { resultats.push({ nom, ok: !!ok, detail }); }

// T1 Chargement
await load();
let s = await etat();
check("T1 Chargement : une seule question, progression 1/5", s.visibles === 1 && s.progression === "Question 1 sur 5" && s.barre === "20%" && !s.erreur, s);
if (OUT) await send("Page.captureScreenshot", { format: "png" }).then(r => writeFileSync(join(OUT, "t-375-question.png"), Buffer.from(r.result.data, "base64")));

// T2 Suivant sans réponse
await ev(`document.getElementById('next-btn').click()`); await sleep(100);
s = await etat();
check("T2 Suivant sans réponse : message, reste sur Q1, pas de résultat", s.progression === "Question 1 sur 5" && s.erreur.includes("question 1") && s.resultat === null, s.erreur);

// T3 Précédent conserve la réponse
await repondreSouris([0]);
await ev(`document.getElementById('prev-btn').click()`); await sleep(100);
s = await etat();
check("T3 Précédent : retour Q1, réponse conservée", s.progression === "Question 1 sur 5" && s.coches === 1, s);

// T4 Résultat simple (tournesol 3)
await load(); await repondreSouris([0, 0, 0, 1, 2]);
s = await etat();
check("T4 Fleur la plus choisie (3 tournesol) → Tournesol", s.resultat === "Tournesol", s.resultat);
check("T5 Compteurs par fleur", JSON.stringify(s.compte) === JSON.stringify(["Tournesol : 3 réponses", "Lavande : 1 réponse", "Pivoine : 1 réponse", "Orchidée : 0 réponse"]), s.compte);
check("T6 Lien bouquets", s.lien === "bouquets.html?fleur=tournesol", s.lien);
check("T7 Image et conseil affichés", s.image > 0 && s.conseil, { image: s.image, conseil: s.conseil });
check("T8 375 px : pas de défilement horizontal (résultat)", !s.debord, s.debord);
if (OUT) await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }).then(r => writeFileSync(join(OUT, "t-375-resultat.png"), Buffer.from(r.result.data, "base64")));

// T9 Égalité : orchidée 2, lavande 2, pivoine 1, orchidée cochée en premier
await load(); await repondreSouris([3, 3, 1, 1, 2]);
s = await etat();
check("T9 Égalité 2-2 orchidée/lavande → Lavande (ordre des données)", s.resultat === "Lavande", s.resultat);

// T10 Égalité tournesol/pivoine → Tournesol
await load(); await repondreSouris([2, 2, 0, 0, 1]);
s = await etat();
check("T10 Égalité 2-2 pivoine/tournesol → Tournesol", s.resultat === "Tournesol", s.resultat);

// T11 Recommencer
await ev(`document.getElementById('reset-btn').click()`); await sleep(200);
s = await etat();
check("T11 Recommencer : réponses effacées, résultat masqué, retour Q1", s.coches === 0 && s.resultat === null && s.progression === "Question 1 sur 5", s);

// T12 Clavier uniquement
await load();
let tabs = 0;
while (tabs < 20 && !(await ev(`document.activeElement?.type === 'radio'`))) { await key("Tab"); tabs++; }
let okClavier = tabs < 20;
for (let q = 0; q < 5 && okClavier; q++) {
  if (!(await ev(`document.activeElement?.type === 'radio'`))) {
    let t = 0; while (t < 5 && !(await ev(`document.activeElement?.type === 'radio'`))) { await key("Tab"); t++; }
  }
  await key(" ");           // coche la réponse sous le focus
  await key("Enter");       // Suivant / Découvrir mon profil
  await sleep(150);
}
await sleep(300);
s = await etat();
check("T12 Clavier : Tab + Espace + Entrée jusqu'au résultat", okClavier && s.resultat !== null, { tabs, resultat: s.resultat });
let t = 0; while (t < 30 && (await ev(`document.activeElement?.id`)) !== "reset-btn") { await key("Tab"); t++; }
await key("Enter"); await sleep(200);
s = await etat();
check("T13 Clavier : Recommencer atteignable et fonctionnel", t < 30 && s.resultat === null && s.coches === 0, { tabs: t });

// T16 Orchidée : conseil absent (null) non affiché, image affichée
await load(); await repondreSouris([3, 3, 3, 0, 1]);
s = await etat();
check("T16 Orchidée : conseil null masqué, image affichée", s.resultat === "Orchidée" && !s.conseil && s.image > 0, { resultat: s.resultat, conseil: s.conseil, image: s.image });

// T14 375 px sur la question
await load(); s = await etat();
check("T14 375 px : pas de défilement horizontal (question)", !s.debord, s.debord);

check("T15 Aucune erreur JavaScript", errors.length === 0, errors);

for (const r of resultats) console.log(`${r.ok ? "OK  " : "ÉCHEC"} ${r.nom}${r.ok ? "" : "  → " + JSON.stringify(r.detail)}`);
console.log(`\n${resultats.filter(r => r.ok).length}/${resultats.length} réussis`);
ws.close(); proc.kill(); process.exit(0);
