import {
  getParticipationSpacePublishBlockerLabel,
  getParticipationSpacePublishStatusLabel,
  getParticipationSpacePublicVisibilityLabel,
  summarizeParticipationSpacePublishState,
  type ParticipationSpacePublishAuditEntry,
  type ParticipationSpacePublishRecord,
} from "@/features/create/participationSpacePublishWorkflow";
import ParticipationSpacePublishActions from "./ParticipationSpacePublishActions";

type Props = {
  participationSpacePublishRecords: ParticipationSpacePublishRecord[];
  participationSpacePublishAuditMap: Map<
    string,
    ParticipationSpacePublishAuditEntry[]
  >;
  participationSpacePublishPersistence: {
    label: string;
    summary: string;
    productionTruth: boolean;
    publicRouteRuntime: "fixture_only";
  };
};

function renderAuditActionLabel(
  action: ParticipationSpacePublishAuditEntry["action"],
) {
  switch (action) {
    case "activation_requested":
      return "Aktivierung angefragt";
    case "activation_approved":
      return "Aktivierung freigegeben";
    case "activation_rejected":
      return "Aktivierung abgelehnt";
    case "activated_internal":
      return "Intern aktiviert";
    case "publication_requested":
      return "Veröffentlichung angefragt";
    case "publication_approved":
      return "Veröffentlichung freigegeben";
    case "publication_rejected":
      return "Veröffentlichung abgelehnt";
    case "published_public":
      return "Öffentlich veröffentlicht";
    default:
      return action;
  }
}

export default function AdminParticipationSpacePublishSection({
  participationSpacePublishRecords,
  participationSpacePublishAuditMap,
  participationSpacePublishPersistence,
}: Props) {
  return (
    <section
      data-testid="admin-participation-space-publish-section"
      className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Participation Space Publish / Activation
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">
            Beteiligungsraum aktivieren/veröffentlichen prüfen
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--muted))]">
            Aktivierung ist ein separater Freigabeschritt. Veröffentlichung ist
            nicht Teil der Erstellung. Öffentliche Sichtbarkeit entsteht nur
            nach expliziter Freigabe, Audit und erneuter Blocker-Prüfung.
          </p>
        </div>
        <div className="max-w-sm rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-xs text-[rgb(var(--muted))]">
          <p className="font-semibold text-[rgb(var(--fg))]">
            {participationSpacePublishPersistence.label}
          </p>
          <p className="mt-1">{participationSpacePublishPersistence.summary}</p>
          <p className="mt-2">
            Öffentliche Route:{" "}
            {participationSpacePublishPersistence.publicRouteRuntime ===
            "fixture_only"
              ? "weiterhin fixture-basiert"
              : participationSpacePublishPersistence.publicRouteRuntime}
          </p>
        </div>
      </div>

      {participationSpacePublishRecords.length === 0 ? (
        <p className="mt-4 text-sm text-[rgb(var(--muted))]">
          Aktuell liegen keine intern erzeugten Beteiligungsräume für einen
          separaten Aktivierungs- oder Veröffentlichungsworkflow vor.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {participationSpacePublishRecords.map((record) => {
            const audits =
              participationSpacePublishAuditMap.get(record.sourceHandoffId) ??
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
                      {getParticipationSpacePublishStatusLabel(record.status)}
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
                      {getParticipationSpacePublicVisibilityLabel(
                        record.visibility,
                      )}
                    </span>
                    <span className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[rgb(var(--fg))]">
                      Raum {record.spaceStatus ?? "unbekannt"}
                    </span>
                    <span className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[rgb(var(--fg))]">
                      Sichtbarkeit {record.spaceVisibility ?? "unbekannt"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                        Leitfrage / öffentliche Kurzfassung
                      </p>
                      <p className="mt-2 text-sm text-[rgb(var(--fg))]">
                        {record.participationQuestion}
                      </p>
                      <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                        Public Copy: {record.publicHeadline} ·{" "}
                        {record.publicSummary}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                        Aktivierung / Veröffentlichung
                      </p>
                      <p className="mt-2 text-sm text-[rgb(var(--fg))]">
                        {summarizeParticipationSpacePublishState(record)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                        Moderations- und Freigaberahmen
                      </p>
                      <p className="mt-2 text-sm text-[rgb(var(--fg))]">
                        {record.moderationPolicy ??
                          "Kein belastbarer Moderationsrahmen hinterlegt."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                        Kontext
                      </p>
                      <p className="mt-2 text-sm text-[rgb(var(--fg))]">
                        {record.relatedAnlassraumId
                          ? `Anlassraum ${record.relatedAnlassraumId}`
                          : "Kein bestehender Anlassraum verknüpft."}
                        {" · "}
                        {record.relatedDossierId
                          ? `Dossier ${record.relatedDossierId}`
                          : "Kein bestehendes Dossier verknüpft."}
                        {" · "}
                        Handoff {record.sourceHandoffId}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                        Review-Kontext, keine automatische Wahrheit
                      </p>
                      <p className="mt-2 text-sm text-[rgb(var(--fg))]">
                        {record.communitySignals.length} Community-Hinweise ·{" "}
                        {record.graphReferences.length} Graph-Bezüge ·{" "}
                        {record.topicReferences.length} Themenbezüge
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                        Guardrails
                      </p>
                      <p className="mt-2 text-sm text-[rgb(var(--fg))]">
                        Öffentliche Sichtbarkeit nur nach expliziter
                        Veröffentlichung. Keine Fakten- oder
                        Quellenverifikation, kein Dossier-/Anlassraum-Publish,
                        kein Auto-Graph, kein Auto-Merge.
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
                          {getParticipationSpacePublishBlockerLabel(blocker)}
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

                <ParticipationSpacePublishActions record={record} />
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
