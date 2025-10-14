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

function tryResolveRel(sfPath, spec){
  const base = path.dirname(sfPath);
  const cand = [
    spec + ".ts", spec + ".tsx", spec + ".js",
    path.posix.join(spec, "index.ts"),
    path.posix.join(spec, "index.tsx"),
    path.posix.join(spec, "index.js"),
  ];
  for (const c of cand){
    const p = path.resolve(base, c);
    if (existsSync(p)) return path.posix.normalize(c);
  }
  return null;
}

let changed = 0;
for (const sf of project.getSourceFiles()){
  for (const im of sf.getImportDeclarations()){
    if (!im.getModuleSpecifierSourceFile()){
      const spec = im.getModuleSpecifierValue();
      if (spec.startsWith(".")){
        const fix = tryResolveRel(sf.getFilePath(), spec);
        if (fix){
          im.setModuleSpecifier(fix);
          report.push(`relative import fixed: ${spec} -> ${fix} in ${sf.getFilePath()}`);
          changed++;
        } else {
          report.push(`unresolved: ${spec} in ${sf.getFilePath()}`);
        }
      } else {
        report.push(`unresolved (pkg/alias): ${spec} in ${sf.getFilePath()}`);
      }
    }
  }
}

if (WRITE) await project.save();

const out = `tools/reperatur/reports/18-unresolved-imports-${Date.now()}-${WRITE?"write":"dry"}.log`;
await fs.mkdir(path.dirname(out), { recursive: true });
await fs.writeFile(out, report.join("\n") || "No unresolved imports");
console.log(`[18-unresolved-imports] ${WRITE? "applied":"dry-run"}; changed: ${changed}`);
