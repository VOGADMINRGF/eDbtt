import Image from "next/image";
import Link from "next/link";
import type { BucketBlock } from "@/components/landing/ExamplesBackdrop";
import type { StartExperienceModel } from "@/features/start/startExperience";

type HomeSplitVoxyLandingProps = {
  blocks?: BucketBlock[];
  experience: StartExperienceModel;
};

type PrimaryCard = {
  href: string;
  title: string;
  text: string;
  cta: string;
  badge: string;
  gated?: boolean;
};

type SupportCard = {
  href: string;
  title: string;
  text: string;
};

const PRIMARY_CARDS: readonly PrimaryCard[] = [
  {
    href: "/create",
    title: "Etwas beitragen",
    text: "Schreib, was dich bewegt. Voxy hilft beim Einordnen.",
    cta: "Beitrag starten",
    badge: "Beitrag einbringen",
    gated: true,
  },
  {
    href: "/swipes",
    title: "Abstimmen & mitmachen",
    text: "Bewerte Themen, Sichtweisen oder Fragen in wenigen Sekunden.",
    cta: "Mitmachen",
    badge: "Abstimmen",
    gated: true,
  },
] as const;

const PUBLIC_SUPPORT_CARDS: readonly SupportCard[] = [
  {
    href: "/themen",
    title: "Themen ansehen",
    text: "Sieh, welche Fragen und Sichtweisen schon sichtbar sind.",
  },
  {
    href: "/dossier",
    title: "Debatte & Argumente",
    text: "Öffne Dossiers und den aktuellen Debattenstand.",
  },
] as const;

const VOXY_HINTS = [
  "Bring ein, was gesehen werden sollte.",
  "Oder stimme ab, wo deine Sicht gebraucht wird.",
  "Nichts wird automatisch veröffentlicht.",
] as const;

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function PrimaryEntryCard({ href, title, text, cta, badge, gated = false }: PrimaryCard) {
  return (
    <Link
      href={href}
      data-testid="home-split-primary-card"
      data-requires-privacy-gate={gated ? "true" : undefined}
      className="group flex h-full flex-col rounded-[1.75rem] border border-[rgba(var(--fg),0.12)] bg-[linear-gradient(180deg,rgba(8,15,38,0.94),rgba(8,18,48,0.82))] p-6 transition duration-200 hover:-translate-y-1 hover:border-[rgba(var(--grad-to),0.38)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)] sm:p-7"
    >
      <span className="inline-flex w-fit rounded-full border border-[rgba(var(--grad-to),0.26)] bg-[rgba(var(--grad-to),0.12)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--grad-to))]">
        {badge}
      </span>
      <h2 className="mt-5 text-2xl font-semibold tracking-tight text-[rgb(var(--fg))] sm:text-[2rem]">
        {title}
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-7 text-[rgb(var(--fg))]/78 sm:text-base">
        {text}
      </p>
      <span className="mt-6 inline-flex w-fit items-center rounded-full border border-[rgba(var(--fg),0.14)] bg-[rgba(var(--fg),0.06)] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition duration-200 group-hover:border-[rgba(var(--grad-to),0.34)] group-hover:text-[rgb(var(--grad-to))]">
        {cta}
      </span>
    </Link>
  );
}

function SupportLinkCard({ href, title, text }: SupportCard) {
  return (
    <Link
      href={href}
      className="rounded-[1.35rem] border border-[rgba(var(--fg),0.1)] bg-[rgba(8,15,36,0.56)] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[rgba(var(--grad-to),0.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)]"
    >
      <p className="text-sm font-semibold text-[rgb(var(--fg))]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[rgb(var(--fg))]/72">{text}</p>
    </Link>
  );
}

export default function HomeSplitVoxyLanding({
  blocks: _blocks,
  experience,
}: HomeSplitVoxyLandingProps) {
  const isUnknownVisitor = experience.familiarity === "unknown_visitor";
  const supportCards = isUnknownVisitor
    ? PUBLIC_SUPPORT_CARDS
    : [
        ...(experience.workspaceHref
          ? [
              {
                href: experience.workspaceHref,
                title: experience.workspaceLabel ?? "Arbeitsbereich öffnen",
                text: experience.helperText,
              },
            ]
          : []),
        ...PUBLIC_SUPPORT_CARDS,
      ];

  return (
    <section className="landing-canvas public-canvas public-start-canvas">
      <div className="landing-shell public-shell public-start-shell">
        <section className="relative overflow-hidden rounded-[2rem] border border-[rgba(var(--fg),0.08)] bg-[linear-gradient(135deg,rgba(4,10,30,0.98),rgba(7,18,48,0.94)_48%,rgba(10,40,102,0.9))] px-5 py-6 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[-10%] top-[-12rem] h-[26rem] rounded-full bg-[radial-gradient(circle,rgba(var(--grad-to),0.16),transparent_66%)] blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[-10rem] right-[-8rem] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(130,180,255,0.22),transparent_62%)] blur-3xl"
          />

          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.04fr)_minmax(320px,0.96fr)] lg:items-center">
            <div className="space-y-5">
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgb(var(--grad-to))]">
                  {isUnknownVisitor ? "Klarer Einstieg" : experience.eyebrow}
                </p>
                <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-[rgb(var(--fg))] sm:text-5xl lg:text-6xl">
                  {isUnknownVisitor ? "Was bewegt dich?" : experience.title}
                </h2>
                <p className="max-w-2xl text-base leading-8 text-[rgb(var(--fg))]/76 sm:text-lg">
                  {isUnknownVisitor
                    ? "Bring ein Thema ein oder stimme ab, wo deine Sicht gebraucht wird. Voxy hilft beim Sortieren. Veröffentlicht wird nichts ohne Prüfung."
                    : experience.description}
                </p>
              </div>

              {!isUnknownVisitor && experience.workspaceHref ? (
                <div className="rounded-[1.35rem] border border-[rgba(var(--fg),0.1)] bg-[rgba(8,15,36,0.52)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
                    Schon dabei?
                  </p>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-[rgb(var(--fg))]/78">
                    {experience.helperText}
                  </p>
                  <Link
                    href={experience.workspaceHref}
                    className="mt-4 inline-flex items-center rounded-full border border-[rgba(var(--fg),0.14)] bg-[rgba(var(--fg),0.06)] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition duration-200 hover:border-[rgba(var(--grad-to),0.34)] hover:text-[rgb(var(--grad-to))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)]"
                  >
                    {experience.workspaceLabel ?? "Arbeitsbereich öffnen"}
                  </Link>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2.5">
                <span className="rounded-full border border-[rgba(var(--fg),0.12)] bg-[rgba(var(--fg),0.06)] px-3 py-1.5 text-xs font-medium text-[rgb(var(--fg))]/78">
                  Nichts wird automatisch veröffentlicht.
                </span>
                <span className="rounded-full border border-[rgba(var(--fg),0.12)] bg-[rgba(var(--fg),0.06)] px-3 py-1.5 text-xs font-medium text-[rgb(var(--fg))]/78">
                  Voxy hilft beim Sortieren.
                </span>
              </div>
            </div>

            <aside className="order-first lg:order-none">
              <div className="rounded-[1.8rem] border border-[rgba(var(--fg),0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--grad-to))]">
                      Mit Voxy
                    </p>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-[rgb(var(--fg))]/78">
                      Schreib, was dich bewegt. Voxy hilft beim Sortieren, bevor du den nächsten Schritt auswählst.
                    </p>
                  </div>
                  <div
                    className="relative hidden h-12 w-12 rounded-full border border-[rgba(var(--grad-to),0.28)] bg-[rgba(var(--grad-to),0.12)] lg:block"
                    aria-hidden="true"
                  />
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:items-end">
                  <div
                    className="relative mx-auto w-full max-w-[16rem] sm:max-w-[18rem]"
                    style={{ aspectRatio: "1 / 1" }}
                    data-voxy-avatar=""
                  >
                    <Image
                      alt="Voxy begleitet den Einstieg in eDebatte."
                      className="object-contain"
                      fill
                      priority
                      sizes="(max-width: 768px) 288px, 320px"
                      src="/brand/voxy/voxy-presenting.webp"
                    />
                  </div>

                  <div className="space-y-3">
                    {VOXY_HINTS.map((hint) => (
                      <div
                        key={hint}
                        className="rounded-[1.15rem] border border-[rgba(var(--fg),0.08)] bg-[rgba(8,15,36,0.58)] px-4 py-3 text-sm leading-6 text-[rgb(var(--fg))]/76"
                      >
                        {hint}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <div className="relative mt-6 grid gap-4 lg:grid-cols-2">
            {PRIMARY_CARDS.map((card) => (
              <PrimaryEntryCard key={card.href} {...card} />
            ))}
          </div>

          <p className="relative mt-5 text-sm leading-6 text-[rgb(var(--fg))]/74">
            Voxy hilft beim Sortieren. Veröffentlicht wird nichts ohne Prüfung.
          </p>

          <div
            className={joinClasses(
              "relative mt-6 grid gap-3",
              supportCards.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2",
            )}
          >
            {supportCards.map((card) => (
              <SupportLinkCard key={`${card.href}-${card.title}`} {...card} />
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
