import Link from "next/link";
import type { RegionPublicationVisibilityState } from "@features/region";
import { buildB2GPublicReadingHint } from "@/features/agenticRuntime/b2gFirstLoginJurisdictionCockpitHints";
import { buildMunicipalHandoffTrialPublicReadingHint } from "@/features/agenticRuntime/municipalHandoffThreeAdoptionTrialContract";
import { buildPublicReadingGuardrailLines } from "@/features/agenticRuntime/segmentedAgentExperienceContract";
import RundenPublicInputPanel from "./RundenPublicInputPanel";

const PUBLIC_CREATE_HREF =
  "/create?mode=source&intent=contribution&source=runden&reason=public_anlassraum_input";

const VISIBILITY_GUIDE: ReadonlyArray<{
  state: Extract<
    RegionPublicationVisibilityState,
    | "public_unverified"
    | "internal_review"
    | "public_reviewed"
    | "public_official"
    | "archived"
    | "blocked"
  >;
  label: string;
  hint: string;
}> = [
  {
    state: "public_unverified",
    label: "als Vorschlag sichtbar",
    hint: "sichtbar, aber nicht geprüft",
  },
  {
    state: "internal_review",
    label: "in Prüfung",
    hint: "noch nicht öffentlich, bis ein Mensch geprüft hat",
  },
  {
    state: "public_reviewed",
    label: "veröffentlicht",
    hint: "sichtbar nach Prüfung, aber nicht automatisch amtlich",
  },
  {
    state: "public_official",
    label: "veröffentlicht",
    hint: "nur nach expliziter Freigabe durch verifizierte Rollen",
  },
  {
    state: "archived",
    label: "archiviert",
    hint: "nicht mehr als aktiver öffentlicher Anlass sichtbar, aber nachvollziehbar dokumentiert",
  },
  {
    state: "blocked",
    label: "blockiert",
    hint: "nicht sichtbar, wenn Inhalte gegen Regeln oder Schutzinteressen verstoßen",
  },
] as const;

const INPUT_KINDS: ReadonlyArray<{
  title: string;
  body: string;
}> = [
  {
    title: "Frage",
    body: "Eine offene Rückfrage, die im Themenraum gesammelt und weiterbearbeitet werden soll.",
  },
  {
    title: "Quelle",
    body: "Ein Link, Dokument oder Hinweis auf Material, das für das Thema relevant sein kann.",
  },
  {
    title: "Perspektive",
    body: "Eine Einordnung, Gegenposition oder Erfahrung aus dem lokalen Kontext.",
  },
  {
    title: "Option",
    body: "Ein Vorschlag, wie mit dem Anlass praktisch weitergearbeitet oder entschieden werden könnte.",
  },
  {
    title: "Hinweis",
    body: "Ein kurzer Sachhinweis, der sichtbar werden kann oder zuerst in Prüfung geht.",
  },
] as const;

function visibilityAccent(
  state: (typeof VISIBILITY_GUIDE)[number]["state"],
): string {
  if (state === "public_unverified") return "border-amber-300/70 bg-amber-50 text-amber-900";
  if (state === "internal_review") return "border-slate-300/80 bg-slate-100 text-slate-900";
  if (state === "public_reviewed") return "border-emerald-300/70 bg-emerald-50 text-emerald-900";
  if (state === "public_official") return "border-sky-300/70 bg-sky-50 text-sky-900";
  if (state === "archived") return "border-stone-300/80 bg-stone-100 text-stone-900";
  return "border-rose-300/70 bg-rose-50 text-rose-900";
}

export default function RundenPublicSharingGuide(props: {
  featuredAnlassraumId?: string | null;
  featuredAnlassraumTitle?: string | null;
}) {
  const publicReadingGuardrails = buildPublicReadingGuardrailLines();
  return (
    <section className="grid gap-4">
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-2xl border bg-[rgb(var(--card))] p-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
              Öffentlicher Gesprächsraum
            </p>
            <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">
              Anlassraum = öffentlicher Gesprächsraum
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
              Hier sammeln wir Fragen, Perspektiven, Quellen, Optionen und Hinweise zu einem
              konkreten Anlass. Ein Dossier bleibt die strukturierte Fakten- und
              Arbeitsgrundlage.
            </p>
            <p className="max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
              Sichtbar heißt nicht automatisch geprüft oder amtlich. Dossier/Faktenstatus
              bleibt in Prüfung. Amtliche Antworten nur durch verifizierte Rollen.
            </p>
            <p className="max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
              {publicReadingGuardrails[0]} {publicReadingGuardrails[1]}
            </p>
            <p className="max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
              {buildB2GPublicReadingHint()}
            </p>
            <p className="max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
              {buildMunicipalHandoffTrialPublicReadingHint()}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <article className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Teilen und QR</h3>
              <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                Teile diesen Anlassraum mit Nachbarn, Freunden oder deiner Initiative.
              </p>
              <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                Nutze den QR-Code für Bürgerdialoge, Veranstaltungen oder Workshops.
              </p>
              <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                Link und QR gehören nur zu sichtbaren Anlässen. Wenn Sichtbarkeit zurückgenommen
                oder archiviert wird, verschwindet dieser öffentliche Pfad wieder.
              </p>
            </article>

            <article className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">
                Für Veranstaltungen nutzen
              </h3>
              <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                Teilnehmende können per Smartphone Fragen, Quellen und Perspektiven einreichen.
              </p>
              <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                So bleibt ein Bürgerdialog auch nach der Veranstaltung als Arbeitsstand
                weiterführbar.
              </p>
            </article>

            <article className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">
                Für Artikel oder Berichte nutzen
              </h3>
              <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                Ein Artikel oder Beitrag kann hier weitergeführt werden: mit Fragen, Quellen,
                Gegenpositionen und Beteiligung.
              </p>
              <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                Beiträge werden nach Sichtbarkeits- und Prüfregeln verarbeitet.
              </p>
            </article>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={PUBLIC_CREATE_HREF}
              className="inline-flex items-center justify-center rounded-lg bg-[rgb(var(--grad-from))] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Beitrag vorbereiten
            </Link>
            <Link
              href="/runden/demo"
              className="inline-flex items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition hover:bg-[rgb(var(--card))]"
            >
              Anlassraum-Logik ansehen
            </Link>
          </div>

          <p className="text-xs text-[rgb(var(--muted))]">
            Keine automatische amtliche Antwort. Keine automatische Dossier- oder
            Anlassraum-Finalisierung.
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border bg-[rgb(var(--card))] p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
              Beteiligungssignale
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">
              Was Menschen hier einreichen können
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {INPUT_KINDS.map((kind) => (
              <article
                key={kind.title}
                className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
              >
                <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">{kind.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{kind.body}</p>
              </article>
            ))}
          </div>

          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
            <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">
              Sichtbarkeits- und Prüfregeln
            </h3>
            <div className="mt-3 space-y-3">
              {VISIBILITY_GUIDE.map((entry) => (
                <div
                  key={entry.state}
                  className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${visibilityAccent(entry.state)}`}
                    >
                      {entry.label}
                    </span>
                    <span className="text-xs text-[rgb(var(--muted))]">{entry.state}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{entry.hint}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 text-sm leading-6 text-[rgb(var(--muted))]">
              <p>
                Nur intern sichtbare Beiträge bleiben intern. Pausiert, archiviert und geschlossen zeigen ehrliche öffentliche Zustände,
                aber keinen aktiven Teilnahmelink.
              </p>
            </div>
          </div>
        </div>
      </div>

      <RundenPublicInputPanel
        anlassraumId={props.featuredAnlassraumId ?? null}
        anlassraumTitle={props.featuredAnlassraumTitle ?? null}
      />
    </section>
  );
}
