import fs from "fs";
import path from "path";

const root = process.cwd();

function patch(file, pairs) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) {
    console.log("• skip (missing):", file);
    return;
  }
  let s = fs.readFileSync(p, "utf8");
  const before = s;

  for (const { find, replace } of pairs) {
    const re = find instanceof RegExp ? find : new RegExp(find, "g");
    s = s.replace(re, replace);
  }

  if (s !== before) {
    fs.writeFileSync(p, s);
    console.log("✓ fixed", file);
  } else {
    console.log("• no changes", file);
  }
}

// 1) Stream-Page: konkrete UI-Komponenten + felder sicher
patch("apps/web/src/app/stream/[slug]/page.tsx", [
  // named -> default-Import aus realen Component-Pfaden
  {
    find: /\bimport\s*\{\s*VideoPlayer\s*\}\s*from\s*["']@ui["'];?/,
    replace: 'import VideoPlayer from "@features/ui/components/VideoPlayer";',
  },
  {
    find: /\bimport\s*\{\s*StatementList\s*\}\s*from\s*["']@ui["'];?/,
    replace: 'import StatementList from "@features/ui/components/StatementList";',
  },

  // region/topic robust zu Strings
  {
    find: /\{stream\.region\}/g,
    replace:
      `{typeof stream.region==="string" ? stream.region : (stream.region?.name ?? stream.region?.label ?? stream.region?.code ?? String(stream.region ?? ""))}`,
  },
  {
    find: /\{stream\.topic\}/g,
    replace:
      `{typeof stream.topic==="string" ? stream.topic : (stream.topic?.label ?? stream.topic?.key ?? String(stream.topic ?? ""))}`,
  },

  // viewers optionaler Pfad
  {
    find: /\bstream\.viewers\b/g,
    replace: `(stream as any)?.viewers ?? (stream as any)?.metrics?.viewers ?? 0`,
  },

  // trailerUrl optionaler Pfad
  {
    find: /\bstream\.trailerUrl\b/g,
    replace: `(stream as any)?.trailerUrl ?? (stream as any)?.media?.trailerUrl`,
  },
]);

// 2) promptSchemas.ts: parsed typisieren (unknown -> any-Struktur)
patch("core/utils/validation/promptSchemas.ts", [
  {
    // jede 'const parsed =' Deklaration mit Typ ausstatten
    find: /const\s+parsed\s*=\s*([^;]+);/g,
    replace:
      'const parsed: { ok: boolean; data?: unknown; error?: { message: string } } = $1;',
  },
]);

// 3) ai/orchestrator.ts: nicht vorhandene Typ-Casts entfernen
patch("features/ai/orchestrator.ts", [
  { find: /\s+as\s+ImpactOnly\b/g, replace: "" },
  { find: /\s+as\s+AlternativesOnly\b/g, replace: "" },
]);

// 4) telemetry.ts: .catch auf void absichern
patch("features/ai/telemetry.ts", [
  {
    find: /\bawait\s+customSink\(e\)\.catch\(\(\)\s*=>\s*\{\}\)\s*;/,
    replace: "await Promise.resolve(customSink(e)).catch(() => {});",
  },
]);

// 5) SwipeCard: CountryAccordion braucht 'countries'; alternatives optional
patch("features/swipe/components/SwipeCard.tsx", [
  {
    find: /<CountryAccordion\s+/,
    replace: '<CountryAccordion countries={[]} ',
  },
  {
    find: /statement\.alternatives\.map\(/g,
    replace: "(statement.alternatives ?? []).map(",
  },
]);

console.log("Done.");
