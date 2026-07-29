import Image from "next/image";
import Link from "next/link";
import type { BucketBlock } from "@/components/landing/ExamplesBackdrop";
import HomeScrollReveal from "@/features/home/HomeScrollReveal";
import type { StartExperienceModel } from "@/features/start/startExperience";
import { resolveVoxyAsset } from "@/features/voxy/voxyAssets";

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
  title: string;
  text: string;
};

type BenefitCard = {
  title: string;
  text: string;
  marker: string;
};

const VOXY_PODCAST_STAGE_ASSET = "/brand/voxy/voxy-podcast-stage.png";
const VOXY_MINI_AVATAR = resolveVoxyAsset("miniAvatar");

const CANONICAL_BRAND_NARRATIVE = [
  "Gesellschaftliche Debatten werden häufig von Lautstärke, Reichweite und Zuspitzung bestimmt. Dabei gehen leisere Stimmen, wichtige Zusammenhänge und belastbare Informationen verloren. Wir glauben, dass bessere Entscheidungen möglich werden, wenn Menschen einander verstehen, unterschiedliche Perspektiven sichtbar sind und Informationen nachvollziehbar eingeordnet werden können.",
  "eDebatte verbindet Stimmen, Positionen und Perspektiven über Sprach- und Interessengrenzen hinweg. Quellen, Evidenzen, Widersprüche und Zusammenhänge werden strukturiert und transparent sichtbar gemacht. So entsteht aus einzelnen Aussagen, Beiträgen und Informationen ein nachvollziehbarer Debattenstand.",
  "Auf eDebatte werden aktuelle Themen, Positionen, Aussagen, Quellen und Dossiers zusammengeführt, geprüft, diskutiert und bewertet. Menschen können sich informieren, eigene Perspektiven beitragen und über Prioritäten, Positionen und mögliche Lösungen abstimmen. Nicht über Wahrheit wird abgestimmt, sondern darüber, wie wir als Gesellschaft mit den verfügbaren Erkenntnissen umgehen.",
] as const;

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
    title: "Ein Thema einbringen",
    text: "Teile eine Beobachtung, Frage, Idee oder Quelle. Voxy hilft beim Sortieren, ohne automatisch zu veröffentlichen.",
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
    title: "Den Debattenstand nachvollziehen",
    text: "Erkenne, was belegt ist, wo Quellen widersprechen und welche Fragen noch offen sind.",
    cta: "Dossiers ansehen",
  },
] as const;

const SEGMENT_CARDS: readonly SegmentCard[] = [
  {
    href: "/account",
    title: "Für Nachbarn und Bürger",
    text: "Themen aus deiner Umgebung verstehen, Perspektiven einbringen und nachvollziehbar mitentscheiden.",
  },
  {
    href: "/account/organization",
    title: "Für Initiativen und Communities",
    text: "Anliegen strukturiert darstellen, Unterstützer verbinden und aus Diskussionen handlungsfähige Debatten machen.",
  },
  {
    href: "/account/organization",
    title: "Für Kommunen und Organisationen",
    text: "Menschen früh beteiligen, Rückmeldungen einordnen und Entscheidungen verständlicher kommunizieren.",
  },
  {
    href: "/dossier",
    title: "Für Medien und Redaktionen",
    text: "Quellen, unterschiedliche Perspektiven und den aktuellen Debattenstand schneller erfassen.",
  },
] as const;

const BENEFIT_CARDS: readonly BenefitCard[] = [
  {
    marker: "01",
    title: "Sprachen verbinden",
    text: "Original-, Lese-, Bedien- und Ausgabesprache werden passend zusammengeführt.",
  },
  {
    marker: "02",
    title: "Quellen sichtbar machen",
    text: "Aussagen, Dokumente und öffentliche Quellen bleiben nachvollziehbar und getrennt erkennbar.",
  },
  {
    marker: "03",
    title: "Zusammenhänge erkennen",
    text: "Argumente, Ereignisse, Akteure und Perspektiven werden über Themen und Regionen hinweg verbunden.",
  },
  {
    marker: "04",
    title: "Debatten statt Kommentarchaos",
    text: "Beiträge werden strukturiert, zusammengeführt und zu einem verständlichen Debattenstand entwickelt.",
  },
  {
    marker: "05",
    title: "Gemeinsam entscheiden",
    text: "Fakten werden nicht abgestimmt. Menschen entscheiden nachvollziehbar über Positionen und nächste Schritte.",
  },
  {
    marker: "06",
    title: "Von lokal bis global",
    text: "Ein Thema kann im eigenen Viertel beginnen und mit ähnlichen Entwicklungen weltweit verbunden werden.",
  },
] as const;

const PROCESS_STEPS = [
  {
    number: "1",
    title: "Voxy hört zu und strukturiert",
    text: "Du bringst eine Frage, Beobachtung, Idee oder Quelle ein.",
  },
  {
    number: "2",
    title: "Quellen und Perspektiven werden verbunden",
    text: "Belege, Aussagen und offene Punkte bleiben getrennt und nachvollziehbar.",
  },
  {
    number: "3",
    title: "Die Community prüft, ergänzt und entscheidet",
    text: "Der Debattenstand wächst gemeinsam. Entschieden wird über Positionen und nächste Schritte – veröffentlicht wird nur nach Prüfung.",
  },
] as const;

const TRUST_LINE =
  "eDebatte veröffentlicht nichts automatisch. Quellen, Prüfstatus und Beteiligung bleiben nachvollziehbar – du entscheidest den nächsten Schritt.";

function EntryLinkCard({ href, eyebrow, title, text, cta, gated = false }: EntryCard) {
  return (
    <Link
      href={href}
      data-testid="home-entry-card"
      data-requires-privacy-gate={gated ? "true" : undefined}
      className="group flex h-full min-h-[13rem] flex-col rounded-[1.8rem] border border-[rgba(114,178,236,0.2)] bg-[rgba(255,255,255,0.72)] px-5 py-5 text-left backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:border-[rgba(30,140,255,0.44)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)] dark:border-[rgba(112,180,240,0.14)] dark:bg-[rgba(8,25,54,0.7)] sm:px-6"
      style={{ boxShadow: "0 20px 48px rgba(11, 54, 105, 0.12)" }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgb(var(--grad-to))]">
        {eyebrow}
      </span>
      <h3 className="mt-4 text-[1.3rem] font-semibold tracking-tight text-[rgb(var(--fg))] sm:text-[1.45rem]">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[rgb(var(--fg))]/72 sm:text-[15px]">{text}</p>
      <span className="mt-auto pt-6 text-sm font-semibold text-[rgb(var(--grad-to))] transition group-hover:translate-x-0.5">
        {cta} →
      </span>
    </Link>
  );
}

function SegmentLinkCard({ href, title, text }: SegmentCard) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-[1.55rem] border border-[rgba(114,178,236,0.18)] bg-[rgba(255,255,255,0.62)] p-5 text-left backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:border-[rgba(30,140,255,0.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)] dark:border-[rgba(112,180,240,0.14)] dark:bg-[rgba(9,29,62,0.62)]"
      style={{ boxShadow: "0 16px 36px rgba(29, 88, 150, 0.09)" }}
    >
      <span aria-hidden="true" className="mb-5 h-1 w-12 rounded-full bg-[linear-gradient(90deg,#168cff,#20cfc8)]" />
      <h3 className="text-lg font-semibold tracking-tight text-[rgb(var(--fg))]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[rgb(var(--fg))]/70">{text}</p>
      <span className="mt-auto pt-5 text-sm font-semibold text-[rgb(var(--grad-to))]">
        Einstieg ansehen →
      </span>
    </Link>
  );
}

function BenefitCardView({ marker, title, text }: BenefitCard) {
  return (
    <article className="relative h-full overflow-hidden rounded-[1.45rem] border border-[rgba(105,171,231,0.18)] bg-[rgba(255,255,255,0.58)] p-5 backdrop-blur-sm dark:border-[rgba(112,180,240,0.13)] dark:bg-[rgba(7,24,51,0.7)] lg:p-4 xl:p-5">
      <span className="text-xs font-semibold tracking-[0.16em] text-[rgb(var(--grad-to))]">{marker}</span>
      <h3 className="mt-4 text-lg font-semibold tracking-tight text-[rgb(var(--fg))] lg:text-base xl:text-lg">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[rgb(var(--fg))]/74 lg:text-[13px] xl:text-sm">{text}</p>
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(24,140,255,0.72),rgba(32,207,200,0.5),transparent)]" />
    </article>
  );
}

export default function HomeSplitVoxyLanding({
  blocks: _blocks,
  experience,
}: HomeSplitVoxyLandingProps) {
  const isUnknownVisitor = experience.familiarity === "unknown_visitor";
  const primaryHref = isUnknownVisitor ? "/themen" : "/swipes";
  const primaryLabel = isUnknownVisitor ? "Debatten entdecken" : "Neu für dich öffnen";

  return (
    <section className="landing-canvas public-canvas public-start-canvas overflow-hidden">
      <div className="landing-shell public-shell public-start-shell !w-full !max-w-[88rem] !gap-0 !px-5 !pb-44 !pt-3 sm:!px-8 sm:!pb-36 md:!pb-28 lg:!px-10 lg:!pt-6">
        <section className="relative py-8 sm:py-12 lg:py-14" aria-labelledby="home-hero-title">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-[-18%] top-[-18rem] h-[38rem] rounded-full bg-[radial-gradient(circle,rgba(18,118,255,0.2),transparent_62%)] blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute right-[-12rem] top-[3rem] h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,rgba(24,207,200,0.16),transparent_66%)] blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-12">
            <HomeScrollReveal className="relative z-[2] max-w-[43rem]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgb(var(--grad-to))]">
                eDebatte · getragen von VoiceOpenGov
              </p>
              <h1 id="home-hero-title" className="mt-5 max-w-[43rem] text-[clamp(2.35rem,11vw,4.15rem)] font-semibold leading-[1.02] tracking-[-0.05em] text-[rgb(var(--fg))] lg:text-[clamp(3rem,4.2vw,4rem)]">
                <span className="block">Stimmen verbinden.</span>
                <span className="block bg-[linear-gradient(90deg,#168cff,#20cfc8)] bg-clip-text text-transparent">
                  Zusammenhänge sichtbar machen.
                </span>
                <span className="block">Gemeinsam entscheiden.</span>
              </h1>
              <p className="mt-6 max-w-[40rem] text-base leading-8 text-[rgb(var(--fg))]/76 sm:text-lg">
                Voxy hilft dir, Themen zu verstehen, Quellen einzuordnen und unterschiedliche Perspektiven zu verbinden – über Sprachen, Meinungen und Grenzen hinweg.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/create"
                  data-requires-privacy-gate="true"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(90deg,rgba(24,207,200,0.96),rgba(26,140,255,0.98))] px-6 py-3 text-sm font-semibold text-[rgb(var(--btn-primary-fg))] transition duration-200 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)]"
                  style={{ boxShadow: "0 14px 34px rgba(24, 140, 255, 0.26)" }}
                >
                  Thema einbringen
                </Link>
                <Link
                  href={primaryHref}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[rgba(74,142,204,0.28)] bg-[rgba(235,247,255,0.72)] px-6 py-3 text-sm font-semibold text-[rgb(var(--fg))] transition duration-200 hover:bg-[rgba(222,241,255,0.86)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)] dark:bg-[rgba(15,52,104,0.46)] dark:hover:bg-[rgba(18,65,126,0.58)]"
                >
                  {primaryLabel}
                </Link>
              </div>

              <Link
                href="/create"
                data-requires-privacy-gate="true"
                className="mt-7 inline-flex max-w-full items-center gap-3 rounded-full border border-[rgba(112,180,240,0.2)] bg-[rgba(255,255,255,0.5)] px-4 py-3 text-left text-sm text-[rgb(var(--fg))]/72 backdrop-blur-sm transition hover:border-[rgba(30,140,255,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)] dark:bg-[rgba(8,28,58,0.5)]"
              >
                <Image alt="" aria-hidden="true" className="h-8 w-8 rounded-full object-cover" height={32} src={VOXY_MINI_AVATAR.candidates[0]} width={32} />
                <span><strong className="font-semibold text-[rgb(var(--fg))]">Hallo Nachbar.</strong> Was bewegt dich?</span>
                <span aria-hidden="true">→</span>
              </Link>

              {!isUnknownVisitor ? (
                <div className="mt-5 rounded-[1.4rem] border border-[rgba(112,180,240,0.18)] bg-[rgba(255,255,255,0.38)] p-5 dark:bg-[rgba(8,28,58,0.4)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--grad-to))]">Dein nächster Schritt</p>
                  <p className="mt-2 text-sm leading-6 text-[rgb(var(--fg))]/74">{experience.helperText}</p>
                  {experience.workspaceHref ? (
                    <Link href={experience.workspaceHref} className="mt-4 inline-flex text-sm font-semibold text-[rgb(var(--grad-to))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.42)]">
                      {experience.workspaceLabel ?? "Arbeitsbereich öffnen"} →
                    </Link>
                  ) : null}
                </div>
              ) : null}

              <p className="mt-6 max-w-[40rem] text-sm leading-7 text-[rgb(var(--fg))]/72 sm:text-[15px]">{TRUST_LINE}</p>
            </HomeScrollReveal>

            <HomeScrollReveal className="relative mx-auto w-full max-w-[44rem]" delayMs={120}>
              <div className="relative overflow-hidden rounded-[2.4rem] border border-[rgba(112,180,240,0.22)] bg-[rgba(5,17,37,0.96)] p-2" style={{ boxShadow: "0 36px 90px rgba(4, 30, 68, 0.34)" }}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] lg:aspect-[6/5] xl:aspect-[4/3]">
                  <Image
                    alt="Voxy als Gastgeber am gemeinsamen eDebatte-Podcast-Tisch"
                    className="object-cover object-center"
                    fill
                    priority
                    sizes="(min-width: 1440px) 704px, (min-width: 1024px) 52vw, calc(100vw - 40px)"
                    src={VOXY_PODCAST_STAGE_ASSET}
                  />
                  <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,transparent_58%,rgba(2,10,24,0.62))]" />
                  <div className="absolute inset-x-5 bottom-5 rounded-[1.35rem] border border-white/15 bg-[rgba(3,14,33,0.72)] p-4 text-white backdrop-blur-md sm:inset-x-7 sm:bottom-7 sm:p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#67dbe0]">Voxy am gemeinsamen Tisch</p>
                    <p className="mt-2 text-lg font-semibold sm:text-xl">Zuhören. Einordnen. Gemeinsam weiterdenken.</p>
                  </div>
                </div>
              </div>
            </HomeScrollReveal>
          </div>

          <HomeScrollReveal
            className="relative mt-10 grid gap-5 border-y border-[rgba(112,180,240,0.16)] py-8 text-sm leading-7 text-[rgb(var(--fg))]/76 sm:mt-12 sm:text-[15px] lg:grid-cols-3 lg:gap-8"
            delayMs={80}
          >
            {CANONICAL_BRAND_NARRATIVE.map((paragraph) => (
              <p key={paragraph} data-testid="home-brand-narrative-paragraph">
                {paragraph}
              </p>
            ))}
          </HomeScrollReveal>
        </section>

        <section aria-labelledby="home-audience-title" className="py-10 sm:py-14">
          <HomeScrollReveal className="mx-auto max-w-[52rem] text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgb(var(--grad-to))]">Für wen ist eDebatte?</p>
            <h2 id="home-audience-title" className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[rgb(var(--fg))] sm:text-4xl">
              Für alle, die mitreden und mitgestalten wollen.
            </h2>
            <p className="mt-4 text-base leading-7 text-[rgb(var(--fg))]/70">
              Unterschiedliche Aufgaben, dieselbe nachvollziehbare Infrastruktur für Quellen, Perspektiven, Beteiligung und Debattenstände.
            </p>
          </HomeScrollReveal>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {SEGMENT_CARDS.map((card, index) => (
              <HomeScrollReveal key={card.title} delayMs={index * 70}>
                <SegmentLinkCard {...card} />
              </HomeScrollReveal>
            ))}
          </div>
        </section>

        <section aria-labelledby="home-benefits-title" className="relative py-10 sm:py-14">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-[8%] top-1/2 h-px bg-[linear-gradient(90deg,transparent,rgba(24,140,255,0.35),rgba(32,207,200,0.28),transparent)]" />
          <HomeScrollReveal className="mx-auto max-w-[52rem] text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgb(var(--grad-to))]">Warum eDebatte?</p>
            <h2 id="home-benefits-title" className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[rgb(var(--fg))] sm:text-4xl">
              Mehr Klarheit. Mehr Tiefe. Mehr Wirkung.
            </h2>
          </HomeScrollReveal>
          <div className="relative mt-8 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {BENEFIT_CARDS.map((benefit, index) => (
              <HomeScrollReveal key={benefit.title} delayMs={index * 45}>
                <BenefitCardView {...benefit} />
              </HomeScrollReveal>
            ))}
          </div>
        </section>

        <section aria-labelledby="home-process-title" className="py-10 sm:py-14">
          <HomeScrollReveal className="rounded-[2.2rem] border border-[rgba(112,180,240,0.18)] bg-[linear-gradient(145deg,rgba(243,250,255,0.82),rgba(218,239,255,0.62))] p-6 dark:border-[rgba(112,180,240,0.13)] dark:bg-[linear-gradient(145deg,rgba(7,22,48,0.9),rgba(10,39,80,0.62))] sm:p-9 lg:p-11">
            <div className="mx-auto max-w-[52rem] text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgb(var(--grad-to))]">So begleitet dich Voxy</p>
              <h2 id="home-process-title" className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[rgb(var(--fg))] sm:text-4xl">
                Vom ersten Gedanken zum gemeinsamen Debattenstand.
              </h2>
            </div>
            <div className="mt-9 grid gap-7 lg:grid-cols-3">
              {PROCESS_STEPS.map((step, index) => (
                <div key={step.number} className="relative text-center lg:text-left">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#168cff,#20cfc8)] text-sm font-bold text-white lg:mx-0">{step.number}</div>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight text-[rgb(var(--fg))]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[rgb(var(--fg))]/74">{step.text}</p>
                  {index < PROCESS_STEPS.length - 1 ? <span aria-hidden="true" className="absolute -right-4 top-5 hidden text-2xl text-[rgb(var(--grad-to))]/45 lg:block">→</span> : null}
                </div>
              ))}
            </div>
          </HomeScrollReveal>
        </section>

        <section aria-labelledby="home-entry-title" className="py-10 sm:py-14">
          <HomeScrollReveal className="max-w-[50rem]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgb(var(--grad-to))]">Dein Einstieg</p>
            <h2 id="home-entry-title" className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[rgb(var(--fg))] sm:text-4xl">
              Lesen, beitragen, mitwirken oder tiefer einsteigen.
            </h2>
            <p className="mt-4 text-base leading-7 text-[rgb(var(--fg))]/70">
              Alles bleibt Teil desselben Themen-, Dossier- und Beteiligungskosmos – statt in getrennten Kommentarspalten zu verschwinden.
            </p>
          </HomeScrollReveal>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {ENTRY_CARDS.map((card, index) => (
              <HomeScrollReveal key={card.href} delayMs={index * 70}>
                <EntryLinkCard {...card} />
              </HomeScrollReveal>
            ))}
          </div>
        </section>

        <section aria-labelledby="home-closing-title" className="pb-8 pt-10 sm:pb-12 sm:pt-14">
          <HomeScrollReveal className="flex flex-col gap-7 rounded-[2rem] border border-[rgba(112,180,240,0.2)] bg-[linear-gradient(135deg,rgba(9,38,82,0.9),rgba(5,22,48,0.96))] p-6 text-white sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] !text-[#67dbe0]">Gemeinsam weiterdenken</p>
              <h2 id="home-closing-title" className="mt-3 text-3xl font-semibold tracking-[-0.035em] !text-white sm:text-4xl">
                <span className="block">Jeder Mensch sieht einen Teil.</span>
                <span className="block text-[#67dbe0]">Gemeinsam sehen wir mehr.</span>
              </h2>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link
                href="/create"
                data-requires-privacy-gate="true"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(90deg,rgba(24,207,200,0.96),rgba(26,140,255,0.98))] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                Thema einbringen
              </Link>
              <Link
                href="/themen"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/24 bg-[rgba(255,255,255,0.08)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[rgba(255,255,255,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                Debatten entdecken
              </Link>
            </div>
          </HomeScrollReveal>
        </section>
      </div>

      <Link
        href="/create"
        data-testid="home-voxy-launcher"
        data-requires-privacy-gate="true"
        data-overlay-safe-offset="mobile-bottom-navigation"
        aria-label="Mit Voxy ein Thema einbringen"
        className="group fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] right-4 z-30 flex items-end gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--grad-to),0.55)] md:bottom-7 md:right-7"
      >
        <span className="hidden max-w-[15rem] translate-y-1 rounded-[1.15rem] border border-[rgba(112,180,240,0.22)] bg-[rgba(255,255,255,0.94)] px-4 py-3 text-sm leading-5 text-[rgb(var(--fg))] opacity-0 backdrop-blur-md transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 dark:bg-[rgba(7,24,51,0.94)] md:block" style={{ boxShadow: "0 18px 46px rgba(4, 30, 68, 0.22)" }}>
          <strong className="block font-semibold">Hallo Nachbar.</strong>
          Soll ich dir helfen, dein Thema zu sortieren?
        </span>
        <span className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-[rgba(42,150,255,0.72)] bg-[rgb(var(--surface))] transition group-hover:-translate-y-1 md:h-16 md:w-16" style={{ boxShadow: "0 20px 52px rgba(4, 30, 68, 0.3)" }}>
          <Image alt="" aria-hidden="true" className="h-full w-full object-cover" height={64} src={VOXY_MINI_AVATAR.candidates[0]} width={64} />
        </span>
      </Link>
    </section>
  );
}
