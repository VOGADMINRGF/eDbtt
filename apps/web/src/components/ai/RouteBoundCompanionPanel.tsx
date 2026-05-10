"use client";

import { useState } from "react";
import VerificationStatusPanel from "./VerificationStatusPanel";
import ShareDeepLinkActions from "@/components/mobile/ShareDeepLinkActions";
import type { E150JourneyKey, E150Lane } from "@features/ai/e150/journeyProfiles";
import type { ResearchUsed, VerificationMode } from "@features/ai/e150/verificationContract";

type CompanionContextKind =
  | "dossier"
  | "factcheck"
  | "guided_workspace"
  | "journalist_companion";

type ParentStatus = {
  status?: string | null;
  lane?: E150Lane;
  verificationMode?: VerificationMode;
  researchUsed?: ResearchUsed;
  sealEligible?: boolean;
  sealGranted?: boolean;
};

type CompanionResponse = {
  ok: boolean;
  companion?: {
    contextKind: CompanionContextKind;
    journeyProfile: E150JourneyKey;
    lane: E150Lane;
    verificationMode: VerificationMode;
    researchUsed: ResearchUsed;
    sealEligible: boolean;
    sealGranted: boolean;
    verificationLabel: "analysiert" | "geprueft" | "verifiziert";
    verificationHint: string;
    workflowLabel: string | null;
    text: string;
    followUps: string[];
    disclaimers: string[];
  };
  error?: string;
  message?: string;
};

type RouteBoundCompanionPanelProps = {
  contextKind: CompanionContextKind;
  title?: string;
  intro?: string;
  placeholder?: string;
  analysisMode?: "analyze" | "media" | "guided";
  routePath?: string;
  parentStatus?: ParentStatus;
};

export default function RouteBoundCompanionPanel(props: RouteBoundCompanionPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<CompanionResponse["companion"] | null>(null);

  async function handleAsk() {
    const message = prompt.trim();
    if (message.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message,
          context: {
            kind: props.contextKind,
            title: props.title,
            analysisMode: props.analysisMode,
            routePath: props.routePath,
            parentStatus: props.parentStatus,
          },
        }),
      });
      const body = (await res.json().catch(() => null)) as CompanionResponse | null;
      if (!res.ok || !body?.ok || !body.companion) {
        throw new Error(body?.message ?? body?.error ?? "Companion-Antwort fehlgeschlagen.");
      }
      setAnswer(body.companion);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Companion-Antwort fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 space-y-3">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Routegebundener Companion
        </p>
        <p className="text-sm text-[rgb(var(--muted))]">
          {props.intro ??
            "Kontextdialog auf Journey-Basis. Kein globaler Chat, kein Wahrheitssiegel."}
        </p>
      </div>

      <VerificationStatusPanel
        lane={props.parentStatus?.lane}
        status={props.parentStatus?.status ?? null}
        verificationMode={props.parentStatus?.verificationMode}
        researchUsed={props.parentStatus?.researchUsed}
        sealEligible={props.parentStatus?.sealEligible}
        sealGranted={props.parentStatus?.sealGranted}
        showHint
      />

      {props.routePath ? (
        <ShareDeepLinkActions
          path={props.routePath}
          title={props.title ? `${props.title} · Companion` : "eDebatte Companion"}
          text="Routegebundener Companion-Link"
        />
      ) : null}

      <div className="space-y-2">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={3}
          className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
          placeholder={props.placeholder ?? "Nachfrage oder Kontextfrage eingeben…"}
        />
        <button
          type="button"
          disabled={loading || prompt.trim().length < 2}
          onClick={() => void handleAsk()}
          className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--muted))] disabled:opacity-50"
        >
          {loading ? "Companion antwortet…" : "Nachfrage stellen"}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-300/60 bg-rose-50/80 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      ) : null}

      {answer ? (
        <div className="space-y-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3">
          <VerificationStatusPanel
            lane={answer.lane}
            status={null}
            verificationMode={answer.verificationMode}
            researchUsed={answer.researchUsed}
            sealEligible={answer.sealEligible}
            sealGranted={answer.sealGranted}
            showHint
          />
          <p className="text-sm text-[rgb(var(--fg))]">{answer.text}</p>
          {answer.followUps.length > 0 ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                Nächste Nachfragen
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-[rgb(var(--muted))]">
                {answer.followUps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
