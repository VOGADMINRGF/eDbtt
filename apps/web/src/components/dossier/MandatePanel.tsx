type ViewerRole =
  | "citizen"
  | "journalist"
  | "administration"
  | "research"
  | "organization"
  | "admin"
  | "staff";

const ROLE_LABELS: Record<string, string> = {
  citizen: "Bürgersicht",
  journalist: "Journalismus",
  administration: "Verwaltung",
  research: "Forschung",
  organization: "Organisation",
  admin: "Admin",
  staff: "Staff",
};

const RIGHTS: Record<string, string[]> = {
  citizen: ["Abstimmen", "Kommentare verfassen"],
  journalist: ["Beiträge erstellen", "Analyse ergänzen"],
  administration: ["Workflow ändern", "Delegieren", "Veröffentlichen"],
  research: ["Analyse vertiefen"],
  organization: ["Stellungnahmen einreichen", "Material beisteuern"],
  admin: ["Workflow ändern", "Delegieren", "Veröffentlichen", "Audit prüfen"],
  staff: ["Workflow ändern", "Delegieren", "Veröffentlichen"],
};

export default function MandatePanel({ viewerRole }: { viewerRole: ViewerRole }) {
  const label = ROLE_LABELS[viewerRole] ?? viewerRole;
  const rights = RIGHTS[viewerRole] ?? [];

  return (
    <section className="vog-card p-6 space-y-3">
      <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">Mandat & Befugnisse</h3>
      <p className="text-sm text-[rgb(var(--fg))]">
        Aktive Rolle: <strong>{label}</strong>
      </p>
      {rights.length ? (
        <ul className="ml-5 list-disc text-sm text-[rgb(var(--muted))]">
          {rights.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[rgb(var(--muted))]">Keine zusätzlichen Befugnisse hinterlegt.</p>
      )}
    </section>
  );
}
