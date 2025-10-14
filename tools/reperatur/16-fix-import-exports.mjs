import fg from "fast-glob";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { Project } from "ts-morph";

const WRITE = process.env.REPERATUR_WRITE === "1";
const report = [];
const tscfg = ["tsconfig.base.json","tsconfig.json"].find(f=>existsSync(f));
const project = tscfg ? new Project({ tsConfigFilePath: tscfg, skipAddingFilesFromTsConfig: true }) : new Project({ skipAddingFilesFromTsConfig: true });

const files = await fg(["apps/**/src/**/*.{ts,tsx}","features/**/*.{ts,tsx}","core/**/*.{ts,tsx}","!**/node_modules/**","!**/dist/**","!**/build/**"]);
files.forEach(f => project.addSourceFileAtPath(f));

let changed = 0;
for (const sf of project.getSourceFiles()){
  let localChanged = false;
  for (const im of sf.getImportDeclarations()){
    try {
      // Skip, wenn "import type ..." ODER irgendein named specifier type-only ist
      if (im.isTypeOnly && im.isTypeOnly()) continue;
      const hasTypeOnlyNamed = im.getNamedImports().some(sp => sp.isTypeOnly && sp.isTypeOnly());
      if (hasTypeOnlyNamed) continue;

      const target = im.getModuleSpecifierSourceFile();
      if (!target) continue; // nur auflösbare Ziele
      const defaultSym = target.getDefaultExportSymbol?.();
      const exportedMap = target.getExportedDeclarations?.() || new Map();
      const exportedNames = new Set([...exportedMap.keys()].filter(k => k !== "default"));

      // Wenn kein Default-Export existiert, nichts tun
      if (!defaultSym) continue;

      // bereits ein Default-Import vorhanden? dann nichts tun
      if (im.getDefaultImport()) continue;

      for (const spec of [...im.getNamedImports()]){
        const name = spec.getName();
        // wenn dieses named export im Ziel existiert -> nicht anfassen
        if (exportedNames.has(name)) continue;

        // Sicherheitsnetz: Wenn irgendwo in dieser Import-Zeile derselbe Name als type-only existiert -> nicht anfassen
        const conflictTypeOnly = im.getNamedImports().some(sp => (sp.isTypeOnly && sp.isTypeOnly()) && sp.getName() === name);
        if (conflictTypeOnly) continue;

        // named -> default (nur wenn dadurch keine Syntaxkonflikte entstehen)
        im.setDefaultImport(name);
        spec.remove();
        report.push(`named→default: ${name} in ${sf.getFilePath()} from ${im.getModuleSpecifierValue()}`);
        localChanged = true;
        break; // pro Import max. 1 Konversion
      }

      // Leere {} aufräumen
      if (im.getNamedImports().length === 0 && im.getImportClause()?.getText()?.trim() === "{}"){
        im.getImportClause()?.removeNamedBindings();
        localChanged = true;
      }
    } catch (e) {
      report.push(`SKIP (manipulation error): ${sf.getFilePath()} :: ${im.getText().slice(0,120)}`);
    }
  }
  if (localChanged) changed++;
}
if (WRITE) await project.save();

const out = `tools/reperatur/reports/16-fix-import-exports-${Date.now()}-${WRITE?"write":"dry"}.log`;
await fs.mkdir(path.dirname(out), { recursive: true });
await fs.writeFile(out, report.join("\n") || "No changes");
console.log(`[16-fix-import-exports] ${WRITE? "applied":"dry-run"}; files changed: ${changed}`);
