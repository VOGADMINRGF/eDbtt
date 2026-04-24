"use client";

import * as React from "react";
import { resolveSealedFactcheckStatusView } from "@features/ai/e150/factcheckStatus";

type FactcheckEnqueueRequest = {
  contributionId?: string;
  text?: string;
  language?: string;
  topic?: string;
  priority?: number;
  withSerp?: boolean;
  deepSearch?: boolean;
};

type FactcheckEnvelope = {
  status?: unknown;
  verificationMode?: unknown;
  researchUsed?: unknown;
  sealEligible?: unknown;
  sealGranted?: unknown;
  claims?: unknown;
  results?: unknown;
  job?: {
    status?: unknown;
    verificationMode?: unknown;
    researchUsed?: unknown;
    sealEligible?: unknown;
    sealGranted?: unknown;
  } | null;
};

const TERMINAL_STATUSES = new Set(["completed", "failed", "error"]);
const POLL_INTERVAL_MS = 1_800;

function toStatusString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function extractClaims(value: FactcheckEnvelope): any[] {
  if (Array.isArray(value.claims)) return value.claims;
  if (Array.isArray(value.results)) return value.results;
  return [];
}

export function useFactcheckJob() {
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string>("idle");
  const [claims, setClaims] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const [verification, setVerification] = React.useState(() =>
    resolveSealedFactcheckStatusView({
      status: "started",
      verificationMode: "sealed",
      researchUsed: "search",
      sealEligible: true,
      sealGranted: false,
    }),
  );

  const mountedRef = React.useRef(true);
  const activeJobRef = React.useRef<string | null>(null);
  const pollTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPollTimer = React.useCallback(() => {
    if (!pollTimerRef.current) return;
    clearTimeout(pollTimerRef.current);
    pollTimerRef.current = null;
  }, []);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearPollTimer();
    };
  }, [clearPollTimer]);

  const applyEnvelope = React.useCallback((payload: FactcheckEnvelope) => {
    const effectiveStatus = toStatusString(payload.job?.status ?? payload.status);
    const normalizedStatus = effectiveStatus || "queued";
    const statusView = resolveSealedFactcheckStatusView({
      status: normalizedStatus,
      verificationMode: payload.job?.verificationMode ?? payload.verificationMode,
      researchUsed: payload.job?.researchUsed ?? payload.researchUsed,
      sealEligible: payload.job?.sealEligible ?? payload.sealEligible,
      sealGranted: payload.job?.sealGranted ?? payload.sealGranted,
    });

    setStatus(normalizedStatus);
    setClaims(extractClaims(payload));
    setVerification(statusView);

    const isDone = TERMINAL_STATUSES.has(normalizedStatus);
    setDone(isDone);
    return isDone;
  }, []);

  const pollStatus = React.useCallback(
    async (targetJobId: string) => {
      try {
        const res = await fetch(`/api/factcheck/status/${encodeURIComponent(targetJobId)}`, {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        });
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (!mountedRef.current || activeJobRef.current !== targetJobId) return;

        if (!res.ok || data?.ok !== true) {
          const message =
            typeof data?.message === "string"
              ? data.message
              : typeof data?.reason === "string"
                ? data.reason
                : `Statusabfrage fehlgeschlagen (HTTP ${res.status})`;
          setError(message);
          setLoading(false);
          setDone(true);
          return;
        }

        const doneNow = applyEnvelope(data as FactcheckEnvelope);
        setLoading(false);

        if (!doneNow && activeJobRef.current === targetJobId) {
          clearPollTimer();
          pollTimerRef.current = setTimeout(() => {
            void pollStatus(targetJobId);
          }, POLL_INTERVAL_MS);
        }
      } catch (err: any) {
        if (!mountedRef.current || activeJobRef.current !== targetJobId) return;
        setLoading(false);
        setDone(true);
        setError(String(err?.message ?? "Statusabfrage fehlgeschlagen"));
      }
    },
    [applyEnvelope, clearPollTimer],
  );

  const enqueue = React.useCallback(
    async (request?: FactcheckEnqueueRequest) => {
      clearPollTimer();
      setLoading(true);
      setError(null);
      setDone(false);
      setClaims([]);
      setStatus("started");
      setVerification(
        resolveSealedFactcheckStatusView({
          status: "started",
          verificationMode: "sealed",
          researchUsed: request?.deepSearch === true ? "deep_search" : "search",
          sealEligible: true,
          sealGranted: false,
        }),
      );

      try {
        const res = await fetch("/api/factcheck/enqueue", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            text: request?.text ?? "",
            contributionId: request?.contributionId,
            language: request?.language ?? "de",
            priority: request?.priority ?? 5,
            topic: request?.topic,
            withSerp: request?.withSerp,
            deepSearch: request?.deepSearch,
          }),
        });

        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (!mountedRef.current) return;

        if (!res.ok || data?.ok !== true) {
          const message =
            typeof data?.message === "string"
              ? data.message
              : typeof data?.reason === "string"
                ? data.reason
                : `Enqueue fehlgeschlagen (HTTP ${res.status})`;
          throw new Error(message);
        }

        const nextJobId = typeof data?.jobId === "string" ? data.jobId : null;
        setJobId(nextJobId);
        activeJobRef.current = nextJobId;

        const doneNow = applyEnvelope(data as FactcheckEnvelope);
        if (nextJobId && !doneNow) {
          pollTimerRef.current = setTimeout(() => {
            void pollStatus(nextJobId);
          }, POLL_INTERVAL_MS);
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        if (!mountedRef.current) return;
        setLoading(false);
        setDone(true);
        setError(String(err?.message ?? "Factcheck enqueue fehlgeschlagen"));
      }
    },
    [applyEnvelope, clearPollTimer, pollStatus],
  );

  return {
    jobId,
    status,
    claims,
    loading,
    error,
    enqueue,
    done,
    verificationMode: verification.verificationMode,
    researchUsed: verification.researchUsed,
    sealEligible: verification.sealEligible,
    sealGranted: verification.sealGranted,
    verificationLabel: verification.verificationLabel,
    workflowStage: verification.workflowStage,
    workflowLabel: verification.workflowLabel,
    sealStatus: verification.sealLabel,
    lane: "sealed_factcheck" as const,
    journeyProfile: "sealed_factcheck" as const,
  };
}
