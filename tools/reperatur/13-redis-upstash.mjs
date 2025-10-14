import fg from "fast-glob";
import fs from "node:fs/promises";
import path from "node:path";

const WRITE = process.env.REPERATUR_WRITE === "1";
const cfg = JSON.parse(await fs.readFile("tools/reperatur/config.json","utf-8"));
const { from, to } = cfg.redisAlias || { from: "@lib/redis", to: "@upstash/redis" };

const files = await fg(["**/*.{ts,tsx}","!**/node_modules/**","!**/dist/**"]);
let changed = 0;
const report = [];

for (const file of files){
  let content = await fs.readFile(file, "utf-8");
  if (!content.includes(from)) continue;

  // Non-destructive: report + optionally rewrite to official package import.
  const next = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g"), to);
  if (next !== content){
    report.push(`REDIS import alias ${from} -> ${to} in ${file}`);
    changed++;
    if (WRITE) await fs.writeFile(file, next, "utf-8");
  }
}

const out = `tools/reperatur/reports/13-redis-upstash-${Date.now()}-${WRITE?"write":"dry"}.log`;
await fs.mkdir(path.dirname(out), { recursive: true });
await fs.writeFile(out, report.join("\n") || "No changes");
console.log(`[13-redis-upstash] ${WRITE? "applied": "dry-run"}; files changed: ${changed}`);
