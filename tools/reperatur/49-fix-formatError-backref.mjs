import fs from "fs";
import path from "path";

const files = [
  "apps/web/src/app/api/finding/upsert/route.ts",
  "apps/web/src/app/api/unit/[id]/interest/route.ts",
];

function patchFile(p) {
  if (!fs.existsSync(p)) {
    console.log("• skip (missing):", p);
    return;
  }
  let s = fs.readFileSync(p, "utf8");
  const before = s;

  // 1) catch-Parameter vereinheitlichen → catch (err)
  s = s.replace(/catch\s*\(\s*[a-zA-Z_]\w*\s*\)/g, "catch (err)");

  // 2) kaputte \1 Backrefs aus meinem vorherigen Patch reparieren
  s = s.replace(/\(\\?1 as any\)/g, "(err as any)");
  s = s.replace(/,\s*\\?1\)/g, ", err)");

  // 3) Falls noch die gesamte Zeile mit \1 existiert, hart ersetzen
  s = s.replace(
    /NextResponse\.json\(\s*formatError\("bad_request",\s*String\(\(\\?1 as any\)\?\.(?:message)\s*\?\?\s*\\?1\)\s*,\s*\\?1\)\s*,\s*\{\s*status:\s*400\s*\}\s*\)/g,
    'NextResponse.json(formatError("bad_request", String((err as any)?.message ?? err), err), { status: 400 })'
  );

  if (s !== before) {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, s);
    console.log("✓ fixed", p);
  } else {
    console.log("• no changes", p);
  }
}

for (const f of files) patchFile(path.join(process.cwd(), f));
