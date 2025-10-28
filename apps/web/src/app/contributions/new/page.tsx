"use client";
import { useState, useRef, useMemo } from "react";
import { useDebounced } from "@/ui/hooks/useDebounced";

export default function NewContributionPage() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"atomicize"|"orchestrate">("atomicize");
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<any>(null);

  const debounced = useDebounced(text, 900);
  const abortRef = useRef<AbortController | null>(null);

  async function callAnalyze(payload: any) {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const res = await fetch("/api/contributions/analyze", {
        method: "POST",
        signal: abortRef.current.signal,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      setOut(j);
    } catch (e) {
      setOut({ ok:false, error:String(e) });
    } finally {
      setLoading(false);
    }
  }

  function onAnalyzeClick() {
    if (!text.trim()) return;
    callAnalyze({ text, cmd: mode, maxClaims: 8 });
  }

  // Optional: Live-Analyse nur wenn toggled, und nur nach Debounce
  useMemo(() => {
    if (!live) return;
    if ((debounced ?? "").trim().length < 12) return;
    callAnalyze({ text: debounced, cmd: mode, maxClaims: 6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, live, mode]);

  return (
    <div className="p-6 space-y-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold">Beitrag analysieren</h1>

      <textarea
        className="w-full min-h-[160px] border rounded p-3"
        placeholder="Text hier einfügen…"
        value={text}
        onChange={(e)=>setText(e.target.value)}
      />

      <div className="flex items-center gap-3">
        <select value={mode} onChange={e=>setMode(e.target.value as any)} className="border rounded px-2 py-1">
          <option value="atomicize">Atomicize (Text → atomare Aussagen)</option>
          <option value="orchestrate">Orchestrate (Claim-Analyse)</option>
        </select>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={live} onChange={e=>setLive(e.target.checked)} />
          Live (mit Debounce) – optional
        </label>

        <button
          onClick={onAnalyzeClick}
          disabled={loading || !text.trim()}
          className="px-3 py-1 rounded bg-black text-white disabled:opacity-50"
        >
          {loading ? "Analysiere…" : "Analysieren"}
        </button>
      </div>

      <pre className="text-xs bg-neutral-50 border rounded p-3 overflow-auto">
        {JSON.stringify(out, null, 2)}
      </pre>
    </div>
  );
}
