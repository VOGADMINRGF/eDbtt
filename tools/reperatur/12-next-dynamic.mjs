import fg from "fast-glob";
import fs from "node:fs/promises";
import path from "node:path";

const WRITE = process.env.REPERATUR_WRITE === "1";
const cfg = JSON.parse(await fs.readFile("tools/reperatur/config.json","utf-8"));
const { insertDynamicFlag, flagValue } = cfg.nextDynamic || { insertDynamicFlag: true, flagValue: "force-dynamic" };
const report = [];
let changed = 0;

const files = await fg(["apps/**/src/app/**/page.tsx","apps/**/src/app/**/layout.tsx","!**/node_modules/**"]);
for (const file of files){
  const content = await fs.readFile(file, "utf-8");
  if (!content.includes("next/dynamic")) continue;
  if (!/ssr\s*:\s*false/.test(content)) continue;

  let next = content;
  if (insertDynamicFlag && !/export\s+const\s+dynamic\s*=/.test(next)){
    next += `\n\nexport const dynamic = "${flagValue}";\n`;
    report.push(`ADD dynamic flag in ${file}`);
    changed++;
  } else {
    report.push(`Found ssr:false (report only) in ${file}`);
  }

  if (WRITE && next !== content){
    await fs.writeFile(file, next, "utf-8");
  }
}

const out = `tools/reperatur/reports/12-next-dynamic-${Date.now()}-${WRITE?"write":"dry"}.log`;
await fs.mkdir(path.dirname(out), { recursive: true });
await fs.writeFile(out, report.join("\n") || "No changes");
console.log(`[12-next-dynamic] ${WRITE? "applied": "dry-run"}; files changed: ${changed}`);
