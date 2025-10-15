"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

type AnalyzeResult = {
  language: string;
  mainTopic?: string | null;
  subTopics: string[];
  regionHint?: string | null;
  claims: { 
    text: string; categoryMain?: string | null; categorySubs: string[];
    region?: string | null; authority?: string | null;
  }[];
};

export default function AnalyzePage() {
  const qs = useSearchParams();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyzeResult | null>(null);

  useEffect(() => {
    const t = qs.get("text");
    if (t) setInput(t);
  }, [qs]);

  async function onAnalyze() {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 60000); // 60s Timeout

      const res = await fetch("/api/contributions/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);

      let json: any = null;
      try { json = await res.json(); }
      catch { setError("Unerwartete Antwort"); return; }

      if (!res.ok || !json?.ok || !json?.data?.claims) {
        setError(json?.error ?? "Unerwartete Antwort");
        return;
      }
      setData(json.data as AnalyzeResult);
    } catch (e: any) {
      setError(e?.name === "AbortError" ? "Zeitüberschreitung" : (e?.message || "Fehler"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4">
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        className="w-full h-64 border p-2"
        placeholder="Dein Text…"
      />
      <div className="mt-2">
        <button onClick={onAnalyze} disabled={loading || !input.trim()}>
          {loading ? "Analysiere …" : "Analysieren"}
        </button>
      </div>

      {error && <div className="mt-3 text-red-600">❌ {error}</div>}

      {data && (
        <div className="mt-4">
          <div>
            <b>Sprache:</b> {data.language}
            {typeof data.mainTopic !== "undefined" && <> • <b>Hauptthema:</b> {data.mainTopic ?? "—"}</>}
            {!!data.subTopics?.length && <> • <b>Subthemen:</b> {data.subTopics.join(", ")}</>}
            {typeof data.regionHint !== "undefined" && <> • <b>Region-Hinweis:</b> {data.regionHint ?? "—"}</>}
          </div>
          {data.claims.map((c, i) => (
            <div key={i} className="mt-3 border p-2">
              <b>Aussage {i + 1}</b>
              <div>{c.text}</div>
              <small>
                Thema: <i>{c.categoryMain ?? "—"}</i>;
                {" "}Sub: {c.categorySubs?.join(", ") || "—"};
                {" "}Region: {c.region ?? "—"};
                {" "}Amt: {c.authority ?? "—"}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
