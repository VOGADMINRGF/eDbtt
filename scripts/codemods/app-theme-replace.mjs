import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";

const REPLACEMENTS = [
  { re: /bg-white(?:\/\d+)?/g, value: "bg-[rgb(var(--card))]" },
  { re: /bg-slate-(50|100|200)(?:\/\d+)?/g, value: "bg-[rgb(var(--bg))]" },
  { re: /text-slate-(900|800)/g, value: "text-[rgb(var(--fg))]" },
  { re: /text-slate-(700|600|500|400)/g, value: "text-[rgb(var(--muted))]" },
  { re: /border-slate-\d{2,3}(?:\/\d+)?/g, value: "border-[rgb(var(--border))]" },
  { re: /ring-slate-\d{2,3}(?:\/\d+)?/g, value: "ring-[rgb(var(--border))]" },
  { re: /divide-slate-\d{2,3}(?:\/\d+)?/g, value: "divide-[rgb(var(--border))]" },
];

const ROOT = process.cwd();
const TARGETS = ["apps/**/*.tsx", "packages/**/*.tsx", "features/**/*.tsx", "core/**/*.tsx"];
const IGNORE = [
  "**/node_modules/**",
  "**/.next/**",
  "**/dist/**",
  "**/build/**",
  "**/.turbo/**",
  "**/coverage/**",
];

const files = fg.sync(TARGETS, { absolute: true, ignore: IGNORE });
let changed = 0;

for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  let next = src;
  for (const { re, value } of REPLACEMENTS) {
    next = next.replace(re, value);
  }
  if (next !== src) {
    fs.writeFileSync(file, next, "utf8");
    changed += 1;
  }
}

const relTargets = TARGETS.map((pattern) => path.relative(ROOT, pattern)).join(", ");
console.log(`app-theme-replace: updated ${changed} files (${relTargets})`);
