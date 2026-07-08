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
  compactText: string;
  desktopClassName: string;
  mobileClassName: string;
};

const PRIMARY_CARDS: readonly PrimaryCard[] = [
  {
    href: "/create",
    title: "Etwas beitragen",
    text: "Beschreibe, was besser werden sollte. Voxy hilft beim Einordnen, Schärfen und Weiterdenken.",
    cta: "Beitrag starten",
    eyebrow: "Beitrag einbringen",
    tone: "primary",
    gated: true,
  },
  {
    href: "/swipes",
    title: "Mitentwickeln",
    text: "Sieh, welche Fragen, Sichtweisen und Ansatzpunkte schon da sind, und hilf, den brauchbaren nächsten Schritt herauszuarbeiten.",
    cta: "Mitwirken",
    eyebrow: "Gemeinsam weiterdenken",
    tone: "secondary",
    gated: true,
  },
] as const;

const HERO_STAGE_LINKS: readonly StageLink[] = [
  {
    href: "/create",
    title: "Beitrag starten",
    text: "Ein Anliegen einbringen und mit Voxy klarer ausarbeiten.",
    eyebrow: "Beitrag",
    compactText: "Anliegen ordnen",
    tone: "primary",
    desktopClassName:
      "col-start-1 row-start-1 min-w-[13.75rem] max-w-[15rem] self-start justify-self-start lg:mt-10",
    mobileClassName: "col-start-1 row-start-1",
  },
  {
    href: "/swipes",
    title: "Mitwirken",
    text: "Sichtweisen, Fragen und Richtungen konstruktiv prüfen.",
    eyebrow: "Mitdenken",
    compactText: "Gedanken schärfen",
    tone: "primary",
    desktopClassName:
      "col-start-3 row-start-1 min-w-[13.9rem] max-w-[15.2rem] self-start justify-self-end lg:mt-8",
    mobileClassName: "col-start-2 row-start-1",
  },
  {
    href: "/themen",
    title: "Themen ansehen",
    text: "Öffentliche Anliegen finden, an die dein Beitrag anknüpfen kann.",
    eyebrow: "Themen",
    compactText: "Anknüpfen",
    tone: "secondary",
    desktopClassName:
      "col-start-1 row-start-3 min-w-[13.6rem] max-w-[14.9rem] self-end justify-self-start lg:mb-4",
    mobileClassName: "col-start-1 row-start-3",
  },
  {
    href: "/dossier",
    title: "Debatte & Argumente",
    text: "Fragen, Perspektiven und Belege im Zusammenhang verstehen.",
    eyebrow: "Dossier",
    compactText: "Zusammenhang verstehen",
    tone: "secondary",
    desktopClassName:
      "col-start-3 row-start-3 min-w-[13.8rem] max-w-[15.25rem] self-end justify-self-end lg:mb-2",
    mobileClassName: "col-start-2 row-start-3",
  },
] as const;

const TRUST_LINE =
  "Keine Schnellschüsse, keine automatische Veröffentlichung – Beiträge werden geordnet, geprüft und gemeinsam weiterentwickelt.";

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
        "group flex h-full min-h-[9.5rem] flex-col rounded-[1.8rem] px-5 py-5 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)] sm:min-h-[10rem] sm:px-6 sm:py-5",
        isPrimary
          ? "bg-[linear-gradient(145deg,rgba(244,252,255,0.96),rgba(196,237,255,0.93)_48%,rgba(118,199,255,0.8))] hover:-translate-y-1 dark:bg-[linear-gradient(145deg,rgba(12,42,88,0.98),rgba(17,95,196,0.52)_52%,rgba(10,18,39,0.98))]"
          : "bg-[linear-gradient(145deg,rgba(252,254,255,0.98),rgba(233,244,255,0.97)_48%,rgba(198,225,248,0.94))] hover:-translate-y-1 dark:bg-[linear-gradient(145deg,rgba(15,26,52,0.92),rgba(15,52,104,0.88)_52%,rgba(8,16,34,0.98))]",
      )}
      style={{
        border: isPrimary ? "1px solid rgba(84, 191, 247, 0.34)" : "1px solid rgba(174, 205, 229, 0.42)",
        boxShadow: isPrimary
          ? "0 24px 56px rgba(24, 99, 173, 0.18)"
          : "0 18px 42px rgba(34, 83, 138, 0.12)",
      }}
    >
      <div className="flex h-full flex-col gap-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(var(--fg))]/54">
          {eyebrow}
        </span>
        <div className="flex h-full flex-col gap-4 sm:gap-5">
          <div className="space-y-1.5">
            <h2 className="text-[1.35rem] font-semibold tracking-tight text-[rgb(var(--fg))] sm:text-[1.5rem]">
              {title}
            </h2>
            <p className="max-w-[21rem] text-sm leading-6 text-[rgb(var(--fg))]/74 sm:text-[15px]">{text}</p>
          </div>
          <span
            className={joinClasses(
              "mt-auto inline-flex w-fit shrink-0 items-center rounded-full px-4 py-2 text-sm font-semibold transition duration-200",
              isPrimary
                ? "bg-[linear-gradient(90deg,rgba(24,207,200,0.94),rgba(26,140,255,0.98))] text-[rgb(var(--btn-primary-fg))] group-hover:brightness-105"
                : "bg-[linear-gradient(135deg,rgba(17,91,184,0.14),rgba(24,207,200,0.16))] text-[rgb(16,56,104)] group-hover:bg-[linear-gradient(135deg,rgba(17,91,184,0.18),rgba(24,207,200,0.2))] dark:bg-[linear-gradient(135deg,rgba(57,118,255,0.16),rgba(24,207,200,0.12))] dark:text-[rgb(var(--fg))] dark:group-hover:bg-[linear-gradient(135deg,rgba(57,118,255,0.22),rgba(24,207,200,0.16))]",
            )}
            style={{
              boxShadow: isPrimary
                ? "0 14px 32px rgba(24, 140, 255, 0.28)"
                : "0 12px 28px rgba(32, 90, 154, 0.14)",
              border: isPrimary ? "none" : "1px solid rgba(55, 126, 198, 0.18)",
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
        "group relative overflow-hidden rounded-[1.45rem] px-5 py-4 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)]",
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
      <div className="pl-3 pr-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--grad-to))]">
          {eyebrow}
        </span>
        <h3 className="mt-2 text-base font-semibold tracking-tight text-[rgb(var(--fg))]">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-[rgb(var(--fg))]/72">{text}</p>
      </div>
    </Link>
  );
}

function MobileStageLinkCard({ href, eyebrow, compactText, tone, mobileClassName }: StageLink) {
  const isPrimary = tone === "primary";
  return (
    <Link
      href={href}
      className={joinClasses(
        "group z-[2] rounded-[1.15rem] px-3 py-2.5 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)]",
        isPrimary
          ? "bg-[linear-gradient(145deg,rgba(246,252,255,0.96),rgba(214,239,255,0.88)_55%,rgba(171,225,255,0.72))] dark:bg-[linear-gradient(145deg,rgba(8,33,71,0.95),rgba(17,82,173,0.28)_55%,rgba(7,16,36,0.98))]"
          : "bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(240,247,255,0.92)_55%,rgba(224,237,250,0.88))] dark:bg-[linear-gradient(145deg,rgba(14,25,49,0.94),rgba(10,30,64,0.8)_55%,rgba(8,16,34,0.98))]",
        mobileClassName,
      )}
      style={{
        border: isPrimary ? "1px solid rgba(90, 197, 251, 0.28)" : "1px solid rgba(174, 205, 229, 0.3)",
        boxShadow: isPrimary
          ? "0 12px 28px rgba(24, 93, 163, 0.13)"
          : "0 10px 22px rgba(31, 74, 125, 0.1)",
      }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--grad-to))]">
        {eyebrow}
      </span>
      <p className="mt-1 text-[13px] font-semibold leading-5 tracking-tight text-[rgb(var(--fg))]">{compactText}</p>
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
      <div className="landing-shell public-shell public-start-shell !w-full !max-w-[82rem] !gap-0 !px-5 !pb-8 !pt-3 sm:!px-8 sm:!pb-10 lg:!px-10 lg:!pt-6">
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

          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,0.97fr)_minmax(0,1.03fr)] lg:items-center lg:gap-12 xl:gap-14">
            <div className="relative z-[1] max-w-[37rem] space-y-7 lg:space-y-9">
              <div className="lg:hidden">
                <div
                  className="relative mx-auto max-w-[28rem] overflow-hidden rounded-[2rem] px-3 pb-4 pt-4"
                  style={{
                    border: "1px solid rgba(167, 212, 244, 0.32)",
                    background:
                      "linear-gradient(145deg, rgba(248,252,255,0.97), rgba(231,244,255,0.92) 52%, rgba(214,236,251,0.82))",
                    boxShadow: "0 22px 48px rgba(20, 77, 131, 0.13)",
                  }}
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-[17%] top-[22%] h-[32%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.96),rgba(146,220,255,0.22)_48%,transparent_82%)] blur-3xl"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-[20%] right-[20%] top-[28%] bottom-[29%] rounded-[999px] border border-[rgba(142,211,255,0.18)]"
                  />
                  <p className="relative z-[2] text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgb(var(--grad-to))]">
                    Mit Voxy
                  </p>

                  <div className="relative mt-4 grid grid-cols-2 grid-rows-[auto_8.5rem_auto] gap-x-3 gap-y-3">
                    {HERO_STAGE_LINKS.map((link) => (
                      <MobileStageLinkCard key={`${link.href}-${link.title}-mobile-stage`} {...link} />
                    ))}

                    <div className="pointer-events-none relative col-span-2 row-start-2 mx-auto flex w-full max-w-[7rem] items-center justify-center">
                      <div
                        className="relative z-[3] w-full"
                        style={{
                          aspectRatio: VOXY_LIGHT_HERO_ASSET.aspectRatio,
                        }}
                      >
                        <Image
                          alt={VOXY_LIGHT_HERO_ASSET.alt}
                          className="object-contain object-center dark:hidden"
                          fill
                          priority
                          sizes="112px"
                          src={VOXY_LIGHT_HERO_ASSET.candidates[0]}
                        />
                        <Image
                          alt={VOXY_DARK_HERO_ASSET.alt}
                          className="hidden object-contain object-center dark:block"
                          fill
                          priority
                          sizes="112px"
                          src={VOXY_DARK_HERO_ASSET.candidates[0]}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[rgb(var(--grad-to))]">
                  {isUnknownVisitor ? "KLARER EINSTIEG" : experience.eyebrow}
                </p>
                <h2 className="max-w-3xl text-[3rem] font-semibold tracking-[-0.05em] text-[rgb(var(--fg))] sm:text-[4.25rem] lg:text-[5.25rem] lg:leading-[0.95]">
                  {isUnknownVisitor ? "Was bewegt dich?" : experience.title}
                </h2>
                <p className="max-w-[35rem] text-base leading-8 text-[rgb(var(--fg))]/76 sm:text-lg lg:text-[1.08rem]">
                  {isUnknownVisitor
                    ? "Bring ein Anliegen, eine Beobachtung oder eine Idee ein. Voxy hilft dabei, Gedanken zu ordnen, Fragen zu schärfen und daraus einen gesellschaftlich brauchbaren Beitrag zu entwickeln."
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

              <div className="grid gap-4 sm:grid-cols-2 xl:max-w-[39rem]">
                {PRIMARY_CARDS.map((card) => (
                  <PrimaryEntryCard key={card.href} {...card} />
                ))}
              </div>

              <p className="max-w-[35rem] text-sm leading-7 text-[rgb(var(--fg))]/64 sm:text-[15px]">
                {TRUST_LINE}
              </p>

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

            <aside className="hidden lg:block">
              <div className="relative mx-auto w-full max-w-[41rem] lg:max-w-none">
                <div className="relative min-h-[41rem] xl:min-h-[43rem]">
                  <div className="absolute left-1/2 top-2 z-[4] -translate-x-1/2 rounded-full bg-[rgba(248,252,255,0.74)] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--grad-to))] backdrop-blur-sm dark:bg-[rgba(9,20,44,0.62)]">
                    Mit Voxy
                  </div>
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-[18%] top-[19%] h-[46%] rounded-full bg-[radial-gradient(circle,rgba(238,248,255,0.68),rgba(135,217,255,0.12)_42%,transparent_76%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(27,105,232,0.16),rgba(24,207,200,0.08)_46%,transparent_80%)]"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute left-[23%] right-[23%] top-[20%] bottom-[21%] rounded-[999px] border border-[rgba(142,211,255,0.18)] dark:border-[rgba(61,122,255,0.14)]"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute left-[18%] right-[18%] top-[25%] bottom-[24%] rounded-[999px] border border-[rgba(224,242,255,0.14)] dark:border-[rgba(129,170,255,0.08)]"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute left-[28%] right-[28%] bottom-[16%] h-[11%] rounded-full bg-[radial-gradient(circle,rgba(69,188,255,0.14),transparent_72%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(24,207,200,0.14),transparent_74%)]"
                  />

                  <div
                    className="absolute left-1/2 top-1/2 z-[3] w-full max-w-[12.5rem] -translate-x-1/2 -translate-y-[39%] xl:max-w-[13.35rem]"
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
                        sizes="(max-width: 1279px) 232px, 256px"
                        src={VOXY_LIGHT_HERO_ASSET.candidates[0]}
                      />
                      <Image
                        alt={VOXY_DARK_HERO_ASSET.alt}
                        className="hidden object-contain object-center dark:block"
                        fill
                        priority
                        sizes="(max-width: 1279px) 232px, 256px"
                        src={VOXY_DARK_HERO_ASSET.candidates[0]}
                      />
                    </div>
                  </div>

                  <div className="absolute inset-0 z-[4] grid grid-cols-[minmax(13.75rem,1fr)_14.25rem_minmax(13.75rem,1fr)] grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-8 gap-y-8 px-5 py-11 xl:grid-cols-[minmax(14.25rem,1fr)_14.75rem_minmax(14.25rem,1fr)] xl:px-8 xl:py-12">
                    {HERO_STAGE_LINKS.map((link) => (
                      <div
                        key={`${link.href}-${link.title}-desktop`}
                        className={joinClasses("z-[4] w-full", link.desktopClassName)}
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
