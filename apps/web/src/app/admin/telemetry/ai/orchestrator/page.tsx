"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  buildAiTraceHiddenByPolicyLines,
  formatAiTraceMissingRuntimeLine,
  formatAiTraceTechnicalVisibility,
  getAiTraceSurfaceScopeLine,
} from "@/features/ai/aiTraceSurfaceTruth";
import {
  buildAdminOrchestratorAiProvenanceTraceStep,
  getAiOrchestrationPublishStateLabel,
  getAiOrchestrationReviewStateLabel,
} from "@/features/create/aiOrchestrationProvenanceTrace";

type SmokeMode = "provider_probe" | "runtime_smoke" | "full_contract";

type ProviderDiagnostic = {
  provider: string;
  displayName: string;
  model: string | null;
  mode: SmokeMode;
  status: "ok" | "skipped" | "failed" | "degraded" | "config_missing";
  rootCause: string;
  nextAction: string;
};

type SmokeResponse = {
  ok: boolean;
  mode: SmokeMode;
  runId: string;
  correlationId: string;
  rows: ProviderDiagnostic[];
  operationalSummary?: {
    normalizedLaneLabel: string;
    normalizedLaneDescription: string;
    reviewRequired: boolean;
    publicOutputAllowed: boolean;
    costApprovalRequired: boolean;
    researchAllowed: boolean;
    nextResearchAction: string;
    nextAction: string;
  };
  createAnalyzeApi: {
    state: "ok" | "failed" | "skipped";
    ok: boolean;
    reason: string | null;
    code: string | null;
  };
  error?: string;
};

type ModeCard = {
  mode: SmokeMode;
  title: string;
  subtitle: string;
  action: string;
};

const MODE_CARDS: ModeCard[] = [
  {
    mode: "provider_probe",
    title: "Direktprüfung Provider",
    subtitle: "Prüft nur, ob ein sicherer technischer Kontakt möglich wäre.",
    action: "Direktprobe ausführen",
  },
  {
    mode: "runtime_smoke",
    title: "Runtime Smoke",
    subtitle: "Prüft den bestehenden Orchestrierungsweg als sichere Diagnose ohne Produktlauf.",
    action: "Runtime Smoke ausführen",
  },
  {
    mode: "full_contract",
    title: "Full Analyze Contract Test",
    subtitle: "Prüft den bestehenden Analyze-Vertrag als sichere Betreiberdiagnose.",
    action: "Full Contract ausführen",
  },
];

function modeToQuery(mode: SmokeMode): string {
  if (mode === "provider_probe") return "?mode=probe";
  if (mode === "full_contract") return "?mode=full";
  return "";
}

function countRows(rows: ProviderDiagnostic[]) {
  return {
    ok: rows.filter((row) => row.status === "ok").length,
    degraded: rows.filter((row) => row.status === "degraded").length,
    blocked: rows.filter((row) => row.status === "failed" || row.status === "config_missing").length,
    skipped: rows.filter((row) => row.status === "skipped").length,
  };
}

type SummaryTone = "emerald" | "amber" | "rose" | "slate";

function toneClasses(tone: SummaryTone) {
  if (tone === "emerald") return "border-emerald-300/60 bg-emerald-50/80 text-emerald-800";
  if (tone === "amber") return "border-amber-300/60 bg-amber-50/80 text-amber-800";
  if (tone === "rose") return "border-rose-300/60 bg-rose-50/80 text-rose-800";
  return "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))]";
}

function summarizeMode(data: SmokeResponse | null) {
  if (!data) {
    return {
      label: "Noch nicht geprüft",
      tone: "slate" as const,
      summary: "Für diesen Diagnosemodus liegt noch kein sicherer Lauf in dieser Oberfläche vor.",
      rootCause: "Noch kein Lauf vorhanden",
      nextAction: "Bei Bedarf bewusst starten.",
      counts: countRows([]),
    };
  }

  const counts = countRows(data.rows);
  const firstProblem = data.rows.find(
    (row) => row.status === "failed" || row.status === "config_missing" || row.status === "degraded",
  );

  if (counts.blocked > 0) {
    return {
      label: "Blocker sichtbar",
      tone: "rose" as const,
      summary:
        "Die sichere Diagnose zeigt mindestens einen blockierenden Orchestrierungs- oder Vertragszustand. Nichts startet dadurch automatisch.",
      rootCause: firstProblem?.rootCause ?? "Blocker im Diagnoselauf sichtbar",
      nextAction: firstProblem?.nextAction ?? "Blocker im bestehenden Betriebsweg prüfen.",
      counts,
    };
  }

  if (counts.degraded > 0) {
    return {
      label: "Teilweise belastbar",
      tone: "amber" as const,
      summary:
        "Der Diagnosemodus ist teilweise belastbar, aber mindestens ein Schritt bleibt nur eingeschränkt oder reviewpflichtig verwertbar.",
      rootCause: firstProblem?.rootCause ?? "Teilweise belastbare Diagnose",
      nextAction: firstProblem?.nextAction ?? "Review-first weiter prüfen.",
      counts,
    };
  }

  if (counts.ok > 0) {
    return {
      label: "Belastbar geprüft",
      tone: "emerald" as const,
      summary:
        "Der Diagnosemodus ist im bestehenden Betriebsrahmen belastbar sichtbar. Das bleibt eine sichere Betreiberdiagnose und kein Produktlauf.",
      rootCause: "Kein aktueller Blocker",
      nextAction: "Nur bei Änderungen erneut prüfen.",
      counts,
    };
  }

  return {
    label: "Nur übersprungen oder offen",
    tone: "slate" as const,
    summary:
      "Es liegt kein belastbarer positiver Lauf vor. Sichtbar sind nur bewusst übersprungene oder noch nicht ausgeführte Diagnoseschritte.",
    rootCause: firstProblem?.rootCause ?? "Keine belastbare Diagnose sichtbar",
    nextAction: firstProblem?.nextAction ?? "Falls nötig später bewusst ausführen.",
    counts,
  };
}

function formatCreateAnalyzeState(data: SmokeResponse | null) {
  if (!data || data.mode !== "full_contract") {
    return "Der Analyze-Vertrag wurde in dieser Oberfläche noch nicht separat geprüft.";
  }
  if (data.createAnalyzeApi.state === "ok") {
    return "Der bestehende Analyze-Vertrag war im Diagnosekontext belastbar erreichbar.";
  }
  if (data.createAnalyzeApi.state === "failed") {
    return "Der bestehende Analyze-Vertrag blieb im Diagnosekontext blockiert oder unvollständig.";
  }
  return "Der Analyze-Vertrag wurde in diesem Lauf bewusst nicht separat ausgeführt.";
}

export default function OrchestratorTelemetryPage() {
  const [dataByMode, setDataByMode] = useState<Partial<Record<SmokeMode, SmokeResponse>>>({});
  const [loadingMode, setLoadingMode] = useState<SmokeMode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const traceScopeLine = getAiTraceSurfaceScopeLine("operator");
  const hiddenByPolicy = buildAiTraceHiddenByPolicyLines("operator");

  const operationalSummary = useMemo(
    () =>
      dataByMode.full_contract?.operationalSummary ??
      dataByMode.runtime_smoke?.operationalSummary ??
      dataByMode.provider_probe?.operationalSummary ??
      null,
    [dataByMode],
  );

  const operatorTrace = useMemo(() => {
    const active =
      dataByMode.full_contract ?? dataByMode.runtime_smoke ?? dataByMode.provider_probe ?? null;
    if (!active) return null;
    const representative = active.rows.find((row) => row.status === "ok") ?? active.rows[0] ?? null;
    return buildAdminOrchestratorAiProvenanceTraceStep({
      runId: active.runId,
      correlationId: active.correlationId,
      provider: representative?.provider ?? null,
      model: representative?.model ?? null,
    });
  }, [dataByMode]);

  async function run(mode: SmokeMode) {
    setLoadingMode(mode);
    setError(null);
    try {
      const res = await fetch(`/api/admin/ai/orchestrator-smoke${modeToQuery(mode)}`, {
        method: "POST",
      });
      const body = (await res.json().catch(() => null)) as SmokeResponse | null;
      if (!res.ok || !body) throw new Error(body?.error || res.statusText);
      setDataByMode((prev) => ({ ...prev, [mode]: body }));
    } catch (err: any) {
      setError(err?.message ?? "Diagnoselauf fehlgeschlagen");
    } finally {
      setLoadingMode(null);
    }
  }

  return (
    <main className="mx-auto flex max-w-[1100px] flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Admin · Telemetry · AI
        </p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Orchestrator-Übersicht</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Diese Oberfläche zeigt sichere Betriebs- und Review-Zusammenfassungen für den bestehenden
          Orchestrierungsweg. Sie ist bewusst keine Debug-, Prompt- oder Providerdetail-Ansicht.
        </p>
        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
          Ergänzende Live-Übersicht:{" "}
          <Link
            href="/admin/telemetry/ai/dashboard"
            className="text-sky-700 underline"
          >
            Recent Runs
          </Link>
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Sichere Trace-Wahrheit</h2>
        <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{traceScopeLine}</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-[rgb(var(--muted))]">
          {hiddenByPolicy.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      {operatorTrace ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Aktuelle Operator-Spur</h2>
          <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">
            {operatorTrace.userVisibleLabel}
          </p>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            Review: {getAiOrchestrationReviewStateLabel(operatorTrace.reviewState)}. Veröffentlichung:{" "}
            {getAiOrchestrationPublishStateLabel(operatorTrace.publishState)}.
          </p>
          <p className="mt-1 text-xs text-[rgb(var(--muted))]">
            {formatAiTraceTechnicalVisibility({
              audience: "operator",
              providerVisibility: operatorTrace.providerVisibility,
              providerKnown: operatorTrace.providerKnown,
            })}
          </p>
          {operatorTrace.missingRuntimeTruth ? (
            <p className="mt-2 text-xs text-amber-800">
              {formatAiTraceMissingRuntimeLine(operatorTrace.missingRuntimeTruthReasons, "operator")}
            </p>
          ) : null}
        </section>
      ) : null}

      {operationalSummary ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Sichere Orchestrierungszusammenfassung</h2>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            {operationalSummary.normalizedLaneLabel}: {operationalSummary.normalizedLaneDescription}
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SummaryChip
              label="Review"
              value={
                operationalSummary.reviewRequired
                  ? "Bleibt erforderlich"
                  : "Kein zusätzlicher Review-Schritt im aktuellen Diagnoselauf"
              }
            />
            <SummaryChip
              label="Veröffentlichung"
              value={
                operationalSummary.publicOutputAllowed
                  ? "Nur als bewusst freizugebender Folgepfad"
                  : "Nicht für öffentliche Ausgabe freigegeben"
              }
            />
            <SummaryChip
              label="Kosten und Freigaben"
              value={
                operationalSummary.costApprovalRequired
                  ? "Bewusste Freigabe nötig"
                  : "Kein zusätzlicher Freigabeschritt im aktuellen Diagnoselauf"
              }
            />
            <SummaryChip
              label="Recherche"
              value={
                operationalSummary.researchAllowed
                  ? "Als getrennter Folgepfad möglich"
                  : "Im aktuellen Diagnoselauf nicht aktiv"
              }
            />
          </div>
          <p className="mt-3 text-sm text-[rgb(var(--muted))]">
            Nächster Research-Schritt: {operationalSummary.nextResearchAction}
          </p>
          <p className="mt-1 text-sm font-medium text-[rgb(var(--fg))]">
            Nächste Betreiberaktion: {operationalSummary.nextAction}
          </p>
        </section>
      ) : null}

      <section className="grid gap-4">
        {MODE_CARDS.map((card) => {
          const data = dataByMode[card.mode] ?? null;
          const summary = summarizeMode(data);
          const counts = summary.counts;

          return (
            <article
              key={card.mode}
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-3xl">
                  <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">{card.title}</h2>
                  <p className="text-sm text-[rgb(var(--muted))]">{card.subtitle}</p>
                </div>
                <button
                  type="button"
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  onClick={() => run(card.mode)}
                  disabled={loadingMode !== null}
                >
                  {loadingMode === card.mode ? "läuft …" : card.action}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses(summary.tone)}`}
                >
                  {summary.label}
                </span>
                {counts.ok > 0 ? <MiniCount label="belastbar" value={counts.ok} /> : null}
                {counts.degraded > 0 ? <MiniCount label="teilweise" value={counts.degraded} /> : null}
                {counts.blocked > 0 ? <MiniCount label="blockiert" value={counts.blocked} /> : null}
                {counts.skipped > 0 ? <MiniCount label="übersprungen" value={counts.skipped} /> : null}
              </div>

              <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">{summary.summary}</p>
              <p className="mt-3 text-sm font-semibold text-[rgb(var(--fg))]">
                Hauptursache: {summary.rootCause}
              </p>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                Nächster Schritt: {summary.nextAction}
              </p>

              {card.mode === "full_contract" ? (
                <div className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3 text-xs text-[rgb(var(--muted))]">
                  <p className="font-semibold text-[rgb(var(--fg))]">Analyze-Vertrag</p>
                  <p className="mt-1">{formatCreateAnalyzeState(data)}</p>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </main>
  );
}

function SummaryChip(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3 text-xs text-[rgb(var(--muted))]">
      <p className="font-semibold uppercase tracking-[0.12em]">{props.label}</p>
      <p className="mt-1 text-sm font-medium text-[rgb(var(--fg))]">{props.value}</p>
    </div>
  );
}

function MiniCount(props: { label: string; value: number }) {
  return (
    <span className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-xs text-[rgb(var(--muted))]">
      {props.label}: {props.value}
    </span>
  );
}
