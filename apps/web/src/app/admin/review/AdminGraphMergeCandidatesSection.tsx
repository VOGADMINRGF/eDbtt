import {
  evaluateProductiveGraphMergeGate,
  getGraphMergeCandidateKindLabel,
  getGraphMergeCandidatesPersistenceState,
  getProductiveGraphMergeGateReasonLabel,
  getGraphMergeCandidateMergeStatusLabel,
  getGraphMergeCandidateReviewStatusLabel,
  listGraphMergeAuditEntries,
  listGraphMergeCandidates,
} from "@features/graphMergeCandidates";
import GraphMergeCandidateActions from "./GraphMergeCandidateActions";

type GraphMergeAuditItem = Awaited<ReturnType<typeof listGraphMergeAuditEntries>>[number];
type GraphMergeCandidateItem = Awaited<ReturnType<typeof listGraphMergeCandidates>>[number];
type GraphMergeCandidatePersistence =
  ReturnType<typeof getGraphMergeCandidatesPersistenceState>;

type Props = {
  graphAuditMap: Map<string, GraphMergeAuditItem>;
  graphCandidatePersistence: GraphMergeCandidatePersistence;
  graphMergeCandidates: GraphMergeCandidateItem[];
};

export default function AdminGraphMergeCandidatesSection({
  graphAuditMap,
  graphCandidatePersistence,
  graphMergeCandidates,
}: Props) {
  return (
    <div className="mt-5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
            Graph-Kandidaten
          </p>
          <p className="mt-1 max-w-3xl text-sm text-[rgb(var(--muted))]">
            Review-bestätigte Arbeitsstände für kontrollierte Zusammenführung. Kein Auto-Merge,
            kein Auto-Publish und keine direkte Wahrheitspromotion.
          </p>
        </div>
        <div className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
          Nur mit Audit-Trail
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold text-[rgb(var(--fg))]">
        {graphCandidatePersistence.label}
      </p>
      <p className="mt-3 text-xs text-[rgb(var(--muted))]">
        {graphCandidatePersistence.summary}
      </p>

      <div className="mt-4 space-y-3">
        {graphMergeCandidates.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">
            Keine Graph-Kandidaten im aktuellen Zustand.
          </p>
        ) : (
          graphMergeCandidates.map((candidate) => {
            const prepareGate = evaluateProductiveGraphMergeGate(candidate, {
              isAdminConfirmed: true,
              phase: "prepare",
            });
            const confirmGate = evaluateProductiveGraphMergeGate(candidate, {
              isAdminConfirmed: true,
              phase: "confirm",
            });
            const latestAudit = graphAuditMap.get(candidate.id) ?? null;

            return (
              <article
                key={candidate.id}
                className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4"
              >
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                    {getGraphMergeCandidateKindLabel(candidate.candidateKind)}
                  </span>
                  <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                    {getGraphMergeCandidateReviewStatusLabel(candidate.reviewStatus)}
                  </span>
                  <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                    {getGraphMergeCandidateMergeStatusLabel(candidate.mergeStatus)}
                  </span>
                  <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                    {confirmGate.allowed
                      ? "Merge-Gate offen"
                      : getProductiveGraphMergeGateReasonLabel(confirmGate.reason)}
                  </span>
                  <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                    Noch nicht veröffentlicht
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-[rgb(var(--fg))]">
                  {candidate.proposedTitle ?? candidate.text}
                </p>
                <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                  {candidate.sourceStatus} · Truth {candidate.truthStatus} · Quellenlage{" "}
                  {candidate.sourceSupport} · Status {candidate.verificationLabel}
                </p>
                <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                  Merge-Gate: {getProductiveGraphMergeGateReasonLabel(confirmGate.reason)} · Audit{" "}
                  {latestAudit ? `vorhanden (${latestAudit.action})` : "erforderlich"}
                </p>
                {!prepareGate.allowed && prepareGate.reason === "blocked_source_open" ? (
                  <p className="mt-2 text-xs text-[rgb(var(--muted))]">Quellenlage offen</p>
                ) : null}
                {!prepareGate.allowed &&
                prepareGate.reason === "blocked_duplicate_unresolved" ? (
                  <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                    Duplikatprüfung offen
                  </p>
                ) : null}
                {!confirmGate.allowed && confirmGate.reason === "blocked_review_required" ? (
                  <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                    Redaktionelle Prüfung offen
                  </p>
                ) : null}
                {!confirmGate.allowed && confirmGate.reason === "override_required" ? (
                  <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                    Override-Begründung erforderlich
                  </p>
                ) : null}
                {candidate.duplicateCandidates?.length ? (
                  <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                    Möglicherweise bereits vorhanden:{" "}
                    {candidate.duplicateCandidates.map((entry) => entry.label).join(" · ")}
                  </p>
                ) : null}
                {latestAudit ? (
                  <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                    Letzter Audit-Eintrag: {latestAudit.action} ·{" "}
                    {new Date(latestAudit.mergedAt).toLocaleString("de-DE")}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                  Graph-Write-Entscheidung bleibt auditierbar, aber weiterhin getrennt von
                  Analyse-, Factcheck- und Review-Automatik.
                </p>
                <GraphMergeCandidateActions
                  candidate={candidate}
                  prepareGate={prepareGate}
                  confirmGate={confirmGate}
                />
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
