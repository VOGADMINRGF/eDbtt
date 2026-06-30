import Link from "next/link";
import {
  getDossierRuntimeCreationBlockerLabel,
  getDossierRuntimeSourceStatusLabel,
  getDossierRuntimeStatusLabel,
  summarizeDossierRuntimeState,
  type DossierRuntimeAuditEntry,
  type DossierRuntimeRecord,
} from "@/features/create/dossierRuntime";
import DossierRuntimeCreationActions from "./DossierRuntimeCreationActions";

type Props = {
  dossierRuntimeRecords: DossierRuntimeRecord[];
  dossierRuntimeAuditMap: Map<string, DossierRuntimeAuditEntry[]>;
  dossierRuntimePersistence: {
    label: string;
    summary: string;
    productionTruth: boolean;
  };
};

function renderAuditActionLabel(action: DossierRuntimeAuditEntry["action"]) {
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

export default function AdminDossierRuntimeCreationSection({
  dossierRuntimeRecords,
  dossierRuntimeAuditMap,
  dossierRuntimePersistence,
}: Props) {
  return (
    <section
      data-testid="admin-dossier-runtime-creation-section"
      className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Dossier Runtime Creation
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">
            Dossier erstellen prüfen
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--muted))]">
            Review-approved Handoffs können hier als echte Dossier-Runtime angelegt werden. Der
            Schritt bleibt auditierbar und erzeugt weder Veröffentlichung noch automatische
            Wahrheit.
          </p>
        </div>
        <div className="max-w-sm rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-xs text-[rgb(var(--muted))]">
          <p className="font-semibold text-[rgb(var(--fg))]">{dossierRuntimePersistence.label}</p>
          <p className="mt-1">{dossierRuntimePersistence.summary}</p>
        </div>
      </div>

      {dossierRuntimeRecords.length === 0 ? (
        <p className="mt-4 text-sm text-[rgb(var(--muted))]">
          Aktuell liegen keine Dossier-Kandidaten für eine echte Runtime-Erstellung vor.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {dossierRuntimeRecords.map((record) => {
            const audits =
              dossierRuntimeAuditMap.get(record.sourceHandoffId) ??
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
                      {getDossierRuntimeStatusLabel(record.status)}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">
                      {record.workingTitle}
                    </h3>
                    <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--muted))]">
                      {record.summary}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[rgb(var(--fg))]">
                      {getDossierRuntimeSourceStatusLabel(record.sourceStatus)}
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
                        Ausgangsfrage / Anlass
                      </p>
                      <p className="mt-2 text-sm text-[rgb(var(--fg))]">
                        {record.originQuestion ?? "Noch keine belastbare Ausgangsfrage vorhanden."}
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
                        Graph- / Topic-Bezüge
                      </p>
                      <p className="mt-2 text-sm text-[rgb(var(--fg))]">
                        {record.graphReferences.slice(0, 4).join(" · ") || "Noch keine belastbaren Graph-Bezüge."}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                        Community / Trust / Abuse
                      </p>
                      <p className="mt-2 text-sm text-[rgb(var(--fg))]">
                        {record.communitySignals.length > 0
                          ? record.communitySignals
                              .slice(0, 3)
                              .map((signal) => signal.title)
                              .join(" · ")
                          : "Keine zusätzlichen Community-Hinweise verknüpft."}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                        Status und Audit
                      </p>
                      <p className="mt-2 text-sm text-[rgb(var(--fg))]">
                        {summarizeDossierRuntimeState(record)}
                      </p>
                      {record.createdDossierId ? (
                        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                          Dossier angelegt:
                          {" "}
                          <Link
                            href={`/admin/dossiers/${encodeURIComponent(record.createdDossierId)}`}
                            className="underline"
                          >
                            {record.createdDossierId}
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
                          {getDossierRuntimeCreationBlockerLabel(blocker)}
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

                <DossierRuntimeCreationActions record={record} />
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
