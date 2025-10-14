import fs from "fs";
import path from "path";

const phaseArg = process.argv.find(a => a.startsWith("--phase="));
const PHASE = phaseArg ? Number(phaseArg.split("=")[1]) : 1; // 1..3

const repo = process.cwd();
const cfgPath = path.join(repo, "apps", "web", "eslint.config.js");
if (!fs.existsSync(cfgPath)) {
  console.error("eslint.config.js nicht gefunden:", cfgPath);
  process.exit(1);
}
let s = fs.readFileSync(cfgPath, "utf8");

// Einfüge-Position: letztes "];"
const endIdx = s.lastIndexOf("];");
if (endIdx === -1) {
  console.error("Konnte Ende des export default Arrays nicht finden.");
  process.exit(1);
}

// Blöcke ohne führende Kommata!
const blocks = [];

// Phase 1
blocks.push(`
// __TIGHTEN_PHASE_1__
{
  files: [
    "src/app/**/route.ts",
    "src/app/api/**",
    "src/server/**/*"
  ],
  rules: {
    "no-undef": "error"
  }
}
`);

// Phase 2
if (PHASE >= 2) blocks.push(`
// __TIGHTEN_PHASE_2__
{
  files: [
    "src/app/**/route.ts",
    "src/app/api/**"
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_",
      "caughtErrorsIgnorePattern": "^_"
    }],
    "no-unused-vars": "off"
  }
}
`);

// Phase 3
if (PHASE >= 3) blocks.push(`
// __TIGHTEN_PHASE_3__
{
  files: [
    "src/components/**/*",
    "src/app/**/page.tsx",
    "src/app/**/layout.tsx"
  ],
  rules: {
    "react-hooks/exhaustive-deps": "warn",
    "report-unused-disable-directives": "warn"
  }
}
`);

// Vor dem Array-Ende prüfen, ob vorher schon ein Komma steht.
const before = s.slice(0, endIdx);
const prevNonWSMatch = before.match(/[^\s]([\s]*)$/);
const prevNonWS = prevNonWSMatch ? prevNonWSMatch[0].trim().slice(-1) : null;

// Wir fügen die Blöcke mit einem führenden Komma EINMAL ein,
// es sei denn, das vorherige Zeichen war bereits ein Komma oder '['.
let insertion = "";
if (prevNonWS && prevNonWS !== "[" && prevNonWS !== ",") {
  insertion += ",";
}
insertion += "\n" + blocks.join(",\n") + "\n";

const patched = s.slice(0, endIdx) + insertion + s.slice(endIdx);
fs.writeFileSync(cfgPath, patched, "utf8");

console.log("✓ ESLint-Config verschärft bis Phase", PHASE);
console.log("→ Jetzt: pnpm run e200");
