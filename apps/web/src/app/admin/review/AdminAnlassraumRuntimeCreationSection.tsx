import Link from "next/link";
import {
  getAnlassraumRuntimeCreationBlockerLabel,
  getAnlassraumRuntimeSourceStatusLabel,
  getAnlassraumRuntimeStatusLabel,
  summarizeAnlassraumRuntimeState,
  type AnlassraumRuntimeAuditEntry,
  type AnlassraumRuntimeRecord,
} from "@/features/create/anlassraumRuntime";
import AnlassraumRuntimeCreationActions from "./AnlassraumRuntimeCreationActions";

type Props = {
  anlassraumRuntimeRecords: AnlassraumRuntimeRecord[];
  anlassraumRuntimeAuditMap: Map<string, AnlassraumRuntimeAuditEntry[]>;
  anlassraumRuntimePersistence: {
    label: string;
    summary: string;
    productionTruth: boolean;
  };
};

function renderAuditActionLabel(action: AnlassraumRuntimeAuditEntry["action"]) {
  switch (action) {
    case "draft_derived":
      return "Aus Handoff abgeleitet";
    case "creation_approved":
      return "Erstellung freigegeben";
    case "creation_rejected":
      return "Erstellung abgelehnt";
    case "creation_blocked":
      return "Erstellung blockiert";
    case "runtime_created":
      return "Runtime erstellt";
    default:
      return action;
  }
}

export default function AdminAnlassraumRuntimeCreationSection({
  anlassraumRuntimeRecords,
  anlassraumRuntimeAuditMap,
  anlassraumRuntimePersistence,
}: Props) {
  return (
    <section
      data-testid="admin-anlassraum-runtime-creation-section"
      className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Anlassraum Runtime Creation
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">
            Anlassraum erstellen prüfen
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--muted))]">
            Review-approved Handoffs können hier als echter interner Anlassraum angelegt werden.
            Der Schritt bleibt auditierbar und erzeugt weder Veröffentlichung noch
            Beteiligungsraum.
          </p>
        </div>
        <div className="max-w-sm rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-xs text-[rgb(var(--muted))]">
          <p className="font-semibold text-[rgb(var(--fg))]">{anlassraumRuntimePersistence.label}</p>
          <p className="mt-1">{anlassraumRuntimePersistence.summary}</p>
        </div>
      </div>

      {anlassraumRuntimeRecords.length === 0 ? (
        <p className="mt-4 text-sm text-[rgb(var(--muted))]">
          Aktuell liegen keine Anlassraum-Kandidaten für eine echte Runtime-Erstellung vor.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {anlassraumRuntimeRecords.map((record) => {
            const audits =
              anlassraumRuntimeAuditMap.get(record.sourceHandoffId) ??
              record.auditTrail ??
              [];
            return (
              <article
                key={record.id}
                className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                      {getAnlassraumRuntimeStatusLabel(record.status)}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">
                      {record.workingTitle}
                    </h3>
                    <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--muted))]">
                      {record.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[rgb(var(--fg))]">
                      {getAnlassraumRuntimeSourceStatusLabel(record.sourceStatus)}
                    </span>
                    <span className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[rgb(var(--fg))]">
                      {record.topicReferences.length} Themenbezüge
                    </span>
                    <span className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[rgb(var(--fg))]">
                      {record.communitySignals.length} Community-Hinweise
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                        Anlass / Ausgangsfrage
                      </p>
                      <p className="mt-2 text-sm text-[rgb(var(--fg))]">
                        {record.trigger}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                        Standpunkte und Argumentlinien
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--fg))]">
                        {record.recognizedStandpoints.slice(0, 3).map((entry) => (
                          <li key={`${record.id}-standpoint-${entry}`}>{entry}</li>
                        ))}
                        {record.argumentLines
                          .filter((entry) => !record.recognizedStandpoints.includes(entry))
                          .slice(0, 3)
                          .map((entry) => (
                            <li key={`${record.id}-argument-${entry}`}>{entry}</li>
                          ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                        Offene Fragen
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--fg))]">
                        {record.openQuestions.slice(0, 4).map((entry) => (
                          <li key={`${record.id}-question-${entry}`}>{entry}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                        Dossier / Handoff / Review-Bezug
                      </p>
                      <p className="mt-2 text-sm text-[rgb(var(--fg))]">
                        {record.relatedDossierId
                          ? `Dossier ${record.relatedDossierId} · Handoff ${record.sourceHandoffId}`
                          : `Handoff ${record.sourceHandoffId} · Review-Item ${record.sourceReviewItemId}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                        Graph- / Topic-Bezüge
                      </p>
                      <p className="mt-2 text-sm text-[rgb(var(--fg))]">
                        {record.graphReferences.slice(0, 4).join(" · ") || "Noch keine belastbaren Graph-Bezüge."}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                        Status und Audit
                      </p>
                      <p className="mt-2 text-sm text-[rgb(var(--fg))]">
                        {summarizeAnlassraumRuntimeState(record)}
                      </p>
                      {record.createdAnlassraumId ? (
                        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                          Anlassraum angelegt:
                          {" "}
                          <Link
                            href={`/runden?view=active&anlassraumId=${encodeURIComponent(record.createdAnlassraumId)}`}
                            className="underline"
                          >
                            {record.createdAnlassraumId}
                          </Link>
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                {record.blockers.length > 0 ? (
                  <div className="mt-4 rounded-2xl border border-amber-300/70 bg-amber-500/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-950">
                      Blocker
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-amber-950">
                      {record.blockers.map((blocker) => (
                        <li key={`${record.id}-${blocker}`}>
                          {getAnlassraumRuntimeCreationBlockerLabel(blocker)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {audits.length > 0 ? (
                  <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                      Audit Trail
                    </p>
                    <ul className="mt-2 space-y-2 text-xs text-[rgb(var(--muted))]">
                      {audits.slice(0, 5).map((entry) => (
                        <li key={entry.id}>
                          <span className="font-semibold text-[rgb(var(--fg))]">
                            {renderAuditActionLabel(entry.action)}
                          </span>
                          {" · "}
                          {new Date(entry.at).toLocaleString("de-DE")}
                          {entry.note ? ` · ${entry.note}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <AnlassraumRuntimeCreationActions record={record} />
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
