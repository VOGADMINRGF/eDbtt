import fs from "fs";
import path from "path";

const repo = process.cwd();
const web = path.join(repo, "apps", "web");
const rd = (p) => fs.readFileSync(p, "utf8");
const wr = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s, "utf8"); console.log("✓", path.relative(repo, p)); };
const ex = (p) => fs.existsSync(p);

// 1) gdpr/delete: ersetze 'dbc.' -> '(db as any).' und entferne evtl. 'const dbc = db as any;'
{
  const p = path.join(web, "src", "app", "api", "gdpr", "delete", "route.ts");
  if (ex(p)) {
    let s = rd(p);
    s = s.replace(/\bdbc\./g, "(db as any).");
    s = s.replace(/^\s*const\s+dbc\s*=\s*db\s+as\s+any;\s*$/m, ""); // Zeile entfernen, falls vorhanden
    wr(p, s);
  }
}

// 2) gdpr/export: 'dbc' -> '(db as any).' & evtl. 'const dbc = db as any;' entfernen
{
  const p = path.join(web, "src", "app", "api", "gdpr", "export", "route.ts");
  if (ex(p)) {
    let s = rd(p);
    s = s.replace(/\bdbc\./g, "(db as any).");
    s = s.replace(/^\s*const\s+dbc\s*=\s*db\s+as\s+any;\s*$/m, "");
    wr(p, s);
  }
}

// 3) QuickSignup.ts: Schema definieren, falls noch nicht vorhanden
{
  const p = path.join(web, "src", "lib", "pii", "QuickSignup.ts");
  if (ex(p)) {
    let s = rd(p);
    if (!/QuickSignupSchema/.test(s)) {
      const inject =
`import { z } from "zod";
export const QuickSignupSchema = z.object({ email: z.string().email().optional() });
`;
      s = inject + s;
      wr(p, s);
    }
  }
}

// 4) aiProviders.ts: ALLE Funktions-Signaturen mit destrukturiertem {meta,gptData,ariData,metaResult,context} auf ': any' bringen
{
  const p = path.join(web, "src", "utils", "aiProviders.ts");
  if (ex(p)) {
    let s = rd(p);

    // a) function declarations (auch async/export async)
    s = s.replace(
      /(export\s+)?(async\s+)?function\s+([A-Za-z0-9_]+)\s*\(\s*\{\s*meta\s*,\s*gptData\s*,\s*ariData\s*,\s*metaResult\s*,\s*context\s*\}\s*\)/g,
      (m, exp, a, name) => `${exp||""}${a||""}function ${name}({ meta, gptData, ariData, metaResult, context }: any)`
    );

    // b) const foo = async ({ ... }) =>  /  const foo = ({ ... }) =>
    s = s.replace(
      /(export\s+)?const\s+([A-Za-z0-9_]+)\s*=\s*(async\s+)?\(\s*\{\s*meta\s*,\s*gptData\s*,\s*ariData\s*,\s*metaResult\s*,\s*context\s*\}\s*\)\s*=>/g,
      (m, exp, name, a) => `${exp||""}const ${name} = ${a||""}({ meta, gptData, ariData, metaResult, context }: any) =>`
    );

    // c) zur Sicherheit: einzelne Parameterzeilen im Signatur-Block (multi-line) – falls TS immer noch meckert
    // (dieser Schritt fügt KEINE Typen in Objektliteralen ein; nur in Param-Listen)
    s = s.replace(
      /(function\s+[A-Za-z0-9_]+\s*\(\s*\{[^)]*)\bmeta\b([^)]*\}\s*\))/g,
      (m, a, b) => `${a}meta${b}` // no-op safety; echte Typisierung passiert oben
    );

    wr(p, s);
  }
}

console.log("→ Jetzt: pnpm run e200");
