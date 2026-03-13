import { demoMandate, type DemoMandate } from "@features/mandate/demoMandate";
import { getDemoPersonaConfig, type DemoPersona } from "@/features/demo/personas";
import {
  DEMO_STATUS_GLOSSARY,
  getDemoStatusLabel,
  mapTimelineStatusToDemoKey,
} from "@/features/demo/statusLanguage";
import { readStringParam, type SurfaceContext } from "@/features/surface";

type MandateStatusFilter = "all" | "aktiv" | "in Planung" | "abgeschlossen";

function statusLabel(status: "done" | "in_progress" | "planned") {
  if (status === "done") return "erledigt";
  if (status === "in_progress") return "läuft";
  return "geplant";
}

function statusClass(status: "done" | "in_progress" | "planned") {
  if (status === "done") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/12 dark:text-emerald-200";
  if (status === "in_progress") return "bg-amber-100 text-amber-800 dark:bg-amber-500/12 dark:text-amber-200";
  return "bg-[rgb(var(--bg))] text-[rgb(var(--muted))]";
}

function mandateSignals(mandate: DemoMandate) {
  const running = mandate.status === "aktiv" ? "läuft" : mandate.status === "in Planung" ? "startet" : "abgeschlossen";
  const riskOpen = mandate.risks.length > 0;
  const impactVisible = mandate.impact.length > 0;
  const stalled = mandate.status !== "abgeschlossen" && mandate.risks.length >= 2;
  return { running, riskOpen, impactVisible, stalled };
}

function inferTheme(mandate: DemoMandate) {
  const text = `${mandate.title} ${mandate.summary}`.toLowerCase();
  if (text.includes("energie") || text.includes("klima")) return "Klima & Energie";
  if (text.includes("schule") || text.includes("bildung")) return "Bildung";
  if (text.includes("mobil")) return "Mobilität";
  return "Infrastruktur";
}

function buildMandatePool(): DemoMandate[] {
  const variantA: DemoMandate = {
    ...demoMandate,
    id: "demo-mandate-002",
    title: "Schulwege sicherer machen",
    region: "Nordrhein-Westfalen - Region",
    status: "in Planung",
    summary:
      "Mandat zur sicheren Schulweg-Infrastruktur mit Querungshilfen, Tempoanpassung und Beleuchtung.",
    lastUpdated: "2025-07-28",
    impact: [
      { label: "Gefahrenstellen", value: "-14 %", trend: "in Pilotzonen" },
      { label: "Elternzufriedenheit", value: "+11 pp", trend: "Befragung Juli 2025" },
      { label: "Budgetabfluss", value: "22 %", trend: "von 0,9 Mio EUR" },
    ],
    risks: [
      {
        title: "Abstimmung mit Straßenbehörde offen",
        owner: "Ordnungsamt",
        mitigation: "Wochenrhythmus für gemeinsame Abnahmen.",
      },
      {
        title: "Ausschreibung verzögert",
        owner: "Vergabestelle",
        mitigation: "Losverfahren vereinfacht.",
      },
    ],
  };

  const variantB: DemoMandate = {
    ...demoMandate,
    id: "demo-mandate-003",
    title: "Digitale Verwaltungsservices ohne Medienbruch",
    region: "Hamburg - Stadt",
    status: "aktiv",
    summary:
      "Mandat zur verbindlichen Ende-zu-Ende-Digitalisierung von Kernleistungen inklusive Service-Level.",
    lastUpdated: "2025-08-02",
    impact: [
      { label: "Bearbeitungszeit", value: "-21 %", trend: "seit Rollout Welle 1" },
      { label: "Online-Anträge", value: "64 %", trend: "Anteil Q3" },
      { label: "Nutzerzufriedenheit", value: "+9 pp", trend: "Befragung August 2025" },
    ],
    risks: [
      {
        title: "Schnittstellen nicht einheitlich",
        owner: "IT-Leitstelle",
        mitigation: "API-Standard bis Quartalsende verbindlich.",
      },
      {
        title: "Personalschulung verzögert",
        owner: "Personalentwicklung",
        mitigation: "Zusatzslots mit Pflichtteilnahme.",
      },
    ],
  };

  const variantC: DemoMandate = {
    ...demoMandate,
    id: "demo-mandate-004",
    title: "Kommunale Wärmenetz-Modernisierung",
    region: "Bayern - Kommune",
    status: "abgeschlossen",
    summary:
      "Mandat zur Modernisierung kommunaler Wärmenetze mit Fokus auf Versorgungssicherheit und Preisstabilität.",
    lastUpdated: "2025-06-10",
    impact: [
      { label: "Versorgungsausfälle", value: "-33 %", trend: "ggü. Vorjahr" },
      { label: "Energieeffizienz", value: "+18 %", trend: "Anlagenmix 2025" },
      { label: "Betriebskosten", value: "-9 %", trend: "Q2 Abschluss" },
    ],
    risks: [
      {
        title: "Folgeinvestitionen nötig",
        owner: "Stadtwerke",
        mitigation: "Mehrjahresplan im Haushalt verankert.",
      },
      {
        title: "Fachkräftebindung",
        owner: "Personalstelle",
        mitigation: "Weiterbildungsbudget dauerhaft gesichert.",
      },
    ],
  };

  return [demoMandate, variantA, variantB, variantC];
}

type MandatSurfaceProps = {
  context: SurfaceContext;
  persona: DemoPersona;
  searchParams?: Record<string, string | string[] | undefined>;
  basePath: string;
};

export async function MandatSurface({
  context,
  persona,
  searchParams,
  basePath,
}: MandatSurfaceProps) {
  const resolved = searchParams ?? {};
  const personaCfg = getDemoPersonaConfig(persona);
  const mandates = buildMandatePool();

  const q = (readStringParam(resolved?.q) ?? "").trim().toLowerCase();
  const region = (readStringParam(resolved?.region) ?? "all").trim();
  const theme = (readStringParam(resolved?.theme) ?? "all").trim();
  const status = (readStringParam(resolved?.status) ?? "all") as MandateStatusFilter;

  const regions = Array.from(new Set(mandates.map((item) => item.region))).sort((a, b) => a.localeCompare(b));
  const themes = Array.from(new Set(mandates.map((item) => inferTheme(item)))).sort((a, b) =>
    a.localeCompare(b),
  );

  const filteredMandates = mandates.filter((mandate) => {
    if (status !== "all" && mandate.status !== status) return false;
    if (region !== "all" && mandate.region !== region) return false;
    if (theme !== "all" && inferTheme(mandate) !== theme) return false;
    if (!q) return true;
    const hay = `${mandate.title} ${mandate.summary} ${mandate.region}`.toLowerCase();
    return hay.includes(q);
  });

  const roleHint =
    persona === "administration"
      ? "Verwaltungsfokus: Zuständigkeit, Umsetzungsgrad, Risikosteuerung."
      : persona === "journalist"
        ? "Journalistischer Fokus: stockende Punkte, Wirkung und offene Risiken."
        : "Bürgerfokus: Was wurde beschlossen und was passiert als nächstes?";

  const openRiskCount = filteredMandates.reduce((sum, mandate) => sum + mandate.risks.length, 0);
  const inProgressCount = filteredMandates.filter((mandate) => mandate.status === "aktiv").length;
  const stalledCount = filteredMandates.filter((mandate) => mandateSignals(mandate).stalled).length;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 space-y-6">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {context.mode === "demo" ? "Demo - Mandat" : "Mandat"}
        </p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">Mandatsraum · {personaCfg.label}</h1>
        <p className="text-sm text-[rgb(var(--muted))]">{roleHint}</p>
        <p className="text-xs text-[rgb(var(--muted))]">
          Statussprache:{" "}
          {DEMO_STATUS_GLOSSARY.filter((item) => ["delegated", "in_review", "confirmed"].includes(item.key))
            .map((item) => item.label)
            .join(" · ")}
          .
        </p>
      </header>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm space-y-3">
        <form method="GET" action={basePath} className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {context.mode === "demo" ? <input type="hidden" name="persona" value={persona} /> : null}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Suche nach Mandat, Region, Risiko..."
            className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
          />
          <select
            name="region"
            defaultValue={region}
            className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
          >
            <option value="all">Region: alle</option>
            {regions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            name="theme"
            defaultValue={theme}
            className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
          >
            <option value="all">Thema: alle</option>
            {themes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={status}
            className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
          >
            <option value="all">Status: alle</option>
            <option value="aktiv">aktiv</option>
            <option value="in Planung">in Planung</option>
            <option value="abgeschlossen">abgeschlossen</option>
          </select>
        </form>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="vog-chip vog-chip--status">Mandate in deiner Region: {region === "all" ? "alle" : region}</span>
          <span className="vog-chip vog-chip--status">Aktiv: {inProgressCount}</span>
          <span className="vog-chip vog-chip--status">Offene Risiken: {openRiskCount}</span>
          <span className="vog-chip vog-chip--status">Stockend: {stalledCount}</span>
          <span className="vog-chip vog-chip--status">Gefiltert: {filteredMandates.length}</span>
        </div>
      </section>

      <section className="grid gap-4">
        {filteredMandates.map((mandate) => {
          const signals = mandateSignals(mandate);
          const primarySignal =
            persona === "journalist"
              ? `Risiko offen: ${signals.riskOpen ? "ja" : "nein"}`
              : persona === "administration"
                ? `Umsetzungsstand: ${signals.running}`
                : `Beschluss zu Umsetzung: ${signals.running}`;
          return (
          <article
            key={mandate.id}
            className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-semibold text-[rgb(var(--fg))]">{mandate.title}</h2>
                <p className="text-sm text-[rgb(var(--muted))]">{mandate.summary}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-[rgb(var(--muted))]">
                <span className="vog-chip vog-chip--status">{mandate.region}</span>
                <span className="vog-chip vog-chip--status">{mandate.status}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="vog-chip vog-chip--active">{primarySignal}</span>
              <span className="vog-chip">{signals.stalled ? "stockt" : "stabil"}</span>
              <span className="vog-chip">{signals.impactVisible ? "Wirkung sichtbar" : "Wirkung offen"}</span>
              <span className="vog-chip">{signals.riskOpen ? "Risiko offen" : "kein offenes Risiko"}</span>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Zuständigkeit</p>
                {mandate.responsibilities.slice(0, 2).map((resp) => (
                  <div key={resp.area} className="text-sm">
                    <p className="font-semibold text-[rgb(var(--fg))]">{resp.area}</p>
                    <p className="text-[rgb(var(--muted))]">{resp.owner}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Umsetzung</p>
                {mandate.timeline.slice(0, 3).map((item) => (
                  <div key={`${mandate.id}-${item.label}`} className="flex items-start justify-between gap-2 text-sm">
                    <div>
                      <p className="font-semibold text-[rgb(var(--fg))]">{item.label}</p>
                      <p className="text-[rgb(var(--muted))]">{new Date(item.date).toLocaleDateString("de-DE")}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(item.status)}`}>
                      {statusLabel(item.status)} · {getDemoStatusLabel(mapTimelineStatusToDemoKey(item.status))}
                    </span>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                  Wirkung & Risiken ({personaCfg.label})
                </p>
                <p className="text-sm text-[rgb(var(--fg))]">
                  Neue Wirkungsdaten: {mandate.impact[0]?.label ?? "—"} {mandate.impact[0]?.value ?? ""}
                </p>
                <p className="text-sm text-[rgb(var(--fg))]">
                  Stockende Punkte: {mandate.risks[0]?.title ?? "Keine offenen Risiken"}
                </p>
              </div>
            </div>
          </article>
          );
        })}
      </section>

      {filteredMandates.length === 0 ? (
        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-6 text-sm text-[rgb(var(--muted))]">
          Keine Mandate für die aktuelle Filterkombination.
        </section>
      ) : null}
    </main>
  );
}
