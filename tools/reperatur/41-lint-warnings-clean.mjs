import fs from "fs";
import path from "path";

const repo = process.cwd();
const files = [
  "apps/web/src/app/verify/page.tsx",
  "apps/web/src/utils/log.ts",
];

for (const rel of files) {
  const p = path.join(repo, rel);
  if (!fs.existsSync(p)) { console.warn("skip (not found):", rel); continue; }
  let s = fs.readFileSync(p, "utf8");

  // Entferne alle eslint-disable Direktiven (Zeile + Blockvarianten)
  s = s
    .replace(/^[ \t]*\/\/\s*eslint-disable.*$\r?\n?/gmi, "")
    .replace(/\/\*\s*eslint-disable(?:-next-line)?[\s\S]*?\*\/\r?\n?/gmi, "");

  fs.writeFileSync(p, s, "utf8");
  console.log("✓ cleaned", rel);
}
