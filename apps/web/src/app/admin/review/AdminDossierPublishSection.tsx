import {
  getDossierPublicationBlockerLabel,
  getDossierPublicationStatusLabel,
  getDossierPublicAccessModeLabel,
  getDossierVisibilityLabel,
  summarizeDossierPublicationState,
  type DossierPublicationRecord,
  type DossierPublishAuditEvent,
} from "@/features/create/dossierPublishWorkflow";
import { DOSSIER_EXPORT_SHARE_PUBLICATION_NOTES } from "@/features/review/dossierExportShareTruth";
import DossierPublishActions from "./DossierPublishActions";

type Props = {
  dossierPublicationRecords: DossierPublicationRecord[];
  dossierPublicationAuditMap: Map<string, DossierPublishAuditEvent[]>;
  dossierPublicationPersistence: {
    label: string;
    summary: string;
    productionTruth: boolean;
    publicRouteRuntime: "runtime_wired";
  };
};

function renderAuditActionLabel(action: DossierPublishAuditEvent["action"]) {
  switch (action) {
    case "publication_review_requested":
      return "Veröffentlichungsprüfung angefragt";
    case "publication_approved":
      return "Veröffentlichung freigegeben";
    case "published_public":
      return "Öffentlich veröffentlicht";
    case "unpublished_public":
      return "Veröffentlichung zurückgezogen";
    case "publication_rejected":
      return "Veröffentlichung abgelehnt";
    case "publication_blocked":
      return "Veröffentlichung blockiert";
    case "publication_archived":
      return "Veröffentlichung archiviert";
    default:
      return action;
  }
}

export default function AdminDossierPublishSection({
  dossierPublicationRecords,
  dossierPublicationAuditMap,
  dossierPublicationPersistence,
}: Props) {
  return (
    <section
      data-testid="admin-dossier-publish-section"
      className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Dossier Publication
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">
            Dossier-Veröffentlichung prüfen
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--muted))]">
            Review-approved Runtime Creation bleibt getrennt von Veröffentlichung. Öffentliche
            Sichtbarkeit entsteht nur nach expliziter Veröffentlichungsprüfung, Freigabe und
            eigenem Publish-Schritt.
          </p>
        </div>
        <div className="max-w-sm rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-xs text-[rgb(var(--muted))]">
          <p className="font-semibold text-[rgb(var(--fg))]">
            {dossierPublicationPersistence.label}
          </p>
          <p className="mt-1">{dossierPublicationPersistence.summary}</p>
          <p className="mt-2">
            Öffentliche Route: {dossierPublicationPersistence.publicRouteRuntime}
          </p>
        </div>
      </div>

      {dossierPublicationRecords.length === 0 ? (
        <p className="mt-4 text-sm text-[rgb(var(--muted))]">
          Aktuell liegen keine erzeugten Runtime-Dossiers für einen separaten Veröffentlichungsworkflow vor.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {dossierPublicationRecords.map((record) => {
            const audits =
              dossierPublicationAuditMap.get(record.sourceHandoffId) ??
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
                      {getDossierPublicationStatusLabel(record.status)}
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
                      {getDossierVisibilityLabel(record.visibility)}
                    </span>
                    <span className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[rgb(var(--fg))]">
                      {getDossierPublicAccessModeLabel(record.publicAccessMode)}
                    </span>
                    <span className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[rgb(var(--fg))]">
                      Runtime {record.runtimeVisibility}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                        Veröffentlichungspfad
                      </p>
                      <p className="mt-2 text-sm text-[rgb(var(--fg))]">
                        {summarizeDossierPublicationState(record)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                        Review- und Guardrail-Copy
                      </p>
                      <p className="mt-2 text-sm text-[rgb(var(--fg))]">
                        {DOSSIER_EXPORT_SHARE_PUBLICATION_NOTES[0]} {DOSSIER_EXPORT_SHARE_PUBLICATION_NOTES[1]}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                        Kontext
                      </p>
                      <p className="mt-2 text-sm text-[rgb(var(--fg))]">
                        {record.originQuestion ?? "Keine zusätzliche Ausgangsfrage hinterlegt."}
                        {" · "}
                        {record.communitySignals.length} Community-Hinweise
                        {" · "}
                        {record.graphReferences.length} Graph-Bezüge
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                        Guardrails
                      </p>
                      <p className="mt-2 text-sm text-[rgb(var(--fg))]">
                        {DOSSIER_EXPORT_SHARE_PUBLICATION_NOTES[4]}
                      </p>
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
                          {getDossierPublicationBlockerLabel(blocker)}
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
                      {audits.slice(0, 6).map((entry) => (
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

                <DossierPublishActions record={record} />
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
