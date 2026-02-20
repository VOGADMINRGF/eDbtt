import type { Dossier } from "@features/dossier";

type OpenIssue = {
  id?: string;
  delegationId?: string;
  questionId: string;
  status: "offen" | "in_bearbeitung" | "abgeschlossen" | string;
  delegatedTo?: string;
  level?: "kommune" | "land" | "bund" | string;
  requestedAt?: string;
};

type OpenIssueManagement = {
  issues: OpenIssue[];
};

const STATUS_LABELS: Record<string, string> = {
  offen: "Offen",
  in_bearbeitung: "In Bearbeitung",
  abgeschlossen: "Abgeschlossen",
};

const LEVEL_LABELS: Record<string, string> = {
  kommune: "Kommune",
  land: "Land",
  bund: "Bund",
};

function formatDate(value?: string | null) {
  if (!value) return "–";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("de-DE", { year: "numeric", month: "short", day: "2-digit" });
}

export default function DelegationPanel({
  analyze,
  openIssueManagement,
  delegations,
}: {
  analyze: Dossier["analyze"];
  openIssueManagement?: OpenIssueManagement;
  delegations?: OpenIssue[];
}) {
  const issues = delegations?.length ? delegations : openIssueManagement?.issues ?? [];

  return (
    <section className="vog-card p-6 space-y-5">
      <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">Offene Fragen & Zuständigkeit</h3>
      <div className="space-y-4">
        {analyze.questions.map((q) => {
          const issue = issues.find((i) => i.questionId === q.id);
          return (
            <div key={q.id} className="border-b border-[rgb(var(--border))] pb-4">
              <p className="text-sm font-medium text-[rgb(var(--fg))]">{q.text}</p>
              {issue ? (
                <div className="mt-2 text-sm text-[rgb(var(--muted))] space-y-1">
                  <div>Status: {STATUS_LABELS[issue.status] ?? issue.status}</div>
                  <div>
                    Delegiert an: {issue.delegatedTo ?? "–"}
                    {issue.level ? ` (${LEVEL_LABELS[issue.level] ?? issue.level})` : ""}
                  </div>
                  <div>Angefragt am: {formatDate(issue.requestedAt)}</div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">Noch keiner Stelle zugeordnet.</p>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-[rgb(var(--muted))]">
        Delegation und Rückmeldung erfolgen strukturiert über die Plattform; Bürgeranfragen werden nicht einzeln ausgelöst.
      </p>
    </section>
  );
}
