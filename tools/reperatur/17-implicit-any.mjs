import fg from "fast-glob";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { Project, SyntaxKind } from "ts-morph";

const WRITE = process.env.REPERATUR_WRITE === "1";
const report = [];
const tscfg = ["tsconfig.base.json","tsconfig.json"].find(f=>existsSync(f));
const project = tscfg ? new Project({ tsConfigFilePath: tscfg, skipAddingFilesFromTsConfig: true }) : new Project({ skipAddingFilesFromTsConfig: true });

const files = await fg(["apps/web/src/**/*.{ts,tsx}","!**/node_modules/**","!**/dist/**","!**/build/**"]);
files.forEach(f => project.addSourceFileAtPath(f));

let paramEdits = 0, destructEdits = 0;

for (const sf of project.getSourceFiles()){
  let changed = false;

  // Funktions-Parameter ohne Typ → : any
  sf.forEachDescendant(n => {
    if (n.getKind() === SyntaxKind.Parameter){
      const p = n;
      if (!p.getTypeNode() && !p.isRestParameter()){
        p.setType("any");
        paramEdits++; changed = true;
      }
    }
  });

  // Destructuring-Variablen ohne Typ → : any
  for (const decl of sf.getVariableDeclarations()){
    const nameNode = decl.getNameNode();
    if ((nameNode?.getKind() === SyntaxKind.ObjectBindingPattern || nameNode?.getKind() === SyntaxKind.ArrayBindingPattern) && !decl.getTypeNode()){
      decl.setType("any");
      destructEdits++; changed = true;
    }
  }

  if (changed) report.push(`UPDATED: ${sf.getFilePath()}`);
}

if (WRITE) await project.save();

const out = `tools/reperatur/reports/17-implicit-any-${Date.now()}-${WRITE?"write":"dry"}.log`;
await fs.mkdir(path.dirname(out), { recursive: true });
await fs.writeFile(out, `paramEdits=${paramEdits}, destructEdits=${destructEdits}\n` + (report.join("\n") || "No changes"));
console.log(`[17-implicit-any] ${WRITE? "applied":"dry-run"}; paramEdits=${paramEdits}, destructEdits=${destructEdits}`);
