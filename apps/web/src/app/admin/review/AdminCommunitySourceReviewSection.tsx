import {
  getCommunitySourceReviewContributionBlockerLabel,
  getCommunitySourceReviewContributionKindLabel,
  getCommunitySourceReviewStatusLabel,
  getCommunitySourceReviewTargetLabel,
  type CommunitySourceReviewContributionBlocker,
} from "@/features/create/communitySourceReviewContribution";
import {
  getCommunitySourceReviewAbuseDispositionLabel,
  getCommunitySourceReviewAbuseReasonLabel,
  getCommunitySourceReviewAbuseSeverityLabel,
  getCommunitySourceReviewAbuseSignalKindLabel,
  getCommunitySourceReviewModerationBlockerLabel,
  getCommunitySourceReviewModerationStatusLabel,
  getCommunitySourceReviewRiskLevelLabel,
  getCommunitySourceReviewSourceQualityLevelLabel,
  getCommunitySourceReviewSourceQualitySignalKindLabel,
  getCommunitySourceReviewTrustLevelLabel,
  getCommunitySourceReviewTrustSignalKindLabel,
  type CommunitySourceReviewModerationBlocker,
} from "@/features/create/communitySourceReviewModeration";
import {
  getCommunitySourceReviewDecisionStatusLabel,
  getCommunitySourceReviewHintBlockerLabel,
  getCommunitySourceReviewRouteTargetLabel,
  type CommunitySourceReviewAuditEntry,
  type CommunitySourceReviewPersistenceState,
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
  submissionRuntimeStatus: "blocked_unwired";
};

function renderBlockerLabel(blocker: CommunitySourceReviewRecordItem["blockers"][number]) {
  if (blocker === "hidden_hint" || blocker === "rejected_hint") {
    return getCommunitySourceReviewHintBlockerLabel(blocker);
  }
  if (
    blocker.startsWith("abuse_") ||
    blocker.startsWith("trust_") ||
    blocker.startsWith("source_quality_") ||
    blocker === "review_priority_trust_quality_only" ||
    blocker === "hidden_pending_review" ||
    blocker === "rejected_abuse" ||
    blocker === "public_exposure_requires_moderation_safe_status"
  ) {
    return getCommunitySourceReviewModerationBlockerLabel(
      blocker as CommunitySourceReviewModerationBlocker,
    );
  }
  return getCommunitySourceReviewContributionBlockerLabel(
    blocker as Exclude<CommunitySourceReviewContributionBlocker, "missing_runtime_contract">,
  );
}

function renderAuditActionLabel(action: CommunitySourceReviewAuditEntry["action"]) {
  if (action === "draft_saved") return "Entwurf gespeichert";
  if (action === "signal_detected") return "Signal erkannt";
  if (action === "signal_reviewed") return "Signal geprüft";
  if (action === "moderation_action_taken") return "Moderationsaktion ausgeführt";
  if (action === "escalation_recommended") return "Eskalation empfohlen";
  if (action === "trust_signal_derived") return "Trust-Signal abgeleitet";
  if (action === "source_quality_signal_derived") return "Quellenqualität abgeleitet";
  if (action === "review_priority_changed") return "Review-Priorität geändert";
  if (action === "source_quality_reviewed") return "Quellenqualität geprüft";
  if (action === "trust_quality_reviewed") return "Trust/Quality geprüft";
  if (action === "hint_allowed") return "Als Hinweis erlaubt";
  if (action === "hint_hidden") return "Hinweis verborgen";
  if (action === "hint_rejected") return "Hinweis zurückgewiesen";
  if (action === "hint_escalated") return "Hinweis priorisiert";
  if (action === "source_review_requested") return "Zur Quellenprüfung geroutet";
  return "Zur Redaktion geroutet";
}

export default function AdminCommunitySourceReviewSection({
  communitySourceReviewRecords,
  communitySourceReviewAuditMap,
  communitySourceReviewPersistence,
  submissionRuntimeStatus,
}: Props) {
  return (
    <div className="mt-5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
            Community Source Review
          </p>
          <p className="mt-1 max-w-3xl text-sm text-[rgb(var(--muted))]">
            Bestehende Review-Workbench für Community-Hinweise, Gegenquellen, Kontext und Eskalationen.
            Keine neue Admin-Welt, keine automatische Wahrheit und keine Community-Mehrheit als Beleg.
          </p>
        </div>
        <div className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
          Öffentlicher Intake: {submissionRuntimeStatus}
        </div>
      </div>

      <p className="mt-3 text-sm font-semibold text-[rgb(var(--fg))]">
        {communitySourceReviewPersistence.label}
      </p>
      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
        {communitySourceReviewPersistence.summary}
      </p>

      <div className="mt-4 space-y-3">
        {communitySourceReviewRecords.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">
            Keine Community-Hinweise im aktuellen Zustand.
          </p>
        ) : (
          communitySourceReviewRecords.map((record) => {
            const audits = communitySourceReviewAuditMap.get(record.id) ?? [];
            const latestAudit = audits[0] ?? null;

            return (
              <article
                key={record.id}
                className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4"
              >
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                    Community-Hinweise moderieren
                  </span>
                  <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                    {record.contribution.kind}
                  </span>
                  <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                    {getCommunitySourceReviewDecisionStatusLabel(record.decisionStatus)}
                  </span>
                </div>

                <p className="mt-3 text-sm font-semibold text-[rgb(var(--fg))]">
                  {getCommunitySourceReviewContributionKindLabel(record.contribution.kind)}
                </p>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                  {record.contribution.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--fg))]">
                  {record.contribution.text}
                </p>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Bezug
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      {getCommunitySourceReviewTargetLabel(record.contribution.target)} ·{" "}
                      {record.contribution.targetId ?? "ohne Ziel-ID"}
                    </p>
                    {record.contribution.claimText ? (
                      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                        Claim: {record.contribution.claimText}
                      </p>
                    ) : null}
                    {record.contribution.sourceRefs.length > 0 ? (
                      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                        Quellen: {record.contribution.sourceRefs.join(" · ")}
                      </p>
                    ) : null}
                    {record.contribution.materialRefs.length > 0 ? (
                      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                        Material: {record.contribution.materialRefs.join(" · ")}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Moderationsstatus
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      Review-Status: {getCommunitySourceReviewStatusLabel(record.contribution.status)}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      Moderation:{" "}
                      {getCommunitySourceReviewModerationStatusLabel(
                        record.contribution.moderation.moderationStatus,
                      )}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      Nächster Pfad: {getCommunitySourceReviewRouteTargetLabel(record.routeTarget)}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      Audit:{" "}
                      {record.latestActorUserId && record.latestDecisionAt
                        ? `${record.latestActorUserId} · ${new Date(record.latestDecisionAt).toLocaleString("de-DE")}`
                        : "noch keine Admin-Entscheidung"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-4">
                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Risk / Abuse
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      Risiko: {getCommunitySourceReviewRiskLevelLabel(record.contribution.moderation.riskLevel)}
                    </p>
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
                      Abuse:{" "}
                      {record.contribution.moderation.abuseReasons.length > 0
                        ? record.contribution.moderation.abuseReasons
                            .map(getCommunitySourceReviewAbuseReasonLabel)
                            .join(" · ")
                        : "keine Abuse-Flags"}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      Signals:{" "}
                      {record.contribution.moderation.abuseSignals.length > 0
                        ? record.contribution.moderation.abuseSignals
                            .map((signal) => getCommunitySourceReviewAbuseSignalKindLabel(signal.kind))
                            .join(" · ")
                        : "keine Abuse-/Spam-Signale"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Trust
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      {getCommunitySourceReviewTrustLevelLabel(record.contribution.moderation.trustLevel)}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      {record.contribution.moderation.guardrails.trustDoesNotVerifyTruth
                        ? "Trust priorisiert höchstens Review."
                        : "Trust ersetzt keine Prüfung."}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      {record.contribution.moderation.abuseState.reviewOnlyHint
                        ? "Signal bleibt nur Review-Hinweis."
                        : "Trust und Signals bleiben klar getrennt."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Quellenqualität
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      {getCommunitySourceReviewSourceQualityLevelLabel(
                        record.contribution.moderation.sourceQualityLevel,
                      )}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      Review-Priorität: {record.contribution.moderation.reviewPriority}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      {record.contribution.moderation.sourceQualityState.summary}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Audit-Hinweis
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      {record.contribution.moderation.summary}
                    </p>
                    {record.latestDecisionNote ? (
                      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                        Letzte Begründung: {record.latestDecisionNote}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      {record.contribution.moderation.abuseState.summary}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Signal-Lesart
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      {record.contribution.moderation.abuseState.duplicateOrRepeatedHint
                        ? "Mehrfach- oder Duplikatsignale erkannt."
                        : "Kein Mehrfach- oder Duplikatcluster erkannt."}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      {record.contribution.moderation.abuseState.excessiveVolumeHint
                        ? "Volumensignal aktiv."
                        : "Kein Volumensignal aktiv."}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      {record.contribution.moderation.canUseHintDespiteAbuseSignals
                        ? "Hinweis kann trotz Signalen als Review-Hinweis betrachtet werden."
                        : "Hinweis bleibt bis zur Moderationsentscheidung als Hint-Nutzung blockiert."}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      {record.contribution.moderation.abuseState.evidenceBlocked
                        ? "Als Evidenz blockiert."
                        : "Nicht automatisch als Evidenz freigegeben."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Signal-Details
                    </p>
                    {record.contribution.moderation.abuseSignals.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        {record.contribution.moderation.abuseSignals.map((signal) => (
                          <p
                            key={`${record.id}:${signal.kind}:${signal.detectedFrom}`}
                            className="text-xs text-[rgb(var(--muted))]"
                          >
                            {getCommunitySourceReviewAbuseSignalKindLabel(signal.kind)} ·{" "}
                            {getCommunitySourceReviewAbuseSeverityLabel(signal.severity)} ·{" "}
                            {getCommunitySourceReviewAbuseDispositionLabel(signal.disposition)}
                            {signal.note ? ` · ${signal.note}` : ""}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                        Keine zusätzlichen Abuse-/Spam-Signale.
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Trust / Quality
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      Trust-Signale:{" "}
                      {record.contribution.moderation.trustSignals.length > 0
                        ? record.contribution.moderation.trustSignals
                            .map((signal) => getCommunitySourceReviewTrustSignalKindLabel(signal.kind))
                            .join(" · ")
                        : "keine zusätzlichen Trust-Signale"}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      Source-Quality-Signale:{" "}
                      {record.contribution.moderation.sourceQualitySignals.length > 0
                        ? record.contribution.moderation.sourceQualitySignals
                            .map((signal) =>
                              getCommunitySourceReviewSourceQualitySignalKindLabel(signal.kind),
                            )
                            .join(" · ")
                        : "keine zusätzlichen Quality-Signale"}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      {record.contribution.moderation.trustState.summary}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                    Guardrails
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Abuse-/Spam-Signale sind Moderationshinweise, keine automatische Ablehnung.
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Mehrfach- oder Volumensignale begründen keine Wahrheit.
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Trust priorisiert Prüfung, bestätigt aber keine Wahrheit.
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Quellenqualität hilft bei der Einordnung, verifiziert aber keine Quelle.
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Auch starke Review-Kandidaten müssen redaktionell oder fachlich geprüft werden.
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Verdächtige Hinweise werden geprüft, aber nicht automatisch veröffentlicht, verifiziert oder in den Graph geschrieben.
                  </p>
                </div>

                {record.blockers.length > 0 ? (
                  <div className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      Blocker
                    </p>
                    <div className="mt-2 space-y-1">
                      {record.blockers.map((blocker) => (
                        <p key={`${record.id}:${blocker}`} className="text-xs text-[rgb(var(--muted))]">
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
                  {latestAudit ? (
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      Letzter Audit-Eintrag: {renderAuditActionLabel(latestAudit.action)} ·{" "}
                      {new Date(latestAudit.at).toLocaleString("de-DE")}
                      {latestAudit.reason ? ` · ${latestAudit.reason}` : ""}
                    </p>
                  ) : null}
                  <div className="mt-2 space-y-1">
                    {audits.slice(0, 6).map((audit) => (
                      <p key={audit.id} className="text-xs text-[rgb(var(--muted))]">
                        {renderAuditActionLabel(audit.action)} ·{" "}
                        {new Date(audit.at).toLocaleString("de-DE")}
                        {audit.signalKinds?.length
                          ? ` · ${audit.signalKinds
                              .map((kind) => getCommunitySourceReviewAbuseSignalKindLabel(kind))
                              .join(" · ")}`
                          : ""}
                        {audit.trustSignalKinds?.length
                          ? ` · ${audit.trustSignalKinds
                              .map((kind) => getCommunitySourceReviewTrustSignalKindLabel(kind))
                              .join(" · ")}`
                          : ""}
                        {audit.sourceQualitySignalKinds?.length
                          ? ` · ${audit.sourceQualitySignalKinds
                              .map((kind) =>
                                getCommunitySourceReviewSourceQualitySignalKindLabel(kind),
                              )
                              .join(" · ")}`
                          : ""}
                        {audit.reason ? ` · ${audit.reason}` : ""}
                      </p>
                    ))}
                  </div>
                </div>

                <CommunitySourceReviewModerationActions record={record} />
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
