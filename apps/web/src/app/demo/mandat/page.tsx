"use client";

import { useMemo, useState } from "react";
import { demoMandate } from "@features/mandate/demoMandate";

const STATUS_STYLES: Record<string, string> = {
  done: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-amber-100 text-amber-700",
  planned: "bg-[rgb(var(--bg))] text-[rgb(var(--muted))]",
};

type PersonaFocus = "citizen" | "journalist" | "administration";

function statusLabel(status: "done" | "in_progress" | "planned") {
  if (status === "done") return "erledigt";
  if (status === "in_progress") return "laeuft";
  return "geplant";
}

function themeForArea(area: string) {
  const value = area.toLowerCase();
  if (value.includes("daten") || value.includes("monitoring")) return "Digitales";
  if (value.includes("sanierung") || value.includes("bau")) return "Bauen";
  if (value.includes("klima") || value.includes("energie")) return "Energie";
  return "Verwaltung";
}

export default function DemoMandatPage() {
  const [statusFilter, setStatusFilter] = useState<"all" | "done" | "in_progress" | "planned">("all");
  const [themeFilter, setThemeFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [focus, setFocus] = useState<PersonaFocus>("citizen");

  const themes = useMemo(
    () => Array.from(new Set(demoMandate.responsibilities.map((item) => themeForArea(item.area)))),
    [],
  );

  const filteredResponsibilities = useMemo(() => {
    return demoMandate.responsibilities.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (themeFilter !== "all" && themeForArea(item.area) !== themeFilter) return false;
      if (regionFilter !== "all" && demoMandate.region !== regionFilter) return false;
      return true;
    });
  }, [regionFilter, statusFilter, themeFilter]);

  const filteredTimeline = useMemo(() => {
    return demoMandate.timeline.filter((item) => (statusFilter === "all" ? true : item.status === statusFilter));
  }, [statusFilter]);

  const relevantRisks = useMemo(() => {
    if (focus === "citizen") return demoMandate.risks;
    if (focus === "journalist") return demoMandate.risks.slice(0, 2);
    return demoMandate.risks;
  }, [focus]);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 space-y-6">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Demo - Mandat</p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">{demoMandate.title}</h1>
        <p className="text-sm text-[rgb(var(--muted))]">{demoMandate.summary}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-[rgb(var(--muted))]">
          <span className="rounded-full bg-[rgb(var(--bg))] px-3 py-1 font-semibold text-[rgb(var(--muted))]">
            {demoMandate.region}
          </span>
          <span>Status: {demoMandate.status}</span>
          <span>Letztes Update: {new Date(demoMandate.lastUpdated).toLocaleDateString("de-DE")}</span>
        </div>
      </header>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
        <div className="grid gap-3 md:grid-cols-4">
          <select
            value={regionFilter}
            onChange={(event) => setRegionFilter(event.target.value)}
            className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
          >
            <option value="all">Region: alle</option>
            <option value={demoMandate.region}>{demoMandate.region}</option>
          </select>
          <select
            value={themeFilter}
            onChange={(event) => setThemeFilter(event.target.value)}
            className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
          >
            <option value="all">Thema: alle</option>
            {themes.map((theme) => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | "done" | "in_progress" | "planned")}
            className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
          >
            <option value="all">Status: alle</option>
            <option value="done">erledigt</option>
            <option value="in_progress">laeuft</option>
            <option value="planned">geplant</option>
          </select>
          <select
            value={focus}
            onChange={(event) => setFocus(event.target.value as PersonaFocus)}
            className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
          >
            <option value="citizen">Fokus: Buerger</option>
            <option value="journalist">Fokus: Journalismus</option>
            <option value="administration">Fokus: Verwaltung</option>
          </select>
        </div>
        <div className="text-xs text-[rgb(var(--muted))]">
          {focus === "journalist"
            ? "Journalistischer Fokus: stockende Mandate, offene Risiken, neue Wirkungsdaten."
            : focus === "administration"
              ? "Verwaltungsfokus: Zustaendigkeiten, Umsetzungsgrad, Wirkung, Risiken."
              : "Buergerfokus: was aendert sich konkret vor Ort und bis wann."}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Timeline & Meilensteine</h2>
          <ol className="space-y-3 text-sm">
            {filteredTimeline.map((item, idx) => (
              <li
                key={idx}
                className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-[rgb(var(--fg))]">{item.label}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{new Date(item.date).toLocaleDateString("de-DE")}</p>
                  {item.note ? <p className="mt-1 text-xs text-[rgb(var(--muted))]">{item.note}</p> : null}
                </div>
                <span className={`h-fit rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[item.status]}`}>
                  {statusLabel(item.status)}
                </span>
              </li>
            ))}
          </ol>
          {!filteredTimeline.length ? (
            <p className="text-sm text-[rgb(var(--muted))]">Keine Timeline-Eintraege fuer den Filter.</p>
          ) : null}
        </div>

        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Wirkung</h2>
          <div className="space-y-3">
            {demoMandate.impact.map((metric) => (
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
            {filteredResponsibilities.map((resp) => (
              <div key={resp.area} className="space-y-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-[rgb(var(--fg))]">{resp.area}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[resp.status]}`}>
                    {statusLabel(resp.status)}
                  </span>
                </div>
                <p className="text-xs text-[rgb(var(--muted))]">Owner: {resp.owner}</p>
                {resp.partners?.length ? (
                  <p className="text-xs text-[rgb(var(--muted))]">Partner: {resp.partners.join(", ")}</p>
                ) : null}
                <p className="text-xs text-[rgb(var(--muted))]">Thema: {themeForArea(resp.area)}</p>
                <ul className="list-disc pl-4 text-xs text-[rgb(var(--muted))]">
                  {resp.deliverables.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {!filteredResponsibilities.length ? (
            <p className="text-sm text-[rgb(var(--muted))]">Keine Zustaendigkeiten fuer den Filter.</p>
          ) : null}
        </div>

        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Risiken & offene Punkte</h2>
          <div className="space-y-3 text-sm">
            {relevantRisks.map((risk) => (
              <div key={risk.title} className="space-y-1 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
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
