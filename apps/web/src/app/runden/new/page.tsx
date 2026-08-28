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
  description: "Stelle eine Frage, lege Antworten fest und bereite deine Abstimmung in wenigen Schritten vor.",
};

type SearchParamsShape = Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RundenManualCreatePage(props: { searchParams?: SearchParamsShape }) {
  const resolved = props.searchParams ? await props.searchParams : undefined;
  const conversionMode = readParam(resolved?.gtm) === "1";
  const detailsMode = readParam(resolved?.details) === "1";
  const initialTemplateId = readParam(resolved?.template) ?? null;
  const initialServerDraft = await readManualAnlassraumServerDraftForCurrentUser(readParam(resolved?.draftId));
  const showGuidedStart = conversionMode && !detailsMode && !initialServerDraft;
  const entryCanon = readRundenEntryCanonReadModel();
  const frontendAiTransparency = buildRundenFrontendAiTransparencyReadModel(entryCanon, initialServerDraft);

  if (showGuidedStart) {
    return (
      <section className="public-canvas vog-page-stage min-h-screen">
        <main className="public-shell vog-main-shell min-h-screen">
          <div className="mx-auto mb-10 flex w-full max-w-3xl items-center justify-between gap-3">
            <Link href="/" className="text-sm font-bold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">← eDebatte</Link>
            <span className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">Kostenlos starten</span>
          </div>
          <GuidedBallotStart initialTemplateId={initialTemplateId} />
        </main>
      </section>
    );
  }

  return (
    <section className="public-canvas vog-page-stage min-h-screen">
      <main className="public-shell vog-main-shell min-h-screen space-y-6">
        {conversionMode ? (
          <div className="mx-auto w-full max-w-[78rem] border-b border-[rgb(var(--border))] pb-5">
            <Link href="/runden/new?gtm=1" className="text-sm font-bold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">← Zur einfachen Ansicht</Link>
            <div className="mt-5 max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">Optionale Einstellungen</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[rgb(var(--fg))] md:text-4xl">Nur ändern, was du wirklich brauchst.</h1>
              <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">Deine Frage und Antworten stehen bereits. Alles darunter ist Zusatz: Sichtbarkeit, Prüfung, KI-Unterstützung oder spätere Weiterbearbeitung. Für eine einfache Abstimmung musst du hier nichts neu erfinden.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mx-auto flex w-full max-w-[78rem] flex-wrap items-center justify-between gap-3">
              <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">eDebatte Mitmachraum</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-[rgb(var(--fg))] md:text-4xl">Mitmachraum vorbereiten</h1></div>
              <Link href="/themen" className="vog-btn-secondary">Zurück zur Themensuche</Link>
            </div>
            <div className="mx-auto w-full max-w-[78rem]"><FrontendAiTransparencyPanel model={frontendAiTransparency} /></div>
          </>
        )}

        <AnlassraumSetupForm conversionMode={conversionMode} initialServerDraft={initialServerDraft} initialTemplateId={initialTemplateId} />
      </main>
    </section>
  );
}
