"use client";

import { useState } from "react";
import { demoMandate } from "@features/mandate/demoMandate";
import { INPUT, TEXTAREA } from "@/lib/ui/inputs";
import { DEMO_CARD, DEMO_MUTED, DEMO_PILL, DEMO_PRIMARY_BUTTON, DEMO_SECONDARY_BUTTON, DEMO_SUBTLE } from "@/lib/ui/demoUi";

const STATUS_STYLES: Record<string, string> = {
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
  planned: "bg-slate-50 text-slate-600 dark:bg-slate-900/50 dark:text-slate-300",
};

const ACTIONS = [
  {
    type: "mandate_update_submit",
    title: "Meilenstein-Update melden",
    description: "Status oder Termin eines Meilensteins aktualisieren.",
    label: "Update melden",
  },
  {
    type: "mandate_risk_submit",
    title: "Risiko melden",
    description: "Risiko oder Blocker an die Redaktion geben.",
    label: "Risiko melden",
  },
  {
    type: "mandate_responsibility_submit",
    title: "Zuständigkeit klären",
    description: "Owner, Partner oder Zuständigkeitsbereich ergänzen.",
    label: "Zuständigkeit klären",
  },
  {
    type: "mandate_impact_submit",
    title: "Wirkungsdaten nachtragen",
    description: "Messwerte, Trends oder Benchmarks hinzufügen.",
    label: "Wirkungsdaten melden",
  },
] as const;

type ActionType = (typeof ACTIONS)[number]["type"];

export default function DemoMandatPage() {
  const [active, setActive] = useState<ActionType | null>(null);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const activeAction = ACTIONS.find((item) => item.type === active) ?? null;

  function openAction(type: ActionType) {
    const item = ACTIONS.find((entry) => entry.type === type);
    setActive(type);
    setTitle(item?.title ?? "");
    setDetails("");
    setSource("");
    setStatus(null);
  }

  function closeAction() {
    setActive(null);
    setStatus(null);
  }

  async function submitAction() {
    if (!activeAction || !title.trim() || !details.trim()) {
      setStatus("Bitte Titel und Beschreibung ausfüllen.");
      return;
    }
    setSending(true);
    setStatus(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setStatus("Demo-Übermittlung gespeichert (Status: offen).");
      setDetails("");
      setSource("");
    } catch (err: any) {
      setStatus(`Fehler: ${String(err?.message ?? err)}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 space-y-6">
      <header className={`${DEMO_CARD} p-6 space-y-3`}>
        <p className={`text-xs font-semibold uppercase tracking-wide ${DEMO_SUBTLE}`}>Demo · Mandat</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{demoMandate.title}</h1>
        <p className={`text-sm ${DEMO_MUTED}`}>{demoMandate.summary}</p>
        <div className={`flex flex-wrap items-center gap-3 text-xs ${DEMO_SUBTLE}`}>
          <span className={DEMO_PILL}>
            {demoMandate.region}
          </span>
          <span>Status: {demoMandate.status}</span>
          <span>Letztes Update: {new Date(demoMandate.lastUpdated).toLocaleDateString("de-DE")}</span>
        </div>
      </header>

      <section className={`${DEMO_CARD} p-5 space-y-4`}>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Was du hier tun kannst</h2>
          <p className={`text-xs ${DEMO_MUTED}`}>
            Das Mandat ist read-only – Updates gehen an die Redaktion und werden geprüft, bevor sie live erscheinen.
          </p>
          <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
            Nächster Schritt: Wähle eine Aktion, um ein Update oder Risiko an die Redaktion zu senden.
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {ACTIONS.map((action) => (
            <div key={action.type} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{action.title}</p>
              <p className={`mt-1 text-xs ${DEMO_MUTED}`}>{action.description}</p>
              <button
                type="button"
                className={`mt-3 ${DEMO_SECONDARY_BUTTON}`}
                onClick={() => openAction(action.type)}
              >
                {action.label}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className={`lg:col-span-2 ${DEMO_CARD} p-5 space-y-3`}>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Timeline & Meilensteine</h2>
          <ol className="space-y-3 text-sm">
            {demoMandate.timeline.map((item, idx) => (
              <li
                key={idx}
                className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40"
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{item.label}</p>
                  <p className={`text-xs ${DEMO_SUBTLE}`}>{new Date(item.date).toLocaleDateString("de-DE")}</p>
                  {item.note && <p className={`text-xs ${DEMO_SUBTLE} mt-1`}>{item.note}</p>}
                </div>
                <span
                  className={`h-fit rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[item.status]}`}
                >
                  {item.status === "done"
                    ? "erledigt"
                    : item.status === "in_progress"
                    ? "läuft"
                    : "geplant"}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className={`${DEMO_CARD} p-5 space-y-3`}>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Wirkung</h2>
          <div className="space-y-3">
            {demoMandate.impact.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40">
                <p className={`text-xs font-semibold uppercase ${DEMO_SUBTLE}`}>{metric.label}</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{metric.value}</p>
                <p className={`text-xs ${DEMO_MUTED}`}>{metric.trend}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className={`${DEMO_CARD} p-5 space-y-3`}>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Zuständigkeiten</h2>
          <div className="space-y-3 text-sm">
            {demoMandate.responsibilities.map((resp) => (
              <div key={resp.area} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-2 dark:border-slate-800 dark:bg-slate-900/40">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{resp.area}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[resp.status]}`}>
                    {resp.status === "done" ? "erledigt" : resp.status === "in_progress" ? "läuft" : "geplant"}
                  </span>
                </div>
                <p className={`text-xs ${DEMO_MUTED}`}>Owner: {resp.owner}</p>
                {resp.partners && resp.partners.length > 0 && (
                  <p className={`text-xs ${DEMO_MUTED}`}>Partner: {resp.partners.join(", ")}</p>
                )}
                <ul className={`list-disc pl-4 text-xs ${DEMO_MUTED}`}>
                  {resp.deliverables.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className={`${DEMO_CARD} p-5 space-y-3`}>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Risiken & offene Punkte</h2>
          <div className="space-y-3 text-sm">
            {demoMandate.risks.map((risk) => (
              <div key={risk.title} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-1 dark:border-slate-800 dark:bg-slate-900/40">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{risk.title}</p>
                <p className={`text-xs ${DEMO_MUTED}`}>Owner: {risk.owner}</p>
                <p className={`text-xs ${DEMO_MUTED}`}>Mitigation: {risk.mitigation}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {activeAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
          onClick={closeAction}
        >
          <div className={`${DEMO_CARD} w-full max-w-lg p-5 space-y-4`} onClick={(event) => event.stopPropagation()}>
            <div className="space-y-1">
              <p className={`text-xs font-semibold uppercase tracking-wide ${DEMO_SUBTLE}`}>Redaktionelles Update</p>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{activeAction.title}</h3>
              <p className={`text-xs ${DEMO_MUTED}`}>{activeAction.description}</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className={`text-xs font-semibold uppercase ${DEMO_SUBTLE}`}>Titel</label>
                <input className={INPUT} value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className={`text-xs font-semibold uppercase ${DEMO_SUBTLE}`}>Beschreibung</label>
                <textarea
                  className={TEXTAREA}
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Was hat sich geändert? Welche Quelle belegt es?"
                />
              </div>
              <div className="space-y-1">
                <label className={`text-xs font-semibold uppercase ${DEMO_SUBTLE}`}>Quelle/Link (optional)</label>
                <input
                  className={INPUT}
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="https://..."
                />
                <p className={`text-[11px] ${DEMO_SUBTLE}`}>Eine URL pro Zeile oder Komma getrennt.</p>
              </div>
            </div>
            {status && <p className={`text-xs ${DEMO_MUTED}`}>{status}</p>}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className={`text-[11px] ${DEMO_SUBTLE}`}>Status Redaktion: offen · jede Änderung wird geprüft</span>
              <div className="flex gap-2">
                <button className={DEMO_SECONDARY_BUTTON} type="button" onClick={closeAction}>
                  Abbrechen
                </button>
                <button className={DEMO_PRIMARY_BUTTON} type="button" onClick={submitAction} disabled={sending}>
                  {sending ? "Sendet …" : "An Redaktion senden"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
