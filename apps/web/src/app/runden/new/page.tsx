import type { Metadata } from "next";
import Link from "next/link";
import FrontendAiTransparencyPanel from "@/features/create/FrontendAiTransparencyPanel";
import { buildRundenFrontendAiTransparencyReadModel } from "@/features/create/frontendAiTransparency";
import { readManualAnlassraumServerDraftForCurrentUser } from "@/features/surfaces/runden/manualAnlassraumServerDraft";
import { readRundenEntryCanonReadModel } from "@/features/surfaces/runden/rundenEntryCanon";
import AnlassraumSetupForm from "./AnlassraumSetupForm";

export const metadata: Metadata = {
  title: "Anlassraum manuell starten - eDebatte",
  description:
    "Lege einen Anlassraum zuerst manuell an und entscheide später bewusst über KI, Prüfung und Sichtbarkeit.",
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
  const initialServerDraft = await readManualAnlassraumServerDraftForCurrentUser(
    readParam(resolved?.draftId),
  );
  const entryCanon = readRundenEntryCanonReadModel();
  const frontendAiTransparency = buildRundenFrontendAiTransparencyReadModel(
    entryCanon,
    initialServerDraft,
  );

  return (
    <section className="public-canvas vog-page-stage min-h-screen">
      <main className="public-shell vog-main-shell min-h-screen space-y-8">
        <div className="mx-auto flex w-full max-w-[78rem] flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
              eDebatte Anlassraum
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[rgb(var(--fg))] md:text-4xl">
              Manuell starten
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[rgb(var(--muted))]">
              Rahmen zuerst selbst setzen. KI, Prüfung und weitere Ausarbeitung bleiben optionale nächste Schritte.
            </p>
          </div>
          <Link
            href="/runden"
            className="vog-btn-secondary"
          >
            Zurück zu /runden
          </Link>
        </div>

        <section
          className="mx-auto w-full max-w-[78rem] rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-5 py-4 text-sm text-[rgb(var(--fg))]"
          data-runden-entry-canon="true"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Kanonischer Einstieg heute
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">
            /runden/new startet mit einem wiederaufnehmbaren Entwurf.
          </h2>
          <p className="mt-2 leading-6 text-[rgb(var(--muted))]">
            {entryCanon.firstPersistentRecord.runtimeTruth}
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[rgb(var(--muted))]">
            <li>
              <strong className="text-[rgb(var(--fg))]">Ohne KI speichern</strong> erzeugt zuerst den
              bestehenden serverseitigen Draft plus lokalen Resume-Kontext.
            </li>
            <li>
              <strong className="text-[rgb(var(--fg))]">Mit KI in /create weiter</strong> bereitet nur
              den Wechsel in die vorhandene Analyze-/Planner-Surface vor.
            </li>
            <li>
              Echter Anlassraum, Dossier oder Beteiligungsraum entstehen erst aus bewussten
              Review- und Runtime-Pfaden.
            </li>
          </ul>
          <p className="mt-3 leading-6 text-[rgb(var(--muted))]">
            {entryCanon.reusableSummary.interplay}
          </p>
        </section>

        <div className="mx-auto w-full max-w-[78rem]">
          <FrontendAiTransparencyPanel model={frontendAiTransparency} />
        </div>

        <AnlassraumSetupForm initialServerDraft={initialServerDraft} />
      </main>
    </section>
  );
}
