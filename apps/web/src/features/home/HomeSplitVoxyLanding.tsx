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
    desktopClassName: "left-[4%] top-[15%] w-[14.35rem] xl:left-[5%] xl:w-[14.75rem]",
    mobileClassName: "col-start-1 row-start-1",
  },
  {
    href: "/swipes",
    title: "Mitwirken",
    text: "Sichtweisen, Fragen und Richtungen konstruktiv prüfen.",
    eyebrow: "Mitdenken",
    compactText: "Gedanken schärfen",
    tone: "primary",
    desktopClassName: "right-[4%] top-[15%] w-[14.35rem] xl:right-[5%] xl:w-[14.75rem]",
    mobileClassName: "col-start-2 row-start-1",
  },
  {
    href: "/themen",
    title: "Themen ansehen",
    text: "Öffentliche Anliegen finden, an die dein Beitrag anknüpfen kann.",
    eyebrow: "Themen",
    compactText: "Anknüpfen",
    tone: "secondary",
    desktopClassName: "left-[5%] bottom-[14%] w-[14.35rem] xl:left-[6%] xl:w-[14.75rem]",
    mobileClassName: "col-start-1 row-start-3",
  },
  {
    href: "/dossier",
    title: "Debatte & Argumente",
    text: "Fragen, Perspektiven und Belege im Zusammenhang verstehen.",
    eyebrow: "Dossier",
    compactText: "Zusammenhang verstehen",
    tone: "secondary",
    desktopClassName: "right-[5%] bottom-[14%] w-[14.35rem] xl:right-[6%] xl:w-[14.75rem]",
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
        "group flex h-full min-h-[9.75rem] flex-col rounded-[1.9rem] px-5 py-5 transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)] sm:min-h-[10.15rem] sm:px-6 sm:py-5",
        isPrimary
          ? "bg-[linear-gradient(145deg,rgba(244,252,255,0.96),rgba(196,237,255,0.93)_48%,rgba(118,199,255,0.8))] dark:bg-[linear-gradient(145deg,rgba(12,42,88,0.98),rgba(17,95,196,0.52)_52%,rgba(10,18,39,0.98))]"
          : "bg-[linear-gradient(145deg,rgba(252,254,255,0.98),rgba(233,244,255,0.97)_48%,rgba(198,225,248,0.94))] dark:bg-[linear-gradient(145deg,rgba(15,26,52,0.92),rgba(15,52,104,0.88)_52%,rgba(8,16,34,0.98))]",
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
              "mt-auto inline-flex w-fit shrink-0 items-center rounded-full px-5 py-2.5 text-sm font-semibold transition duration-200",
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
        "group relative flex min-h-[9.35rem] flex-col justify-between overflow-hidden rounded-[1.7rem] px-5 py-[1.05rem] text-left transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)]",
        isPrimary
          ? "bg-[linear-gradient(155deg,rgba(248,252,255,0.94),rgba(212,238,255,0.88)_52%,rgba(178,225,255,0.72))] dark:bg-[linear-gradient(155deg,rgba(10,33,72,0.92),rgba(18,88,179,0.34)_52%,rgba(6,16,36,0.98))]"
          : "bg-[linear-gradient(155deg,rgba(255,255,255,0.92),rgba(236,246,255,0.9)_52%,rgba(214,230,246,0.78))] dark:bg-[linear-gradient(155deg,rgba(12,24,52,0.9),rgba(20,59,118,0.26)_52%,rgba(8,16,34,0.98))]",
      )}
      style={{
        border: isPrimary ? "1px solid rgba(90, 197, 251, 0.28)" : "1px solid rgba(132, 183, 236, 0.24)",
        boxShadow: isPrimary
          ? "0 22px 48px rgba(31, 94, 162, 0.16)"
          : "0 18px 42px rgba(34, 83, 138, 0.14)",
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-[12%] top-[-35%] h-[70%] rounded-full bg-[radial-gradient(circle,rgba(73,191,255,0.18),transparent_68%)] blur-3xl"
      />
      <div className="space-y-3">
        <span
          className={joinClasses(
            "inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
            isPrimary
              ? "border-[rgba(102,210,255,0.22)] bg-[rgba(255,255,255,0.56)] text-[rgb(19,106,176)] dark:bg-[rgba(17,76,146,0.38)] dark:text-[rgb(171,227,255)]"
              : "border-[rgba(122,173,236,0.2)] bg-[rgba(248,252,255,0.64)] text-[rgb(53,106,171)] dark:bg-[rgba(12,36,72,0.34)] dark:text-[rgb(162,204,255)]",
          )}
        >
          {eyebrow}
        </span>
        <div className="space-y-1.5 pr-1">
          <h3 className="text-base font-semibold tracking-tight text-[rgb(24,60,102)] dark:text-[rgb(246,251,255)]">
            {title}
          </h3>
          <p className="text-sm leading-6 text-[rgb(38,79,126)]/78 dark:text-[rgb(227,240,255)]/78">{text}</p>
        </div>
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
        "group z-[2] rounded-[1.2rem] px-3 py-2.5 text-center transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)]",
        isPrimary
          ? "bg-[linear-gradient(150deg,rgba(248,252,255,0.92),rgba(214,239,255,0.8)_55%,rgba(185,228,255,0.68))] dark:bg-[linear-gradient(150deg,rgba(10,34,70,0.88),rgba(18,88,179,0.24)_55%,rgba(6,16,34,0.96))]"
          : "bg-[linear-gradient(150deg,rgba(255,255,255,0.9),rgba(237,246,255,0.84)_55%,rgba(216,232,247,0.72))] dark:bg-[linear-gradient(150deg,rgba(11,23,50,0.86),rgba(17,64,122,0.18)_55%,rgba(7,16,34,0.94))]",
        mobileClassName,
      )}
      style={{
        border: isPrimary ? "1px solid rgba(90, 197, 251, 0.24)" : "1px solid rgba(124, 174, 228, 0.2)",
        boxShadow: isPrimary
          ? "0 16px 32px rgba(31, 94, 162, 0.14)"
          : "0 12px 28px rgba(34, 83, 138, 0.12)",
      }}
    >
      <span
        className={joinClasses(
          "inline-flex rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em]",
          isPrimary
            ? "border-[rgba(102,210,255,0.18)] bg-[rgba(255,255,255,0.58)] text-[rgb(20,109,181)] dark:bg-[rgba(17,76,146,0.34)] dark:text-[rgb(165,225,255)]"
            : "border-[rgba(122,173,236,0.16)] bg-[rgba(248,252,255,0.62)] text-[rgb(55,107,170)] dark:bg-[rgba(12,36,72,0.32)] dark:text-[rgb(168,206,255)]",
        )}
      >
        {eyebrow}
      </span>
      <p className="mt-1.5 text-[13px] font-semibold leading-5 tracking-tight text-[rgb(24,60,102)] dark:text-[rgb(244,250,255)]">
        {compactText}
      </p>
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
                  className="relative mx-auto max-w-[28rem] overflow-hidden rounded-[2rem] border border-[rgba(112,180,240,0.2)] bg-[linear-gradient(155deg,rgba(248,252,255,0.94),rgba(223,241,255,0.9)_48%,rgba(198,230,248,0.82))] px-3 pb-4 pt-4 dark:border-[rgba(112,180,240,0.16)] dark:bg-[linear-gradient(155deg,rgba(7,18,40,0.92),rgba(11,37,78,0.78)_48%,rgba(6,16,34,0.96))]"
                  style={{ boxShadow: "0 26px 56px rgba(29, 88, 150, 0.16)" }}
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-[16%] top-[22%] h-[34%] rounded-full bg-[radial-gradient(circle,rgba(39,144,255,0.22),rgba(24,207,200,0.14)_40%,transparent_78%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(39,144,255,0.2),rgba(24,207,200,0.12)_40%,transparent_78%)]"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-[18%] right-[18%] top-[26%] bottom-[27%] rounded-[999px] border border-[rgba(113,187,255,0.18)] dark:border-[rgba(113,187,255,0.14)]"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-[22%] top-[30%] bottom-[31%] rounded-[999px] border border-[rgba(98,155,255,0.1)] dark:border-[rgba(98,155,255,0.08)]"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute right-[-12%] top-[-8%] h-[8rem] w-[8rem] bg-[radial-gradient(circle,rgba(119,214,255,0.24),transparent_68%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(119,214,255,0.18),transparent_68%)]"
                  />
                  <p className="relative z-[2] text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgb(33,128,200)] dark:text-[rgb(172,228,255)]">
                    Mit Voxy
                  </p>

                  <div className="relative mt-4 grid grid-cols-2 grid-rows-[auto_9.6rem_auto] gap-x-3 gap-y-3 sm:grid-rows-[auto_10rem_auto]">
                    {HERO_STAGE_LINKS.map((link) => (
                      <MobileStageLinkCard key={`${link.href}-${link.title}-mobile-stage`} {...link} />
                    ))}

                    <div className="pointer-events-none relative col-span-2 row-start-2 mx-auto flex w-full max-w-[8.25rem] items-center justify-center sm:max-w-[8.75rem]">
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

              <div className="space-y-3 text-center lg:text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[rgb(var(--grad-to))]">
                  {isUnknownVisitor ? "KLARER EINSTIEG" : experience.eyebrow}
                </p>
                <h2 className="mx-auto max-w-3xl text-[3rem] font-semibold tracking-[-0.05em] text-[rgb(var(--fg))] sm:text-[4.25rem] lg:mx-0 lg:text-[5.25rem] lg:leading-[0.95]">
                  {isUnknownVisitor ? "Was bewegt dich?" : experience.title}
                </h2>
                <p className="mx-auto max-w-[35rem] text-base leading-8 text-[rgb(var(--fg))]/76 sm:text-lg lg:mx-0 lg:text-[1.08rem]">
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

              <div className="mx-auto grid max-w-[39rem] gap-4 sm:grid-cols-2 lg:mx-0">
                {PRIMARY_CARDS.map((card) => (
                  <PrimaryEntryCard key={card.href} {...card} />
                ))}
              </div>

              <p className="mx-auto max-w-[35rem] text-center text-sm leading-7 text-[rgb(var(--fg))]/64 sm:text-[15px] lg:mx-0 lg:text-left">
                {TRUST_LINE}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-1 text-sm text-[rgb(var(--fg))]/58 lg:justify-start">
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
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-[8%] top-[8%] bottom-[8%] rounded-[2.7rem] border border-[rgba(105,172,240,0.2)] bg-[linear-gradient(160deg,rgba(248,252,255,0.88),rgba(223,241,255,0.72)_46%,rgba(204,232,247,0.76))] backdrop-blur-[22px] dark:border-[rgba(105,172,240,0.16)] dark:bg-[linear-gradient(160deg,rgba(8,19,41,0.66),rgba(14,42,86,0.34)_46%,rgba(8,16,34,0.7))]"
                    style={{ boxShadow: "0 34px 80px rgba(34, 83, 138, 0.14)" }}
                  />
                  <div className="absolute left-1/2 top-[7.5%] z-[4] -translate-x-1/2 rounded-full border border-[rgba(122,188,255,0.18)] bg-[rgba(248,252,255,0.78)] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[rgb(35,130,201)] backdrop-blur-sm dark:border-[rgba(122,188,255,0.16)] dark:bg-[rgba(8,28,58,0.5)] dark:text-[rgb(175,226,255)]">
                    Mit Voxy
                  </div>
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-[16%] top-[18%] h-[48%] rounded-full bg-[radial-gradient(circle,rgba(52,163,255,0.22),rgba(24,207,200,0.14)_42%,transparent_78%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(52,163,255,0.2),rgba(24,207,200,0.12)_42%,transparent_78%)]"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute left-[21%] right-[21%] top-[20%] bottom-[20%] rounded-[999px] border border-[rgba(142,211,255,0.18)] dark:border-[rgba(142,211,255,0.12)]"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute left-[17%] right-[17%] top-[24%] bottom-[24%] rounded-[999px] border border-[rgba(98,155,255,0.1)] dark:border-[rgba(98,155,255,0.08)]"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute left-[24%] right-[24%] bottom-[15%] h-[14%] rounded-full bg-[radial-gradient(circle,rgba(69,188,255,0.16),transparent_72%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(69,188,255,0.12),transparent_72%)]"
                  />

                  <div
                    className="absolute left-1/2 top-1/2 z-[3] w-full max-w-[13.15rem] -translate-x-1/2 -translate-y-[37%] xl:max-w-[14.15rem]"
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
                        sizes="(max-width: 1279px) 246px, 272px"
                        src={VOXY_LIGHT_HERO_ASSET.candidates[0]}
                      />
                      <Image
                        alt={VOXY_DARK_HERO_ASSET.alt}
                        className="hidden object-contain object-center dark:block"
                        fill
                        priority
                        sizes="(max-width: 1279px) 246px, 272px"
                        src={VOXY_DARK_HERO_ASSET.candidates[0]}
                      />
                    </div>
                  </div>

                  <div className="absolute inset-0 z-[4]">
                    {HERO_STAGE_LINKS.map((link) => (
                      <div
                        key={`${link.href}-${link.title}-desktop`}
                        className={joinClasses("absolute z-[4]", link.desktopClassName)}
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
