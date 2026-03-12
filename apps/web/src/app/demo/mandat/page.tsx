import { demoMandate } from "@features/mandate/demoMandate";
import { getDemoPersonaConfig, parseDemoPersona } from "@/features/demo/personas";
import { DEMO_STATUS_GLOSSARY } from "@/features/demo/statusLanguage";

const STATUS_STYLES: Record<string, string> = {
  done: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-amber-100 text-amber-700",
  planned: "bg-[rgb(var(--bg))] text-[rgb(var(--muted))]",
};

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

function readParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function statusLabel(status: "done" | "in_progress" | "planned") {
  if (status === "done") return "erledigt";
  if (status === "in_progress") return "laeuft";
  return "geplant";
}

export default async function DemoMandatPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  const resolved = searchParams ? await searchParams : {};
  const persona = parseDemoPersona(readParam(resolved?.persona));
  const personaCfg = getDemoPersonaConfig(persona);

  const roleHint =
    persona === "administration"
      ? "Verwaltungsfokus: Zustaendigkeit, Umsetzungsgrad, Risikosteuerung."
      : persona === "journalist"
        ? "Journalistischer Fokus: stockende Punkte, Wirkung und offene Risiken."
        : "Buergerfokus: Was wurde beschlossen und was passiert als naechstes?";

  const rightPanelTitle = persona === "journalist" ? "Risiken & offene Punkte" : "Wirkung";

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 space-y-6">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Demo - Mandat</p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">
          {demoMandate.title} · {personaCfg.label}
        </h1>
        <p className="text-sm text-[rgb(var(--muted))]">{demoMandate.summary}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-[rgb(var(--muted))]">
          <span className="rounded-full bg-[rgb(var(--bg))] px-3 py-1 font-semibold text-[rgb(var(--muted))]">
            {demoMandate.region}
          </span>
          <span>Status: {demoMandate.status}</span>
          <span>Letztes Update: {new Date(demoMandate.lastUpdated).toLocaleDateString("de-DE")}</span>
        </div>
        <p className="text-xs text-[rgb(var(--muted))]">
          {roleHint} · Statussprache:{" "}
          {DEMO_STATUS_GLOSSARY.filter((item) => ["delegated", "in_review", "confirmed"].includes(item.key))
            .map((item) => item.label)
            .join(" · ")}
          .
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Timeline & Meilensteine</h2>
          <ol className="space-y-3 text-sm">
            {demoMandate.timeline.map((item, idx) => (
              <li
                key={idx}
                className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-[rgb(var(--fg))]">{item.label}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{new Date(item.date).toLocaleDateString("de-DE")}</p>
                  {item.note && <p className="text-xs text-[rgb(var(--muted))] mt-1">{item.note}</p>}
                </div>
                <span className={`h-fit rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[item.status]}`}>
                  {statusLabel(item.status)}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">{rightPanelTitle}</h2>
          <div className="space-y-3">
            {persona === "journalist"
              ? demoMandate.risks.map((risk) => (
                  <div key={risk.title} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 space-y-1">
                    <p className="font-semibold text-[rgb(var(--fg))]">{risk.title}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">Owner: {risk.owner}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">Mitigation: {risk.mitigation}</p>
                  </div>
                ))
              : demoMandate.impact.map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
                    <p className="text-xs font-semibold uppercase text-[rgb(var(--muted))]">{metric.label}</p>
                    <p className="text-xl font-semibold text-[rgb(var(--fg))]">{metric.value}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">{metric.trend}</p>
                  </div>
                ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Zustaendigkeiten</h2>
          <div className="space-y-3 text-sm">
            {demoMandate.responsibilities.map((resp) => (
              <div key={resp.area} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-[rgb(var(--fg))]">{resp.area}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[resp.status]}`}>
                    {statusLabel(resp.status)}
                  </span>
                </div>
                <p className="text-xs text-[rgb(var(--muted))]">Owner: {resp.owner}</p>
                {resp.partners && resp.partners.length > 0 && (
                  <p className="text-xs text-[rgb(var(--muted))]">Partner: {resp.partners.join(", ")}</p>
                )}
                <ul className="list-disc pl-4 text-xs text-[rgb(var(--muted))]">
                  {resp.deliverables.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">
            {persona === "journalist" ? "Wirkungsdaten" : "Risiken & offene Punkte"}
          </h2>
          <div className="space-y-3 text-sm">
            {persona === "journalist"
              ? demoMandate.impact.map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
                    <p className="text-xs font-semibold uppercase text-[rgb(var(--muted))]">{metric.label}</p>
                    <p className="text-xl font-semibold text-[rgb(var(--fg))]">{metric.value}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">{metric.trend}</p>
                  </div>
                ))
              : demoMandate.risks.map((risk) => (
                  <div key={risk.title} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 space-y-1">
                    <p className="font-semibold text-[rgb(var(--fg))]">{risk.title}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">Owner: {risk.owner}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">Mitigation: {risk.mitigation}</p>
                  </div>
                ))}
          </div>
        </div>
      </section>
    </main>
  );
}
