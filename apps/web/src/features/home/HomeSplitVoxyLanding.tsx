import Image from "next/image";
import Link from "next/link";
import type { BucketBlock } from "@/components/landing/ExamplesBackdrop";
import type { StartExperienceModel } from "@/features/start/startExperience";
import { resolveVoxyAsset } from "@/features/voxy/voxyAssets";
import { buildVoxyExperienceShellHint } from "@/features/voxy/voxyExperienceShellContract";

type HomeSplitVoxyLandingProps = {
  blocks?: BucketBlock[];
  experience: StartExperienceModel;
};

type EntryCard = {
  href: string;
  eyebrow: string;
  title: string;
  text: string;
  cta: string;
  gated?: boolean;
};

type SegmentCard = {
  href: string;
  eyebrow: string;
  title: string;
  text: string;
};

const ENTRY_CARDS: readonly EntryCard[] = [
  {
    href: "/themen",
    eyebrow: "Aktuelle Entwicklungen",
    title: "Verstehen, was sich verändert",
    text: "Sieh neue Quellen, Positionen, Entscheidungen und Beteiligungsmöglichkeiten in ihrem Zusammenhang.",
    cta: "Entwicklungen entdecken",
  },
  {
    href: "/create",
    eyebrow: "Eigener Beitrag",
    title: "Beitrag prüfen und strukturieren",
    text: "Bring eine Beobachtung, Frage, Idee oder Quelle ein. Voxy hilft beim Einordnen, ohne automatisch zu veröffentlichen.",
    cta: "Beitrag starten",
    gated: true,
  },
  {
    href: "/swipes",
    eyebrow: "Beteiligung",
    title: "Mitwirken, wo deine Sicht gebraucht wird",
    text: "Prüfe Fragen, Perspektiven und mögliche nächste Schritte – transparent und ohne künstlichen Meinungsdruck.",
    cta: "Offene Beteiligung ansehen",
    gated: true,
  },
  {
    href: "/dossier",
    eyebrow: "Dossiers",
    title: "Fakten, Positionen und offene Fragen verbinden",
    text: "Verfolge, was belegt ist, wo Quellen widersprechen und wie sich ein Debattenstand weiterentwickelt.",
    cta: "Dossiers verstehen",
  },
] as const;

const SEGMENT_CARDS: readonly SegmentCard[] = [
  {
    href: "/account",
    eyebrow: "Für Bürger:innen",
    title: "Relevante Entwicklungen verstehen und mitwirken",
    text: "Folge Themen, Regionen und Beteiligungen. Später siehst du auf einen Blick, was sich seit deinem letzten Besuch wesentlich verändert hat.",
  },
  {
    href: "/account/organization",
    eyebrow: "Für Organisationen, Medien & Kultur",
    title: "Themen, Veranstaltungen, Publikum und Ergebnisse verbinden",
    text: "Bereite Beteiligung, Live-Formate und Dossiers gemeinsam im Team vor – vom Theatergespräch bis zum Medienformat.",
  },
  {
    href: "/account/organization",
    eyebrow: "Für Verwaltung & Behörden",
    title: "Zuständigkeiten, Rückmeldungen und Debattenstände bearbeiten",
    text: "Ordne öffentliche Themen ein, begleite Beteiligungsverfahren und dokumentiere Antworten sowie nächste Schritte nachvollziehbar.",
  },
] as const;

const CHANGE_QUESTIONS = [
  "Was ist neu?",
  "Was ist belegt?",
  "Was bleibt offen?",
  "Wo kannst du mitwirken?",
] as const;

const TRUST_LINE =
  "eDebatte veröffentlicht nichts automatisch. Quellen, Prüfstatus und Beteiligung bleiben nachvollziehbar – du entscheidest den nächsten Schritt.";

const VOXY_LIGHT_HERO_ASSET = resolveVoxyAsset("createGuideLight");
const VOXY_DARK_HERO_ASSET = resolveVoxyAsset("createGuideDark");

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function EntryLinkCard({ href, eyebrow, title, text, cta, gated = false }: EntryCard) {
  return (
    <Link
      href={href}
      data-testid="home-entry-card"
      data-requires-privacy-gate={gated ? "true" : undefined}
      className="group flex h-full min-h-[13rem] flex-col rounded-[1.8rem] border border-[rgba(114,178,236,0.24)] bg-[linear-gradient(150deg,rgba(250,253,255,0.94),rgba(228,243,255,0.88)_52%,rgba(203,230,249,0.78))] px-5 py-5 text-left transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)] dark:border-[rgba(112,180,240,0.16)] dark:bg-[linear-gradient(150deg,rgba(10,24,52,0.92),rgba(13,57,112,0.52)_52%,rgba(7,17,37,0.98))] sm:px-6"
      style={{ boxShadow: "0 20px 48px rgba(29, 88, 150, 0.13)" }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgb(var(--grad-to))]">
        {eyebrow}
      </span>
      <h2 className="mt-4 text-[1.3rem] font-semibold tracking-tight text-[rgb(var(--fg))] sm:text-[1.45rem]">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-[rgb(var(--fg))]/72 sm:text-[15px]">{text}</p>
      <span className="mt-auto pt-6 text-sm font-semibold text-[rgb(var(--grad-to))] transition group-hover:translate-x-0.5">
        {cta} →
      </span>
    </Link>
  );
}

function SegmentLinkCard({ href, eyebrow, title, text }: SegmentCard) {
  return (
    <Link
      href={href}
      className="group rounded-[1.55rem] border border-[rgba(114,178,236,0.18)] bg-[rgba(237,247,255,0.66)] p-5 text-left transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)] dark:border-[rgba(112,180,240,0.14)] dark:bg-[rgba(10,31,66,0.5)]"
      style={{ boxShadow: "0 16px 36px rgba(29, 88, 150, 0.09)" }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--grad-to))]">
        {eyebrow}
      </span>
      <h3 className="mt-3 text-lg font-semibold tracking-tight text-[rgb(var(--fg))]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[rgb(var(--fg))]/70">{text}</p>
      <span className="mt-4 inline-flex text-sm font-semibold text-[rgb(var(--grad-to))]">
        Einstieg ansehen →
      </span>
    </Link>
  );
}

export default function HomeSplitVoxyLanding({
  blocks: _blocks,
  experience,
}: HomeSplitVoxyLandingProps) {
  const isUnknownVisitor = experience.familiarity === "unknown_visitor";
  const heroTitle = isUnknownVisitor
    ? "Verstehen, was sich verändert. Mitreden, wo es zählt."
    : experience.title;
  const heroDescription = isUnknownVisitor
    ? "eDebatte bündelt aktuelle Entwicklungen, Quellen, Positionen und Beteiligungsmöglichkeiten zu nachvollziehbaren Themenständen – von deiner Region bis zur Welt."
    : experience.description;
  const primaryHref = isUnknownVisitor ? "/themen" : "/swipes";
  const primaryLabel = isUnknownVisitor
    ? "Aktuelle Entwicklungen entdecken"
    : "Neu für dich öffnen";

  return (
    <section className="landing-canvas public-canvas public-start-canvas overflow-hidden">
      <div className="landing-shell public-shell public-start-shell !w-full !max-w-[82rem] !gap-0 !px-5 !pb-12 !pt-3 sm:!px-8 sm:!pb-16 lg:!px-10 lg:!pt-6">
        <section className="relative py-8 sm:py-12 lg:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[-22%] top-[-16rem] h-[32rem] rounded-full bg-[radial-gradient(circle,rgba(18,118,255,0.18),transparent_62%)] blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[-10rem] top-[2rem] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(160,223,255,0.32),transparent_62%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(24,207,200,0.16),transparent_66%)]"
          />

          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] lg:items-center lg:gap-14">
            <div className="relative z-[1] max-w-[43rem]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgb(var(--grad-to))]">
                {isUnknownVisitor
                  ? "AKTUELLE THEMEN · QUELLEN · BETEILIGUNG"
                  : experience.eyebrow}
              </p>
              <h1 className="mt-4 max-w-[43rem] text-[2.85rem] font-semibold leading-[1.02] tracking-[-0.05em] text-[rgb(var(--fg))] sm:text-[4.2rem] lg:text-[4.8rem]">
                {heroTitle}
              </h1>
              <p className="mt-6 max-w-[40rem] text-base leading-8 text-[rgb(var(--fg))]/76 sm:text-lg">
                {heroDescription}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href={primaryHref}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(90deg,rgba(24,207,200,0.96),rgba(26,140,255,0.98))] px-6 py-3 text-sm font-semibold text-[rgb(var(--btn-primary-fg))] transition duration-200 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)]"
                  style={{ boxShadow: "0 14px 34px rgba(24, 140, 255, 0.26)" }}
                >
                  {primaryLabel}
                </Link>
                <Link
                  href="/create"
                  data-requires-privacy-gate="true"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[rgba(74,142,204,0.24)] bg-[rgba(235,247,255,0.72)] px-6 py-3 text-sm font-semibold text-[rgb(var(--fg))] transition duration-200 hover:bg-[rgba(222,241,255,0.86)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)] dark:bg-[rgba(15,52,104,0.46)] dark:hover:bg-[rgba(18,65,126,0.58)]"
                >
                  Beitrag prüfen
                </Link>
              </div>

              <div
                className="mt-8 rounded-[1.55rem] border border-[rgba(112,180,240,0.2)] bg-[rgba(238,248,255,0.66)] p-5 dark:border-[rgba(112,180,240,0.14)] dark:bg-[rgba(10,31,66,0.46)]"
                style={{ boxShadow: "0 16px 38px rgba(29, 88, 150, 0.1)" }}
              >
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">
                  Nicht nur die nächste Schlagzeile.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {CHANGE_QUESTIONS.map((question) => (
                    <span
                      key={question}
                      className="rounded-full border border-[rgba(82,154,219,0.18)] bg-[rgba(255,255,255,0.5)] px-3 py-2 text-center text-xs font-semibold text-[rgb(var(--fg))]/76 dark:bg-[rgba(12,41,84,0.42)]"
                    >
                      {question}
                    </span>
                  ))}
                </div>
              </div>

              {!isUnknownVisitor ? (
                <div
                  className="mt-5 rounded-[1.55rem] border border-[rgba(112,180,240,0.18)] bg-[rgba(255,255,255,0.38)] p-5 dark:bg-[rgba(8,28,58,0.4)]"
                  style={{ boxShadow: "0 16px 38px rgba(29, 88, 150, 0.08)" }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--grad-to))]">
                    Dein nächster Schritt
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgb(var(--fg))]/74">
                    {experience.helperText}
                  </p>
                  {experience.workspaceHref ? (
                    <Link
                      href={experience.workspaceHref}
                      className="mt-4 inline-flex text-sm font-semibold text-[rgb(var(--grad-to))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)]"
                    >
                      {experience.workspaceLabel ?? "Arbeitsbereich öffnen"} →
                    </Link>
                  ) : null}
                </div>
              ) : null}

              <p className="mt-6 max-w-[40rem] text-sm leading-7 text-[rgb(var(--fg))]/64 sm:text-[15px]">
                {TRUST_LINE}
              </p>
            </div>

            <aside className="relative mx-auto w-full max-w-[35rem]">
              <div
                className="relative overflow-hidden rounded-[2.4rem] border border-[rgba(112,180,240,0.2)] bg-[linear-gradient(155deg,rgba(248,252,255,0.94),rgba(220,240,255,0.9)_50%,rgba(194,226,248,0.82))] px-6 pb-7 pt-6 dark:border-[rgba(112,180,240,0.16)] dark:bg-[linear-gradient(155deg,rgba(7,18,40,0.94),rgba(11,42,86,0.8)_50%,rgba(6,16,34,0.98))]"
                style={{ boxShadow: "0 30px 72px rgba(29, 88, 150, 0.17)" }}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-[12%] top-[8%] h-[55%] rounded-full bg-[radial-gradient(circle,rgba(47,160,255,0.24),rgba(24,207,200,0.13)_42%,transparent_76%)] blur-3xl"
                />
                <p className="relative z-[2] text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgb(var(--grad-to))]">
                  Mit Voxy
                </p>
                <div className="relative z-[2] mx-auto mt-4 w-full max-w-[13rem]" data-voxy-avatar="">
                  <div className="relative" style={{ aspectRatio: VOXY_LIGHT_HERO_ASSET.aspectRatio }}>
                    <Image
                      alt={VOXY_LIGHT_HERO_ASSET.alt}
                      className="object-contain object-center dark:hidden"
                      fill
                      priority
                      sizes="220px"
                      src={VOXY_LIGHT_HERO_ASSET.candidates[0]}
                    />
                    <Image
                      alt={VOXY_DARK_HERO_ASSET.alt}
                      className="hidden object-contain object-center dark:block"
                      fill
                      priority
                      sizes="220px"
                      src={VOXY_DARK_HERO_ASSET.candidates[0]}
                    />
                  </div>
                </div>
                <div className="relative z-[2] mt-2 text-center">
                  <h2 className="text-2xl font-semibold tracking-tight text-[rgb(var(--fg))]">
                    Relevantes erkennen. Zusammenhänge verstehen.
                  </h2>
                  <p className="mx-auto mt-3 max-w-[28rem] text-sm leading-6 text-[rgb(var(--fg))]/72">
                    Voxy begleitet dich durch eDebatte. Im Hintergrund werden Quellen, Aussagen, Perspektiven und Beteiligungswege getrennt eingeordnet.
                  </p>
                  <p className="mx-auto mt-4 max-w-[28rem] text-xs leading-5 text-[rgb(var(--fg))]/58">
                    {buildVoxyExperienceShellHint("home")}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section aria-labelledby="home-entry-title" className="py-10 sm:py-14">
          <div className="max-w-[47rem]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgb(var(--grad-to))]">
              Dein Einstieg
            </p>
            <h2 id="home-entry-title" className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[rgb(var(--fg))] sm:text-4xl">
              Von der Entwicklung zum nachvollziehbaren nächsten Schritt.
            </h2>
            <p className="mt-4 text-base leading-7 text-[rgb(var(--fg))]/70">
              Lesen, prüfen, mitwirken oder selbst etwas einbringen – alles bleibt Teil desselben Themen-, Dossier- und Beteiligungskosmos.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {ENTRY_CARDS.map((card) => (
              <EntryLinkCard key={card.href} {...card} />
            ))}
          </div>
        </section>

        <section aria-labelledby="home-audience-title" className="py-10 sm:py-14">
          <div className="max-w-[50rem]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgb(var(--grad-to))]">
              Ein System, unterschiedliche Aufgaben
            </p>
            <h2 id="home-audience-title" className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[rgb(var(--fg))] sm:text-4xl">
              Für Bürger, Organisationen, Medien, Kultur und Verwaltung.
            </h2>
            <p className="mt-4 text-base leading-7 text-[rgb(var(--fg))]/70">
              Die Oberfläche passt sich dem Auftrag an. Quellen, Dossiers, Beteiligung und Prüfregeln bleiben dieselbe gemeinsame Infrastruktur.
            </p>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {SEGMENT_CARDS.map((card) => (
              <SegmentLinkCard key={`${card.eyebrow}-${card.title}`} {...card} />
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
