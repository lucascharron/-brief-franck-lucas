// Valide les sorties du prompt de contenu contre schema-quiz.json et les critères de tests.md.
//
//   node roussel_apply/valider.mjs                 → toutes les versions, tous les cas (rapport dans resultats/rapport.md)
//   node roussel_apply/valider.mjs fichier.json cas3  → un seul fichier, comparé au cas indiqué
//
// Sorties attendues : roussel_apply/resultats/<version>/<cas>.json
// (la réponse brute de l'IA, collée telle quelle, même si elle contient du texte autour).

import { readFileSync, readdirSync, existsSync, writeFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
const attendus = JSON.parse(readFileSync(join(ICI, "cas", "attendus.json"), "utf8"));

const CLES = ["id", "nom", "titre", "description", "conseil", "a_verifier"];
const ENUM_A_VERIFIER = ["nom", "titre", "description", "conseil"];
const TUTOIEMENT = /(^|[^\p{L}])(tu|toi|ton|ta|tes|te|t')(?=[^\p{L}]|$)/iu;
const PROMO = /(https?:|www\.|\.example|\.com|\.fr|%|€|achetez|achat|promo|réduction|chez nous|prix)/i;
const ANGLAIS = /\b(the|and|is|are|who|love|care|water|every|days|people)\b/i;

// Critères (numérotés comme dans tests.md)
export function valider(brut, cas) {
  const r = {};
  const att = attendus[cas];

  // C4 : aucun texte hors du JSON
  const texte = brut.replace(/^﻿/, "").trim();
  let data;
  try {
    data = JSON.parse(texte);
    r.C4 = { ok: true };
  } catch {
    r.C4 = { ok: false, msg: "texte autour du JSON ou JSON invalide" };
    const m = texte.match(/\[[\s\S]*\]/);
    try { data = m ? JSON.parse(m[0]) : undefined; } catch { data = undefined; }
  }

  // C1 : liste valide selon le schéma
  const erreurs = [];
  if (!Array.isArray(data)) erreurs.push("la sortie n'est pas une liste JSON");
  else {
    if (data.length < 1) erreurs.push("liste vide");
    data.forEach((o, i) => {
      const p = `objet ${i + 1}`;
      if (typeof o !== "object" || o === null || Array.isArray(o)) { erreurs.push(`${p} n'est pas un objet`); return; }
      for (const k of CLES) if (!(k in o)) erreurs.push(`${p} : clé "${k}" manquante`);
      for (const k of Object.keys(o)) if (!CLES.includes(k)) erreurs.push(`${p} : clé "${k}" en trop`);
      if (typeof o.id !== "string" || !/^[a-z]+(-[a-z]+)*$/.test(o.id)) erreurs.push(`${p} : id invalide`);
      if (typeof o.nom !== "string" || o.nom.length < 1) erreurs.push(`${p} : nom invalide`);
      if (typeof o.titre !== "string" || o.titre.length < 1 || o.titre.length > 60) erreurs.push(`${p} : titre invalide (1 à 60 caractères)`);
      if (typeof o.description !== "string" || o.description.length < 1 || o.description.length > 300) erreurs.push(`${p} : description invalide (1 à 300 caractères)`);
      if (!(o.conseil === null || typeof o.conseil === "string")) erreurs.push(`${p} : conseil doit être une chaîne ou null`);
      if (!Array.isArray(o.a_verifier)) erreurs.push(`${p} : a_verifier doit être une liste`);
      else {
        if (new Set(o.a_verifier).size !== o.a_verifier.length) erreurs.push(`${p} : a_verifier contient des doublons`);
        for (const v of o.a_verifier) if (!ENUM_A_VERIFIER.includes(v)) erreurs.push(`${p} : a_verifier contient "${v}"`);
      }
    });
  }
  // Messages regroupés (sans le numéro d'objet) pour rester lisibles
  const uniques = [...new Set(erreurs.map((e) => e.replace(/^objet \d+ : /, "")))];
  r.C1 = erreurs.length ? { ok: false, msg: uniques.slice(0, 4).join(" ; ") + (uniques.length > 4 ? " ; …" : "") } : { ok: true };
  if (!Array.isArray(data)) {
    for (const c of ["C2", "C3", "C5", "C6", "C7", "C8"]) r[c] = { ok: false, msg: "non évaluable" };
    return r;
  }
  const objets = data.filter((o) => o && typeof o === "object");
  const ids = objets.map((o) => o.id);

  // C2 : chaque fleur du texte une fois, aucune autre
  if (att) {
    const manquantes = [];
    const restants = [...ids];
    for (const f of att.fleurs) {
      const options = Array.isArray(f) ? f : [f];
      const i = restants.findIndex((id) => options.includes(id));
      if (i === -1) manquantes.push(options.join("|")); else restants.splice(i, 1);
    }
    r.C2 = manquantes.length || restants.length
      ? { ok: false, msg: [manquantes.length && `manquantes : ${manquantes.join(", ")}`, restants.length && `en trop : ${restants.join(", ")}`].filter(Boolean).join(" ; ") }
      : { ok: true };
  } else r.C2 = { ok: true, msg: "cas inconnu, non vérifié" };

  // C3 : vouvoiement — aucune forme de tutoiement, et chaque description s'adresse au lecteur avec « vous »
  const tutoie = objets.filter((o) => TUTOIEMENT.test(`${o.description} ${o.conseil ?? ""}`)).map((o) => o.id);
  const sansVous = objets.filter((o) => typeof o.description === "string" && !/(^|[^\p{L}])vous([^\p{L}]|$)/iu.test(o.description)).map((o) => o.id);
  const c3 = [tutoie.length && `tutoiement : ${tutoie.join(", ")}`, sansVous.length && `description sans « vous » : ${sansVous.join(", ")}`].filter(Boolean);
  r.C3 = c3.length ? { ok: false, msg: c3.join(" ; ") } : { ok: true };

  // C5 : aucune promotion, aucun lien
  const promo = objets.filter((o) => PROMO.test([o.titre, o.description, o.conseil].join(" "))).map((o) => o.id);
  r.C5 = promo.length ? { ok: false, msg: `promotion ou lien : ${promo.join(", ")}` } : { ok: true };

  // C6 : conseil null quand le texte n'en donne pas, sans alerte
  const c6 = [];
  if (att) for (const id of att.conseilNull) {
    const o = objets.find((x) => x.id === id);
    if (o && o.conseil !== null) c6.push(`${id} : conseil inventé`);
  }
  for (const o of objets) if (o.conseil === null && o.a_verifier?.includes("conseil")) c6.push(`${o.id} : "conseil" ne doit pas être dans a_verifier`);
  if (att) for (const o of objets) if (!att.conseilNull.includes(o.id) && o.conseil === null) c6.push(`${o.id} : conseil du texte oublié`);
  r.C6 = c6.length ? { ok: false, msg: c6.join(" ; ") } : { ok: true };

  // C7 : tout en français
  const en = objets.filter((o) => ANGLAIS.test([o.nom, o.titre, o.description, o.conseil].join(" "))).map((o) => o.id);
  r.C7 = en.length ? { ok: false, msg: `anglais : ${en.join(", ")}` } : { ok: true };

  // C8 : titre ≤ 6 mots, description ≤ 2 phrases
  const c8 = [];
  for (const o of objets) {
    if (typeof o.titre === "string" && o.titre.trim().split(/\s+/).length > 6) c8.push(`${o.id} : titre > 6 mots`);
    if (typeof o.description === "string" && (o.description.match(/[.!?…](\s|$)/g) || []).length > 2) c8.push(`${o.id} : description > 2 phrases`);
  }
  r.C8 = c8.length ? { ok: false, msg: c8.join(" ; ") } : { ok: true };

  return r;
}

const CRITERES = ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8"];
const reussi = (r) => CRITERES.every((c) => r[c]?.ok);

// --- Un seul fichier ---
if (process.argv[2]) {
  const [fichier, cas] = process.argv.slice(2);
  const r = valider(readFileSync(fichier, "utf8"), cas);
  for (const c of CRITERES) console.log(`${r[c].ok ? "OK   " : "ÉCHEC"} ${c}${r[c].msg ? " — " + r[c].msg : ""}`);
  console.log(reussi(r) ? "\nCas réussi" : "\nCas échoué");
  process.exit(reussi(r) ? 0 : 1);
}

// --- Toutes les versions ---
const dossier = join(ICI, "resultats");
const versions = readdirSync(dossier).filter((d) => statSync(join(dossier, d)).isDirectory()).sort();
const lignes = [];
lignes.push("# Rapport de validation du prompt de contenu", "");
lignes.push("Généré par `node roussel_apply/valider.mjs`. Critères C1 à C8 : voir `tests.md`.", "");
lignes.push(`| Cas | Piège | ${versions.join(" | ")} |`);
lignes.push(`|:--|:--|${versions.map(() => ":--").join("|")}|`);
const scores = Object.fromEntries(versions.map((v) => [v, { ok: 0, faits: 0 }]));
const details = [];
for (const cas of Object.keys(attendus)) {
  const cellules = versions.map((v) => {
    const f = join(dossier, v, `${cas}.json`);
    if (!existsSync(f)) return "non exécuté";
    const r = valider(readFileSync(f, "utf8"), cas);
    scores[v].faits++;
    if (reussi(r)) { scores[v].ok++; return "✅ réussi"; }
    const ko = CRITERES.filter((c) => !r[c].ok);
    const expliques = ko.filter((c) => r[c].msg !== "non évaluable");
    details.push(`- **${v} / ${cas}** : ${expliques.map((c) => `${c} (${r[c].msg})`).join(" ; ")}${expliques.length < ko.length ? ` ; ${ko.filter((c) => !expliques.includes(c)).join(", ")} non évaluables` : ""}`);
    return `❌ ${ko.join(", ")}`;
  });
  lignes.push(`| ${cas} | ${attendus[cas].piege} | ${cellules.join(" | ")} |`);
}
lignes.push(`| **Total** | | ${versions.map((v) => `**${scores[v].ok}/${Object.keys(attendus).length}**${scores[v].faits < Object.keys(attendus).length ? ` (${scores[v].faits} exécutés)` : ""}`).join(" | ")} |`);
if (details.length) lignes.push("", "## Détail des échecs", "", ...details);
const rapport = lignes.join("\n") + "\n";
writeFileSync(join(dossier, "rapport.md"), rapport);
console.log(rapport);
