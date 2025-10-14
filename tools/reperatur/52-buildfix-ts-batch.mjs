import fs from "fs";
import path from "path";

const root = process.cwd();

function edit(file, transforms) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) return console.log("• skip (missing):", file);
  let s = fs.readFileSync(p, "utf8");
  const before = s;

  for (const [re, rep] of transforms) s = s.replace(re, rep);

  if (s !== before) {
    fs.writeFileSync(p, s);
    console.log("✓ fixed", file);
  } else {
    console.log("• no changes", file);
  }
}

// --- 1) stream page: Importe & Felder ---
edit("apps/web/src/app/stream/[slug]/page.tsx", [
  // Importe auf konkrete Komponenten
  [/\bimport\s*\{\s*VideoPlayer\s*\}\s*from\s*["']@ui["'];?/g, 
   'import VideoPlayer from "@features/ui/components/VideoPlayer";'],
  [/\bimport\s*\{\s*StatementList\s*\}\s*from\s*["']@ui["'];?/g, 
   'import StatementList from "@features/ui/components/StatementList";'],

  // region/topic als Text rendern
  [/\{stream\.region\}/g, `{typeof stream.region==='string' ? stream.region : (stream.region?.name ?? stream.region?.label ?? stream.region?.code ?? String(stream.region))}`],
  [/\{stream\.topic\}/g, `{typeof stream.topic==='string' ? stream.topic : (stream.topic?.label ?? stream.topic?.key ?? String(stream.topic))}`],

  // viewers optional & typ-sicher
  [/\{stream\.viewers\}/g, `{(stream as any)?.viewers ?? (stream as any)?.metrics?.viewers ?? 0}`],

  // trailerUrl optional & typ-sicher
  [/\btrailerUrl\}/g, `trailerUrl ?? (stream as any)?.media?.trailerUrl}`],
  [/\burl=\{stream\.trailerUrl\}/g, `url={(stream as any)?.trailerUrl ?? (stream as any)?.media?.trailerUrl}`],
]);

// --- 2) promptSchemas.ts: parsed ist unknown → any ---
edit("core/utils/validation/promptSchemas.ts", [
  [/const\s+parsed\s*=/g, "const parsed: any ="],
]);

// --- 3) ai/orchestrator.ts: ungenaue Casts entfernen ---
edit("features/ai/orchestrator.ts", [
  [/\s+as\s+ImpactOnly\b/g, ""],
  [/\s+as\s+AlternativesOnly\b/g, ""],
]);

// --- 4) telemetry: catch robust ---
edit("features/ai/telemetry.ts", [
  [/\bawait\s+customSink\(e\)\.catch\(\(\)\s*=>\s*\{\}\)\s*;/g,
   "await Promise.resolve(customSink(e)).catch(() => {});"],
]);

// --- 5) SwipeCard: CountryAccordion props & alternatives optional ---
edit("features/swipe/components/SwipeCard.tsx", [
  [/<CountryAccordion\s+/g, "<CountryAccordion countries={[]} "],
  [/statement\.alternatives\.map\(/g, "(statement.alternatives ?? []).map("],
]);

console.log("Done.");
