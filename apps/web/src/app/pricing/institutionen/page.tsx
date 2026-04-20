import Link from "next/link";
import ProductSurfaceShell from "@/components/layout/ProductSurfaceShell";
import {
  getInstitutionalAddOnById,
  getInstitutionalAddOnMaturityMeta,
  getInstitutionalPricingSegments,
  getInstitutionalSelectionFrames,
  getInstitutionalSelectionGoals,
  normalizeInstitutionalSelectionFrameId,
  normalizeInstitutionalSelectionGoalId,
  normalizePricingLocale,
  normalizePricingSegmentId,
  recommendInstitutionalConfiguration,
  type InstitutionalPricingSegmentId,
  type PricingLocale,
} from "@features/pricing";

const SALES_EMAIL = "sales@edebatte.org";

const PAGE_COPY = {
  de: {
    heroTitle: "Institutionelle Konditionen",
    heroIntro:
      "Beantworte ein paar Fragen zu Einsatz, Ziel und Rahmen. Wir schlagen dir das passende Modell und sinnvolle Erweiterungen vor.",
    directToSelection: "Direkt zur Auswahl",
    contact: "Kontakt",
    toPrivateOverview: "Zur Privatübersicht",
    selectionTitle: "Triff deine Vorauswahl",
    step1: "1. Wer seid ihr?",
    step2: "2. Was steht im Vordergrund?",
    step3: "3. Wie sieht euer Einsatzrahmen aus?",
    segmentOrganization: "Organisation / Verband / Verein",
    segmentMunicipality: "Kommune / Verwaltung / Landkreis",
    recommendationTitle: "Empfohlene Konfiguration",
    recommendationSubtitle: "Basispaket, Mehrwert im Arbeitsalltag und sinnvolle Erweiterungen",
    coveredBy: "Was damit abgedeckt ist",
    gapHint: "Was optional ergänzt werden kann",
    valueTitle: "Welchen Unterschied es macht",
    recommendedAddOns: "Empfohlene Erweiterungen",
    optionalAddOns: "Optional",
    optionalAddOnsHint: "Ergänzen, wenn es im Einsatzkontext wirklich hilft.",
    needBasedAddOns: "Nur bei Bedarf",
    needBasedAddOnsHint: "Diese Bausteine brauchen meist zusätzliche Klärung.",
    statusLabel: "Status",
    statusDirect: "Direkt bestellbar",
    statusWithQuestions: "Mit Rückfragen",
    statusClarification: "Nur nach Klärung",
    ctaApply: "Empfehlung übernehmen",
    ctaOrder: "Direkt bestellen",
    ctaQuote: "Kostenvoranschlag anfordern",
    ctaQuoteDownload: "Downloadlink anfordern",
    ctaConversation: "Gespräch anfragen",
    ctaBackPricing: "Zur Preisübersicht",
    ctaContactSales: "Kontakt an sales@edebatte.org",
    quoteDownloadHint:
      "Der Downloadlink wird im Bestellfluss erst nach Pflichtangaben angefordert und separat per E-Mail versendet.",
    contactPathsTitle: "Kontaktwege",
    contactPathTeam: "Kontakt zum Team",
    contactPathTeams: "MS Teams",
    contactPathEmail: "E-Mail",
    contactPathPhone: "Telefonisch",
    alternativeTitle: "Alternative Stufe",
    forWhom: "Für wen",
    recommendedFor: "Typisch für",
    maturity: "Bestellbarkeit",
  },
  en: {
    heroTitle: "Institutional conditions",
    heroIntro:
      "Answer a few questions about target use and operating frame. We recommend the best-fit model and useful extensions.",
    directToSelection: "Jump to guided selection",
    contact: "Contact",
    toPrivateOverview: "Back to civic pricing",
    selectionTitle: "Make your preselection",
    step1: "1. Who are you?",
    step2: "2. What is your primary goal?",
    step3: "3. What is your operating frame?",
    segmentOrganization: "Organization / association / NGO",
    segmentMunicipality: "Municipality / administration / district",
    recommendationTitle: "Recommended configuration",
    recommendationSubtitle: "Base package, practical value and useful extensions",
    coveredBy: "What this covers",
    gapHint: "What can be added optionally",
    valueTitle: "What difference it makes",
    recommendedAddOns: "Recommended extensions",
    optionalAddOns: "Optional",
    optionalAddOnsHint: "Add when it clearly helps in your setup.",
    needBasedAddOns: "Need-based only",
    needBasedAddOnsHint: "These modules usually require additional alignment.",
    statusLabel: "Status",
    statusDirect: "Directly orderable",
    statusWithQuestions: "With follow-up questions",
    statusClarification: "Clarification required",
    ctaApply: "Apply recommendation",
    ctaOrder: "Direct order",
    ctaQuote: "Request quote",
    ctaQuoteDownload: "Request download link",
    ctaConversation: "Request conversation",
    ctaBackPricing: "Back to pricing",
    ctaContactSales: "Contact sales@edebatte.org",
    quoteDownloadHint:
      "The download link is requested in the order flow after required details and sent separately by email.",
    contactPathsTitle: "Contact paths",
    contactPathTeam: "Contact team",
    contactPathTeams: "MS Teams",
    contactPathEmail: "Email",
    contactPathPhone: "Phone",
    alternativeTitle: "Alternative tier",
    forWhom: "For whom",
    recommendedFor: "Typical for",
    maturity: "Orderability",
  },
} as const;

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

function firstString(value?: string | string[]) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return null;
}

function withLocaleHref(href: string, locale: PricingLocale) {
  if (locale !== "en") return href;
  const [pathAndQuery, hash = ""] = href.split("#");
  const [path, query = ""] = pathAndQuery.split("?");
  const params = new URLSearchParams(query);
  params.set("lang", "en");
  const queryString = params.toString();
  return `${path}${queryString ? `?${queryString}` : ""}${hash ? `#${hash}` : ""}`;
}

function buildInstitutionalStateHref(args: {
  locale: PricingLocale;
  segment: InstitutionalPricingSegmentId;
  goal: string;
  frame: string;
}) {
  const params = new URLSearchParams();
  params.set("segment", args.segment);
  params.set("goal", args.goal);
  params.set("frame", args.frame);
  if (args.locale === "en") params.set("lang", "en");
  return `/pricing/institutionen?${params.toString()}#guided-selection`;
}

function buildVormerkenHref(args: {
  locale: PricingLocale;
  segment: InstitutionalPricingSegmentId;
  packageId: string;
  addOnIds?: readonly string[];
  goal: string;
  frame: string;
  quote?: boolean;
  completion?: "direct_order" | "quote_request" | "conversation_request";
}) {
  const params = new URLSearchParams();
  params.set("segment", args.segment);
  params.set("paket", args.packageId);
  params.set("goal", args.goal);
  params.set("frame", args.frame);
  if (args.addOnIds && args.addOnIds.length > 0) {
    params.set("addons", args.addOnIds.join(","));
  }
  if (args.quote) params.set("quote", "1");
  if (args.completion) params.set("completion", args.completion);
  if (args.locale === "en") params.set("lang", "en");
  return `/order?${params.toString()}`;
}

export default async function InstitutionalPricingPage({ searchParams }: PageProps = {}) {
  const params = (await searchParams) ?? {};
  const locale = normalizePricingLocale(firstString(params.lang));
  const text = PAGE_COPY[locale];

  const rawSegment = normalizePricingSegmentId(firstString(params.segment));
  const segment: InstitutionalPricingSegmentId =
    rawSegment === "organisationen" || rawSegment === "kommunen" ? rawSegment : "organisationen";

  const goals = getInstitutionalSelectionGoals(locale);
  const frames = getInstitutionalSelectionFrames(locale);
  const selectedGoal = normalizeInstitutionalSelectionGoalId(firstString(params.goal)) ?? goals[0].id;
  const selectedFrame = normalizeInstitutionalSelectionFrameId(firstString(params.frame)) ?? frames[1].id;
  const selectedGoalOption = goals.find((goal) => goal.id === selectedGoal) ?? goals[0] ?? null;
  const selectedFrameOption = frames.find((frame) => frame.id === selectedFrame) ?? frames[0] ?? null;

  const recommendation = recommendInstitutionalConfiguration({
    segmentId: segment,
    goalId: selectedGoal,
    frameId: selectedFrame,
    locale,
  });

  const segmentData = getInstitutionalPricingSegments(locale).find((entry) => entry.id === segment);
  if (!segmentData) {
    return null;
  }
  const organizationSegment = getInstitutionalPricingSegments(locale).find((entry) => entry.id === "organisationen");
  const municipalSegment = getInstitutionalPricingSegments(locale).find((entry) => entry.id === "kommunen");

  const recommendedPackage = segmentData.packageOptions.find(
    (entry) => entry.packageId === recommendation.recommendedPackageId,
  );
  const alternativePackage = segmentData.packageOptions.find(
    (entry) => entry.packageId === recommendation.alternativePackageId,
  );

  const recommendedAddOns = recommendation.recommendedAddOnIds
    .map((id) => getInstitutionalAddOnById(id, locale))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  const optionalAddOns = recommendation.optionalAddOnIds
    .map((id) => getInstitutionalAddOnById(id, locale))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  const optionalAddOnsTier = optionalAddOns.filter((addOn) => {
    const maturity = getInstitutionalAddOnMaturityMeta(addOn.maturity, locale);
    return maturity.fullyOperational && !maturity.requiresFollowupAlignment;
  });
  const needBasedAddOns = optionalAddOns.filter((addOn) => {
    const maturity = getInstitutionalAddOnMaturityMeta(addOn.maturity, locale);
    return !maturity.fullyOperational || maturity.requiresFollowupAlignment;
  });

  const stateHref = (next: {
    segment?: InstitutionalPricingSegmentId;
    goal?: string;
    frame?: string;
  }) =>
    buildInstitutionalStateHref({
      locale,
      segment: next.segment ?? segment,
      goal: next.goal ?? selectedGoal,
      frame: next.frame ?? selectedFrame,
    });

  const applyRecommendationHref = buildVormerkenHref({
    locale,
    segment,
    packageId: recommendation.recommendedPackageId,
    addOnIds: recommendation.recommendedAddOnIds,
    goal: recommendation.goalId,
    frame: recommendation.frameId,
    completion: "direct_order",
  });

  const directOrderHref = buildVormerkenHref({
    locale,
    segment,
    packageId: recommendation.recommendedPackageId,
    goal: recommendation.goalId,
    frame: recommendation.frameId,
    completion: "direct_order",
  });

  const quoteHref = buildVormerkenHref({
    locale,
    segment,
    packageId: recommendation.recommendedPackageId,
    addOnIds: recommendation.recommendedAddOnIds,
    goal: recommendation.goalId,
    frame: recommendation.frameId,
    completion: "quote_request",
  });

  const quoteDownloadHref = buildVormerkenHref({
    locale,
    segment,
    packageId: recommendation.recommendedPackageId,
    addOnIds: recommendation.recommendedAddOnIds,
    goal: recommendation.goalId,
    frame: recommendation.frameId,
    quote: true,
    completion: "quote_request",
  });

  const conversationHref = buildVormerkenHref({
    locale,
    segment,
    packageId: recommendation.recommendedPackageId,
    addOnIds: recommendation.recommendedAddOnIds,
    goal: recommendation.goalId,
    frame: recommendation.frameId,
    completion: "conversation_request",
  });
  const teamContactHref = withLocaleHref("/kontakt?channel=team", locale);
  const phoneContactHref = withLocaleHref("/kontakt?channel=phone", locale);
  const teamsHref = "https://teams.microsoft.com/l/chat/0/0?users=sales@edebatte.org";

  return (
    <ProductSurfaceShell>
      <header className="rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {locale === "en" ? "Institutional pricing flow" : "Institutioneller Preisfluss"}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[rgb(var(--fg))] sm:text-4xl">{text.heroTitle}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[rgb(var(--muted))]">{text.heroIntro}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#guided-selection" className="btn-primary">
            {text.directToSelection}
          </a>
          <a href={`mailto:${SALES_EMAIL}`} className="btn-secondary">
            {text.contact}
          </a>
          <Link href={withLocaleHref("/pricing", locale)} className="btn-secondary">
            {text.toPrivateOverview}
          </Link>
        </div>
      </header>

      <section id="guided-selection" className="mt-8 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm sm:p-6">
        <div className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.selectionTitle}</p>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.step1}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <Link
                href={stateHref({ segment: "organisationen" })}
                className={[
                  "rounded-2xl border px-4 py-3 text-left text-sm",
                  segment === "organisationen"
                    ? "border-sky-300 bg-sky-50 text-sky-900"
                    : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))]",
                ].join(" ")}
              >
                <span className="block font-semibold">{text.segmentOrganization}</span>
                <span className="mt-1 block text-xs">{organizationSegment?.forWhom[0]}</span>
              </Link>
              <Link
                href={stateHref({ segment: "kommunen" })}
                className={[
                  "rounded-2xl border px-4 py-3 text-left text-sm",
                  segment === "kommunen"
                    ? "border-sky-300 bg-sky-50 text-sky-900"
                    : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))]",
                ].join(" ")}
              >
                <span className="block font-semibold">{text.segmentMunicipality}</span>
                <span className="mt-1 block text-xs">{municipalSegment?.forWhom[0]}</span>
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.step2}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {goals.map((goal) => (
                <Link
                  key={goal.id}
                  href={stateHref({ goal: goal.id })}
                  className={[
                    "rounded-2xl border px-4 py-3 text-left text-sm",
                    selectedGoal === goal.id
                      ? "border-sky-300 bg-sky-50 text-sky-900"
                      : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))]",
                  ].join(" ")}
                >
                  <span className="block font-semibold">{goal.title}</span>
                  <span className="mt-1 block text-xs">{goal.detail}</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.step3}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {frames.map((frame) => (
                <Link
                  key={frame.id}
                  href={stateHref({ frame: frame.id })}
                  className={[
                    "rounded-2xl border px-4 py-3 text-left text-sm",
                    selectedFrame === frame.id
                      ? "border-sky-300 bg-sky-50 text-sky-900"
                      : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))]",
                  ].join(" ")}
                >
                  <span className="block font-semibold">{frame.title}</span>
                  <span className="mt-1 block text-xs">{frame.detail}</span>
                </Link>
              ))}
            </div>
          </div>
          <p className="text-xs text-[rgb(var(--muted))]">
            {(segment === "kommunen" ? text.segmentMunicipality : text.segmentOrganization)} · {selectedGoalOption?.title ?? ""} ·{" "}
            {selectedFrameOption?.title ?? ""}
          </p>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border-2 border-sky-400/80 bg-[linear-gradient(145deg,rgba(14,165,233,0.16),rgba(255,255,255,0.9))] p-7 shadow-[0_22px_60px_rgba(14,165,233,0.18)] dark:bg-[linear-gradient(145deg,rgba(14,165,233,0.2),rgba(15,23,42,0.5))]">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-900 dark:text-sky-100">{text.recommendationTitle}</p>
        <p className="mt-1 text-sm font-medium text-sky-900/90 dark:text-sky-100/90">{text.recommendationSubtitle}</p>

        <div className="mt-4 rounded-2xl border border-sky-300/80 bg-white/90 p-5 text-sm shadow-sm dark:bg-slate-900/40">
          <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">
            {recommendedPackage?.title ?? recommendation.recommendedPackageId}
          </h2>
          <p className="mt-2 text-[rgb(var(--muted))]">{recommendation.whyRecommended}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.coveredBy}</p>
          <p className="mt-1 text-[rgb(var(--muted))]">{recommendation.coveredByPackage}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.gapHint}</p>
          <p className="mt-1 text-[rgb(var(--muted))]">{recommendation.gapHint}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.valueTitle}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[rgb(var(--muted))]">
            {recommendation.roiHighlights.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        {alternativePackage ? (
          <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.alternativeTitle}</p>
            <p className="mt-1 font-semibold text-[rgb(var(--fg))]">{alternativePackage.title}</p>
            <p className="mt-1 text-[rgb(var(--muted))]">{alternativePackage.detail}</p>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={applyRecommendationHref} className="btn-primary">
            {text.ctaApply}
          </Link>
          <Link href={directOrderHref} className="btn-primary">
            {text.ctaOrder}
          </Link>
          <Link href={quoteHref} className="btn-secondary">
            {text.ctaQuote}
          </Link>
          <Link href={quoteDownloadHref} className="btn-secondary">
            {text.ctaQuoteDownload}
          </Link>
          <Link href={conversationHref} className="inline-flex items-center rounded-full px-3 py-2 text-sm font-semibold text-[rgb(var(--muted))] underline-offset-2 hover:underline">
            {text.ctaConversation}
          </Link>
        </div>
        <p className="mt-3 text-xs text-[rgb(var(--muted))]">{text.quoteDownloadHint}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          <Link href={withLocaleHref("/pricing", locale)} className="text-[rgb(var(--muted))] underline-offset-2 hover:underline">
            {text.ctaBackPricing}
          </Link>
          <a href={`mailto:${SALES_EMAIL}`} className="text-[rgb(var(--muted))] underline-offset-2 hover:underline">
            {text.ctaContactSales}
          </a>
        </div>
        <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.contactPathsTitle}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a href={teamContactHref} className="btn-secondary">{text.contactPathTeam}</a>
            <a href={teamsHref} target="_blank" rel="noreferrer" className="btn-secondary">{text.contactPathTeams}</a>
            <a href={`mailto:${SALES_EMAIL}`} className="btn-secondary">{text.contactPathEmail}</a>
            <a href={phoneContactHref} className="btn-secondary">{text.contactPathPhone}</a>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.recommendedAddOns}</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {recommendedAddOns.map((addOn) => {
            const status =
              addOn.maturity === "direct_orderable"
                ? text.statusDirect
                : addOn.maturity === "orderable_review_required"
                  ? text.statusWithQuestions
                  : text.statusClarification;
            return (
              <article key={addOn.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">{addOn.title}</p>
                <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">{addOn.priceLabel}</p>
                <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">{addOn.whenUseful}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.statusLabel}</p>
                <p className="mt-1 text-xs leading-relaxed text-[rgb(var(--muted))]">{status}</p>
                <Link
                  href={buildVormerkenHref({
                    locale,
                    segment,
                    packageId: recommendation.recommendedPackageId,
                    addOnIds: [addOn.id],
                    goal: recommendation.goalId,
                    frame: recommendation.frameId,
                  })}
                  className="btn-secondary mt-3 inline-flex"
                >
                  {locale === "en" ? "Add in configurator" : "Im Konfigurator ergänzen"}
                </Link>
              </article>
            );
          })}
        </div>

        <details className="mt-5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
          <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">{text.optionalAddOns}</summary>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">{text.optionalAddOnsHint}</p>
          <ul className="mt-3 space-y-2 text-sm text-[rgb(var(--muted))]">
            {optionalAddOnsTier.map((addOn) => {
              const status =
                addOn.maturity === "direct_orderable"
                  ? text.statusDirect
                  : addOn.maturity === "orderable_review_required"
                    ? text.statusWithQuestions
                    : text.statusClarification;
              return (
                <li key={addOn.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
                  <p className="font-semibold text-[rgb(var(--fg))]">{addOn.title}</p>
                  <p>{addOn.priceLabel}</p>
                  <p className="mt-1 text-xs">{addOn.whenUseful}</p>
                  <p className="mt-1 text-xs">{text.statusLabel}: {status}</p>
                </li>
              );
            })}
          </ul>
        </details>

        <details className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
          <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">{text.needBasedAddOns}</summary>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">{text.needBasedAddOnsHint}</p>
          <ul className="mt-3 space-y-2 text-sm text-[rgb(var(--muted))]">
            {needBasedAddOns.map((addOn) => (
              <li key={addOn.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
                <p className="font-semibold text-[rgb(var(--fg))]">{addOn.title}</p>
                <p>{addOn.priceLabel}</p>
                <p className="mt-1 text-xs">{addOn.whenUseful}</p>
                <p className="mt-1 text-xs">{text.statusLabel}: {text.statusClarification}</p>
              </li>
            ))}
          </ul>
        </details>
      </section>
    </ProductSurfaceShell>
  );
}
