/**
 * i18n-sort.mjs
 *
 * Sorts all locale app.json files alphabetically by key, then reports any
 * keys that are present in the English baseline but missing from other locales.
 *
 * Usage:  node ./scripts/i18n-sort.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = resolve(__dirname, "../src/i18n/locales");
const LOCALES = ["en", "da", "sv", "no"];

function readLocale(lang) {
  const path = resolve(LOCALES_DIR, lang, "app.json");
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeLocale(lang, data) {
  const path = resolve(LOCALES_DIR, lang, "app.json");
  const sorted = Object.fromEntries(
    Object.keys(data)
      .sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }))
      .map((k) => [k, data[k]]),
  );
  writeFileSync(path, JSON.stringify(sorted, null, 2) + "\n", "utf8");
  return sorted;
}

// ── Sort all locale files ────────────────────────────────────────────────────

const locales = {};
for (const lang of LOCALES) {
  const data = readLocale(lang);
  locales[lang] = writeLocale(lang, data);
  const count = Object.keys(locales[lang]).length;
  console.log(`[${lang}] sorted — ${count} keys`);
}

// ── Check for missing keys ───────────────────────────────────────────────────

const enKeys = Object.keys(locales["en"]);
let allOk = true;

console.log("");
for (const lang of LOCALES.filter((l) => l !== "en")) {
  const missing = enKeys.filter((k) => !(k in locales[lang]));
  if (missing.length === 0) {
    console.log(`[${lang}] ✓ no missing keys`);
  } else {
    allOk = false;
    console.log(`[${lang}] ✗ ${missing.length} missing key(s):`);
    for (const key of missing) {
      const preview = key.length > 80 ? key.slice(0, 77) + "…" : key;
      console.log(`    - "${preview}"`);
    }
  }
}

console.log("");
if (allOk) {
  console.log("All locale files are in sync.");
} else {
  console.log(
    "Add the missing keys to each locale file and re-run this script.",
  );
  process.exit(1);
}
