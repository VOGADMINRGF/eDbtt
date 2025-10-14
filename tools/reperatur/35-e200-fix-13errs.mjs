import fs from "fs";
import path from "path";

const repo = process.cwd();
const web = path.join(repo, "apps", "web");
const rd = (p) => fs.readFileSync(p, "utf8");
const wr = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s, "utf8"); console.log("✓", path.relative(repo, p)); };
const ex = (p) => fs.existsSync(p);

// 1) notify route: sendAlertEmail mit Payload typ-sicher aufrufen
{
  const p = path.join(web, "src", "app", "api", "admin", "alerts", "notify", "route.ts");
  if (ex(p)) {
    let s = rd(p);
    // a) sicherstellen, dass der Aufruf mit Payload-Objekt erfolgt
    s = s.replace(
      /sendAlertEmail\(\s*\{\s*subject:\s*payload\.subject\s*,\s*html:\s*payload\.html\s*,\s*text:\s*payload\.text\s*,\s*to:\s*\(payload\s+as\s+any\)\.to\s*\}\s*\)/m,
      "sendAlertEmail(payload as any)"
    );
    // b) falls es noch die 4-Arg-Variante gibt, ebenfalls auf Payload drehen
    s = s.replace(
      /sendAlertEmail\(\s*payload\.subject\s*,\s*payload\.html\s*,\s*payload\.text\s*(?:,\s*payload\.to)?\s*\)/m,
      "sendAlertEmail(payload as any)"
    );
    wr(p, s);
  }
}

// 2) gdpr/delete: db-Guard + dbc statt db
{
  const p = path.join(web, "src", "app", "api", "gdpr", "delete", "route.ts");
  if (ex(p)) {
    let s = rd(p);
    if (!/db unavailable/.test(s)) {
      s = s.replace(/const\s+db\s*=\s*await\s*getDb\([^\)]*\);?/, (m) => `${m}\n  if (!db) return NextResponse.json({ ok:false, error:"db unavailable" }, { status: 500 });\n  const dbc = db as any;`);
      // alle folgenden db.collection -> dbc.collection
      s = s.replace(/\bdb\.collection\(/g, "dbc.collection(");
      wr(p, s);
    }
  }
}

// 3) gdpr/export: db-Guard + dbc statt db
{
  const p = path.join(web, "src", "app", "api", "gdpr", "export", "route.ts");
  if (ex(p)) {
    let s = rd(p);
    if (!/db unavailable/.test(s)) {
      s = s.replace(/const\s+db\s*=\s*await\s*getDb\([^\)]*\);?/, (m) => `${m}\n  if (!db) return NextResponse.json({ ok:false, error:"db unavailable" }, { status: 500 });\n  const dbc = db as any;`);
      s = s.replace(/\bdb\./g, "dbc.");
      wr(p, s);
    }
  }
}

// 4) QuickSignup.ts: QuickSignupSchema sicherstellen
{
  const p = path.join(web, "src", "lib", "pii", "QuickSignup.ts");
  if (ex(p)) {
    let s = rd(p);
    if (!/QuickSignupSchema/.test(s)) {
      s = `import { z } from "zod";\nconst QuickSignupSchema = z.object({ email: z.string().email().optional() });\n` + s;
      wr(p, s);
    }
  }
}

// 5) aiProviders.ts: Parameter-Destructuring mit : any typisieren
{
  const p = path.join(web, "src", "utils", "aiProviders.ts");
  if (ex(p)) {
    let s = rd(p);
    // Fälle wie:
    // export async function someFn({ meta, gptData, ariData, metaResult, context }) { ... }
    // → : any anfügen
    s = s.replace(
      /export\s+async\s+function\s+([A-Za-z0-9_]+)\s*\(\s*\{\s*meta\s*,\s*gptData\s*,\s*ariData\s*,\s*metaResult\s*,\s*context\s*\}\s*\)/gs,
      'export async function $1({ meta, gptData, ariData, metaResult, context }: any)'
    );

    // Falls es eine Variante ohne "export" gibt:
    s = s.replace(
      /async\s+function\s+([A-Za-z0-9_]+)\s*\(\s*\{\s*meta\s*,\s*gptData\s*,\s*ariData\s*,\s*metaResult\s*,\s*context\s*\}\s*\)/gs,
      'async function $1({ meta, gptData, ariData, metaResult, context }: any)'
    );

    wr(p, s);
  }
}

console.log("→ Jetzt: pnpm run e200");

