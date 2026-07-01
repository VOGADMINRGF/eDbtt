import {
  buildWorkbenchSignalDiagnostics,
  createWorkbenchAuditEvent,
  getCommunitySourceReviewWorkbenchActionLabel,
  mapContributionToWorkbenchItem,
  mapPublicSubmissionToWorkbenchItem,
  summarizeCommunitySourceReviewWorkbench,
  type CommunitySourceReviewWorkbenchSummary,
  type CommunitySourceReviewWorkbenchUiItem,
} from "@/features/create/communitySourceReviewWorkbench";
import {
  getCommunitySourceReviewAbuseDispositionLabel,
  getCommunitySourceReviewAbuseSeverityLabel,
  getCommunitySourceReviewSourceQualitySignalKindLabel,
  getCommunitySourceReviewTrustSignalKindLabel,
} from "@/features/create/communitySourceReviewModeration";
import {
  getCommunitySourceReviewHintBlockerLabel,
  getCommunitySourceReviewSubmissionRuntimeStatusLabel,
  type CommunitySourceReviewAuditEntry,
  type CommunitySourceReviewPersistenceState,
  type CommunitySourceReviewRecord,
  type CommunitySourceReviewSubmissionRuntimeStatus,
} from "@/features/create/communitySourceReviewServer";
import CommunitySourceReviewModerationActions from "./CommunitySourceReviewModerationActions";

type CommunitySourceReviewRecordItem = Awaited<
  ReturnType<
    typeof import("@/features/create/communitySourceReviewServer").listCommunitySourceReviewRecords
  >
>[number];

type Props = {
  communitySourceReviewRecords: CommunitySourceReviewRecordItem[];
  communitySourceReviewAuditMap: Map<string, CommunitySourceReviewAuditEntry[]>;
  communitySourceReviewPersistence: CommunitySourceReviewPersistenceState;
  submissionRuntimeStatus: CommunitySourceReviewSubmissionRuntimeStatus;
  workbenchItems?: CommunitySourceReviewWorkbenchUiItem[];
  workbenchSummary?: CommunitySourceReviewWorkbenchSummary;
};

function renderBlockerLabel(
  blocker: CommunitySourceReviewRecord["blockers"][number],
) {
  return getCommunitySourceReviewHintBlockerLabel(blocker);
}

function buildWorkbenchItemsFromRecords(input: {
  records: CommunitySourceReviewRecordItem[];
  auditMap: Map<string, CommunitySourceReviewAuditEntry[]>;
}): CommunitySourceReviewWorkbenchUiItem[] {
  return input.records.map((record) => {
    const audits = input.auditMap.get(record.id) ?? [];
    const item =
      record.contribution.notes.includes("Öffentlicher Intake: review-first API")
        ? mapPublicSubmissionToWorkbenchItem(record, audits)
        : mapContributionToWorkbenchItem(record, audits);
    return item;
  });
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))]">{value}</p>
      <p className="mt-2 text-xs text-[rgb(var(--muted))]">{detail}</p>
    </article>
  );
}

function ActionPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[11px] text-[rgb(var(--muted))]">
      {label}
    </span>
  );
}

export default function AdminCommunitySourceReviewSection({
  communitySourceReviewRecords,
  communitySourceReviewAuditMap,
  communitySourceReviewPersistence,
  submissionRuntimeStatus,
  workbenchItems,
  workbenchSummary,
}: Props) {
  const computedWorkbenchItems =
    workbenchItems ??
    buildWorkbenchItemsFromRecords({
      records: communitySourceReviewRecords,
      auditMap: communitySourceReviewAuditMap,
    });
  const summary =
    workbenchSummary ??
    summarizeCommunitySourceReviewWorkbench({
      items: computedWorkbenchItems,
    });
  const recordMap = new Map(
    communitySourceReviewRecords.map((record) => [record.id, record]),
  );

  return (
    <div className="mt-5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
            Community Source Review Workbench
          </p>
          <p className="mt-1 max-w-3xl text-sm text-[rgb(var(--muted))]">
            Operativer review-first Arbeitsplatz für öffentliche Submissions und
            bestehende Community-Hinweise. Keine Wahrheitsmaschine, kein
            Publish-Workflow, kein Graph- oder Merge-Pfad und keine
            Entitätserstellung.
          </p>
        </div>
        <div className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
          Öffentlicher Intake:{" "}
          {getCommunitySourceReviewSubmissionRuntimeStatusLabel(
            submissionRuntimeStatus,
          )}
        </div>
      </div>

      <p className="mt-3 text-sm font-semibold text-[rgb(var(--fg))]">
        {communitySourceReviewPersistence.label}
      </p>
      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
        {communitySourceReviewPersistence.summary}
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Neu"
          value={summary.newCount}
          detail="Frische Hinweise ohne Folge-Routing."
        />
        <SummaryCard
          label="Zur Moderation"
          value={summary.queuedForModerationCount}
          detail="Signals, Abuse oder Review-Bedarf aktiv."
        />
        <SummaryCard
          label="Quellenprüfung"
          value={summary.needsSourceReviewCount}
          detail="Explizit zur Quellenprüfung weitergereicht."
        />
        <SummaryCard
          label="Redaktion / Eskalation"
          value={summary.needsEditorialReviewCount + summary.escalatedCount}
          detail="Redaktionell offen oder bewusst eskaliert."
        />
        <SummaryCard
          label="Ops-Hinweis"
          value={summary.pendingTooLongCount}
          detail="Älter als 72h und damit basic-covered stale/pendingTooLong."
        />
      </div>

      <div className="mt-4 space-y-3">
        {computedWorkbenchItems.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">
            Keine Community-Hinweise im aktuellen Zustand.
          </p>
        ) : (
          computedWorkbenchItems.map((item) => {
            const record = recordMap.get(item.id);
            const diagnostics = record
              ? buildWorkbenchSignalDiagnostics(record)
              : null;
            const audits =
              communitySourceReviewAuditMap.get(item.id)?.map(
                createWorkbenchAuditEvent,
              ) ?? [];

            return (
              <article
                key={item.id}
                className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4"
              >
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                    {item.originLabel}
                  </span>
                  <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                    {item.kind}
                  </span>
                  <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                    Status: {item.statusLabel}
                  </span>
                  <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                    Priority: {item.priorityLabel}
                  </span>
                  {item.pendingTooLong ? (
                    <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                      pendingTooLong
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 text-sm font-semibold text-[rgb(var(--fg))]">
                  {item.kindLabel}
                </p>
                <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                  {item.originDetail}
                </p>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--fg))]">
                  {item.body}
                </p>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Bezug
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      {item.targetLabel} · {item.targetId ?? "ohne Ziel-ID"}
                    </p>
                    {item.claimText ? (
                      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                        Claim: {item.claimText}
                      </p>
                    ) : null}
                    {item.sourceRefs.length > 0 ? (
                      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                        Quellen: {item.sourceRefs.join(" · ")}
                      </p>
                    ) : null}
                    {item.materialRefs.length > 0 ? (
                      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                        Material: {item.materialRefs.join(" · ")}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Workbench-Status
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      Entscheidung: {item.decisionStatusLabel}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      Moderation: {item.moderationStatusLabel}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      Nächster Pfad: {item.routeTargetLabel}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      Risiko: {item.riskLevelLabel}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      Review-Priorität: {item.reviewPriorityLabel}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-4">
                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Signals
                    </p>
                    {item.signals.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        {item.signals.map((signal) => (
                          <p key={`${item.id}:${signal.kind}`} className="text-xs text-[rgb(var(--muted))]">
                            {signal.label} · {signal.detail}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                        Keine zusätzlichen Workbench-Signale.
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Trust / Qualität
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      Trust: {item.trustLevelLabel}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      Quellenqualität: {item.sourceQualityLevelLabel}
                    </p>
                    {record ? (
                      <>
                        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                          Trust-Signale:{" "}
                          {record.contribution.moderation.trustSignals.length > 0
                            ? record.contribution.moderation.trustSignals
                                .map((signal) =>
                                  getCommunitySourceReviewTrustSignalKindLabel(
                                    signal.kind,
                                  ),
                                )
                                .join(" · ")
                            : "keine zusätzlichen Trust-Signale"}
                        </p>
                        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                          Source-Quality-Signale:{" "}
                          {record.contribution.moderation.sourceQualitySignals.length > 0
                            ? record.contribution.moderation.sourceQualitySignals
                                .map((signal) =>
                                  getCommunitySourceReviewSourceQualitySignalKindLabel(
                                    signal.kind,
                                  ),
                                )
                                .join(" · ")
                            : "keine zusätzlichen Quality-Signale"}
                        </p>
                      </>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Abuse / Spam
                    </p>
                    {record ? (
                      <>
                        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                          Severity:{" "}
                          {getCommunitySourceReviewAbuseSeverityLabel(
                            record.contribution.moderation.abuseSeverity,
                          )}
                        </p>
                        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                          Disposition:{" "}
                          {getCommunitySourceReviewAbuseDispositionLabel(
                            record.contribution.moderation.abuseDisposition,
                          )}
                        </p>
                        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                          Signals: {diagnostics?.abuseSignalSummary ?? "keine"}
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                        Keine zusätzlichen Abuse-/Spam-Signale.
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Operations
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      Letzte Aktualisierung: {new Date(item.lastUpdatedAt).toLocaleString("de-DE")}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      Offen seit: {item.staleHours}h
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      {item.pendingTooLong
                        ? "Stale/pendingTooLong: basic-covered."
                        : "Aktiv innerhalb des aktuellen Operationsfensters."}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                    Verfügbare Aktionen
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.availableActions.map((action) => (
                      <ActionPill
                        key={`${item.id}:${action}`}
                        label={getCommunitySourceReviewWorkbenchActionLabel(
                          action,
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                    Guardrails
                  </p>
                  {item.guardrails.map((guardrail) => (
                    <p key={`${item.id}:${guardrail}`} className="mt-1 text-xs text-[rgb(var(--muted))]">
                      {guardrail}
                    </p>
                  ))}
                </div>

                {record?.blockers.length ? (
                  <div className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Blocker
                    </p>
                    <div className="mt-2 space-y-1">
                      {record.blockers.map((blocker) => (
                        <p key={`${item.id}:${blocker}`} className="text-xs text-[rgb(var(--muted))]">
                          {blocker} · {renderBlockerLabel(blocker)}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                    Audit-Historie
                  </p>
                  {item.latestAudit ? (
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      Letzter Audit-Eintrag: {item.latestAudit.label} ·{" "}
                      {new Date(item.latestAudit.at).toLocaleString("de-DE")}
                      {item.latestAudit.note ? ` · ${item.latestAudit.note}` : ""}
                    </p>
                  ) : null}
                  <div className="mt-2 space-y-1">
                    {audits.slice(0, 6).map((audit) => (
                      <p key={audit.id} className="text-xs text-[rgb(var(--muted))]">
                        {audit.label} · {new Date(audit.at).toLocaleString("de-DE")}
                        {audit.workbenchPriority
                          ? ` · Priority ${audit.workbenchPriority}`
                          : ""}
                        {audit.note ? ` · ${audit.note}` : ""}
                      </p>
                    ))}
                  </div>
                </div>

                <CommunitySourceReviewModerationActions item={item} />
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
