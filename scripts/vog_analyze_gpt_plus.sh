#!/usr/bin/env bash
set -euo pipefail

ROOT="apps/web"

echo "🔧 Patch: OpenAI Responses API (input_text + json_object)…"
for F in \
  "$ROOT/src/features/analyze/analyzeContribution.ts" \
  "features/analyze/analyzeContribution.ts" \
  "core/gpt/analyzeContribution.ts" \
  "$ROOT/src/lib/contribution/analyzeContribution.ts"
do
  test -f "$F" || continue
  # 1) content type -> input_text
  perl -0777 -i -pe 's/\{ type:\s*"text",\s*text:/\{ type: "input_text", text:/g' "$F" || true
  # 2) json mode -> object
  perl -0777 -i -pe 's/text:\s*\{\s*format:\s*"json"\s*\}/text: { format: { type: "json_object" } }/g' "$F" || true
  # 3) „json“-Hint im Input (Responses-API verlangt das Wort json)
  perl -0777 -i -pe 's/(content:\s*\[\s*\{\s*type:\s*"input_text",\s*text:\s*)([^}]+)\}\s*\])/$1"format: json\\n\\n" + \2}\]/s' "$F" || true
done

TARGET="$ROOT/src/features/analyze/analyzeContribution.ts"
ALT="features/analyze/analyzeContribution.ts"
[ -f "$ALT" ] && TARGET="$ALT"

echo "🤝 Patch: ARI-Fallback verdrahten in $TARGET…"
# Import ARI client
perl -0777 -i -pe 's#(\nimport .*?;)(\n)#$1\nimport { queryAri } from "@core/ari/ariClient";\n$2#s' "$TARGET"

# Fallback-Logik: erst GPT, bei Fehler ARI, bei erneutem Fehler minimaler Not-Fallback
perl -0777 -i -pe '
  s{
    export\s+async\s+function\s+analyzeContribution\(\s*text:\s*string\s*\)\s*:\s*Promise<AnalyzeResult>\s*\{
    (.*?)
    return\s+out;\s*\}
  }{
    export async function analyzeContribution(text: string): Promise<AnalyzeResult> {
      const model = process.env.OPENAI_MODEL || "gpt-5-pro";
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("OPENAI_API_KEY missing");

      async function runGPT(): Promise<AnalyzeResult> {
        const res = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            reasoning: { effort: process.env.OPENAI_REASONING_EFFORT || "medium" },
            input: [
              { role: "system", content: [{ type: "input_text", text: buildSystemPrompt() }] },
              { role: "user",   content: [{ type: "input_text", text: "format: json\\n\\n" + text.slice(0, 8000) }] },
            ],
            text: { format: { type: "json_object" } },
            max_output_tokens: 1500,
          }),
        });
        const full = await res.json();
        if (!res.ok) throw new Error(`OpenAI ${res.status} – ${JSON.stringify(full)}`);
        const content = String(full.output_text ?? "").trim();
        let parsed: any; try { parsed = JSON.parse(content); } catch { parsed = null; }
        let out = coerceToAnalyzeResult(parsed, text);
        (out as any)._meta = { mode: "gpt" };
        return out;
      }

      async function runARI(gptErr: unknown): Promise<AnalyzeResult> {
        const prompt = buildSystemPrompt() + "\\n\\nTEXT:\\n" + text.slice(0,8000) + "\\n\\nAntworte NUR mit JSON.";
        const raw: any = await queryAri({ query: prompt, sources: [], format: "json" });
        let parsed: any; try { parsed = typeof raw === "string" ? JSON.parse(raw) : raw; } catch { parsed = null; }
        let out = coerceToAnalyzeResult(parsed, text);
        (out as any)._meta = { mode: "ari", gptError: String((gptErr as any)?.message || gptErr) };
        return out;
      }

      try {
        return await runGPT();
      } catch (e1) {
        try {
          return await runARI(e1);
        } catch (e2) {
          const out = coerceToAnalyzeResult(null, text);
          (out as any)._meta = { mode: "fallback", gptError: String((e1 as any)?.message || e1), ariError: String((e2 as any)?.message || e2) };
          return out;
        }
      }
    }
  }sx' "$TARGET"

echo "📰 (Optional) News-Pulse Helper (nur wenn NEWSAPI_KEY gesetzt ist)…"
mkdir -p "$ROOT/src/features/analyze"
cat > "$ROOT/src/features/analyze/newsPulse.ts" <<'TS'
export type NewsPulse = { enabled: boolean; total?: number; latestHours?: number; topSources?: string[]; };
function hoursSince(x?: string){ if(!x) return; const t=Date.parse(x); return isFinite(t)?Math.round((Date.now()-t)/36e5):undefined; }
export async function newsPulseFor(query: string, lang="de"): Promise<NewsPulse> {
  const key = process.env.NEWSAPI_KEY; if (!key) return { enabled: false };
  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", query.slice(0,120));
  url.searchParams.set("language", lang);
  url.searchParams.set("pageSize", "10");
  url.searchParams.set("sortBy", "publishedAt");
  const res = await fetch(url.toString(), { headers: { "X-Api-Key": key } });
  if (!res.ok) return { enabled: false };
  const data = await res.json(); const arts = Array.isArray(data?.articles)?data.articles:[];
  const total = Number(data?.totalResults ?? arts.length) || arts.length;
  const latest = hoursSince(arts[0]?.publishedAt);
  const topSources = [...new Set(arts.map((a:any)=>a?.source?.name).filter(Boolean))].slice(0,5);
  return { enabled: true, total, latestHours: latest, topSources };
}
TS

ANAR="$ROOT/src/app/api/contributions/analyze/route.ts"
if test -f "$ANAR"; then
  echo "🎛  API: News-Pulse einfügen & Fehler sichtbar machen…"
  perl -0777 -i -pe 's#(\nimport .*?;)(\n)#$1\nimport { newsPulseFor } from "@features/analyze/newsPulse";\n$2#s' "$ANAR"
  perl -0777 -i -pe '
    s{
      (const\s+result\s*=\s*await\s*analyzeContribution\([^\)]*\);\s*)
      (return\s+NextResponse\.json\()
    }{$1
      // News-Pulse (optional)
      try {
        const lang = (result as any)?.language ?? "de";
        for (const c of (result as any)?.claims ?? []) {
          c.pulse = await newsPulseFor(String(c.text||"").slice(0,160), lang);
        }
      } catch {}
      $2(result)\)
    }sx' "$ANAR"
fi

UI="$ROOT/src/components/analyze/AnalyzeUI.tsx"
if test -f "$UI"; then
  echo "🎨 UI: Sterne raus, Quellenlage rein…"
  perl -0777 -i -pe '
    s{
      (Relevanz[\s\S]*?)
      (<\/div>\s*<\/div>)
    }{
      <div className="text-sm text-neutral-700 mt-2">
        <span className="font-medium">Quellenlage:</span>{" "}
        {c.pulse?.enabled ? (
          <>
            {c.pulse?.total ?? "—"} Treffer; letzte Aktualisierung vor {c.pulse?.latestHours ?? "—"}h.
            {Array.isArray(c.pulse?.topSources) && c.pulse!.topSources!.length > 0 && (
              <span>{" "}Top-Quellen: {c.pulse!.topSources!.join(", ")}</span>
            )}
          </>
        ) : (
          <span>nicht geprüft</span>
        )}
      </div>
      $2
    }sx' "$UI"
fi

echo "✅ Fertig. Starte jetzt neu: pnpm --filter @vog/web dev"
