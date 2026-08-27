import type { Metadata } from "next";
import Link from "next/link";
import FrontendAiTransparencyPanel from "@/features/create/FrontendAiTransparencyPanel";
import { buildRundenFrontendAiTransparencyReadModel } from "@/features/create/frontendAiTransparency";
import { readManualAnlassraumServerDraftForCurrentUser } from "@/features/surfaces/runden/manualAnlassraumServerDraft";
import { readRundenEntryCanonReadModel } from "@/features/surfaces/runden/rundenEntryCanon";
import AnlassraumSetupForm from "./AnlassraumSetupForm";
import GuidedBallotStart from "./GuidedBallotStart";

export const metadata: Metadata = {
  title: "Kostenlose Abstimmung starten - eDebatte",
  description:
    "Stelle eine Frage, lege Antworten fest und bereite deine Abstimmung in wenigen Schritten vor.",
};

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

function readParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function RundenManualCreatePage(props: {
  searchParams?: SearchParamsShape;
}) {
  const resolved = props.searchParams ? await props.searchParams : undefined;
  const conversionMode = readParam(resolved?.gtm) === "1";
  const detailsMode = readParam(resolved?.details) === "1";
  const initialTemplateId = readParam(resolved?.template) ?? null;
  const initialServerDraft = await readManualAnlassraumServerDraftForCurrentUser(
    readParam(resolved?.draftId),
  );
  const showGuidedStart = conversionMode && !detailsMode && !initialServerDraft;
  const entryCanon = readRundenEntryCanonReadModel();
  const frontendAiTransparency = buildRundenFrontendAiTransparencyReadModel(
    entryCanon,
    initialServerDraft,
  );

  if (showGuidedStart) {
    return (
      <section className="public-canvas vog-page-stage min-h-screen">
        <main className="public-shell vog-main-shell min-h-screen">
          <div className="mx-auto mb-7 flex w-full max-w-3xl items-center justify-between gap-3">
            <Link href="/" className="text-sm font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">
              ← eDebatte
            </Link>
            <span className="rounded-full border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-900 dark:border-cyan-400/30 dark:bg-cyan-950/25 dark:text-cyan-100">
              Kostenlos starten
            </span>
          </div>
          <GuidedBallotStart initialTemplateId={initialTemplateId} />
        </main>
      </section>
    );
  }

  return (
    <section className="public-canvas vog-page-stage min-h-screen">
      <main className="public-shell vog-main-shell min-h-screen space-y-8">
        <div className="mx-auto flex w-full max-w-[78rem] flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
              {conversionMode ? "Deine Abstimmung · Feinschliff" : "eDebatte Mitmachraum"}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[rgb(var(--fg))] md:text-4xl">
              {conversionMode ? "Prüfen und freigeben" : "Mitmachraum vorbereiten"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[rgb(var(--muted))]">
              {conversionMode
                ? "Deine Frage und Antworten sind vorbereitet. Hier kannst du nur noch Details, Sichtbarkeit und optionale Unterstützung festlegen."
                : "Setze zuerst Thema, Frage und mögliche Antworten. Danach entscheidest du: ohne Voxy weiter oder mit Voxy strukturieren."}
            </p>
          </div>
          <Link href={conversionMode ? "/?from=create" : "/themen"} className="vog-btn-secondary">
            {conversionMode ? "Zur Startseite" : "Zurück zur Themensuche"}
          </Link>
        </div>

        {!conversionMode ? (
          <section
            className="mx-auto w-full max-w-[78rem] rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-5 py-4 text-sm text-[rgb(var(--fg))]"
            data-runden-entry-canon="true"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">So funktioniert der Start</p>
            <h2 className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">Erst festhalten, dann sortieren, dann gemeinsam klären.</h2>
            <p className="mt-2 leading-6 text-[rgb(var(--muted))]">Ein Mitmachraum beginnt als Entwurf. Veröffentlichung oder Beteiligung entstehen erst nach bewusster Prüfung.</p>
          </section>
        ) : (
          <section className="mx-auto w-full max-w-[78rem] rounded-2xl border border-cyan-300 bg-cyan-50 px-5 py-4 text-sm text-cyan-950 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-50">
            <p className="font-semibold">Der Schnellstart ist erledigt.</p>
            <p className="mt-1 leading-6">Du kannst den vorbereiteten Stand jetzt prüfen. Eigene Antwortvorschläge bleiben – wenn ausgewählt – prüfpflichtig und gehen nicht automatisch online.</p>
          </section>
        )}

        {conversionMode ? (
          <section className="mx-auto w-full max-w-[78rem] rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-5 py-4 text-sm text-[rgb(var(--muted))]">
            <strong className="text-[rgb(var(--fg))]">Nur wenn du mehr brauchst:</strong>{" "}
            Sichtbarkeit, KI-Unterstützung und weitere Einstellungen liegen hier bewusst hinter dem einfachen Schnellstart.
          </section>
        ) : (
          <div className="mx-auto w-full max-w-[78rem]">
            <FrontendAiTransparencyPanel model={frontendAiTransparency} />
          </div>
        )}

        <AnlassraumSetupForm
          conversionMode={conversionMode}
          initialServerDraft={initialServerDraft}
          initialTemplateId={initialTemplateId}
        />
      </main>
    </section>
  );
}
