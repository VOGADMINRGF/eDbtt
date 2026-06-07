import {
  getEditorialReviewNextStepLabel,
  getEditorialReviewReasonLabel,
  getEditorialReviewSourceTypeLabel,
  getEditorialReviewStatusLabel,
  listEditorialReviewRequests,
} from "@features/editorialReviewQueue";
import EditorialReviewRequestActions from "./EditorialReviewRequestActions";

type EditorialReviewRequestItem = Awaited<ReturnType<typeof listEditorialReviewRequests>>[number];

type Props = {
  currentUserId: string;
  editorialRequests: EditorialReviewRequestItem[];
};

export default function AdminEditorialReviewSection({
  currentUserId,
  editorialRequests,
}: Props) {
  return (
    <div className="mt-5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
            Redaktionelle Prüfbitten
          </p>
          <p className="mt-1 max-w-3xl text-sm text-[rgb(var(--muted))]">
            Beiträge, Analyse-Entwürfe und Truth-Guard-Fälle mit manueller Prüfung. Kein
            Auto-Publish, kein Graph-Merge, kein Dossier- oder Anlassraum-Start.
          </p>
        </div>
        <div className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
          Noch nicht veröffentlicht
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {editorialRequests.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">
            Keine redaktionellen Prüfbitten im aktuellen Filter.
          </p>
        ) : (
          editorialRequests.map((request) => (
            <article
              key={request.id}
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                      {getEditorialReviewStatusLabel(request.status)}
                    </span>
                    <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                      {getEditorialReviewSourceTypeLabel(request.sourceType)}
                    </span>
                    <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                      {getEditorialReviewReasonLabel(request.reason)}
                    </span>
                    <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                      {request.truthStatus}
                    </span>
                    <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                      {request.sourceSupport}
                    </span>
                  </div>
                  <p className="max-w-4xl text-sm font-semibold text-[rgb(var(--fg))]">
                    {request.originalText}
                  </p>
                  <p className="text-xs text-[rgb(var(--muted))]">
                    {request.sourceStatus} ·{" "}
                    {request.reviewRecommended ? "Prüfung empfohlen" : "Prüfung optional"} ·
                    Status {request.verificationLabel} · nächster Schritt{" "}
                    {getEditorialReviewNextStepLabel({
                      sourceType: request.sourceType,
                      status: request.status,
                    })}{" "}
                    · erstellt am {new Date(request.createdAt).toLocaleString("de-DE")}
                  </p>
                  {request.userNote ? (
                    <p className="text-xs text-[rgb(var(--muted))]">
                      Nutzerhinweis: {request.userNote}
                    </p>
                  ) : null}
                  {request.lastAction === "user_replied" ? (
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      Nutzer hat geantwortet
                      {request.lastUserReplyAt
                        ? ` · ${new Date(request.lastUserReplyAt).toLocaleString("de-DE")}`
                        : ""}
                    </p>
                  ) : null}
                  {request.userReplies?.length ? (
                    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                      <p className="text-xs font-semibold text-[rgb(var(--fg))]">
                        Letzte Antwort
                      </p>
                      <p className="mt-2 text-sm text-[rgb(var(--fg))]">
                        {request.userReplies[request.userReplies.length - 1]?.text}
                      </p>
                    </div>
                  ) : null}
                  {request.reviewerNote || request.statusNote ? (
                    <p className="text-xs text-[rgb(var(--muted))]">
                      Letzte Begründung: {request.reviewerNote ?? request.statusNote}
                    </p>
                  ) : null}
                  {request.userVisibleNote ? (
                    <p className="text-xs text-[rgb(var(--muted))]">
                      Nutzerseitig sichtbar: {request.userVisibleNote}
                    </p>
                  ) : null}
                </div>
              </div>

              <EditorialReviewRequestActions request={request} currentUserId={currentUserId} />
            </article>
          ))
        )}
      </div>
    </div>
  );
}
