import fs from "node:fs/promises";
import path from "node:path";

const APP_ROOT = path.resolve(process.cwd(), "apps/web/src/app");
const DOCS_DIR = path.resolve(process.cwd(), "docs");

async function scan() {
  const items = [];

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      if (entry.name === "node_modules") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith("_")) continue;
        await walk(full);
        continue;
      }
      if (!entry.isFile()) continue;
      if (entry.name === "page.tsx" || entry.name === "page.ts") {
        items.push({
          path: buildRoutePath(full),
          file: path.relative(APP_ROOT, full),
          kind: "page",
        });
      }
      if (entry.name === "route.ts") {
        const routePath = buildRoutePath(full);
        if (routePath.startsWith("/api")) {
          items.push({
            path: routePath,
            file: path.relative(APP_ROOT, full),
            kind: "api",
          });
        }
      }
    }
  }

  await walk(APP_ROOT);
  return items.sort((a, b) => a.path.localeCompare(b.path));
}

function buildRoutePath(fullPath) {
  const rel = path.relative(APP_ROOT, fullPath);
  const segments = rel.split(path.sep);
  segments.pop();
  const filtered = segments.filter((seg) => {
    if (!seg) return false;
    if (seg.startsWith("(") && seg.endsWith(")")) return false;
    if (seg.startsWith("@")) return false;
    return true;
  });
  const mapped = filtered.map(normalizeSegment);
  const body = mapped.filter(Boolean).join("/");
  return `/${body}`.replace(/\/+/g, "/") || "/";
}

function normalizeSegment(segment) {
  if (segment.startsWith("[[...") && segment.endsWith("]]")) {
    return `:${segment.slice(4, -2)}*`;
  }
  if (segment.startsWith("[...") && segment.endsWith("]")) {
    return `:${segment.slice(4, -1)}*`;
  }
  if (segment.startsWith("[") && segment.endsWith("]")) {
    return `:${segment.slice(1, -1)}`;
  }
  return segment;
}

function toMarkdown(items) {
  const preamble = [
    "<!-- GENERATED FILE - DO NOT EDIT MANUALLY -->",
    "",
    "> **Generated artifact (read-only).**",
    "> Änderungen an Routen in `apps/web/src/app/**/page.tsx` oder `apps/web/src/app/**/route.ts` vornehmen,",
    "> dann `node scripts/route-inventory.mjs` ausführen.",
    "",
  ].join("\n");
  const header = "| Route | Typ | Datei |\n|---|---|---|";
  const rows = items.map((item) => `| \`${item.path}\` | ${item.kind} | \`${item.file}\` |`);
  return [preamble, header, ...rows].join("\n");
}

async function run() {
  const items = await scan();
  await fs.mkdir(DOCS_DIR, { recursive: true });
  await fs.writeFile(path.join(DOCS_DIR, "ROUTES.generated.json"), JSON.stringify(items, null, 2));
  await fs.writeFile(path.join(DOCS_DIR, "ROUTES.generated.md"), toMarkdown(items));
  console.log(`ROUTES.generated.* geschrieben (${items.length} Einträge).`);
}

run().catch((err) => {
  console.error("route-inventory failed", err);
  process.exit(1);
});
