import type { Metadata } from "next";
import Link from "next/link";
import FrontendAiTransparencyPanel from "@/features/create/FrontendAiTransparencyPanel";
import { buildRundenFrontendAiTransparencyReadModel } from "@/features/create/frontendAiTransparency";
import { readManualAnlassraumServerDraftForCurrentUser } from "@/features/surfaces/runden/manualAnlassraumServerDraft";
import { readRundenEntryCanonReadModel } from "@/features/surfaces/runden/rundenEntryCanon";
import AnlassraumSetupForm from "./AnlassraumSetupForm";

export const metadata: Metadata = {
  title: "Mitmachraum vorbereiten - eDebatte",
  description:
    "Lege einen Mitmachraum zuerst als Entwurf an und entscheide später bewusst über Voxy, Prüfung und Sichtbarkeit.",
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
              eDebatte Mitmachraum
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[rgb(var(--fg))] md:text-4xl">
              Mitmachraum vorbereiten
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[rgb(var(--muted))]">
              Setze zuerst Thema, Frage und mögliche Antworten. Voxy kann danach drüberschauen – aber du entscheidest jeden nächsten Schritt.
            </p>
          </div>
          <Link
            href="/runden"
            className="vog-btn-secondary"
          >
            Zurück zum Themenüberblick
          </Link>
        </div>

        <section
          className="mx-auto w-full max-w-[78rem] rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-5 py-4 text-sm text-[rgb(var(--fg))]"
          data-runden-entry-canon="true"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            So funktioniert der Start
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">
            Erst festhalten, dann sortieren, dann gemeinsam klären.
          </h2>
          <p className="mt-2 leading-6 text-[rgb(var(--muted))]">
            Ein Mitmachraum beginnt als Entwurf für eine Frage, kleine Umfrage oder gemeinsame Klärung. Du kannst direkt weiterarbeiten oder Voxy bitten, Struktur, offene Punkte und nächste Schritte zu prüfen.
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[rgb(var(--muted))]">
            <li>
              <strong className="text-[rgb(var(--fg))]">Direkt bearbeiten</strong> speichert deinen Stand ohne zusätzliche Ausarbeitung.
            </li>
            <li>
              <strong className="text-[rgb(var(--fg))]">Voxy drüberschauen lassen</strong> hilft beim Ordnen von Thema, Fragen, Zielgruppe und nächsten Schritten.
            </li>
            <li>
              Themen-Zusammenfassung, Beteiligung oder Veröffentlichung entstehen erst nach bewusster Prüfung und Bestätigung.
            </li>
          </ul>
          <p className="mt-3 leading-6 text-[rgb(var(--muted))]">
            So bleibt verständlich, was vorbereitet wurde, was noch offen ist und wobei Menschen konkret mitmachen können.
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
