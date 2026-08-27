import type { Metadata } from "next";
import Link from "next/link";
import FrontendAiTransparencyPanel from "@/features/create/FrontendAiTransparencyPanel";
import { buildRundenFrontendAiTransparencyReadModel } from "@/features/create/frontendAiTransparency";
import { readManualAnlassraumServerDraftForCurrentUser } from "@/features/surfaces/runden/manualAnlassraumServerDraft";
import { readRundenEntryCanonReadModel } from "@/features/surfaces/runden/rundenEntryCanon";
import AnlassraumSetupForm from "./AnlassraumSetupForm";

export const metadata: Metadata = {
  title: "Kostenlose Abstimmung vorbereiten - eDebatte",
  description:
    "Lege eine Abstimmung kostenlos als Entwurf an und entscheide später bewusst über Unterstützung, Prüfung und Sichtbarkeit.",
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
  const initialTemplateId = readParam(resolved?.template) ?? null;
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
              {conversionMode ? "eDebatte Abstimmung" : "eDebatte Mitmachraum"}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[rgb(var(--fg))] md:text-4xl">
              {conversionMode ? "Eigene Abstimmung kostenlos starten" : "Mitmachraum vorbereiten"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[rgb(var(--muted))]">
              {conversionMode
                ? "Lege Frage und Antwortmöglichkeiten fest. Alles bleibt ein Entwurf, bis du es selbst geprüft und bewusst freigegeben hast."
                : "Setze zuerst Thema, Frage und mögliche Antworten. Danach entscheidest du: ohne Voxy weiter oder mit Voxy strukturieren."}
            </p>
          </div>
          <Link
            href={conversionMode ? "/" : "/themen"}
            className="vog-btn-secondary"
          >
            {conversionMode ? "Zurück zur Startseite" : "Zurück zur Themensuche"}
          </Link>
        </div>

        {!conversionMode ? <section
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
            Ein Mitmachraum beginnt als Entwurf für eine Frage, kleine Umfrage oder gemeinsame Klärung. Du kannst direkt weiterarbeiten oder Voxy für Struktur, offene Punkte und nächste Schritte nutzen.
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[rgb(var(--muted))]">
            <li>
              <strong className="text-[rgb(var(--fg))]">Ohne Voxy</strong> speicherst du deinen Stand ohne zusätzliche Ausarbeitung.
            </li>
            <li>
              <strong className="text-[rgb(var(--fg))]">Mit Voxy</strong> werden Thema, Fragen, Zielgruppe und nächste Schritte geordnet.
            </li>
            <li>
              Debatte &amp; Argumente, Beteiligung oder Veröffentlichung entstehen erst nach bewusster Prüfung und Bestätigung.
            </li>
          </ul>
          <p className="mt-3 leading-6 text-[rgb(var(--muted))]">
            So bleibt verständlich, was vorbereitet wurde, was noch offen ist und wobei Menschen konkret aktiv dabei sein können.
          </p>
        </section> : (
          <section className="mx-auto w-full max-w-[78rem] rounded-2xl border border-cyan-300 bg-cyan-50 px-5 py-4 text-sm text-cyan-950 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-50">
            <p className="font-semibold">Kostenlos für kleine Gruppen</p>
            <p className="mt-1 leading-6">Du kannst ohne Registrierung beginnen und den Entwurf lokal sichern. Für eine dauerhafte Freigabe und das Teilen ist anschließend eine Anmeldung erforderlich.</p>
          </section>
        )}

        {conversionMode ? (
          <section className="mx-auto w-full max-w-[78rem] rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-5 py-4 text-sm text-[rgb(var(--muted))]">
            <strong className="text-[rgb(var(--fg))]">Du behältst die Kontrolle.</strong>{" "}
            KI-Unterstützung ist optional, wird gekennzeichnet und veröffentlicht oder entscheidet nichts selbstständig.
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
