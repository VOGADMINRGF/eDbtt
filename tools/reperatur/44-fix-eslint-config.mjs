import fs from "fs";
import path from "path";

const cfgPath = path.join(process.cwd(), "apps", "web", "eslint.config.js");
if (!fs.existsSync(cfgPath)) {
  console.error("eslint.config.js nicht gefunden:", cfgPath);
  process.exit(1);
}

let s = fs.readFileSync(cfgPath, "utf8");

// 1) Doppelte Kommata in Arrays reduzieren: ", ,", ",\n," etc.
s = s.replace(/,\s*,/g, ", ");

// 2) Schutz: "[ ," am Anfang vermeiden
s = s.replace(/\[\s*,/g, "[");

// 3) Falls versehentlich ",\n// __TIGHTEN_PHASE" erzeugt wurde → Komma entfernen
s = s.replace(/,\s*(\/\/ __TIGHTEN_PHASE_\d+__)/g, "\n$1");

// 4) Zwischen Array-Elementen sicherstellen, dass genau EIN Komma steht
// (Nur für unsere Tighten-Blöcke)
s = s.replace(/(}\s*)\n(\/\/ __TIGHTEN_PHASE_\d+__)/g, "$1,\n$2");

fs.writeFileSync(cfgPath, s, "utf8");
console.log("✓ eslint.config.js saniert");
console.log("→ Jetzt: pnpm run e200");
