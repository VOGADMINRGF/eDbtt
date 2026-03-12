import Link from "next/link";
import ReportPage from "@features/report/components/ReportPage";
import demoReports from "@features/report/data/demoReports";
import { getDemoPersonaConfig, parseDemoPersona, withPersona } from "@/features/demo/personas";
import { DEMO_STATUS_GLOSSARY } from "@/features/demo/statusLanguage";

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

function readParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function DemoDossierPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  const resolved = searchParams ? await searchParams : {};
  const persona = parseDemoPersona(readParam(resolved?.persona));
  const personaCfg = getDemoPersonaConfig(persona);

  const roleHint =
    persona === "journalist"
      ? "Quellenlage, Einspruch, offene Fragen und exportfaehige Einordnung."
      : persona === "administration"
        ? "Workflow, Zustaendigkeit, Delegation und auditierbare Dokumentation."
        : "Verstehen, mitwirken, Status nachverfolgen und Perspektiven einreichen.";

  const quickActions =
    persona === "journalist"
      ? [
          { label: "Quelle nachreichen", href: "/demo/create?intent=source" },
          { label: "Widerspruch markieren", href: "/demo/create?intent=objection" },
        ]
      : persona === "administration"
        ? [
            { label: "Option erfassen", href: "/demo/create?intent=option" },
            { label: "Claim schaerfen", href: "/demo/create?intent=claim" },
          ]
        : [
            { label: "Perspektive ergaenzen", href: "/demo/create?intent=perspective" },
            { label: "Frage einreichen", href: "/demo/create?intent=question" },
          ];

  return (
    <main className="min-h-screen bg-[rgb(var(--card))]">
      <h1 className="sr-only">Demo Dossier</h1>
      <section className="mx-auto max-w-6xl px-4 pt-8">
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-5 shadow-sm space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
            Demo - Dossier · {personaCfg.label}
          </p>
          <p className="text-sm text-[rgb(var(--muted))]">{roleHint}</p>
          <div className="flex flex-wrap gap-2 text-[11px]">
            {DEMO_STATUS_GLOSSARY.filter((item) =>
              ["community_submitted", "in_review", "confirmed", "verified"].includes(item.key),
            ).map((item) => (
              <span
                key={item.key}
                className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1 text-[rgb(var(--muted))]"
              >
                {item.label}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={withPersona(action.href, persona)}
                className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1 text-xs font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
      <ReportPage initial={demoReports} />
    </main>
  );
}
