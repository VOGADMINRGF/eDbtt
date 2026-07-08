import Image from "next/image";
import Link from "next/link";
import type { BucketBlock } from "@/components/landing/ExamplesBackdrop";
import type { StartExperienceModel } from "@/features/start/startExperience";
import { resolveVoxyAsset } from "@/features/voxy/voxyAssets";

type HomeSplitVoxyLandingProps = {
  blocks?: BucketBlock[];
  experience: StartExperienceModel;
};

type PrimaryCard = {
  href: string;
  title: string;
  text: string;
  cta: string;
  eyebrow: string;
  tone: "primary" | "secondary";
  gated?: boolean;
};

type SupportLink = {
  href: string;
  label: string;
};

const PRIMARY_CARDS: readonly PrimaryCard[] = [
  {
    href: "/create",
    title: "Etwas beitragen",
    text: "Schreib, was dich bewegt. Voxy hilft beim Einordnen.",
    cta: "Beitrag starten",
    eyebrow: "Beitrag einbringen",
    tone: "primary",
    gated: true,
  },
  {
    href: "/swipes",
    title: "Abstimmen & mitmachen",
    text: "Bewerte Themen, Sichtweisen oder Fragen in wenigen Sekunden.",
    cta: "Mitmachen",
    eyebrow: "Abstimmen",
    tone: "secondary",
    gated: true,
  },
] as const;

const PUBLIC_SUPPORT_LINKS: readonly SupportLink[] = [
  {
    href: "/themen",
    label: "Themen ansehen",
  },
  {
    href: "/dossier",
    label: "Debatte & Argumente",
  },
] as const;

const TRUST_HINTS = [
  "Nichts wird automatisch veröffentlicht.",
  "Voxy hilft beim Sortieren.",
  "Du entscheidest den nächsten Schritt.",
] as const;

const VOXY_LIGHT_HERO_ASSET = resolveVoxyAsset("createGuideLight");
const VOXY_DARK_HERO_ASSET = resolveVoxyAsset("createGuideDark");

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function PrimaryEntryCard({ href, title, text, cta, eyebrow, tone, gated = false }: PrimaryCard) {
  const isPrimary = tone === "primary";
  return (
    <Link
      href={href}
      data-testid="home-split-primary-card"
      data-requires-privacy-gate={gated ? "true" : undefined}
      className={joinClasses(
        "group flex h-full flex-col rounded-[1.9rem] p-6 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)] sm:p-7",
        isPrimary
          ? "bg-[linear-gradient(145deg,rgba(24,207,200,0.24),rgba(26,140,255,0.18)_45%,rgba(6,17,42,0.94))] hover:-translate-y-1"
          : "bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(8,18,48,0.78)_55%,rgba(6,12,32,0.92))] hover:-translate-y-1",
      )}
      style={{
        border: isPrimary ? "1px solid rgba(86, 224, 214, 0.22)" : "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: isPrimary
          ? "0 24px 64px rgba(7, 23, 47, 0.28)"
          : "0 18px 48px rgba(5, 12, 31, 0.22)",
      }}
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(var(--fg))]/54">
        {eyebrow}
      </span>
      <h2 className="mt-4 text-[1.9rem] font-semibold tracking-tight text-[rgb(var(--fg))] sm:text-[2.25rem]">
        {title}
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-7 text-[rgb(var(--fg))]/74 sm:text-base">
        {text}
      </p>
      <span
        className={joinClasses(
          "mt-7 inline-flex w-fit items-center rounded-full px-5 py-2.5 text-sm font-semibold transition duration-200",
          isPrimary
            ? "bg-[linear-gradient(90deg,rgba(24,207,200,0.94),rgba(26,140,255,0.98))] text-[rgb(var(--btn-primary-fg))] group-hover:brightness-105"
            : "bg-[rgba(255,255,255,0.07)] text-[rgb(var(--fg))] group-hover:bg-[rgba(255,255,255,0.12)]",
        )}
        style={{
          boxShadow: isPrimary ? "0 14px 32px rgba(24, 140, 255, 0.28)" : "0 10px 24px rgba(5, 12, 31, 0.2)",
        }}
      >
        {cta}
      </span>
    </Link>
  );
}

export default function HomeSplitVoxyLanding({
  blocks: _blocks,
  experience,
}: HomeSplitVoxyLandingProps) {
  const isUnknownVisitor = experience.familiarity === "unknown_visitor";
  const supportLinks = isUnknownVisitor
    ? PUBLIC_SUPPORT_LINKS
    : [
        ...(experience.workspaceHref
          ? [
              {
                href: experience.workspaceHref,
                label: experience.workspaceLabel ?? "Arbeitsbereich öffnen",
              },
            ]
          : []),
        ...PUBLIC_SUPPORT_LINKS,
      ];

  return (
    <section className="landing-canvas public-canvas public-start-canvas overflow-hidden">
      <div className="landing-shell public-shell public-start-shell !w-full !max-w-[78rem] !gap-0 !px-5 !pb-8 !pt-3 sm:!px-8 sm:!pb-10 lg:!px-10 lg:!pt-6">
        <section className="relative min-h-[calc(100svh-8rem)] py-6 sm:py-10 lg:min-h-[38rem] lg:py-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[-22%] top-[-16rem] h-[32rem] rounded-full bg-[radial-gradient(circle,rgba(18,118,255,0.18),transparent_62%)] blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[-10rem] top-[4rem] h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(24,207,200,0.18),transparent_66%)] blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[-14rem] left-[18%] h-[24rem] w-[40rem] rounded-full bg-[radial-gradient(circle,rgba(117,162,255,0.12),transparent_70%)] blur-3xl"
          />

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(20rem,0.98fr)] lg:items-center lg:gap-12">
            <div className="relative z-[1] max-w-[40rem] space-y-6 lg:space-y-8">
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[rgb(var(--grad-to))]">
                  {isUnknownVisitor ? "KLARER EINSTIEG" : experience.eyebrow}
                </p>
                <h2 className="max-w-3xl text-[3rem] font-semibold tracking-[-0.05em] text-[rgb(var(--fg))] sm:text-[4.25rem] lg:text-[5.6rem] lg:leading-[0.94]">
                  {isUnknownVisitor ? "Was bewegt dich?" : experience.title}
                </h2>
                <p className="max-w-[36rem] text-base leading-8 text-[rgb(var(--fg))]/76 sm:text-lg lg:text-[1.18rem]">
                  {isUnknownVisitor
                    ? "Bring ein Thema ein oder stimme ab, wo deine Sicht gebraucht wird. Voxy hilft beim Sortieren. Veröffentlicht wird nichts ohne Prüfung."
                    : experience.description}
                </p>
              </div>

              {!isUnknownVisitor && experience.workspaceHref ? (
                <div
                  className="max-w-[30rem] rounded-[1.55rem] bg-[rgba(255,255,255,0.05)] p-4"
                  style={{
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    boxShadow: "0 18px 46px rgba(5, 12, 31, 0.2)",
                  }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
                    Schon dabei?
                  </p>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-[rgb(var(--fg))]/78">
                    {experience.helperText}
                  </p>
                  <Link
                    href={experience.workspaceHref}
                    className="mt-4 inline-flex items-center rounded-full bg-[rgba(255,255,255,0.08)] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition duration-200 hover:bg-[rgba(255,255,255,0.12)] hover:text-[rgb(var(--grad-to))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)]"
                    style={{ border: "1px solid rgba(255, 255, 255, 0.12)" }}
                  >
                    {experience.workspaceLabel ?? "Arbeitsbereich öffnen"}
                  </Link>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2 xl:max-w-[46rem]">
                {PRIMARY_CARDS.map((card) => (
                  <PrimaryEntryCard key={card.href} {...card} />
                ))}
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                {TRUST_HINTS.map((hint) => (
                  <span
                    key={hint}
                    className="text-xs font-medium text-[rgb(var(--fg))]/72 sm:text-[13px]"
                  >
                    {hint}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-sm text-[rgb(var(--fg))]/62">
                {supportLinks.map((link) => (
                  <Link
                    key={`${link.href}-${link.label}`}
                    href={link.href}
                    className="transition duration-200 hover:text-[rgb(var(--fg))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <aside className="order-first lg:order-none">
              <div className="relative mx-auto flex w-full max-w-[42rem] items-center justify-center lg:max-w-none lg:justify-end">
                <div className="relative flex min-h-[21rem] w-full items-center justify-center sm:min-h-[27rem] lg:min-h-[35rem]">
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-[12%] bottom-[8%] h-[30%] rounded-full bg-[radial-gradient(circle,rgba(51,188,255,0.2),transparent_72%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(24,207,200,0.22),transparent_72%)]"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-[8%] top-[5%] h-[72%] rounded-full bg-[radial-gradient(circle,rgba(237,247,255,0.95),rgba(129,211,255,0.34)_38%,transparent_74%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(43,117,255,0.28),rgba(24,207,200,0.14)_42%,transparent_78%)]"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-[10%] inset-y-[10%] rounded-[3rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.34),rgba(255,255,255,0.04)_58%,rgba(255,255,255,0))] opacity-80 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(19,32,61,0.02)_58%,rgba(19,32,61,0))]"
                  />

                  <div className="absolute left-0 top-2 z-[2] rounded-full bg-[rgba(246,250,255,0.72)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--grad-to))] backdrop-blur-sm dark:bg-[rgba(7,19,46,0.62)] sm:left-4 lg:left-6">
                    Mit Voxy
                  </div>

                  <div
                    className="absolute right-[6%] top-[14%] z-[2] hidden max-w-[12rem] rounded-[1.15rem] bg-[rgba(248,252,255,0.6)] px-4 py-3 text-sm leading-6 text-[rgb(var(--fg))]/72 backdrop-blur-sm dark:bg-[rgba(7,19,46,0.44)] lg:block"
                    style={{
                      border: "1px solid rgba(182, 218, 245, 0.26)",
                      boxShadow: "0 18px 42px rgba(16, 53, 96, 0.12)",
                    }}
                  >
                    Voxy hilft beim Sortieren, bevor du den nächsten Schritt auswählst.
                  </div>

                  <div
                    className="relative z-[1] mx-auto w-full max-w-[19rem] overflow-hidden sm:max-w-[24rem] lg:max-w-[33rem]"
                    style={{
                      aspectRatio: VOXY_LIGHT_HERO_ASSET.aspectRatio,
                      WebkitMaskImage:
                        "radial-gradient(ellipse 74% 84% at 50% 42%, #000 58%, transparent 100%)",
                      maskImage:
                        "radial-gradient(ellipse 74% 84% at 50% 42%, #000 58%, transparent 100%)",
                    }}
                    data-voxy-avatar=""
                  >
                    <Image
                      alt={VOXY_LIGHT_HERO_ASSET.alt}
                      className="object-contain object-center dark:hidden"
                      fill
                      priority
                      sizes="(max-width: 768px) 320px, (max-width: 1280px) 440px, 528px"
                      src={VOXY_LIGHT_HERO_ASSET.candidates[0]}
                      style={{ transform: "translateY(2%) scale(1.08)" }}
                    />
                    <Image
                      alt={VOXY_DARK_HERO_ASSET.alt}
                      className="hidden object-contain object-center dark:block"
                      fill
                      priority
                      sizes="(max-width: 768px) 320px, (max-width: 1280px) 440px, 528px"
                      src={VOXY_DARK_HERO_ASSET.candidates[0]}
                      style={{ transform: "translateY(2%) scale(1.08)" }}
                    />
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </section>
  );
}
