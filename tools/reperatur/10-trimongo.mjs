import fg from "fast-glob";
import fs from "node:fs/promises";
import path from "node:path";
import { Project, SyntaxKind } from "ts-morph";

const WRITE = process.env.REPERATUR_WRITE === "1";
const report = [];
import { existsSync } from "node:fs";
const __tscfg = ["tsconfig.base.json","tsconfig.json"].find(f=>existsSync(f));
const project = __tscfg
  ? new Project({ tsConfigFilePath: __tscfg, skipAddingFilesFromTsConfig: true })
  : new Project({ skipAddingFilesFromTsConfig: true });

const files = await fg(["**/*.{ts,tsx}","!**/node_modules/**","!**/dist/**","!**/build/**"]);
files.forEach(f => project.addSourceFileAtPath(f));

let edits = 0;

for (const sf of project.getSourceFiles()) {
  let changed = false;

  sf.forEachDescendant(node => {
    if (node.getKind() === SyntaxKind.CallExpression) {
      const ce = node;
      const exp = ce.getExpression().getText();
      if (exp === "getCol" || exp.endsWith(".getCol")) {
        const args = ce.getArguments();
        if (args.length === 1) {
          ce.addArgument('"core"');
          changed = true;
        }
      }
      if (exp === "triCol" || exp.endsWith(".triCol")) {
        const args = ce.getArguments();
        if (args.length === 1) {
          // triCol("users") -> triCol("core", "users")
          ce.insertArgument(0, '"core"');
          changed = true;
        }
      }
    }
  });

  if (changed) {
    edits++;
    report.push(`UPDATED: ${sf.getFilePath()}`);
  }
}

if (WRITE) {
  await project.save();
}

const out = `tools/reperatur/reports/10-trimongo-${Date.now()}-${WRITE?"write":"dry"}.log`;
await fs.mkdir(path.dirname(out), { recursive: true });
await fs.writeFile(out, report.join("\n") || "No changes");
console.log(`[10-trimongo] ${WRITE? "applied": "dry-run"}; files changed: ${edits}`);
