import fg from "fast-glob";
import fs from "node:fs/promises";
import path from "node:path";

const WRITE = process.env.REPERATUR_WRITE === "1";
const cfg = JSON.parse(await fs.readFile("tools/reperatur/config.json","utf-8"));
const models = cfg.mongooseModels || [];
const report = [];
let changed = 0;

for (const m of models){
  const files = await fg([m.glob,"!**/node_modules/**"]);
  for (const f of files){
    const content = await fs.readFile(f, "utf-8");
    if (!/new\s+Schema\s*\(/.test(content)) continue;

    let next = content;
    const marker = "// __REPERATUR_INDEXES__";
    if (!content.includes(marker)){
      const idxLines = (m.indexes || []).map(ix => {
        const fields = JSON.stringify(ix.fields).replace(/"(\w+)":/g, "$1:");
        return `SCHEMA_VAR.index(${fields});`;
      }).join("\n");

      const schemaVarMatch = content.match(/const\s+(\w+)\s*=\s*new\s+Schema\s*\(/);
      const schemaVar = schemaVarMatch ? schemaVarMatch[1] : "SchemaObj";

      let injected = `\n${marker}\ntry {\n  const SCHEMA_VAR = ${schemaVar};\n  ${idxLines.replace(/SCHEMA_VAR/g, schemaVar)}\n} catch (_) { /* noop */ }\n`;
      next += injected;
      report.push(`ADD indexes to ${f}`);
      changed++;
      if (WRITE) await fs.writeFile(f, next, "utf-8");
    } else {
      report.push(`Indexes already present (marker) in ${f}`);
    }
  }
}

const out = `tools/reperatur/reports/14-mongoose-indexes-${Date.now()}-${WRITE?"write":"dry"}.log`;
await fs.mkdir(path.dirname(out), { recursive: true });
await fs.writeFile(out, report.join("\n") || "No changes");
console.log(`[14-mongoose-indexes] ${WRITE? "applied": "dry-run"}; files changed: ${changed}`);
