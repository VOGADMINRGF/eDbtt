import fs from "fs";
import path from "path";

const files = [
  "apps/web/src/app/api/finding/upsert/route.ts",
  "apps/web/src/app/api/unit/[id]/interest/route.ts",
];

for (const f of files) {
  const p = path.join(process.cwd(), f);
  if (!fs.existsSync(p)) { console.log("• skip (missing):", f); continue; }
  let s = fs.readFileSync(p, "utf8");
  const before = s;

  // spezifisch: " ?? \1 " → " ?? err "
  s = s.replace(/\?\?\s*\\1/g, "?? err");
  // fallback: alle verbliebenen "\1" → "err"
  s = s.replace(/\\1/g, "err");

  if (s !== before) {
    fs.writeFileSync(p, s);
    console.log("✓ fixed", f);
  } else {
    console.log("• no changes", f);
  }
}
