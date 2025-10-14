// apps/web/src/app/demo/page.tsx
"use client";
import { useState } from "react";
import { useFactcheckJob } from "@/hooks/useFactcheckJob";

export default function Demo() {
  const [input, setInput] = useState("");
  const { jobId, status, claims, loading, error, enqueue, done } =
    useFactcheckJob();

  return (
    <div className="p-6 space-y-4">
      <textarea
        className="w-full border rounded p-3"
        rows={5}
        placeholder="Text für Factcheck… (min. 20 Zeichen)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        disabled={loading || input.length < 20}
        onClick={() => enqueue({ text: input, language: "de", priority: 5 })}
      >
        {loading ? "Wird geprüft…" : "Factcheck starten"}
      </button>

      {error && <div className="text-red-600">Fehler: {error}</div>}
      {jobId && <div className="text-sm opacity-70">JobID: {jobId}</div>}
      {status && <div>Status: {status}</div>}

      {done && claims && (
        <div className="space-y-2">
          <h3 className="font-semibold">Ergebnis</h3>
          {claims.map((c) => (
            <div key={c.id} className="border rounded p-3">
              <div className="font-medium">{c.text}</div>
              <div className="text-sm">
                Konsens: {c.consensus?.verdict ?? "—"} (
                {Math.round((c.consensus?.confidence ?? 0) * 100)}%)
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
