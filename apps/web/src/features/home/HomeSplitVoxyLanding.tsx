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

type StageLink = {
  href: string;
  title: string;
  text: string;
  eyebrow: string;
  tone: "primary" | "secondary";
  desktopClassName: string;
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

const HERO_STAGE_LINKS: readonly StageLink[] = [
  {
    href: "/create",
    title: "Beitrag starten",
    text: "Ein Thema einbringen und mit Voxy sauber ordnen.",
    eyebrow: "Beitrag",
    tone: "primary",
    desktopClassName: "left-0 top-[6%] lg:max-w-[13rem]",
  },
  {
    href: "/swipes",
    title: "Mitmachen",
    text: "Sichtweisen, Fragen und Richtungen schnell bewerten.",
    eyebrow: "Mitmachen",
    tone: "primary",
    desktopClassName: "right-0 top-[18%] lg:max-w-[13.5rem]",
  },
  {
    href: "/themen",
    title: "Themen ansehen",
    text: "Öffentliche Anliegen, an die dein Beitrag anknüpfen kann.",
    eyebrow: "Themen",
    tone: "secondary",
    desktopClassName: "left-[7%] bottom-[16%] lg:max-w-[12.75rem]",
  },
  {
    href: "/dossier",
    title: "Debatte & Argumente",
    text: "Fragen, Positionen und Belege im Zusammenhang lesen.",
    eyebrow: "Dossier",
    tone: "secondary",
    desktopClassName: "right-[4%] bottom-[5%] lg:max-w-[14rem]",
  },
] as const;

const TRUST_LINE =
  "Review-first · Keine automatische Veröffentlichung · Du entscheidest den nächsten Schritt";

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
        "group flex h-full min-h-[7.4rem] flex-col justify-between rounded-[1.6rem] px-5 py-4 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)] sm:min-h-[8rem] sm:px-6 sm:py-5",
        isPrimary
          ? "bg-[linear-gradient(145deg,rgba(244,252,255,0.96),rgba(196,237,255,0.93)_48%,rgba(118,199,255,0.8))] hover:-translate-y-1 dark:bg-[linear-gradient(145deg,rgba(12,42,88,0.98),rgba(17,95,196,0.52)_52%,rgba(10,18,39,0.98))]"
          : "bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(240,247,255,0.96)_48%,rgba(217,234,248,0.92))] hover:-translate-y-1 dark:bg-[linear-gradient(145deg,rgba(15,26,52,0.92),rgba(12,38,78,0.86)_52%,rgba(8,16,34,0.98))]",
      )}
      style={{
        border: isPrimary ? "1px solid rgba(84, 191, 247, 0.34)" : "1px solid rgba(174, 205, 229, 0.42)",
        boxShadow: isPrimary
          ? "0 24px 56px rgba(24, 99, 173, 0.18)"
          : "0 18px 42px rgba(34, 83, 138, 0.12)",
      }}
    >
      <div className="space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(var(--fg))]/54">
          {eyebrow}
        </span>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-[1.35rem] font-semibold tracking-tight text-[rgb(var(--fg))] sm:text-[1.5rem]">
              {title}
            </h2>
            <p className="max-w-[18rem] text-sm leading-6 text-[rgb(var(--fg))]/74">{text}</p>
          </div>
          <span
            className={joinClasses(
              "inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-semibold transition duration-200",
              isPrimary
                ? "bg-[linear-gradient(90deg,rgba(24,207,200,0.94),rgba(26,140,255,0.98))] text-[rgb(var(--btn-primary-fg))] group-hover:brightness-105"
                : "bg-[rgba(17,91,184,0.1)] text-[rgb(17,53,95)] group-hover:bg-[rgba(17,91,184,0.16)] dark:bg-[rgba(255,255,255,0.08)] dark:text-[rgb(var(--fg))] dark:group-hover:bg-[rgba(255,255,255,0.14)]",
            )}
            style={{
              boxShadow: isPrimary
                ? "0 14px 32px rgba(24, 140, 255, 0.28)"
                : "0 10px 22px rgba(52, 108, 173, 0.12)",
            }}
          >
            {cta}
          </span>
        </div>
      </div>
    </Link>
  );
}

function StageLinkCard({ href, title, text, eyebrow, tone }: StageLink) {
  const isPrimary = tone === "primary";
  return (
    <Link
      href={href}
      className={joinClasses(
        "group relative overflow-hidden rounded-[1.35rem] px-4 py-3 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)]",
        isPrimary
          ? "bg-[linear-gradient(150deg,rgba(246,251,255,0.97),rgba(212,238,255,0.9)_52%,rgba(160,221,255,0.78))] dark:bg-[linear-gradient(150deg,rgba(8,33,71,0.96),rgba(17,82,173,0.3)_52%,rgba(7,16,36,0.98))]"
          : "bg-[linear-gradient(150deg,rgba(255,255,255,0.95),rgba(243,248,255,0.93)_54%,rgba(226,238,250,0.88))] dark:bg-[linear-gradient(150deg,rgba(14,25,49,0.94),rgba(10,30,64,0.82)_54%,rgba(8,16,34,0.98))]",
      )}
      style={{
        border: isPrimary ? "1px solid rgba(90, 197, 251, 0.34)" : "1px solid rgba(174, 205, 229, 0.36)",
        boxShadow: isPrimary
          ? "0 18px 44px rgba(24, 93, 163, 0.2)"
          : "0 14px 36px rgba(31, 74, 125, 0.12)",
      }}
    >
      <div
        aria-hidden="true"
        className={joinClasses(
          "absolute inset-y-0 left-0 w-[0.28rem] rounded-full",
          isPrimary
            ? "bg-[linear-gradient(180deg,rgba(24,207,200,1),rgba(26,140,255,1))]"
            : "bg-[linear-gradient(180deg,rgba(88,145,255,0.9),rgba(24,207,200,0.75))]",
        )}
      />
      <span className="pl-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--grad-to))]">
        {eyebrow}
      </span>
      <h3 className="mt-2 pl-2 text-base font-semibold tracking-tight text-[rgb(var(--fg))]">{title}</h3>
      <p className="mt-1 pl-2 text-sm leading-6 text-[rgb(var(--fg))]/72">{text}</p>
    </Link>
  );
}

export default function HomeSplitVoxyLanding({
  blocks: _blocks,
  experience,
}: HomeSplitVoxyLandingProps) {
  const isUnknownVisitor = experience.familiarity === "unknown_visitor";
  const supportLinks = experience.workspaceHref
    ? [
        {
          href: experience.workspaceHref,
          label: experience.workspaceLabel ?? "Arbeitsbereich öffnen",
        },
      ]
    : [];

  return (
    <section className="landing-canvas public-canvas public-start-canvas overflow-hidden">
      <div className="landing-shell public-shell public-start-shell !w-full !max-w-[80rem] !gap-0 !px-5 !pb-8 !pt-3 sm:!px-8 sm:!pb-10 lg:!px-10 lg:!pt-6">
        <section className="relative min-h-[calc(100svh-8rem)] py-6 sm:py-10 lg:min-h-[42rem] lg:py-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[-22%] top-[-16rem] h-[32rem] rounded-full bg-[radial-gradient(circle,rgba(18,118,255,0.18),transparent_62%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(18,118,255,0.18),transparent_62%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[-10rem] top-[2rem] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(160,223,255,0.34),transparent_62%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(24,207,200,0.18),transparent_66%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[-14rem] left-[18%] h-[24rem] w-[40rem] rounded-full bg-[radial-gradient(circle,rgba(117,162,255,0.12),transparent_70%)] blur-3xl"
          />

          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] lg:items-center lg:gap-8">
            <div className="relative z-[1] max-w-[35rem] space-y-6 lg:space-y-8">
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[rgb(var(--grad-to))]">
                  {isUnknownVisitor ? "KLARER EINSTIEG" : experience.eyebrow}
                </p>
                <h2 className="max-w-3xl text-[3rem] font-semibold tracking-[-0.05em] text-[rgb(var(--fg))] sm:text-[4.25rem] lg:text-[5.25rem] lg:leading-[0.95]">
                  {isUnknownVisitor ? "Was bewegt dich?" : experience.title}
                </h2>
                <p className="max-w-[34rem] text-base leading-8 text-[rgb(var(--fg))]/76 sm:text-lg lg:text-[1.1rem]">
                  {isUnknownVisitor
                    ? "Bring ein Thema ein oder stimme ab, wo deine Sicht gebraucht wird. Voxy hilft beim Sortieren — veröffentlicht wird nichts ohne Prüfung."
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

              <div className="grid gap-4 sm:grid-cols-2 xl:max-w-[33rem]">
                {PRIMARY_CARDS.map((card) => (
                  <PrimaryEntryCard key={card.href} {...card} />
                ))}
              </div>

              <p className="text-sm text-[rgb(var(--fg))]/64 sm:text-[15px]">{TRUST_LINE}</p>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-sm text-[rgb(var(--fg))]/58">
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
              <div className="relative mx-auto w-full max-w-[40rem] lg:max-w-none">
                <div className="relative min-h-[31rem] sm:min-h-[34rem] lg:min-h-[42rem]">
                  <div className="absolute left-2 top-4 z-[4] rounded-full bg-[rgba(248,252,255,0.78)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--grad-to))] backdrop-blur-sm dark:bg-[rgba(9,20,44,0.64)] sm:left-6">
                    Mit Voxy
                  </div>
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-[10%] top-[14%] h-[58%] rounded-full bg-[radial-gradient(circle,rgba(238,248,255,0.92),rgba(135,217,255,0.22)_42%,transparent_76%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(27,105,232,0.26),rgba(24,207,200,0.12)_46%,transparent_80%)]"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute left-[18%] right-[18%] top-[17%] bottom-[18%] rounded-[999px] border border-[rgba(142,211,255,0.34)] dark:border-[rgba(61,122,255,0.2)]"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute left-[10%] right-[10%] top-[23%] bottom-[22%] rounded-[999px] border border-[rgba(224,242,255,0.24)] dark:border-[rgba(129,170,255,0.12)]"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute left-[22%] right-[22%] bottom-[13%] h-[15%] rounded-full bg-[radial-gradient(circle,rgba(69,188,255,0.2),transparent_72%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(24,207,200,0.2),transparent_74%)]"
                  />

                  <div
                    className="absolute left-1/2 top-1/2 z-[3] w-full max-w-[11.5rem] -translate-x-1/2 -translate-y-[43%] sm:max-w-[12.75rem] lg:max-w-[14.5rem]"
                  >
                    <div
                      className="relative"
                      style={{
                        aspectRatio: VOXY_LIGHT_HERO_ASSET.aspectRatio,
                      }}
                      data-voxy-avatar=""
                    >
                      <Image
                        alt={VOXY_LIGHT_HERO_ASSET.alt}
                        className="object-contain object-center dark:hidden"
                        fill
                        priority
                        sizes="(max-width: 640px) 184px, (max-width: 1024px) 220px, 280px"
                        src={VOXY_LIGHT_HERO_ASSET.candidates[0]}
                      />
                      <Image
                        alt={VOXY_DARK_HERO_ASSET.alt}
                        className="hidden object-contain object-center dark:block"
                        fill
                        priority
                        sizes="(max-width: 640px) 184px, (max-width: 1024px) 220px, 280px"
                        src={VOXY_DARK_HERO_ASSET.candidates[0]}
                      />
                    </div>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 z-[2] grid grid-cols-2 gap-3 px-1 pt-8 lg:hidden">
                    {HERO_STAGE_LINKS.map((link) => (
                      <StageLinkCard key={`${link.href}-${link.title}-mobile`} {...link} />
                    ))}
                  </div>

                  <div className="absolute inset-0 hidden lg:block">
                    {HERO_STAGE_LINKS.map((link) => (
                      <div
                        key={`${link.href}-${link.title}-desktop`}
                        className={joinClasses("absolute z-[4] w-full", link.desktopClassName)}
                      >
                        <StageLinkCard {...link} />
                      </div>
                    ))}
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
