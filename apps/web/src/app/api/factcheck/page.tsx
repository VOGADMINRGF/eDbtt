"use client";
import { useState } from "react";
import VerificationStatusPanel from "@/components/ai/VerificationStatusPanel";
import type { E150Lane } from "@features/ai/e150/journeyProfiles";
import type { ResearchUsed, VerificationMode } from "@features/ai/e150/verificationContract";

type FactcheckClaimResult = {
  id: string;
  text: string;
};

type FactcheckJobResult = {
  jobId?: string;
  status?: string;
  lane?: E150Lane;
  verificationMode?: VerificationMode;
  researchUsed?: ResearchUsed;
  sealEligible?: boolean;
  sealGranted?: boolean;
  verdict?: string;
  confidence?: number;
};

type FactcheckResult = {
  job: FactcheckJobResult;
  claims: FactcheckClaimResult[];
};

function toClaims(value: unknown): FactcheckClaimResult[] {
  if (!Array.isArray(value)) return [];
  return value.map((claim, idx) => {
    const current = claim as { id?: unknown; text?: unknown } | null;
    return {
      id: typeof current?.id === "string" && current.id.trim() ? current.id : String(idx + 1),
      text: typeof current?.text === "string" ? current.text : "",
    };
  });
}

function toLane(value: unknown): E150Lane | undefined {
  switch (value) {
    case "standard":
    case "sealed_factcheck":
    case "material_grounding":
      return value;
    default:
      return undefined;
  }
}

function toVerificationMode(value: unknown): VerificationMode | undefined {
  switch (value) {
    case "none":
    case "precheck":
    case "sealed":
      return value;
    default:
      return undefined;
  }
}

function toResearchUsed(value: unknown): ResearchUsed | undefined {
  switch (value) {
    case "none":
    case "lite":
    case "gemini":
    case "search":
    case "deep_search":
      return value;
    default:
      return undefined;
  }
}

function toJob(value: unknown): FactcheckJobResult {
  const current = value as Record<string, unknown> | null;
  return {
    jobId: typeof current?.jobId === "string" ? current.jobId : undefined,
    status: typeof current?.status === "string" ? current.status : undefined,
    lane: toLane(current?.lane),
    verificationMode: toVerificationMode(current?.verificationMode),
    researchUsed: toResearchUsed(current?.researchUsed),
    sealEligible: typeof current?.sealEligible === "boolean" ? current.sealEligible : undefined,
    sealGranted: typeof current?.sealGranted === "boolean" ? current.sealGranted : undefined,
    verdict: typeof current?.verdict === "string" ? current.verdict : undefined,
    confidence: typeof current?.confidence === "number" ? current.confidence : undefined,
  };
}

export default function FactcheckPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FactcheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const enq = await fetch("/api/factcheck/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: "de" }),
      });
      const ej = await enq.json();
      if (!enq.ok) throw new Error(ej?.message ?? "enqueue failed");

      // sanft pollen, max. 30s
      for (let i = 0; i < 30; i++) {
        const st = await fetch(`/api/factcheck/status/${ej.jobId}`);
        const sj = await st.json();
        if (st.ok && (sj.job.status === "completed" || sj.job.status === "failed")) {
          setResult({
            job: toJob(sj?.job),
            claims: toClaims(sj?.claims),
          });
          setLoading(false);
          return;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      throw new Error("Timeout");
    } catch (e: any) {
      setError(e.message ?? String(e));
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Factcheck</h1>
      <textarea
        className="w-full border rounded p-3 min-h-[140px]"
        placeholder="Text hier einfügen…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        onClick={run}
        disabled={loading || text.trim().length < 10}
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
      >
        {loading ? "Prüfe…" : "Factcheck starten"}
      </button>

      {error && <p className="text-red-600">Fehler: {error}</p>}
      {result && (
        <div className="border rounded p-4 space-y-2">
          <div className="text-sm text-gray-600">
            Job #{result.job.jobId ?? "unbekannt"} – {result.job.status ?? "offen"}
          </div>
          <VerificationStatusPanel
            lane={result.job?.lane ?? "sealed_factcheck"}
            status={result.job?.status}
            verificationMode={result.job?.verificationMode}
            researchUsed={result.job?.researchUsed}
            sealEligible={result.job?.sealEligible}
            sealGranted={result.job?.sealGranted}
            showHint
          />
          {result.job?.verdict && (
            <div className="text-xs text-gray-500">
              Verdict: <b>{result.job.verdict}</b>
              {typeof result.job.confidence === "number" ? ` (confidence ${result.job.confidence})` : ""}
            </div>
          )}
          {result.claims.map((c) => (
            <div key={c.id} className="p-3 bg-gray-50 rounded">
              <div className="font-medium">{c.text}</div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
