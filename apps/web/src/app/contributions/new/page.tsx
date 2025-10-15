"use client";
import React from "react";

type AnalyzeResult = {
  language: string;
  mainTopic?: string | null;
  subTopics: string[];
  regionHint?: string | null;
  claims: { text: string; categoryMain?: string | null; categorySubs: string[]; region?: string | null; authority?: string | null }[];
};

export default function NewContributionPage() {
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<AnalyzeResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function onAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/contributions/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as AnalyzeResult;
      setResult(json);
    } catch (err: any) {
      setError(err?.message || "Analyse fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    { key: "parse", label: "Vorverarbeitung", done: !!text.trim() },
    { key: "canon", label: "Kanon-Mapping (Tier-1/Tier-2)", done: !!result },
    { key: "db", label: "Interner Abgleich (Duplikate/Region)", done: false },
    { key: "ext", label: "Externe Quellen (Suche/Rank)", done: false },
    { key: "experts", label: "Virtuelle Experten-Panel", done: false },
    { key: "fact", label: "Faktencheck", done: false },
    { key: "trust", label: "Trust-Score", done: false },
  ];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Beitrag erstellen & analysieren</h1>

      <form onSubmit={onAnalyze} className="space-y-3">
        <textarea
          className="w-full min-h-[160px] p-3 border rounded"
          placeholder="Schreibe deinen Beitrag/These…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex gap-2 items-center">
          <button
            type="submit"
            disabled={loading || text.trim().length < 6}
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          >
            {loading ? "Analysiere …" : "Analyse starten"}
          </button>
          {error && <span className="text-red-600">{error}</span>}
        </div>
      </form>

      {/* Pipeline-Visualisierung (einfacher Stepper) */}
      <div className="border rounded p-4">
        <div className="font-medium mb-2">Analyse-Pipeline</div>
        <ul className="space-y-1">
          {steps.map((s) => (
            <li key={s.key} className="flex items-center gap-2">
              <span className={`inline-block h-2 w-2 rounded-full ${s.done ? "bg-green-600" : "bg-gray-400"}`} />
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Ergebnisse */}
      {result && (
        <div className="border rounded p-4 space-y-3">
          <div className="flex flex-wrap gap-3 text-sm">
            <div>Sprache: <b>{result.language || "—"}</b></div>
            <div>Hauptthema: <b>{result.mainTopic || "—"}</b></div>
            {!!result.subTopics?.length && (
              <div>Subthemen: <b>{result.subTopics.join(", ")}</b></div>
            )}
          </div>

          <div>
            <div className="font-medium mb-2">Extrahierte Claims</div>
            <ol className="list-decimal pl-5 space-y-2">
              {(result.claims || []).map((c, i) => (
                <li key={i}>
                  <div className="font-medium">{c.text}</div>
                  <div className="text-sm text-gray-600">
                    {c.categoryMain ? <>Kategorie: <b>{c.categoryMain}</b> · </> : null}
                    {c.categorySubs?.length ? <>Sub: {c.categorySubs.join(", ")} · </> : null}
                    {c.region ? <>Region: {c.region} · </> : null}
                    {c.authority ? <>Institution: {c.authority}</> : null}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="text-sm text-gray-700">
            Nächste Schritte (automatisierbar): Abgleich gegen interne Datenbank, externe Quellen-Suche,
            multi-perspektivische KI-Bewertung, **Faktencheck**, vorläufiger **Trust-Score**.
            Danach Vorschau zur Korrekturfreigabe.
          </div>
        </div>
      )}
    </div>
  );
}
