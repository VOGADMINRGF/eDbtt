import fs from "fs";
import path from "path";

const repo = process.cwd();
const web = path.join(repo, "apps", "web");

const files = [
  // Auth / Session / Security
  "src/app/api/auth/login/route.ts",
  "src/app/api/auth/register/route.ts",
  "src/utils/session.ts",
  "src/utils/password.ts",
  "src/app/api/csrf/route.ts",

  // AI / LLM
  "src/lib/contribution/llm/analyzeWithGPT.ts",

  // DB Clients
  "src/lib/db.ts",
  "src/utils/arangoClient.ts",
  "src/utils/neo4jClient.ts",
  "src/utils/memgraphClient.ts",

  // Mail
  "src/utils/email.ts",
];

function rd(p) { return fs.readFileSync(p, "utf8"); }
function wr(p, s) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s, "utf8"); console.log("✓", path.relative(web, p)); }
function ex(p) { return fs.existsSync(p); }

// Hilfsfunktion: sichergestellt, dass `import { env } from "@/utils/env"` existiert
function ensureEnvImport(src) {
  if (/from\s+["']@\/utils\/env["']/.test(src)) return src;
  return `import { env } from "@/utils/env";\n${src}`;
}

const replacements = [
  // Security
  [/([^A-Za-z0-9_])JWT_SECRET([^A-Za-z0-9_])/g, "$1env.JWT_SECRET$2"],
  [/([^A-Za-z0-9_])TTL_DAYS([^A-Za-z0-9_])/g, "$1env.TTL_DAYS$2"],
  // AI
  [/([^A-Za-z0-9_])OPENAI_URL([^A-Za-z0-9_])/g, "$1env.OPENAI_URL$2"],
  [/([^A-Za-z0-9_])MODEL([^A-Za-z0-9_])/g, "$1env.MODEL$2"],
  [/([^A-Za-z0-9_])TIMEOUT_MS([^A-Za-z0-9_])/g, "$1env.TIMEOUT_MS$2"],
  // DB
  [/([^A-Za-z0-9_])uri([^A-Za-z0-9_])/g, "$1env.MONGO_URI$2"],
  [/([^A-Za-z0-9_])dbName([^A-Za-z0-9_])/g, "$1env.ARANGO_DB_NAME$2"],
  [/([^A-Za-z0-9_])USER([^A-Za-z0-9_])/g, "$1env.NEO4J_USER$2"],
  [/([^A-Za-z0-9_])PASS([^A-Za-z0-9_])/g, "$1env.NEO4J_PASS$2"],
  [/([^A-Za-z0-9_])password([^A-Za-z0-9_])/g, "$1env.MEMGRAPH_PASSWORD$2"],
  // Mail
  [/([^A-Za-z0-9_])DEFAULT_FROM([^A-Za-z0-9_])/g, "$1env.EMAIL_DEFAULT_FROM$2"],
];

for (const rel of files) {
  const p = path.join(web, rel);
  if (!ex(p)) continue;
  let s = rd(p);
  const before = s;

  s = ensureEnvImport(s);
  for (const [re, to] of replacements) s = s.replace(re, to);

  if (s !== before) wr(p, s);
}

console.log("→ Done. Jetzt: pnpm run e200");
