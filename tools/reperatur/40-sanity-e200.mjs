// tools/reperatur/40-sanity-e200.mjs
import fs from "fs";
import path from "path";

const flags = new Set(process.argv.slice(2)); // --apply  --silence-features
const APPLY = flags.has("--apply");
const SILENCE_FEATURES = flags.has("--silence-features");

const repo = process.cwd();
const webDir = path.join(repo, "apps", "web");

const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null);
const writeJSON = (p, obj) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
};

function parseJSONC(str, fileLabel = "unknown.json") {
  if (str == null) return null;
  try {
    // BOM weg
    let s = str.replace(/^\uFEFF/, "");
    // Block- & Line-Kommentare raus
    s = s.replace(/\/\*[\s\S]*?\*\//g, "");
    s = s.replace(/(^|[^:])\/\/.*$/gm, "$1");
    // trailing commas:  ,  vor } oder ] entfernen
    s = s.replace(/,\s*([}\]])/g, "$1");
    // Mehrfach-Whitespace normalisieren
    return JSON.parse(s);
  } catch (e) {
    console.error(`✖ JSONC-Parse-Fehler in ${fileLabel}: ${e.message}`);
    // Zeige 2–3 Zeilen Kontext um die vermutete Stelle (heuristisch)
    const pos = Number(String(e.message).match(/position (\d+)/)?.[1] ?? 0);
    if (pos > 0) {
      const start = Math.max(0, pos - 80);
      const end = Math.min(str.length, pos + 80);
      console.error("… Kontext …\n" + str.slice(start, end) + "\n…");
    }
    process.exit(1);
  }
}

function log(ok, msg) {
  const icon = ok ? "✓" : "•";
  console.log(`${icon} ${msg}`);
}

// 0) Tool versions
let tsVer = "n/a", esVer = "n/a";
try { tsVer = JSON.parse(read(path.join(repo, "node_modules/typescript/package.json"))).version; } catch {}
try { esVer = JSON.parse(read(path.join(repo, "node_modules/eslint/package.json"))).version; } catch {}
console.log(`TS ${tsVer} | ESLint ${esVer}`);

// 1) apps/web/tsconfig.json – exclude & paths
const tsconfigPath = path.join(webDir, "tsconfig.json");
const tsc = parseJSONC(read(tsconfigPath), "apps/web/tsconfig.json") ?? {};
tsc.compilerOptions ||= {};
tsc.exclude ||= [];
const mustExcl = ["src/_disabled/**", ".next/**"];
let changed = false;
for (const e of mustExcl) {
  if (!tsc.exclude.includes(e)) { tsc.exclude.push(e); changed = true; }
}
if (APPLY && changed) {
  writeJSON(tsconfigPath, tsc);
  log(true, `tsconfig(web): exclude ergänzt (${mustExcl.join(", ")})`);
} else {
  log(!changed, `tsconfig(web) exclude ok (${mustExcl.join(", ")})`);
}

// 2) ESLint flat-config vorhanden?
const eslintCfg = path.join(webDir, "eslint.config.js");
if (fs.existsSync(eslintCfg)) log(true, "eslint.config.js gefunden (apps/web)");
else log(false, "eslint.config.js fehlt in apps/web");

// 3) package.json scripts – lint zeigt auf web/eslint.config.js?
const pkgPath = path.join(repo, "package.json");
const pkg = parseJSONC(read(pkgPath), "package.json") ?? {};
pkg.scripts ||= {};
const wantLint = 'pnpm -w dlx eslint --config apps/web/eslint.config.js "apps/web/src/**/*.{ts,tsx}" --max-warnings=0';
const lintOk = pkg.scripts.lint === wantLint;
if (!lintOk && APPLY) {
  pkg.scripts.lint = wantLint;
  pkg.scripts.typecheck ||= "pnpm -w exec tsc --noEmit -p apps/web/tsconfig.json";
  pkg.scripts.e200 ||= "pnpm run typecheck && pnpm run lint";
  writeJSON(pkgPath, pkg);
  log(true, "package.json scripts.lint/typecheck/e200 gesetzt");
} else {
  log(lintOk, "package.json lint-Script zeigt auf apps/web/eslint.config.js");
}

// 4) features/tsconfig.json – stumm schalten (Option A)
const featuresTscPath = path.join(repo, "features", "tsconfig.json");
if (fs.existsSync(featuresTscPath)) {
  const ft = parseJSONC(read(featuresTscPath), "features/tsconfig.json") ?? {};
  const includeEmpty = Array.isArray(ft.include) && ft.include.length === 0;
  if (SILENCE_FEATURES) {
    const newFt = {
      extends: ft.extends ?? "../../tsconfig.base.json",
      compilerOptions: {
        ...(ft.compilerOptions || {}),
        noEmit: true,
        skipLibCheck: true,
        jsx: "react-jsx"
      },
      include: []
    };
    writeJSON(featuresTscPath, newFt);
    log(true, "features/tsconfig.json stumm geschaltet (include: [])");
  } else {
    log(includeEmpty, "features/tsconfig.json geprüft (include leer = stumm)");
  }
} else {
  log(true, "features/tsconfig.json nicht vorhanden (kein Einfluss)");
}

// 5) .vscode/settings.json – Workspace-TS & Excludes empfehlen/setzen
const vsPath = path.join(repo, ".vscode", "settings.json");
let vs = parseJSONC(read(vsPath), ".vscode/settings.json") ?? {};
const want = {
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.exclude": { "**/features/tsconfig*.json": true }
};
let vsChanged = false;
for (const [k, v] of Object.entries(want)) {
  if (k === "files.exclude") {
    vs["files.exclude"] ||= {};
    for (const [ek, ev] of Object.entries(v)) {
      if (vs["files.exclude"][ek] !== ev) { vs["files.exclude"][ek] = ev; vsChanged = true; }
    }
  } else {
    if (vs[k] !== v) { vs[k] = v; vsChanged = true; }
  }
}
if (APPLY && vsChanged) {
  writeJSON(vsPath, vs);
  log(true, ".vscode/settings.json aktualisiert (Workspace-TS & exclude features/tsconfig*.json)");
} else {
  log(!vsChanged, ".vscode/settings.json ok");
}

// 6) Hinweise
console.log("\nHinweis:");
console.log("• In VS Code danach: Command Palette → “TypeScript: Restart TS Server”.");
console.log("• Dann erneut: pnpm run e200");
