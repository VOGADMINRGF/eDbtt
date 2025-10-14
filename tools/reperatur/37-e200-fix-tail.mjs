import fs from "fs";
import path from "path";

const repo = process.cwd();
const web = path.join(repo, "apps", "web");
const rd = (p) => fs.readFileSync(p, "utf8");
const wr = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s, "utf8"); console.log("✓", path.relative(repo, p)); };
const ex = (p) => fs.existsSync(p);

// 1) gdpr/export: db-Guard ist schon drin; jetzt db -> (db as any) überall (inkl. 'await db...')
{
  const p = path.join(web, "src", "app", "api", "gdpr", "export", "route.ts");
  if (ex(p)) {
    let s = rd(p);
    s = s.replace(/\bdb\./g, "(db as any).");         // property / method use
    s = s.replace(/await\s+db\b/g, "await (db as any)"); // 'await db...' chains
    wr(p, s);
  }
}

// 2) QuickSignup.ts: QuickSignupSchema wirklich definieren, falls keine Deklaration existiert
{
  const p = path.join(web, "src", "lib", "pii", "QuickSignup.ts");
  if (ex(p)) {
    let s = rd(p);
    const hasDecl = /(?:^|\n)\s*(?:export\s+)?const\s+QuickSignupSchema\b/.test(s);
    if (!hasDecl) {
      // Import ergänzen, falls fehlt
      if (!/from\s+["']zod["']/.test(s)) {
        s = `import { z } from "zod";\n` + s;
      }
      s = `export const QuickSignupSchema = z.object({ email: z.string().email().optional() });\n` + s;
      wr(p, s);
    }
  }
}

// 3) aiProviders.ts: Funktionssignaturen mit separaten Parametern typisieren
{
  const p = path.join(web, "src", "utils", "aiProviders.ts");
  if (ex(p)) {
    let s = rd(p);

    // a) Function declarations: (export)? (async)? function name(meta, gptData, ariData, metaResult, context)
    s = s.replace(
      /(export\s+)?(async\s+)?function\s+([A-Za-z0-9_]+)\s*\(\s*meta\s*,\s*gptData\s*,\s*ariData\s*,\s*metaResult\s*,\s*context\s*\)\s*\{/g,
      (m, exp, a, name) => `${exp||""}${a||""}function ${name}(meta: any, gptData: any, ariData: any, metaResult: any, context: any){`
    );

    // b) Arrow functions: (export)? const name = (async )?(meta, gptData, ariData, metaResult, context) =>
    s = s.replace(
      /(export\s+)?const\s+([A-Za-z0-9_]+)\s*=\s*(async\s+)?\(\s*meta\s*,\s*gptData\s*,\s*ariData\s*,\s*metaResult\s*,\s*context\s*\)\s*=>/g,
      (m, exp, name, a) => `${exp||""}const ${name} = ${a||""}(meta: any, gptData: any, ariData: any, metaResult: any, context: any) =>`
    );

    wr(p, s);
  }
}

console.log("→ Jetzt: pnpm run e200");
