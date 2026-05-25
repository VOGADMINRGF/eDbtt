import Link from "next/link";
import ProductSurfaceShell from "@/components/layout/ProductSurfaceShell";
import {
  formatPackageBillingModeLabel,
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
    step2Municipal: "2. Welcher Beteiligungs- oder Vergabebedarf steht im Vordergrund?",
    step3Municipal: "3. Welcher Beschaffungs- und Einsatzrahmen passt?",
    segmentOrganization: "Beteiligungsbüro / Agentur / Organisation",
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
    segmentBoundaryTitle: "B2G und B2B klar getrennt",
    segmentBoundaryMunicipal:
      "Kommunen kaufen Beteiligungsleistungen, Pilotpakete oder vergabefähige Leistungsbausteine.",
    segmentBoundaryOrg:
      "Organisationen/Beteiligungsbüros nutzen eDebatte als Werkzeug-, Dossier-, Studio- und Beteiligungsinfrastruktur für eigene Projekte.",
    municipalContextTitle: "Kommunale Einordnung vor dem Paket",
    municipalContextText:
      "Vor einer Beteiligungsleistung müssen Anlass, Region, Sachstand, Zuständigkeit und Verfahren sauber eingeordnet werden. eDebatte unterstützt diese Strukturierung, ersetzt aber keine Rechtsprüfung und keine gesetzlich vorgeschriebene formelle Beteiligung.",
    municipalContextPoints: [
      "Regionaler Anlass / Gebiet",
      "Kommunaler Sachstand",
      "Zuständigkeit / Fachbereich",
      "formelle oder informelle Beteiligung",
      "Quellenlage und offene Fragen",
      "gewünschtes Ergebnis: Check, Dossier, Runde, Betrieb oder Vergabepaket",
    ],
    legalPricingHint: "B2B- und B2G-Preise verstehen sich zzgl. MwSt.",
    annualHint: "Jährliche Zahlung wird bevorzugt.",
    billingModeLabel: "Abrechnungsmodus",
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
    step2Municipal: "2. Which participation or procurement need is primary?",
    step3Municipal: "3. Which procurement and deployment frame fits?",
    segmentOrganization: "Participation office / agency / organization",
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
    segmentBoundaryTitle: "B2G and B2B are distinct",
    segmentBoundaryMunicipal:
      "Municipalities buy participation services, pilot packages or procurement-ready service modules.",
    segmentBoundaryOrg:
      "Organizations/participation offices use eDebatte as tooling, dossier, studio and participation infrastructure for their own projects.",
    municipalContextTitle: "Municipal classification before package choice",
    municipalContextText:
      "Before any participation service, trigger, region, status, responsibility and procedure must be classified. eDebatte supports this structure but does not replace legal review or statutory formal participation duties.",
    municipalContextPoints: [
      "Regional trigger / territory",
      "Municipal status baseline",
      "Responsibility / department",
      "Formal or informal participation path",
      "Source context and open questions",
      "Desired outcome: check, dossier, round, operations or procurement package",
    ],
    legalPricingHint: "B2B and B2G prices are stated plus VAT.",
    annualHint: "Annual billing is preferred.",
    billingModeLabel: "Billing mode",
  },
} as const;

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

type MunicipalTenderCard = {
  id: "beteiligungs_check" | "dossier_runde" | "betrieb_kommune" | "vergabe_rahmenvertrag";
  name: string;
  priceTag: string;
  billingMode: string;
  purpose: string;
  typicalUseCases: readonly string[];
  services: readonly string[];
  deliverable: string;
  orderability: string;
  procurementHint: string;
  ctaLabel: string;
  href: string;
};

type B2BPartnerCard = {
  id: "starter" | "projektpartner" | "buero_betrieb" | "partner_rahmen";
  name: string;
  priceTag: string;
  billingMode: string;
  forWhom: string;
  typicalUse: string;
  services: readonly string[];
  result: string;
  orderability: string;
  note: string;
  ctaLabel: string;
  href: string;
  secondaryCtaLabel?: string;
  secondaryHref?: string;
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

function withVatSuffix(priceLabel: string, locale: PricingLocale) {
  if (/mwst|vat/i.test(priceLabel)) return priceLabel;
  return locale === "en" ? `${priceLabel} + VAT` : `${priceLabel} zzgl. MwSt.`;
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

function buildMunicipalTenderCards(args: {
  locale: PricingLocale;
  goal: string;
  frame: string;
}): readonly MunicipalTenderCard[] {
  const card1Href = buildVormerkenHref({
    locale: args.locale,
    segment: "kommunen",
    packageId: "b2g_basis",
    goal: args.goal,
    frame: args.frame,
    completion: "direct_order",
    addOnIds: ["reports_outcomes"],
  });
  const card2Href = buildVormerkenHref({
    locale: args.locale,
    segment: "kommunen",
    packageId: "b2g_basis",
    goal: args.goal,
    frame: args.frame,
    completion: "quote_request",
    addOnIds: ["reports_outcomes", "companion_kommunikation"],
    quote: true,
  });
  const card3Href = buildVormerkenHref({
    locale: args.locale,
    segment: "kommunen",
    packageId: "b2g_pro",
    goal: args.goal,
    frame: args.frame,
    completion: "conversation_request",
    addOnIds: ["managed_governance", "reports_outcomes", "moderation_assistenz"],
  });
  const card4Href = buildVormerkenHref({
    locale: args.locale,
    segment: "kommunen",
    packageId: "b2g_pro",
    goal: args.goal,
    frame: args.frame,
    completion: "quote_request",
    addOnIds: ["managed_governance", "reports_outcomes", "faktencheck_kontingent"],
    quote: true,
  });

  if (args.locale === "en") {
    return [
      {
        id: "beteiligungs_check",
        name: "Participation Check",
        priceTag: "from €2,500 one-time + VAT",
        billingMode: "one-time",
        purpose: "Early-stage pre-check for municipalities and public buyers.",
        typicalUseCases: [
          "Topic scoping before public launch",
          "Pre-briefing for administration and committees",
          "Pilot assessment before procurement escalation",
        ],
        services: [
          "Classify topic and trigger context",
          "Check source landscape and open issues",
          "Assess participation readiness",
          "Recommend suitable next format",
        ],
        deliverable: "Participation check memo with next-step recommendation and pilot scope.",
        orderability: "Cost estimate possible · directly reservable",
        procurementHint: "Suitable as pilot package and preparatory service package.",
        ctaLabel: "Reserve pilot",
        href: card1Href,
      },
      {
        id: "dossier_runde",
        name: "Dossier & Participation Round",
        priceTag: "project-based + VAT (typically one-time)",
        billingMode: "project-based / one-time",
        purpose: "For one concrete municipal topic with public feedback loop.",
        typicalUseCases: [
          "District-level issue discussions",
          "Topic-focused feedback rounds",
          "Project-specific pilot participation",
        ],
        services: [
          "Dossier with source and position structure",
          "Options/eventualities and participation question",
          "QR/link access and response channel",
          "Result overview and result documentation",
        ],
        deliverable: "Topic dossier plus documented participation round with outcome summary.",
        orderability: "Orderable with follow-up questions · pilot package suitable",
        procurementHint: "Cost estimate and service description request available.",
        ctaLabel: "Request cost estimate",
        href: card2Href,
      },
      {
        id: "betrieb_kommune",
        name: "Municipal Participation Operations",
        priceTag: "from €4,500 / month + VAT",
        billingMode: "monthly · annual billing preferred",
        purpose: "For recurring participation across multiple topics.",
        typicalUseCases: [
          "Recurring participation operations",
          "Cross-department participation coordination",
          "Continuous reporting to administration and councils",
        ],
        services: [
          "Multiple topics/dossiers/rounds",
          "Role and rights concept",
          "Admin access, templates and status logic",
          "Regular reports and outcomes",
        ],
        deliverable: "Operational participation framework with reusable templates and reporting cadence.",
        orderability: "Offer after clarification",
        procurementHint: "Framework-agreement suitable.",
        ctaLabel: "Request conversation",
        href: card3Href,
      },
      {
        id: "vergabe_rahmenvertrag",
        name: "Procurement / Framework Package",
        priceTag: "offer after clarification + VAT",
        billingMode: "clarification-first / framework-based",
        purpose: "For formal tender preparation and framework agreement setup.",
        typicalUseCases: [
          "Preparation of procurement documents",
          "Service package and lot structure definition",
          "Structured support for follow-up operations",
        ],
        services: [
          "Service description draft package",
          "Optional lot structure",
          "Data protection / security appendix draft",
          "Support, acceptance and documentation logic",
        ],
        deliverable: "Procurement-oriented service description draft with annex structure and acceptance logic.",
        orderability: "Only after clarification",
        procurementHint: "Orientation only: no legal procurement advice.",
        ctaLabel: "Request service description",
        href: card4Href,
      },
    ] as const;
  }

  return [
    {
      id: "beteiligungs_check",
      name: "Beteiligungs-Check",
      priceTag: "ab 2.500 € einmalig zzgl. MwSt.",
      billingMode: "einmalig",
      purpose: "Frühe Vorprüfung für Kommunen, Verwaltungen und öffentliche Auftraggeber.",
      typicalUseCases: [
        "Thema vor öffentlichem Start einordnen",
        "Vorbereitung für Verwaltung und Gremien",
        "Pilotprüfung vor weiterer Vergabetiefe",
      ],
      services: [
        "Thema und Anlass einordnen",
        "Quellenlage und offene Fragen prüfen",
        "Beteiligungsreife bewerten",
        "Empfehlung für Format und nächsten Schritt",
      ],
      deliverable: "Kurzbericht zur Beteiligungsreife mit nächstem Schritt und Pilotrahmen.",
      orderability: "Kostenvoranschlag möglich · direkt vormerkbar",
      procurementHint: "Als Pilotpaket und vorbereitender Leistungsbaustein geeignet.",
      ctaLabel: "Pilot vormerken",
      href: card1Href,
    },
    {
      id: "dossier_runde",
      name: "Dossier & Beteiligungsrunde",
      priceTag: "projektbezogen zzgl. MwSt. (typisch einmalig)",
      billingMode: "projektbezogen / einmalig",
      purpose: "Für ein konkretes kommunales Thema mit nachvollziehbarer Rückmeldung.",
      typicalUseCases: [
        "Stadtteil- und Projektthemen",
        "Beteiligungsrunde zu klarer Fragestellung",
        "Pilotpaket mit dokumentierter Ergebnislage",
      ],
      services: [
        "Dossier mit Quellen- und Positionenstruktur",
        "Optionen/Eventualitäten und Beteiligungsfrage",
        "QR-/Link-Zugang und Rückmeldekanal",
        "Ergebnisübersicht und Ergebnisdokumentation",
      ],
      deliverable: "Themenbezogenes Dossier plus dokumentierte Beteiligungsrunde mit Ergebnissicht.",
      orderability: "Mit Rückfragen bestellbar · als Pilotpaket geeignet",
      procurementHint: "Kostenvoranschlag und Leistungsbeschreibung anforderbar.",
      ctaLabel: "Kostenvoranschlag anfordern",
      href: card2Href,
    },
    {
      id: "betrieb_kommune",
      name: "Beteiligungsbetrieb Kommune",
      priceTag: "ab 4.500 € / Monat zzgl. MwSt.",
      billingMode: "monatlich · jährliche Zahlung bevorzugt",
      purpose: "Für wiederkehrende Beteiligung über mehrere Themen hinweg.",
      typicalUseCases: [
        "Regelbetrieb mit mehreren Beteiligungsanlässen",
        "Koordination über Fachbereiche",
        "Regelmäßige Berichte für Verwaltung und Gremien",
      ],
      services: [
        "Mehrere Themen, Dossiers und Runden",
        "Rollen- und Rechtekonzept",
        "Adminzugang, Vorlagen und Statuslogik",
        "Regelmäßige Reports und Outcomes",
      ],
      deliverable: "Beteiligungsbetriebsrahmen mit wiederverwendbaren Vorlagen und Report-Taktung.",
      orderability: "Angebot nach Klärung",
      procurementHint: "Rahmenvertrag geeignet.",
      ctaLabel: "Gespräch anfragen",
      href: card3Href,
    },
    {
      id: "vergabe_rahmenvertrag",
      name: "Rahmenvertrag / Vergabepaket",
      priceTag: "Angebot nach Klärung zzgl. MwSt.",
      billingMode: "nach Klärung / rahmenvertragsbasiert",
      purpose: "Für formale Ausschreibungsvorbereitung und Rahmenvertrag.",
      typicalUseCases: [
        "Vorbereitung von Ausschreibungsunterlagen",
        "Leistungsbausteine und Losstruktur abstimmen",
        "Betriebs- und Supportrahmen vorbereiten",
      ],
      services: [
        "Leistungsbeschreibung als Entwurfs-/Anforderungspaket",
        "Optionale Losstruktur",
        "Datenschutz-/Sicherheitsanhang als Entwurf",
        "Support-, Abnahme- und Dokumentationslogik",
      ],
      deliverable: "Vergabeorientierter Leistungsbeschreibung-Entwurf mit Anhangsstruktur und Abnahmelogik.",
      orderability: "Nur nach Klärung",
      procurementHint: "Vergabehinweis zur Orientierung, keine Rechtsberatung.",
      ctaLabel: "Leistungsbeschreibung anfordern",
      href: card4Href,
    },
  ] as const;
}

function buildB2BPartnerCards(args: {
  locale: PricingLocale;
  goal: string;
  frame: string;
}): readonly B2BPartnerCard[] {
  const starterHref = buildVormerkenHref({
    locale: args.locale,
    segment: "organisationen",
    packageId: "b2b_basis",
    goal: args.goal,
    frame: args.frame,
    completion: "direct_order",
    addOnIds: ["reports_outcomes"],
  });
  const starterDemoHref = buildVormerkenHref({
    locale: args.locale,
    segment: "organisationen",
    packageId: "b2b_basis",
    goal: args.goal,
    frame: args.frame,
    completion: "conversation_request",
  });
  const projectHref = buildVormerkenHref({
    locale: args.locale,
    segment: "organisationen",
    packageId: "b2b_basis",
    goal: args.goal,
    frame: args.frame,
    completion: "quote_request",
    addOnIds: ["companion_kommunikation", "reports_outcomes"],
    quote: true,
  });
  const officeOpsHref = buildVormerkenHref({
    locale: args.locale,
    segment: "organisationen",
    packageId: "b2b_pro",
    goal: args.goal,
    frame: args.frame,
    completion: "conversation_request",
    addOnIds: ["managed_governance", "moderation_assistenz", "reports_outcomes"],
  });
  const frameworkHref = buildVormerkenHref({
    locale: args.locale,
    segment: "organisationen",
    packageId: "b2b_pro",
    goal: args.goal,
    frame: args.frame,
    completion: "quote_request",
    addOnIds: ["managed_governance", "faktencheck_kontingent", "companion_kommunikation"],
    quote: true,
  });

  if (args.locale === "en") {
    return [
      {
        id: "starter",
        name: "Participation Office Starter",
        priceTag: "from €1,500 / month + VAT",
        billingMode: "monthly · annual billing preferred",
        forWhom: "Small participation offices and moderation teams launching first studio-enabled projects.",
        typicalUse: "1-3 dossiers with one participation round and communication-ready outputs.",
        services: [
          "Dossier setup with source and question structure",
          "Simple participation round with QR/link access",
          "Output Studio export preparation",
          "Result documentation for client handover",
        ],
        result: "Pilot-ready dossier and communication package for first client projects.",
        orderability: "Directly reservable as pilot package",
        note: "eDebatte supports process design work, it does not replace participation offices.",
        ctaLabel: "Reserve pilot",
        href: starterHref,
        secondaryCtaLabel: "Request demo",
        secondaryHref: starterDemoHref,
      },
      {
        id: "projektpartner",
        name: "Project Partner Participation",
        priceTag: "project-based + VAT (typically one-time)",
        billingMode: "project-based / one-time",
        forWhom: "Participation, planning and communication offices running one concrete client project.",
        typicalUse: "A project-bound dossier room with roles for office, client and moderation/editorial teams.",
        services: [
          "Project dossier space with open questions and options",
          "Participation round with channel-ready outputs",
          "Reports/outcomes module for client communication",
          "Optional moderation and evaluation support",
        ],
        result: "Documented project participation package with reusable communication outputs.",
        orderability: "Cost estimate and project inquiry available",
        note: "Designed as infrastructure partner model for external client delivery.",
        ctaLabel: "Request project package",
        href: projectHref,
      },
      {
        id: "buero_betrieb",
        name: "Agency / Office Operations",
        priceTag: "from €2,900 / month + VAT",
        billingMode: "monthly · annual billing preferred",
        forWhom: "Offices with recurring client projects and cross-team delivery.",
        typicalUse: "Multi-project setup with templates, team roles and recurring reporting cadence.",
        services: [
          "Multiple projects, dossiers and rounds",
          "Team roles and reusable participation templates",
          "Client-facing reporting and status logic",
          "Studio-supported output preparation per project",
        ],
        result: "Reusable delivery operations for recurring participation projects.",
        orderability: "Offer after alignment",
        note: "Mandate/client capability depends on configured operating context.",
        ctaLabel: "Schedule partner conversation",
        href: officeOpsHref,
      },
      {
        id: "partner_rahmen",
        name: "Partner / Framework Model",
        priceTag: "offer after clarification + VAT",
        billingMode: "clarification-first / framework-based",
        forWhom: "Larger networks, foundations, media partners and public-dialogue consultancies.",
        typicalUse: "Recurring cooperation model with pilots, training and support framework.",
        services: [
          "Partner terms and recurring support scope",
          "Method catalog and enablement/training",
          "Optional export/branding extensions (where available)",
          "Operational support and governance alignment",
        ],
        result: "Partner-ready cooperation framework for recurring project portfolios.",
        orderability: "Only after clarification",
        note: "No fake white-label promise and no autonomous external publishing.",
        ctaLabel: "Request framework model",
        href: frameworkHref,
        secondaryCtaLabel: "Check partnership",
        secondaryHref: officeOpsHref,
      },
    ] as const;
  }

  return [
    {
      id: "starter",
      name: "Beteiligungsbüro Starter",
      priceTag: "ab 1.500 € / Monat zzgl. MwSt.",
      billingMode: "monatlich · jährliche Zahlung bevorzugt",
      forWhom:
        "Kleine Beteiligungsbüros, Moderationsbüros und Dialogteams mit ersten Studio-gestützten Projekten.",
      typicalUse: "1-3 Dossiers mit einer Beteiligungsrunde und direkt nutzbaren Kommunikationsbausteinen.",
      services: [
        "Dossier-Struktur mit Quellen- und Fragenraum",
        "Einfache Beteiligungsrunde mit QR-/Link-Zugang",
        "Output-Studio für Export-/Veröffentlichungsvorbereitung",
        "Ergebnisdokumentation für Auftraggeber",
      ],
      result: "Pilotfähiges Dossier- und Kommunikationspaket für erste Kundenprojekte.",
      orderability: "Direkt vormerkbar als Pilotpaket",
      note: "eDebatte ersetzt keine Moderation, sondern ergänzt bestehende Beteiligungsarbeit.",
      ctaLabel: "Pilot vormerken",
      href: starterHref,
      secondaryCtaLabel: "Demo anfragen",
      secondaryHref: starterDemoHref,
    },
    {
      id: "projektpartner",
      name: "Projektpartner Beteiligung",
      priceTag: "projektbezogen zzgl. MwSt. (typisch einmalig)",
      billingMode: "projektbezogen / einmalig",
      forWhom:
        "Beteiligungsbüros, Planungsbüros und Kommunikationsagenturen mit einem konkreten Kundenprojekt.",
      typicalUse:
        "Projektbezogener Dossierraum mit Rollen für Büro, Auftraggeber und Moderation/Redaktion.",
      services: [
        "Projekt-Dossierraum mit offenen Fragen und Optionen",
        "Beteiligungsrunde mit kanalbezogener Aufbereitung",
        "Reports/Outcomes für Auftraggeberkommunikation",
        "Optionale Moderations- und Auswertungsunterstützung",
      ],
      result: "Dokumentiertes Projektpaket mit nachvollziehbarer Beteiligung und Output-Bausteinen.",
      orderability: "Kostenvoranschlag und Projektanfrage möglich",
      note: "Positioniert eDebatte als Infrastrukturpartner in laufenden Beteiligungsprojekten.",
      ctaLabel: "Projektpaket anfragen",
      href: projectHref,
    },
    {
      id: "buero_betrieb",
      name: "Agentur-/Büro-Betrieb",
      priceTag: "ab 2.900 € / Monat zzgl. MwSt.",
      billingMode: "monatlich · jährliche Zahlung bevorzugt",
      forWhom: "Beteiligungs- und Dialogprofis mit wiederkehrenden Mandaten über mehrere Teams.",
      typicalUse: "Mehrere Projekte, Vorlagen, Teamrollen und kontinuierliche Ergebnisberichte.",
      services: [
        "Mehrere Projekte, Dossiers und Runden",
        "Teamrollen und wiederverwendbare Beteiligungsformate",
        "Mandatsfähige Status- und Reportinglogik",
        "Studio-gestützte Veröffentlichungs- und Exportvorbereitung",
      ],
      result: "Wiederverwendbarer Betriebsrahmen für kontinuierliche Beteiligungsproduktion.",
      orderability: "Angebot nach Klärung",
      note: "Mandanten-/Kundenfähigkeit wird je nach technischem Setup konkretisiert.",
      ctaLabel: "Partnergespräch vereinbaren",
      href: officeOpsHref,
    },
    {
      id: "partner_rahmen",
      name: "Partner-/Rahmenmodell",
      priceTag: "Angebot nach Klärung zzgl. MwSt.",
      billingMode: "nach Klärung / rahmenvertragsbasiert",
      forWhom:
        "Größere Büros, Netzwerke, Stiftungsprogramme, Medien- und Public-Affairs-Dienstleister.",
      typicalUse: "Wiederkehrende Partnerschaft mit Pilotkommunen/-themen, Schulung und Support.",
      services: [
        "Partnerkonditionen und Betriebsrahmen",
        "Methodenkatalog und Enablement",
        "Optionale Export-/Branding-Erweiterungen (falls verfügbar)",
        "Governance- und Supportabstimmung",
      ],
      result: "Partnerschaftsmodell für wiederkehrende Projektportfolios.",
      orderability: "Nur nach Klärung",
      note: "Keine Fake-White-Label-Zusage und keine automatische externe Veröffentlichung.",
      ctaLabel: "Kostenvoranschlag anfordern",
      href: frameworkHref,
      secondaryCtaLabel: "Partnerschaft prüfen",
      secondaryHref: officeOpsHref,
    },
  ] as const;
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
  type FrameOptionId = (typeof frames)[number]["id"];

  const municipalGoalOverrides =
    locale === "en"
      ? {
          beteiligung_starten: {
            title: "Clarify status and participation readiness",
            detail: "Classify trigger, source context and participation readiness first.",
          },
          moderation_begleitung: {
            title: "Prepare concrete topic / dossier",
            detail: "Structure one concrete municipal topic dossier for execution.",
          },
          auswertung_reports: {
            title: "Run participation round",
            detail: "Execute a documented round with question, response and outcome view.",
          },
          betrieb_aufsetzen: {
            title: "Set up recurring participation operations",
            detail: "Build reusable operating routines across multiple topics.",
          },
          oeffentliche_anschlussfaehigkeit: {
            title: "Prepare service description / lot structure",
            detail: "Prepare procurement-oriented service modules and optional lot structure.",
          },
          faktencheck_strittig: {
            title: "Framework agreement / recurring demand",
            detail: "Frame recurring demand for framework-level procurement.",
          },
        }
      : {
          beteiligung_starten: {
            title: "Sachstand & Beteiligungsreife klären",
            detail: "Anlass, Quellenlage und Beteiligungsreife zuerst sauber einordnen.",
          },
          moderation_begleitung: {
            title: "Konkretes Thema / Dossier vorbereiten",
            detail: "Ein kommunales Thema als belastbares Dossier vorbereiten.",
          },
          auswertung_reports: {
            title: "Beteiligungsrunde durchführen",
            detail: "Rückmeldungen strukturiert erfassen und Ergebnisdokumentation aufbauen.",
          },
          betrieb_aufsetzen: {
            title: "Laufenden Beteiligungsbetrieb aufbauen",
            detail: "Wiederkehrende Beteiligung mit Rollen, Vorlagen und Betriebslogik aufsetzen.",
          },
          oeffentliche_anschlussfaehigkeit: {
            title: "Leistungsbeschreibung / Losstruktur vorbereiten",
            detail: "Vergabeorientierte Leistungsbausteine und optionale Losstruktur vorbereiten.",
          },
          faktencheck_strittig: {
            title: "Rahmenvertrag / wiederkehrender Bedarf",
            detail: "Wiederkehrenden Bedarf für Rahmenvertrag und Folgebeauftragung strukturieren.",
          },
        };

  const municipalFrameOptions: readonly { id: FrameOptionId; title: string; detail: string }[] =
    locale === "en"
      ? [
          { id: "pilot", title: "Pilot / small service module", detail: "Small pilot module with clear scope." },
          { id: "einmaliger_einsatz", title: "Single project / concrete procedure", detail: "One defined municipal procedure." },
          { id: "laufender_betrieb", title: "Recurring operations", detail: "Continuous participation operations." },
          { id: "fokus_reporting", title: "Framework agreement / multiple topics", detail: "Multi-topic frame for recurring procurement." },
          { id: "fokus_moderation", title: "Offer after clarification", detail: "Needs follow-up alignment before final order path." },
        ]
      : [
          { id: "pilot", title: "Pilot / kleiner Leistungsbaustein", detail: "Kleiner Pilot mit klar abgegrenztem Umfang." },
          { id: "einmaliger_einsatz", title: "Einzelprojekt / konkretes Verfahren", detail: "Ein definiertes kommunales Verfahren." },
          { id: "laufender_betrieb", title: "wiederkehrender Betrieb", detail: "Regelbetrieb über mehrere Beteiligungsanlässe." },
          { id: "fokus_reporting", title: "Rahmenvertrag / mehrere Themen", detail: "Mehrere Themen als wiederkehrender Beschaffungsrahmen." },
          { id: "fokus_moderation", title: "Angebot nach Klärung", detail: "Vor Bestellung ist eine fachliche Klärung erforderlich." },
        ];

  const frameOptionMap = new Map(frames.map((frame) => [frame.id, frame]));
  const displayedGoals =
    segment === "kommunen"
      ? goals.map((goal) => {
          const override = municipalGoalOverrides[goal.id];
          if (!override) return goal;
          return { ...goal, ...override };
        })
      : goals;
  const displayedFrames =
    segment === "kommunen"
      ? municipalFrameOptions
          .map((frame) => {
            const base = frameOptionMap.get(frame.id);
            if (!base) return null;
            return { ...base, title: frame.title, detail: frame.detail };
          })
          .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      : frames;
  const displayedSelectedGoalOption =
    displayedGoals.find((goal) => goal.id === selectedGoal) ?? selectedGoalOption;
  const displayedSelectedFrameOption =
    displayedFrames.find((frame) => frame.id === selectedFrame) ?? selectedFrameOption;

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
  const municipalTenderCards =
    segment === "kommunen"
      ? buildMunicipalTenderCards({
          locale,
          goal: selectedGoal,
          frame: selectedFrame,
        })
      : [];
  const b2bPartnerCards =
    segment === "organisationen"
      ? buildB2BPartnerCards({
          locale,
          goal: selectedGoal,
          frame: selectedFrame,
        })
      : [];
  const municipalAddOnCatalog =
    locale === "en"
      ? [
          "Dossier Search / Search Credit",
          "Deep Research Credit",
          "Fact-check quota",
          "Moderation & assistance",
          "Event support",
          "Reports & outcomes",
          "QR / print package",
          "Training / role setup",
          "Data protection / security appendix",
          "Procurement / service-description draft package",
        ]
      : [
          "Dossier Search / Search Credit",
          "Deep Research Credit",
          "Faktencheck-Kontingent",
          "Moderation & Assistenz",
          "Event-Begleitung",
          "Reports & Outcomes",
          "QR-/Printpaket",
          "Schulung / Rollen-Setup",
          "Datenschutz-/Sicherheitsanhang",
          "Vergabe-/Leistungsbeschreibungspaket als Entwurf",
        ];

  const packagePriceHintById: Partial<Record<string, string>> =
    locale === "en"
      ? {
          b2b_basis: "from €1,500 / month + VAT",
          b2b_pro: "from €2,900 / month + VAT",
          b2g_basis: "from €2,500 / month + VAT",
          b2g_pro: "from €4,500 / month + VAT",
        }
        : {
          b2b_basis: "ab 1.500 € / Monat zzgl. MwSt.",
          b2b_pro: "ab 2.900 € / Monat zzgl. MwSt.",
          b2g_basis: "ab 2.500 € / Monat zzgl. MwSt.",
          b2g_pro: "ab 4.500 € / Monat zzgl. MwSt.",
        };
  const packageBillingModeHintById: Partial<Record<string, string>> =
    locale === "en"
      ? {
          b2b_basis: "monthly · annual billing preferred",
          b2b_pro: "monthly · annual billing preferred",
          b2g_basis: "monthly · annual billing preferred",
          b2g_pro: "monthly · annual billing preferred",
        }
      : {
          b2b_basis: "monatlich · jährliche Zahlung bevorzugt",
          b2b_pro: "monatlich · jährliche Zahlung bevorzugt",
          b2g_basis: "monatlich · jährliche Zahlung bevorzugt",
          b2g_pro: "monatlich · jährliche Zahlung bevorzugt",
        };
  const recommendedPackagePriceHint = packagePriceHintById[recommendation.recommendedPackageId];
  const recommendedPackageBillingModeHint = packageBillingModeHintById[recommendation.recommendedPackageId];
  const showDirectOrderCta = segment !== "kommunen";
  const recommendationTitle =
    segment === "kommunen"
      ? locale === "en"
        ? "Recommended operations and pricing frame"
        : "Empfohlener Betriebs- und Preisrahmen"
      : text.recommendationTitle;
  const recommendationSubtitle =
    segment === "kommunen"
      ? locale === "en"
        ? "The pricing frame complements the selected service tier. The primary municipal decision is made above in the B2G procurement and participation packages."
        : "Der Preisrahmen ergänzt die gewählte Leistungsstufe. Die fachliche Auswahl erfolgt oben über die B2G-Vergabe- und Beteiligungspakete."
      : text.recommendationSubtitle;

  return (
    <ProductSurfaceShell>
      <header className="rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {locale === "en" ? "Institutional pricing flow" : "Institutioneller Preisfluss"}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[rgb(var(--fg))] sm:text-4xl">{text.heroTitle}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[rgb(var(--muted))]">{text.heroIntro}</p>
        <p className="mt-2 text-xs text-[rgb(var(--muted))]">
          {text.legalPricingHint} {text.annualHint}
        </p>
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

      <section className="mt-6 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.segmentBoundaryTitle}</p>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">{text.segmentBoundaryMunicipal}</p>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">{text.segmentBoundaryOrg}</p>
      </section>

      <section id="guided-selection" className="mt-8 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm sm:p-6">
        <div className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.selectionTitle}</p>
          <p className="text-sm text-[rgb(var(--muted))]">
            Projektpakete schalten nur explizit zugewiesene Leistungen frei. Transparenzhinweise,
            Reporting und Vertragslage bleiben auditierbar; Finanzierung erzeugt weder
            Quellengewichtung noch Factcheck- oder Veröffentlichungsprivilegien.
          </p>
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
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              {segment === "kommunen" ? text.step2Municipal : text.step2}
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {displayedGoals.map((goal) => (
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
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              {segment === "kommunen" ? text.step3Municipal : text.step3}
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {displayedFrames.map((frame) => (
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
            {(segment === "kommunen" ? text.segmentMunicipality : text.segmentOrganization)} ·{" "}
            {displayedSelectedGoalOption?.title ?? ""} · {displayedSelectedFrameOption?.title ?? ""}
          </p>
        </div>
      </section>

      {segment === "organisationen" ? (
        <section className="mt-8 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            {locale === "en" ? "For participation offices and dialogue professionals" : "Für Beteiligungsbüros & Dialogprofis"}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">
            {locale === "en"
              ? "eDebatte does not replace moderation. It makes participation delivery more structured, visible and reusable."
              : "eDebatte ersetzt keine Moderation. Es macht Beteiligungsarbeit strukturierter, sichtbarer und wiederverwendbar."}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">
            {locale === "en"
              ? "B2B means tooling, dossier, studio and participation infrastructure for your own client projects."
              : "B2B heißt: Werkzeug-, Dossier-, Studio- und Beteiligungsinfrastruktur für eigene Kundenprojekte."}
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {b2bPartnerCards.map((entry) => (
              <article key={entry.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 text-sm shadow-sm">
                <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">{entry.name}</h3>
                <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">{entry.priceTag}</p>
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                  {text.billingModeLabel}: {entry.billingMode}
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                  {locale === "en" ? "For whom" : "Für wen"}
                </p>
                <p className="mt-1 text-[rgb(var(--muted))]">{entry.forWhom}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                  {locale === "en" ? "Typical use" : "Typischer Einsatz"}
                </p>
                <p className="mt-1 text-[rgb(var(--muted))]">{entry.typicalUse}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                  {locale === "en" ? "Included services" : "Enthaltene Leistungen"}
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-[rgb(var(--muted))]">
                  {entry.services.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                  {locale === "en" ? "Result" : "Ergebnis"}
                </p>
                <p className="mt-1 text-[rgb(var(--muted))]">{entry.result}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                  {locale === "en" ? "Orderability" : "Bestellbarkeit"}
                </p>
                <p className="mt-1 text-[rgb(var(--muted))]">{entry.orderability}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                  {locale === "en" ? "Note" : "Hinweis"}
                </p>
                <p className="mt-1 text-[rgb(var(--muted))]">{entry.note}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={entry.href} className="btn-secondary">
                    {entry.ctaLabel}
                  </Link>
                  {entry.secondaryCtaLabel && entry.secondaryHref ? (
                    <Link
                      href={entry.secondaryHref}
                      className="inline-flex items-center rounded-full px-3 py-2 text-xs font-semibold text-[rgb(var(--muted))] underline-offset-2 hover:underline"
                    >
                      {entry.secondaryCtaLabel}
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {segment === "kommunen" ? (
        <section className="mt-6 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.municipalContextTitle}</p>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">{text.municipalContextText}</p>
          <ul className="mt-3 space-y-1 text-sm text-[rgb(var(--muted))]">
            {text.municipalContextPoints.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {segment === "kommunen" ? (
        <section className="mt-8 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            {locale === "en" ? "Procurement-ready service packages" : "Vergabe- & Ausschreibungspakete"}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">
            {locale === "en"
              ? "Municipal B2G flow: this is a service-framework selection for public buyers, not a generic SaaS package picker."
              : "Kommunaler B2G-Modus: Hier wählen öffentliche Auftraggeber keinen normalen SaaS-Tarif, sondern einen passenden Leistungsrahmen."}
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {municipalTenderCards.map((entry) => (
              <article key={entry.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 text-sm shadow-sm">
                <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">{entry.name}</h3>
                <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">{entry.priceTag}</p>
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                  {text.billingModeLabel}: {entry.billingMode}
                </p>
                <p className="mt-1 text-[rgb(var(--muted))]">{entry.purpose}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                  {locale === "en" ? "Typical use cases" : "Typische Einsatzfälle"}
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-[rgb(var(--muted))]">
                  {entry.typicalUseCases.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                  {locale === "en" ? "Included services" : "Enthaltene Leistungen"}
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-[rgb(var(--muted))]">
                  {entry.services.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                  {locale === "en" ? "Result / deliverable" : "Ergebnis / Deliverable"}
                </p>
                <p className="mt-1 text-[rgb(var(--muted))]">{entry.deliverable}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                  {locale === "en" ? "Orderability" : "Bestellbarkeit"}
                </p>
                <p className="mt-1 text-[rgb(var(--muted))]">{entry.orderability}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                  {locale === "en" ? "Procurement note" : "Vergabehinweis"}
                </p>
                <p className="mt-1 text-[rgb(var(--muted))]">{entry.procurementHint}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={entry.href} className="btn-secondary">
                    {entry.ctaLabel}
                  </Link>
                  {entry.id === "vergabe_rahmenvertrag" ? (
                    <Link
                      href={buildVormerkenHref({
                        locale,
                        segment: "kommunen",
                        packageId: "b2g_pro",
                        goal: selectedGoal,
                        frame: selectedFrame,
                        completion: "conversation_request",
                        addOnIds: ["managed_governance"],
                      })}
                      className="inline-flex items-center rounded-full px-3 py-2 text-xs font-semibold text-[rgb(var(--muted))] underline-offset-2 hover:underline"
                    >
                      {locale === "en" ? "Check procurement package" : "Vergabepaket prüfen"}
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              {locale === "en" ? "Typical municipal add-ons" : "Typische kommunale Add-ons"}
            </p>
            <ul className="mt-2 grid gap-1 text-[rgb(var(--muted))] sm:grid-cols-2">
              {municipalAddOnCatalog.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div className="mt-5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 text-sm text-[rgb(var(--muted))]">
            <p>
              {locale === "en"
                ? "Procurement note: this is orientation support and a service-description draft package, not legal advice and not an automated public tender."
                : "Vergabehinweis: Das ist eine Orientierung und ein Leistungsbeschreibung-Entwurf, keine Rechtsberatung und keine automatische Ausschreibung."}
            </p>
            <p className="mt-2">
              {locale === "en"
                ? "eDebatte supports preparation, execution, documentation and continuity. It does not replace formal statutory participation obligations."
                : "eDebatte unterstützt Vorbereitung, Durchführung, Dokumentation und Anschlussfähigkeit. Es ersetzt keine formelle Beteiligungspflicht."}
            </p>
          </div>
        </section>
      ) : null}

      <section
        className={[
          "mt-8 rounded-3xl p-6 shadow-sm sm:p-7",
          segment === "kommunen"
            ? "border border-[rgb(var(--border))] bg-[rgb(var(--card))]"
            : "border-2 border-sky-400/80 bg-[linear-gradient(145deg,rgba(14,165,233,0.16),rgba(255,255,255,0.9))] shadow-[0_22px_60px_rgba(14,165,233,0.18)] dark:bg-[linear-gradient(145deg,rgba(14,165,233,0.2),rgba(15,23,42,0.5))]",
        ].join(" ")}
      >
        <p
          className={[
            "text-xs font-semibold uppercase tracking-wide",
            segment === "kommunen" ? "text-[rgb(var(--muted))]" : "text-sky-900 dark:text-sky-100",
          ].join(" ")}
        >
          {recommendationTitle}
        </p>
        <p
          className={[
            "mt-1 text-sm font-medium",
            segment === "kommunen" ? "text-[rgb(var(--muted))]" : "text-sky-900/90 dark:text-sky-100/90",
          ].join(" ")}
        >
          {recommendationSubtitle}
        </p>

        <div
          className={[
            "mt-4 rounded-2xl p-5 text-sm shadow-sm",
            segment === "kommunen"
              ? "border border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
              : "border border-sky-300/80 bg-white/90 dark:bg-slate-900/40",
          ].join(" ")}
        >
          <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">
            {recommendedPackage?.title ?? recommendation.recommendedPackageId}
          </h2>
          {recommendedPackagePriceHint ? (
            <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">{recommendedPackagePriceHint}</p>
          ) : null}
          {recommendedPackageBillingModeHint ? (
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">
              {text.billingModeLabel}: {recommendedPackageBillingModeHint}
            </p>
          ) : null}
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
          <Link href={applyRecommendationHref} className={segment === "kommunen" ? "btn-secondary" : "btn-primary"}>
            {segment === "kommunen" ? (locale === "en" ? "Apply frame" : "Rahmen übernehmen") : text.ctaApply}
          </Link>
          {showDirectOrderCta ? (
            <Link href={directOrderHref} className="btn-primary">
              {text.ctaOrder}
            </Link>
          ) : null}
          <Link href={quoteHref} className="btn-secondary">
            {segment === "kommunen" ? (locale === "en" ? "Request cost estimate" : "Kostenvoranschlag anfordern") : text.ctaQuote}
          </Link>
          <Link href={quoteDownloadHref} className="btn-secondary">
            {segment === "kommunen" ? (locale === "en" ? "Request service description" : "Leistungsbeschreibung anfordern") : text.ctaQuoteDownload}
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
                <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">{withVatSuffix(addOn.priceLabel, locale)}</p>
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
                  <p>{withVatSuffix(addOn.priceLabel, locale)}</p>
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
                <p>{withVatSuffix(addOn.priceLabel, locale)}</p>
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
