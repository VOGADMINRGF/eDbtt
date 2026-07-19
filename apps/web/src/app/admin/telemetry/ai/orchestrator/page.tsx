"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatAiTraceMissingRuntimeLine } from "@/features/ai/aiTraceSurfaceTruth";
import {
  buildAdminOrchestratorAiProvenanceTraceStep,
  getAiOrchestrationPublishStateLabel,
  getAiOrchestrationReviewStateLabel,
} from "@/features/create/aiOrchestrationProvenanceTrace";

type SmokeMode = "create_planner" | "provider_probe" | "runtime_smoke" | "full_contract";

type ProviderDiagnostic = {
  provider: string;
  displayName: string;
  model: string | null;
  mode: SmokeMode;
  status: "ok" | "skipped" | "failed" | "degraded" | "config_missing";
  rootCause: string;
  nextAction: string;
  providerErrorCode?: string | null;
  httpStatus?: number | null;
  providerStatus?: "reachable" | "down" | "unknown";
  adapterStatus?: "ok" | "failed" | "not_started";
  parseStatus?: "ok" | "failed" | "not_started";
  schemaStatus?: "ok" | "failed" | "not_started";
  schemaPath?: string | null;
  journeyDecision?: string | null;
  strictStatus?: string | null;
  finalContractStatus?: string | null;
  durationMs?: number | null;
  timeoutMs?: number | null;
  maxOutputTokens?: number | null;
  tokensIn?: number | null;
  tokensOut?: number | null;
  estimatedCostUsd?: number | null;
  estimatedCostEur?: number | null;
  costKnown?: boolean;
  selectedSmokeModel?: string | null;
  effectiveModel?: string | null;
  openAiSmokeModelMismatch?: boolean | null;
};

type SmokeResponse = {
  ok: boolean;
  mode: SmokeMode;
  runId: string;
  correlationId: string;
  rows: ProviderDiagnostic[];
  directContractRows?: ProviderDiagnostic[];
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
    durationMs?: number;
    reason: string | null;
    code: string | null;
  };
  plannerSmoke?: {
    source: string;
    qualityStatus: string;
    degradedReason: string | null;
    topicCount: number;
    scopeCount: number;
    providerCallAttempted: boolean;
    providerCallSucceeded: boolean;
    modelCandidates: string[];
    timeoutMs: number;
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
    mode: "create_planner",
    title: "Create Planner Live Smoke",
    subtitle: "Prüft exakt den Modell-, Fallback- und Timeout-Pfad, den /create für die Themenanalyse verwendet.",
    action: "Create Planner prüfen",
  },
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

function modeEndpoint(mode: SmokeMode): string {
  if (mode === "create_planner") return "/api/admin/ai/create-planner-smoke";
  if (mode === "provider_probe") return "/api/admin/ai/orchestrator-smoke?mode=probe";
  if (mode === "full_contract") return "/api/admin/ai/orchestrator-smoke?mode=full";
  return "/api/admin/ai/orchestrator-smoke";
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
      const res = await fetch(modeEndpoint(mode), {
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
          Diese Admin-Oberfläche verbindet sichere Betriebszusammenfassungen mit aufklappbaren
          technischen Laufdetails. Prompts, Secrets und ungekürzte Providerantworten bleiben verborgen.
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
        <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
          Sichtbar bleiben Arbeitsstand, Review-Grenzen und sichere Betriebsdiagnostik. Technische
          Kennungen sind nur innerhalb der geschützten Admin-Ansicht und standardmäßig eingeklappt sichtbar.
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-[rgb(var(--muted))]">
          <li>Keine Prompts, Secrets oder ungekürzten Providerantworten in dieser Oberfläche.</li>
          <li>Modell, Fehlercode, Timeout, Laufzeit und Vertragsstatus bleiben für die Störungsanalyse sichtbar.</li>
          <li>Quellen-, Recherche- und Factcheck-Hinweise bleiben Prüfpfade, keine bestätigten Belege.</li>
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
            Sichere Laufdetails stehen in den eingeklappten technischen Details des jeweiligen Diagnoselaufs.
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

              {data ? <TechnicalDiagnostics data={data} /> : null}
            </article>
          );
        })}
      </section>
    </main>
  );
}

function diagnosticValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined || value === "") return "n/a";
  if (typeof value === "boolean") return value ? "ja" : "nein";
  return String(value);
}

function formatMilliseconds(value: number | null | undefined): string {
  return typeof value === "number" ? `${value} ms` : "n/a";
}

function formatTokens(row: ProviderDiagnostic): string {
  if (typeof row.tokensIn !== "number" && typeof row.tokensOut !== "number") return "n/a";
  return `${row.tokensIn ?? 0} / ${row.tokensOut ?? 0}`;
}

function formatCost(row: ProviderDiagnostic): string {
  if (row.costKnown !== true) return "n/a";
  const eur = typeof row.estimatedCostEur === "number" ? `EUR ${row.estimatedCostEur.toFixed(6)}` : null;
  const usd = typeof row.estimatedCostUsd === "number" ? `USD ${row.estimatedCostUsd.toFixed(6)}` : null;
  return [eur, usd].filter(Boolean).join(" · ") || "n/a";
}

function TechnicalDiagnostics({ data }: { data: SmokeResponse }) {
  const groups = [
    { title: data.mode === "create_planner" ? "Create-Planner-Pfad" : "Orchestrator-/Journey-Pfad", rows: data.rows },
    ...(data.directContractRows?.length
      ? [{ title: "Direkter Analyze-Contract", rows: data.directContractRows }]
      : []),
  ];

  return (
    <details className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))]">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[rgb(var(--fg))]">
        Technische Details
      </summary>
      <div className="border-t border-[rgb(var(--border))] px-4 py-4">
        <div className="grid gap-2 text-xs text-[rgb(var(--muted))] md:grid-cols-2">
          <DiagnosticField label="Run-ID" value={data.runId} />
          <DiagnosticField label="Korrelations-ID" value={data.correlationId} />
        </div>

        {data.plannerSmoke ? (
          <div className="mt-3 grid gap-2 rounded-xl border border-[rgb(var(--border))] p-3 text-xs md:grid-cols-3">
            <DiagnosticField label="Planner-Quelle" value={data.plannerSmoke.source} />
            <DiagnosticField label="Qualitätsstatus" value={data.plannerSmoke.qualityStatus} />
            <DiagnosticField label="Degraded Reason" value={data.plannerSmoke.degradedReason} />
            <DiagnosticField label="Erkannte Themen" value={data.plannerSmoke.topicCount} />
            <DiagnosticField label="Erkannte Scopes" value={data.plannerSmoke.scopeCount} />
            <DiagnosticField
              label="Provider-Aufruf"
              value={data.plannerSmoke.providerCallSucceeded ? "erfolgreich" : data.plannerSmoke.providerCallAttempted ? "fehlgeschlagen" : "nicht gestartet"}
            />
          </div>
        ) : null}

        {groups.map((group) => (
          <section key={group.title} className="mt-4">
            <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">{group.title}</h3>
            <div className="mt-2 space-y-3">
              {group.rows.map((row, index) => (
                <article
                  key={`${group.title}-${row.provider}-${index}`}
                  className="rounded-xl border border-[rgb(var(--border))] p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[rgb(var(--fg))]">
                      {row.displayName || row.provider}
                    </p>
                    <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-xs text-[rgb(var(--muted))]">
                      {row.status}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs md:grid-cols-2 xl:grid-cols-4">
                    <DiagnosticField label="Modell" value={row.effectiveModel ?? row.model} />
                    <DiagnosticField label="Konfiguriertes Modell" value={row.selectedSmokeModel} />
                    <DiagnosticField label="Provider-Code" value={row.providerErrorCode} />
                    <DiagnosticField label="HTTP" value={row.httpStatus} />
                    <DiagnosticField label="Provider / Adapter" value={`${diagnosticValue(row.providerStatus)} / ${diagnosticValue(row.adapterStatus)}`} />
                    <DiagnosticField label="Timeout" value={formatMilliseconds(row.timeoutMs)} />
                    <DiagnosticField label="Dauer" value={formatMilliseconds(row.durationMs)} />
                    <DiagnosticField label="Max. Output-Tokens" value={row.maxOutputTokens} />
                    <DiagnosticField label="Parse / Schema" value={`${diagnosticValue(row.parseStatus)} / ${diagnosticValue(row.schemaStatus)}`} />
                    <DiagnosticField label="Schema-Pfad" value={row.schemaPath} />
                    <DiagnosticField label="Strict / Final" value={`${diagnosticValue(row.strictStatus)} / ${diagnosticValue(row.finalContractStatus)}`} />
                    <DiagnosticField label="Journey-Entscheidung" value={row.journeyDecision} />
                    <DiagnosticField label="Tokens in / out" value={formatTokens(row)} />
                    <DiagnosticField label="Geschätzte Kosten" value={formatCost(row)} />
                    <DiagnosticField label="Modellabweichung" value={row.openAiSmokeModelMismatch} />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-[rgb(var(--fg))]">
                    Root Cause: {diagnosticValue(row.rootCause)}
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Next Action: {diagnosticValue(row.nextAction)}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ))}

        <div className="mt-4 grid gap-2 rounded-xl border border-[rgb(var(--border))] p-3 text-xs md:grid-cols-3">
          <DiagnosticField label="Analyze-State" value={data.createAnalyzeApi.state} />
          <DiagnosticField label="Analyze-Code" value={data.createAnalyzeApi.code} />
          <DiagnosticField label="Analyze-Dauer" value={formatMilliseconds(data.createAnalyzeApi.durationMs)} />
        </div>
        <p className="mt-3 text-xs text-[rgb(var(--muted))]">
          Prompts, Secrets, Provider-Rohantworten und ungekürzte Fehlerpayloads werden hier nicht angezeigt.
        </p>
      </div>
    </details>
  );
}

function DiagnosticField(props: {
  label: string;
  value: string | number | boolean | null | undefined;
}) {
  return (
    <div>
      <p className="font-semibold text-[rgb(var(--muted))]">{props.label}</p>
      <p className="break-words text-[rgb(var(--fg))]">{diagnosticValue(props.value)}</p>
    </div>
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
