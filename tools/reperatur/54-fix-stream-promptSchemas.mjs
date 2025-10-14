import fs from "fs";
import path from "path";

const root = process.cwd();

function patch(file, pairs) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) return console.log("• skip (missing):", file);
  let s = fs.readFileSync(p, "utf8");
  const before = s;
  for (const { find, replace } of pairs) {
    const re = find instanceof RegExp ? find : new RegExp(find, "g");
    s = s.replace(re, replace);
  }
  if (s !== before) { fs.writeFileSync(p, s); console.log("✓ fixed", file); }
  else { console.log("• no changes", file); }
}

/* 1) STREAM PAGE: 
   - region?.label / region?.code → (region as any)?.label / (region as any)?.code
   - Klammern um (A ?? B) && <Comp ...>
*/
patch("apps/web/src/app/stream/[slug]/page.tsx", [
  { find: /stream\.region\?\.label/g, replace: "(stream.region as any)?.label" },
  { find: /stream\.region\?\.code/g,  replace: "(stream.region as any)?.code"  },
  { // {(A ?? B) && <VideoPlayer url={A ?? B}/>}
    find: /(\{\s*)(\(stream as any\)\?\.\btrailerUrl\b\s*\?\?\s*\(stream as any\)\?\.\bmedia\b\?\.\btrailerUrl\b)(\s*\&\&\s*<VideoPlayer\s+url=\{)(\(stream as any\)\?\.\btrailerUrl\b\s*\?\?\s*\(stream as any\)\?\.\bmedia\b\?\.\btrailerUrl\b)(\}\s*\/>\s*\})/,
    replace: (_, a, lhs, mid, rhs, end) => `${a}(${lhs}) && <VideoPlayer url={${rhs}} />}`
  },
]);

/* 2) PROMPT SCHEMAS:
   - parsed sauber casten
   - Guard: parsed?.error?.message optional
*/
function fixBlock(text, label) {
  // const parsed: {...} = safeJsonParse<unknown>(jsonText);
  text = text.replace(
    /const\s+parsed\s*:\s*\{\s*ok:\s*boolean;[\s\S]*?}\s*=\s*safeJsonParse<unknown>\(jsonText\);/m,
    `const parsed = safeJsonParse(jsonText) as { ok: boolean; data?: unknown; error?: { message: string } };`
  );
  // if (!parsed.ok) throw new Error(`... ${parsed.error.message}`);
  text = text.replace(
    new RegExp(`if\\s*\\(!parsed\\.ok\\)\\s*throw new Error\\(\\\`${label} JSON parse failed: \\$\\{parsed\\.error\\.message\\}\\\`\\);`),
    `if (!parsed || parsed.ok !== true) { const msg = (parsed as any)?.error?.message ?? "unknown"; throw new Error(\`${label} JSON parse failed: \${msg}\`); }`
  );
  return text;
}

(() => {
  const file = "core/utils/validation/promptSchemas.ts";
  const p = path.join(root, file);
  if (!fs.existsSync(p)) return console.log("• skip (missing):", file);
  let s = fs.readFileSync(p, "utf8");

  s = fixBlock(s, "Impact");
  s = fixBlock(s, "Alternatives");
  s = fixBlock(s, "Factcheck");

  fs.writeFileSync(p, s);
  console.log("✓ fixed", file);
})();
