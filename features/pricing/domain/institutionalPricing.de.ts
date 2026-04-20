import type { PricingSegmentId } from "./types";
import type { PricingLocale } from "./i18n";

export type InstitutionalPricingSegmentId = "organisationen" | "kommunen";
export type InstitutionalPackageOption = {
  packageId: "b2b_basis" | "b2b_pro" | "b2g_basis" | "b2g_pro";
  title: string;
  detail: string;
  ctaLabel: string;
  ctaHref: string;
};

export type InstitutionalPriceBlock = {
  key:
    | "grundaktivierung"
    | "laufender_betrieb"
    | "raeume"
    | "aktive_beteiligung"
    | "reports"
    | "moderation_governance";
  title: string;
  priceLabel: string;
  detail: string;
};

export type InstitutionalAddOn = {
  id:
    | "event_begleitung"
    | "moderation_assistenz"
    | "reports_outcomes"
    | "managed_governance"
    | "companion_kommunikation"
    | "faktencheck_kontingent";
  title: string;
  priceLabel: string;
  detail: string;
  usp: string;
  whenUseful: string;
  recommendedFor: string;
  shortLabel?: string;
  badgeLabel?: string;
  orderability: string;
  maturity: InstitutionalAddOnMaturity;
  ctaLabel: string;
  relevantSegments: readonly PricingSegmentId[];
};

export type InstitutionalAddOnMaturity =
  | "direct_orderable"
  | "orderable_review_required"
  | "followup_required"
  | "in_rollout";

export type InstitutionalAddOnMaturityMeta = {
  label: string;
  publicHint: string;
  defaultCtaLabel: string;
  requiresInternalReview: boolean;
  requiresFollowupAlignment: boolean;
  fullyOperational: boolean;
};

export type InstitutionalPricingSegment = {
  id: InstitutionalPricingSegmentId;
  title: string;
  shortTitle: string;
  forWhom: readonly string[];
  intendedFor: readonly string[];
  standardIncluded: readonly string[];
  priceBlocks: readonly InstitutionalPriceBlock[];
  addOns: readonly InstitutionalAddOn[];
  activationAndEnablement: readonly string[];
  packageOptions: readonly InstitutionalPackageOption[];
  ctaHref: string;
};

export type InstitutionalSelectionGoalId =
  | "beteiligung_starten"
  | "betrieb_aufsetzen"
  | "auswertung_reports"
  | "moderation_begleitung"
  | "oeffentliche_anschlussfaehigkeit"
  | "faktencheck_strittig";

export type InstitutionalSelectionFrameId =
  | "einmaliger_einsatz"
  | "pilot"
  | "laufender_betrieb"
  | "internes_team"
  | "oeffentliche_beteiligung"
  | "hohe_sichtbarkeit"
  | "fokus_ruecklaeufe"
  | "fokus_moderation"
  | "fokus_reporting";

export type InstitutionalCompletionPathId = "direct_order" | "quote_request" | "conversation_request";

export type InstitutionalSelectionOption<TId extends string> = {
  id: TId;
  title: string;
  detail: string;
};

export type InstitutionalRecommendation = {
  segmentId: InstitutionalPricingSegmentId;
  goalId: InstitutionalSelectionGoalId;
  frameId: InstitutionalSelectionFrameId;
  recommendedPackageId: InstitutionalPackageOption["packageId"];
  alternativePackageId: InstitutionalPackageOption["packageId"];
  whyRecommended: string;
  coveredByPackage: string;
  gapHint: string;
  roiHighlights: readonly string[];
  recommendedAddOnIds: readonly InstitutionalAddOn["id"][];
  optionalAddOnIds: readonly InstitutionalAddOn["id"][];
};

export const INSTITUTIONAL_PRICING_ROUTE = "/pricing/institutionen" as const;

export const INSTITUTIONAL_PRICING_PAGE_CONTENT = {
  heroTitle: "Institutionelle Preise",
  heroIntro:
    "Organisationen, Verbände, Vereine, Kommunen und Verwaltungen erhalten bei uns keinen politischen Sonderzugang, sondern einen professionellen Betriebsrahmen für strukturierte Beteiligung, Governance und belastbare Auswertung.",
  heroHint:
    "Die Preislogik trennt Grundaktivierung, laufenden Betrieb, aktive Räume, Auswertung und optionale Add-ons transparent voneinander.",
  legalNote: "Alle Angaben als Netto-Orientierungswerte je nach Einsatzkontext, Laufzeit und Aktivierungsumfang.",
  segmentKicker: "Institutionelle Segmente",
} as const;

export const INSTITUTIONAL_PRICING_PAGE_CONTENT_EN = {
  heroTitle: "Institutional pricing",
  heroIntro:
    "Organizations, associations, municipalities and public administrations do not receive political special access here. They receive a professional operating framework for structured participation, governance and robust analytics.",
  heroHint:
    "The pricing model transparently separates activation, ongoing operations, active rooms, analytics and optional add-ons.",
  legalNote: "All values are net orientation values depending on context, term and activation scope.",
  segmentKicker: "Institutional segments",
} as const;

export const INSTITUTIONAL_ADD_ON_MATURITY_META: Record<
  InstitutionalAddOnMaturity,
  InstitutionalAddOnMaturityMeta
> = {
  direct_orderable: {
    label: "Direkt bestellbar",
    publicHint: "Direkt bestellbar und je nach Paket direkt aktivierbar.",
    defaultCtaLabel: "Jetzt ergänzen",
    requiresInternalReview: false,
    requiresFollowupAlignment: false,
    fullyOperational: true,
  },
  orderable_review_required: {
    label: "Bestellbar, intern geprüft",
    publicHint: "Bestellbar im öffentlichen Flow, Aktivierung erfolgt nach interner Prüfung.",
    defaultCtaLabel: "Mit bestellen",
    requiresInternalReview: true,
    requiresFollowupAlignment: false,
    fullyOperational: true,
  },
  followup_required: {
    label: "Bestellbar, mit Folgeabstimmung",
    publicHint: "Bestellbar im öffentlichen Flow, Umfang und Einsatz werden anschließend abgestimmt.",
    defaultCtaLabel: "Bedarf vormerken",
    requiresInternalReview: false,
    requiresFollowupAlignment: true,
    fullyOperational: true,
  },
  in_rollout: {
    label: "Schrittweise im Ausbau",
    publicHint: "Für ausgewählte Einsatzkontexte verfügbar; operative Aktivierung erfolgt abgestimmt.",
    defaultCtaLabel: "Verfügbarkeit anfragen",
    requiresInternalReview: true,
    requiresFollowupAlignment: true,
    fullyOperational: false,
  },
} as const;

export const INSTITUTIONAL_ADD_ON_MATURITY_META_EN: Record<
  InstitutionalAddOnMaturity,
  InstitutionalAddOnMaturityMeta
> = {
  direct_orderable: {
    label: "Directly orderable",
    publicHint: "Directly orderable and, depending on package, directly activatable.",
    defaultCtaLabel: "Add now",
    requiresInternalReview: false,
    requiresFollowupAlignment: false,
    fullyOperational: true,
  },
  orderable_review_required: {
    label: "Orderable, internally reviewed",
    publicHint: "Orderable in the public flow; activation follows internal review.",
    defaultCtaLabel: "Add to order",
    requiresInternalReview: true,
    requiresFollowupAlignment: false,
    fullyOperational: true,
  },
  followup_required: {
    label: "Orderable, with follow-up coordination",
    publicHint: "Orderable in the public flow; scope and usage are coordinated in a follow-up step.",
    defaultCtaLabel: "Mark need",
    requiresInternalReview: false,
    requiresFollowupAlignment: true,
    fullyOperational: true,
  },
  in_rollout: {
    label: "Rolling out gradually",
    publicHint: "Available for selected contexts; activation is coordinated by rollout stage.",
    defaultCtaLabel: "Request availability",
    requiresInternalReview: true,
    requiresFollowupAlignment: true,
    fullyOperational: false,
  },
} as const;

export function getInstitutionalAddOnMaturityMeta(
  maturity: InstitutionalAddOnMaturity,
  locale: PricingLocale = "de",
) {
  return (locale === "en" ? INSTITUTIONAL_ADD_ON_MATURITY_META_EN : INSTITUTIONAL_ADD_ON_MATURITY_META)[maturity];
}

export const INSTITUTIONAL_SHARED_ADD_ONS: readonly InstitutionalAddOn[] = [
  {
    id: "event_begleitung",
    title: "Event-Begleitung",
    priceLabel: "ab 690 € je Einsatz",
    detail: "Begleitung für beteiligungsnahe Termine, Starts und öffentlich sichtbare Formate.",
    usp: "Begleitet Beteiligung dort, wo ein Termin, ein Startpunkt oder öffentliche Sichtbarkeit zusätzlichen Rahmen braucht.",
    whenUseful:
      "Sinnvoll bei Veranstaltungen, Kampagnenstarts, Live-Formaten oder zeitgebundenen Beteiligungsfenstern.",
    recommendedFor: "Kommunen, Organisationen, Verbände und öffentliche Formate mit klaren Terminen.",
    orderability: "Bestellbar, Einsatzrahmen wird im Folgeprozess abgestimmt.",
    maturity: "followup_required",
    ctaLabel: "Event-Begleitung ergänzen",
    relevantSegments: ["kommunen", "organisationen", "journalismus"],
  },
  {
    id: "moderation_assistenz",
    title: "Moderation / Assistenz",
    priceLabel: "ab 450 € / Monat",
    detail: "Laufende Moderations- und Assistenzleistung für aktive Beteiligungsprozesse.",
    usp: "Hilft, Beiträge, Rückläufe und Kommunikation geordnet, anschlussfähig und für Beteiligte besser handhabbar zu halten.",
    whenUseful:
      "Sinnvoll bei mehreren aktiven Räumen, erhöhtem Kommunikationsbedarf oder längeren Beteiligungsprozessen.",
    recommendedFor: "Organisationen, Kommunen und Teams mit laufender Beteiligung.",
    orderability: "Bestellbar, Umfang wird intern geprüft und im Betriebskontext bestätigt.",
    maturity: "orderable_review_required",
    ctaLabel: "Moderation ergänzen",
    relevantSegments: ["organisationen", "kommunen"],
  },
  {
    id: "reports_outcomes",
    title: "Reports / Outcomes",
    priceLabel: "ab 390 € / Monat",
    detail: "Auswertungspakete mit Ergebnisbildern, Spannungen und anschlussfähiger Zusammenfassung.",
    usp: "Verdichtet Beteiligung in nachvollziehbare Ergebnisse, Spannungsbilder und auswertbare Zusammenfassungen.",
    whenUseful:
      "Sinnvoll, wenn Rückläufe dokumentiert, Entscheidungen vorbereitet oder Ergebnisse weitergegeben werden sollen.",
    recommendedFor: "Organisationen, Kommunen, Verwaltungen und Verbände mit Auswertungsbedarf.",
    orderability: "Direkt bestellbar und im laufenden Paketbetrieb ergänzbar.",
    maturity: "direct_orderable",
    ctaLabel: "Report ergänzen",
    relevantSegments: ["organisationen", "kommunen", "journalismus"],
  },
  {
    id: "managed_governance",
    title: "Managed Governance",
    priceLabel: "ab 1.200 € / Monat",
    detail: "Begleitete Governance-Erweiterung für Rollen-, Freigabe- und Reviewlogiken.",
    usp: "Schafft zusätzlichen Rahmen für Rollen, Freigaben, Reviewlogik und strukturierte Prozessführung.",
    whenUseful:
      "Sinnvoll bei sensiblen Themen, mehreren Teams, wiederkehrenden Freigaben oder komplexeren institutionellen Abläufen.",
    recommendedFor: "Kommunen, Verwaltungen, Verbände und größere Organisationen.",
    orderability: "Bestellbar, Governance-Aufbau wird im Folgeprozess abgestimmt.",
    maturity: "followup_required",
    ctaLabel: "Governance ergänzen",
    relevantSegments: ["kommunen", "organisationen"],
  },
  {
    id: "companion_kommunikation",
    title: "Companion- / Kommunikationsformate",
    priceLabel: "ab 290 € / Monat",
    detail: "Companion-, QR- und Kommunikationsmodule für öffentliche Einbindung.",
    usp: "Verbinden Beteiligung mit Öffentlichkeit, Anschlusskommunikation und nachvollziehbarer Einbindung rund um Inhalte und Formate.",
    whenUseful:
      "Sinnvoll bei Artikeln, Kampagnen, Veranstaltungen, öffentlichen Themenräumen oder kommunalen Informationsprozessen.",
    recommendedFor: "Journalismus, Organisationen, Kommunen und Formate mit öffentlicher Reichweite.",
    orderability: "Direkt bestellbar und im Paket als Kommunikationsbaustein ergänzbar.",
    maturity: "direct_orderable",
    ctaLabel: "Companion ergänzen",
    relevantSegments: ["journalismus", "organisationen", "kommunen"],
  },
  {
    id: "faktencheck_kontingent",
    title: "Optionales Faktencheck-Kontingent",
    priceLabel: "ab 290 € / Monat",
    detail: "Prüfkontingente für strittige Behauptungen und öffentlich relevante Einzelthemen.",
    usp: "Erweitern Recherche- und Beteiligungsprozesse dort, wo strittige Behauptungen oder öffentlich relevante Einzelthemen belastbarer geprüft werden sollen.",
    whenUseful:
      "Sinnvoll bei kontroversen Aussagen, journalistischen Recherchen, sensiblen kommunalen Themen oder Konfliktlagen mit hohem Klärungsbedarf.",
    recommendedFor:
      "Freie Journalist:innen, Medienkontexte, Kommunen und öffentliche Debatten mit erhöhtem Prüfbedarf.",
    orderability: "Bestellbar, Umfang und Freigabelogik werden intern geprüft.",
    maturity: "orderable_review_required",
    ctaLabel: "Faktencheck ergänzen",
    relevantSegments: ["journalismus", "kommunen", "organisationen"],
  },
];

export const INSTITUTIONAL_SHARED_ADD_ONS_EN: readonly InstitutionalAddOn[] = [
  {
    id: "event_begleitung",
    title: "Event support",
    priceLabel: "from €690 per engagement",
    detail: "Support for participation moments that are tied to dates, launches or public visibility.",
    usp: "Adds an operational frame where events, launch moments or public visibility need additional support.",
    whenUseful:
      "Useful for events, campaign launches, live formats or time-bound participation windows.",
    recommendedFor: "Municipalities, organizations, associations and public formats with fixed timelines.",
    orderability: "Orderable, with scope and execution coordinated in a follow-up step.",
    maturity: "followup_required",
    ctaLabel: "Add event support",
    relevantSegments: ["kommunen", "organisationen", "journalismus"],
  },
  {
    id: "moderation_assistenz",
    title: "Moderation / assistance",
    priceLabel: "from €450 / month",
    detail: "Ongoing moderation and assistance for active participation operations.",
    usp: "Keeps contributions, feedback loops and communication structured, manageable and publicly coherent.",
    whenUseful:
      "Useful with multiple active rooms, elevated communication demand or longer participation processes.",
    recommendedFor: "Organizations, municipalities and teams with ongoing participation operations.",
    orderability: "Orderable, with scope internally reviewed and confirmed in operating context.",
    maturity: "orderable_review_required",
    ctaLabel: "Add moderation",
    relevantSegments: ["organisationen", "kommunen"],
  },
  {
    id: "reports_outcomes",
    title: "Reports / outcomes",
    priceLabel: "from €390 / month",
    detail: "Analytics packages with result views, tensions and actionable summaries.",
    usp: "Condenses participation into traceable outcomes, tension views and shareable summaries.",
    whenUseful:
      "Useful when feedback loops must be documented, decisions prepared or outcomes communicated.",
    recommendedFor: "Organizations, municipalities, administrations and associations with reporting demand.",
    orderability: "Directly orderable and attachable in ongoing package operations.",
    maturity: "direct_orderable",
    ctaLabel: "Add report",
    relevantSegments: ["organisationen", "kommunen", "journalismus"],
  },
  {
    id: "managed_governance",
    title: "Managed governance",
    priceLabel: "from €1,200 / month",
    detail: "Guided governance extension for roles, approvals and review logic.",
    usp: "Adds operational structure for roles, approvals, review logic and structured process leadership.",
    whenUseful:
      "Useful for sensitive topics, multiple teams, recurring approvals or complex institutional operations.",
    recommendedFor: "Municipalities, administrations, associations and larger organizations.",
    orderability: "Orderable, with governance setup coordinated in a follow-up process.",
    maturity: "followup_required",
    ctaLabel: "Add governance",
    relevantSegments: ["kommunen", "organisationen"],
  },
  {
    id: "companion_kommunikation",
    title: "Companion / communication formats",
    priceLabel: "from €290 / month",
    detail: "Companion, QR and communication modules for public integration.",
    usp: "Connects participation with public communication and traceable follow-up around content and formats.",
    whenUseful:
      "Useful for articles, campaigns, events, public topic rooms or municipal information processes.",
    recommendedFor: "Journalism, organizations, municipalities and formats with public reach.",
    orderability: "Directly orderable and attachable as communication module in package operations.",
    maturity: "direct_orderable",
    ctaLabel: "Add companion",
    relevantSegments: ["journalismus", "organisationen", "kommunen"],
  },
  {
    id: "faktencheck_kontingent",
    title: "Optional fact-check quota",
    priceLabel: "from €290 / month",
    detail: "Verification quota for disputed claims and publicly relevant single issues.",
    usp: "Extends research and participation where disputed claims or public-interest issues require stronger verification.",
    whenUseful:
      "Useful for controversial statements, journalistic research, sensitive municipal topics or high-friction conflicts.",
    recommendedFor:
      "Independent journalists, media contexts, municipalities and public debates with higher verification demand.",
    orderability: "Orderable, with scope and release logic internally reviewed.",
    maturity: "orderable_review_required",
    ctaLabel: "Add fact-check quota",
    relevantSegments: ["journalismus", "kommunen", "organisationen"],
  },
];

const INSTITUTIONAL_ADD_ON_BY_ID = new Map(
  INSTITUTIONAL_SHARED_ADD_ONS.map((entry) => [entry.id, entry]),
);

const INSTITUTIONAL_ADD_ON_BY_ID_EN = new Map(
  INSTITUTIONAL_SHARED_ADD_ONS_EN.map((entry) => [entry.id, entry]),
);

function getInstitutionalSharedAddOnsInternal(locale: PricingLocale = "de") {
  return locale === "en" ? INSTITUTIONAL_SHARED_ADD_ONS_EN : INSTITUTIONAL_SHARED_ADD_ONS;
}

export function getInstitutionalSharedAddOns(locale: PricingLocale = "de") {
  return getInstitutionalSharedAddOnsInternal(locale);
}

export function getInstitutionalAddOnById(id: string, locale: PricingLocale = "de") {
  const map = locale === "en" ? INSTITUTIONAL_ADD_ON_BY_ID_EN : INSTITUTIONAL_ADD_ON_BY_ID;
  return map.get(id as InstitutionalAddOn["id"]) ?? null;
}

const ADD_ON_PRIORITY_BY_SEGMENT: Record<PricingSegmentId, readonly InstitutionalAddOn["id"][]> = {
  privat: [],
  journalismus: [
    "faktencheck_kontingent",
    "companion_kommunikation",
    "event_begleitung",
    "reports_outcomes",
  ],
  organisationen: [
    "moderation_assistenz",
    "managed_governance",
    "reports_outcomes",
    "event_begleitung",
    "companion_kommunikation",
    "faktencheck_kontingent",
  ],
  kommunen: [
    "managed_governance",
    "reports_outcomes",
    "event_begleitung",
    "moderation_assistenz",
    "companion_kommunikation",
    "faktencheck_kontingent",
  ],
};

function sortAddOnsForSegment(
  addOns: readonly InstitutionalAddOn[],
  segmentId: PricingSegmentId | null,
  locale: PricingLocale = "de",
) {
  if (!segmentId) return [...addOns];
  const priority = ADD_ON_PRIORITY_BY_SEGMENT[segmentId];
  const rank = new Map(priority.map((id, index) => [id, index]));
  return [...addOns].sort((a, b) => {
    const aRank = rank.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bRank = rank.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return aRank - bRank || a.title.localeCompare(b.title, locale === "en" ? "en" : "de");
  });
}

export function getInstitutionalAddOnsForSegment(
  segmentId: PricingSegmentId | null,
  locale: PricingLocale = "de",
) {
  const addOns = getInstitutionalSharedAddOnsInternal(locale);
  if (!segmentId) return sortAddOnsForSegment(addOns, null, locale);
  const filtered = addOns.filter((entry) => entry.relevantSegments.includes(segmentId));
  return sortAddOnsForSegment(filtered, segmentId, locale);
}

export const INSTITUTIONAL_PRICING_SEGMENTS: readonly InstitutionalPricingSegment[] = [
  {
    id: "organisationen",
    title: "Organisationen / Verbände / Vereine",
    shortTitle: "Organisationen",
    forWhom: [
      "Verbände, Vereine, Initiativen, Träger und professionelle Organisationsteams",
      "Betriebsnahe Kontexte mit Team-, Rollen- und Governance-Bedarf",
    ],
    intendedFor: [
      "Strukturierte Themenarbeit mit nachvollziehbarer Beteiligung",
      "Verlässliche Teamabläufe mit Moderation und Routing",
      "Reports und Outcomes für interne und öffentliche Kommunikation",
    ],
    standardIncluded: [
      "Themenräume und Anlassräume",
      "Teams und Rollenmodell",
      "Governance-, Moderations- und Routing-Grundstruktur",
      "Basis-Reporting für laufenden Betrieb",
    ],
    priceBlocks: [
      {
        key: "grundaktivierung",
        title: "Grundaktivierung",
        priceLabel: "ab 1.500 € / Monat",
        detail: "Professioneller Einstieg mit Einrichtung von Struktur, Rollen und Startprozessen.",
      },
      {
        key: "laufender_betrieb",
        title: "Laufender Betrieb (Betrieb Plus)",
        priceLabel: "ab 2.900 € / Monat",
        detail: "Regelbetrieb mit mehr Teams, erweiterten Prozesspfaden und stabiler Governance.",
      },
      {
        key: "raeume",
        title: "Räume / Themenräume / Anlassräume",
        priceLabel: "Small 300 € · Medium 600–1.000 € · Large 1.000–1.500 € / aktiver Raum",
        detail: "Raumkomplexität nach Quellenlage, Konfliktintensität und Stakeholder-Dichte.",
      },
      {
        key: "aktive_beteiligung",
        title: "Optionale aktive Beteiligung",
        priceLabel: "ab 0,75 € je aktivem Teilnehmenden und Zeitraum",
        detail: "Nur aktive Beteiligung wird berücksichtigt, keine pauschale Account-Bepreisung.",
      },
      {
        key: "reports",
        title: "Reports / Auswertung",
        priceLabel: "ab 390 € / Monat",
        detail: "Outcome- und Wirkungsreports als eigenständiger, transparent buchbarer Baustein.",
      },
      {
        key: "moderation_governance",
        title: "Moderation / Governance",
        priceLabel: "ab 450 € / Monat",
        detail: "Zusätzliche Governance- und Moderationsleistung je nach Prozesskomplexität.",
      },
    ],
    addOns: INSTITUTIONAL_SHARED_ADD_ONS,
    activationAndEnablement: [
      "Paketbeauftragung über /order?segment=organisationen",
      "Aktivierung mit Team- und Rollenabstimmung",
      "Freischaltung und Betriebsaufnahme entlang des abgestimmten Prozessrahmens",
    ],
    packageOptions: [
      {
        packageId: "b2b_basis",
        title: "Organisation Aktivierung",
        detail: "Professioneller Einstieg mit Struktur-, Rollen- und Startaufbau.",
        ctaLabel: "Paket auswählen",
        ctaHref: "/order?paket=b2b_basis",
      },
      {
        packageId: "b2b_pro",
        title: "Organisation Betrieb Plus",
        detail: "Laufender Betrieb mit vertiefter Governance und Reporttiefe.",
        ctaLabel: "Bestellung absenden",
        ctaHref: "/order?paket=b2b_pro",
      },
    ],
    ctaHref: "/order?segment=organisationen",
  },
  {
    id: "kommunen",
    title: "Kommunen / Verwaltungen / Landkreise",
    shortTitle: "Kommunen / Verwaltung",
    forWhom: [
      "Kommunalverwaltungen, Landkreise, öffentliche Träger",
      "Beteiligungsprozesse mit Transparenz-, Rücklauf- und Umsetzungsanforderungen",
    ],
    intendedFor: [
      "Beteiligungsbetrieb mit Anlassräumen und Themenräumen",
      "Nachvollziehbare Governance und öffentliche Transparenz",
      "Auswertbare Rückläufe für Verwaltung, Gremien und Öffentlichkeit",
    ],
    standardIncluded: [
      "Beteiligungsbetriebs-Setup inkl. Rollenmodell",
      "Anlassräume und Themenräume im kommunalen Kontext",
      "Governance- und Freigabegrundstruktur",
      "Basisreports inkl. Mehrheits-, Minderheits- und Spannungsbilder",
    ],
    priceBlocks: [
      {
        key: "grundaktivierung",
        title: "Grundaktivierung",
        priceLabel: "ab 2.500 € / Monat",
        detail: "Einrichtung des kommunalen Betriebsrahmens inkl. Rollen, Zuständigkeiten und Startpfad.",
      },
      {
        key: "laufender_betrieb",
        title: "Laufender Betrieb (Betrieb Plus)",
        priceLabel: "ab 4.500 € / Monat",
        detail: "Fortlaufender Beteiligungsbetrieb mit erweitertem Auswertungs- und Umsetzungsfokus.",
      },
      {
        key: "raeume",
        title: "Räume / Themenräume / Anlassräume",
        priceLabel: "Small 300 € · Medium 600–1.000 € · Large 1.000–1.500 € / aktiver Raum",
        detail: "Staffelung nach Prozessumfang, Konfliktintensität und Koordinationsaufwand.",
      },
      {
        key: "aktive_beteiligung",
        title: "Optionale aktive Beteiligung",
        priceLabel: "ab 0,75 € je aktivem Teilnehmenden und Zeitraum",
        detail: "Keine Einwohnerpauschale, sondern klare Orientierung an real aktiver Beteiligung.",
      },
      {
        key: "reports",
        title: "Reports / Auswertung",
        priceLabel: "ab 590 € / Monat",
        detail: "Regelmäßige Auswertungspakete für Transparenz, Rückläufe und Entscheidungsnähe.",
      },
      {
        key: "moderation_governance",
        title: "Moderation / Governance",
        priceLabel: "ab 790 € / Monat",
        detail: "Zusätzliche Moderations- und Governance-Begleitung im laufenden Beteiligungsbetrieb.",
      },
    ],
    addOns: INSTITUTIONAL_SHARED_ADD_ONS,
    activationAndEnablement: [
      "Paketbeauftragung über /order?segment=kommunen",
      "Aktivierung mit kommunaler Prozess- und Rollenabstimmung",
      "Freischaltung entlang Governance-, Reporting- und Umsetzungslogik",
    ],
    packageOptions: [
      {
        packageId: "b2g_basis",
        title: "Kommune / Verwaltung Aktivierung",
        detail: "Erster Beteiligungsbetrieb mit klaren Rollen und Transparenzpfad.",
        ctaLabel: "Paket auswählen",
        ctaHref: "/order?paket=b2g_basis",
      },
      {
        packageId: "b2g_pro",
        title: "Kommune / Verwaltung Betrieb Plus",
        detail: "Fortlaufender Betrieb mit stärkerer Auswertung und Umsetzungsnähe.",
        ctaLabel: "Bestellung absenden",
        ctaHref: "/order?paket=b2g_pro",
      },
    ],
    ctaHref: "/order?segment=kommunen",
  },
] as const;

export const INSTITUTIONAL_PRICING_SEGMENTS_EN: readonly InstitutionalPricingSegment[] = [
  {
    id: "organisationen",
    title: "Organizations / associations / NGOs",
    shortTitle: "Organizations",
    forWhom: [
      "Associations, NGOs, initiatives, institutions and professional organization teams",
      "Operational contexts with team, role and governance needs",
    ],
    intendedFor: [
      "Structured topic work with traceable participation",
      "Reliable team workflows with moderation and routing",
      "Reports and outcomes for internal and public communication",
    ],
    standardIncluded: [
      "Topic rooms and issue rooms",
      "Team and role model",
      "Governance, moderation and routing baseline",
      "Baseline reporting for ongoing operations",
    ],
    priceBlocks: [
      {
        key: "grundaktivierung",
        title: "Base activation",
        priceLabel: "from €1,500 / month",
        detail: "Professional setup including structure, roles and startup processes.",
      },
      {
        key: "laufender_betrieb",
        title: "Ongoing operations (Operations Plus)",
        priceLabel: "from €2,900 / month",
        detail: "Regular operations with more teams, expanded process paths and stable governance.",
      },
      {
        key: "raeume",
        title: "Rooms / topic rooms / issue rooms",
        priceLabel: "Small €300 · Medium €600–1,000 · Large €1,000–1,500 / active room",
        detail: "Room complexity depends on source context, conflict intensity and stakeholder density.",
      },
      {
        key: "aktive_beteiligung",
        title: "Optional active participation",
        priceLabel: "from €0.75 per active participant and period",
        detail: "Only active participation is considered, not flat account-based pricing.",
      },
      {
        key: "reports",
        title: "Reports / analytics",
        priceLabel: "from €390 / month",
        detail: "Outcome and impact reporting as a standalone, transparently orderable module.",
      },
      {
        key: "moderation_governance",
        title: "Moderation / governance",
        priceLabel: "from €450 / month",
        detail: "Additional governance and moderation support based on process complexity.",
      },
    ],
    addOns: INSTITUTIONAL_SHARED_ADD_ONS_EN,
    activationAndEnablement: [
      "Package order via /order?segment=organisationen",
      "Activation with team and role alignment",
      "Go-live along the agreed operating framework",
    ],
    packageOptions: [
      {
        packageId: "b2b_basis",
        title: "Organization Activation",
        detail: "Professional entry with structure, role and startup setup.",
        ctaLabel: "Select package",
        ctaHref: "/order?paket=b2b_basis",
      },
      {
        packageId: "b2b_pro",
        title: "Organization Operations Plus",
        detail: "Ongoing operations with deeper governance and reporting depth.",
        ctaLabel: "Submit order",
        ctaHref: "/order?paket=b2b_pro",
      },
    ],
    ctaHref: "/order?segment=organisationen",
  },
  {
    id: "kommunen",
    title: "Municipalities / public administration / districts",
    shortTitle: "Municipalities / administration",
    forWhom: [
      "Municipal administrations, districts and public institutions",
      "Participation processes with transparency, feedback-loop and implementation requirements",
    ],
    intendedFor: [
      "Participation operations with issue and topic rooms",
      "Traceable governance and public transparency",
      "Analyzable feedback loops for administration, councils and public",
    ],
    standardIncluded: [
      "Participation operations setup incl. role model",
      "Issue and topic rooms in municipal context",
      "Governance and approval baseline",
      "Baseline reports incl. majority, minority and tension insights",
    ],
    priceBlocks: [
      {
        key: "grundaktivierung",
        title: "Base activation",
        priceLabel: "from €2,500 / month",
        detail: "Setup of municipal operating framework incl. roles, responsibilities and launch path.",
      },
      {
        key: "laufender_betrieb",
        title: "Ongoing operations (Operations Plus)",
        priceLabel: "from €4,500 / month",
        detail: "Continuous participation operations with expanded analytics and implementation focus.",
      },
      {
        key: "raeume",
        title: "Rooms / topic rooms / issue rooms",
        priceLabel: "Small €300 · Medium €600–1,000 · Large €1,000–1,500 / active room",
        detail: "Tiering based on process scope, conflict intensity and coordination effort.",
      },
      {
        key: "aktive_beteiligung",
        title: "Optional active participation",
        priceLabel: "from €0.75 per active participant and period",
        detail: "No per-capita baseline pricing; oriented to real active participation.",
      },
      {
        key: "reports",
        title: "Reports / analytics",
        priceLabel: "from €590 / month",
        detail: "Regular analytics packages for transparency, feedback loops and decision readiness.",
      },
      {
        key: "moderation_governance",
        title: "Moderation / governance",
        priceLabel: "from €790 / month",
        detail: "Additional moderation and governance support in continuous participation operations.",
      },
    ],
    addOns: INSTITUTIONAL_SHARED_ADD_ONS_EN,
    activationAndEnablement: [
      "Package order via /order?segment=kommunen",
      "Activation with municipal process and role alignment",
      "Go-live along governance, reporting and implementation logic",
    ],
    packageOptions: [
      {
        packageId: "b2g_basis",
        title: "Municipality / Administration Activation",
        detail: "First participation operations with clear role and transparency path.",
        ctaLabel: "Select package",
        ctaHref: "/order?paket=b2g_basis",
      },
      {
        packageId: "b2g_pro",
        title: "Municipality / Administration Operations Plus",
        detail: "Continuous operations with stronger analytics and implementation proximity.",
        ctaLabel: "Submit order",
        ctaHref: "/order?paket=b2g_pro",
      },
    ],
    ctaHref: "/order?segment=kommunen",
  },
] as const;

const INSTITUTIONAL_SELECTION_GOALS_DE: readonly InstitutionalSelectionOption<InstitutionalSelectionGoalId>[] = [
  {
    id: "beteiligung_starten",
    title: "Beteiligung starten",
    detail: "Schneller, sauberer Einstieg in einen neuen Beteiligungsanlass.",
  },
  {
    id: "betrieb_aufsetzen",
    title: "Laufenden Betrieb aufsetzen",
    detail: "Struktur für regelmäßige Beteiligung mit Rollen und klaren Abläufen.",
  },
  {
    id: "auswertung_reports",
    title: "Auswertung / Reports",
    detail: "Belastbare Rückläufe und nachvollziehbare Entscheidungsgrundlagen.",
  },
  {
    id: "moderation_begleitung",
    title: "Moderation / Begleitung",
    detail: "Laufende Begleitung für kommunikativ anspruchsvolle Prozesse.",
  },
  {
    id: "oeffentliche_anschlussfaehigkeit",
    title: "Öffentliche Anschlussfähigkeit",
    detail: "Companion-, Kommunikations- und Beteiligungswirkung nach außen stärken.",
  },
  {
    id: "faktencheck_strittig",
    title: "Faktencheck für strittige Themen",
    detail: "Kontroverse Punkte belastbar prüfen und nachvollziehbar dokumentieren.",
  },
];

const INSTITUTIONAL_SELECTION_GOALS_EN: readonly InstitutionalSelectionOption<InstitutionalSelectionGoalId>[] = [
  {
    id: "beteiligung_starten",
    title: "Start participation",
    detail: "Fast and clean entry for a new participation context.",
  },
  {
    id: "betrieb_aufsetzen",
    title: "Set up ongoing operations",
    detail: "Reliable structure for recurring participation with clear team workflows.",
  },
  {
    id: "auswertung_reports",
    title: "Analytics / reports",
    detail: "Traceable outcomes and actionable decision support.",
  },
  {
    id: "moderation_begleitung",
    title: "Moderation / support",
    detail: "Ongoing process support for communication-heavy contexts.",
  },
  {
    id: "oeffentliche_anschlussfaehigkeit",
    title: "Public continuity",
    detail: "Strengthen public communication around participation outcomes.",
  },
  {
    id: "faktencheck_strittig",
    title: "Fact-check disputed topics",
    detail: "Validate contentious claims and keep the evidence trail clear.",
  },
];

const INSTITUTIONAL_SELECTION_FRAMES_DE: readonly InstitutionalSelectionOption<InstitutionalSelectionFrameId>[] = [
  {
    id: "einmaliger_einsatz",
    title: "Einmaliger Einsatz",
    detail: "Klar abgegrenzter Anlass mit begrenzter Laufzeit.",
  },
  {
    id: "pilot",
    title: "Pilot",
    detail: "Begrenzter Testbetrieb mit Lernschleife.",
  },
  {
    id: "laufender_betrieb",
    title: "Laufender Betrieb",
    detail: "Regelbetrieb über mehrere Themen und Zeiträume.",
  },
  {
    id: "internes_team",
    title: "Internes Team",
    detail: "Interne Abstimmung mit begrenzter öffentlicher Sichtbarkeit.",
  },
  {
    id: "oeffentliche_beteiligung",
    title: "Öffentliche Beteiligung",
    detail: "Offene Einbindung mit nachvollziehbaren Rückläufen.",
  },
  {
    id: "hohe_sichtbarkeit",
    title: "Hohe Sichtbarkeit",
    detail: "Hoher Kommunikations- und Erwartungsdruck im Außenraum.",
  },
  {
    id: "fokus_ruecklaeufe",
    title: "Fokus Rückläufe",
    detail: "Rückläufe, Spannungsbilder und Umsetzungsimpulse stehen im Vordergrund.",
  },
  {
    id: "fokus_moderation",
    title: "Fokus Moderation",
    detail: "Begleitete Prozessführung ist zentral.",
  },
  {
    id: "fokus_reporting",
    title: "Fokus Reporting",
    detail: "Regelmäßige Auswertung und Berichterstattung stehen im Fokus.",
  },
];

const INSTITUTIONAL_SELECTION_FRAMES_EN: readonly InstitutionalSelectionOption<InstitutionalSelectionFrameId>[] = [
  {
    id: "einmaliger_einsatz",
    title: "One-time engagement",
    detail: "Clearly bounded context with limited duration.",
  },
  {
    id: "pilot",
    title: "Pilot",
    detail: "Limited rollout with explicit learning loop.",
  },
  {
    id: "laufender_betrieb",
    title: "Ongoing operations",
    detail: "Continuous operations across topics and time periods.",
  },
  {
    id: "internes_team",
    title: "Internal team",
    detail: "Internal alignment with limited public visibility.",
  },
  {
    id: "oeffentliche_beteiligung",
    title: "Public participation",
    detail: "Open engagement with traceable feedback loops.",
  },
  {
    id: "hohe_sichtbarkeit",
    title: "High visibility",
    detail: "High communication pressure in public-facing contexts.",
  },
  {
    id: "fokus_ruecklaeufe",
    title: "Feedback-loop focus",
    detail: "Outcome loops and tension insights are central.",
  },
  {
    id: "fokus_moderation",
    title: "Moderation focus",
    detail: "Guided process moderation is central.",
  },
  {
    id: "fokus_reporting",
    title: "Reporting focus",
    detail: "Regular analytics and reporting are central.",
  },
];

const INSTITUTIONAL_COMPLETION_PATHS_DE: readonly InstitutionalSelectionOption<InstitutionalCompletionPathId>[] = [
  {
    id: "direct_order",
    title: "Direkt bestellen",
    detail: "Konfiguration direkt absenden und Freischaltung im Folgeprozess starten.",
  },
  {
    id: "quote_request",
    title: "Kostenvoranschlag anfordern",
    detail: "Konfiguration speichern und als Angebotsgrundlage verwenden.",
  },
  {
    id: "conversation_request",
    title: "Gespräch anfragen",
    detail: "Konfiguration senden und Rückruf-/Abstimmungswunsch markieren.",
  },
];

const INSTITUTIONAL_COMPLETION_PATHS_EN: readonly InstitutionalSelectionOption<InstitutionalCompletionPathId>[] = [
  {
    id: "direct_order",
    title: "Direct order",
    detail: "Submit configuration and continue with activation follow-up.",
  },
  {
    id: "quote_request",
    title: "Request quote",
    detail: "Store configuration and use it as quote basis.",
  },
  {
    id: "conversation_request",
    title: "Request conversation",
    detail: "Submit configuration and mark call-back / alignment request.",
  },
];

const GOAL_ID_SET = new Set<InstitutionalSelectionGoalId>(
  INSTITUTIONAL_SELECTION_GOALS_DE.map((entry) => entry.id),
);

const FRAME_ID_SET = new Set<InstitutionalSelectionFrameId>(
  INSTITUTIONAL_SELECTION_FRAMES_DE.map((entry) => entry.id),
);

const COMPLETION_PATH_ID_SET = new Set<InstitutionalCompletionPathId>(
  INSTITUTIONAL_COMPLETION_PATHS_DE.map((entry) => entry.id),
);

const GOAL_ADD_ON_PRIORITY: Record<InstitutionalSelectionGoalId, readonly InstitutionalAddOn["id"][]> = {
  beteiligung_starten: ["event_begleitung", "companion_kommunikation", "moderation_assistenz"],
  betrieb_aufsetzen: ["moderation_assistenz", "managed_governance", "reports_outcomes"],
  auswertung_reports: ["reports_outcomes", "managed_governance", "companion_kommunikation"],
  moderation_begleitung: ["moderation_assistenz", "event_begleitung", "managed_governance"],
  oeffentliche_anschlussfaehigkeit: ["companion_kommunikation", "event_begleitung", "reports_outcomes"],
  faktencheck_strittig: ["faktencheck_kontingent", "reports_outcomes", "companion_kommunikation"],
};

const FRAME_ADD_ON_PRIORITY: Record<InstitutionalSelectionFrameId, readonly InstitutionalAddOn["id"][]> = {
  einmaliger_einsatz: ["event_begleitung", "companion_kommunikation", "reports_outcomes"],
  pilot: ["reports_outcomes", "moderation_assistenz", "companion_kommunikation"],
  laufender_betrieb: ["managed_governance", "moderation_assistenz", "reports_outcomes"],
  internes_team: ["moderation_assistenz", "reports_outcomes", "managed_governance"],
  oeffentliche_beteiligung: ["companion_kommunikation", "event_begleitung", "reports_outcomes"],
  hohe_sichtbarkeit: ["companion_kommunikation", "event_begleitung", "faktencheck_kontingent"],
  fokus_ruecklaeufe: ["reports_outcomes", "managed_governance", "moderation_assistenz"],
  fokus_moderation: ["moderation_assistenz", "managed_governance", "event_begleitung"],
  fokus_reporting: ["reports_outcomes", "managed_governance", "companion_kommunikation"],
};

const ADD_ON_NOT_NEEDED_HINT_DE: Record<InstitutionalAddOn["id"], string> = {
  event_begleitung: "Eher nicht nötig bei rein internem, asynchronem Betrieb ohne Terminfenster.",
  moderation_assistenz: "Eher nicht nötig bei sehr kleinem, konfliktarmem Einmal-Setup.",
  reports_outcomes: "Eher nicht nötig, wenn keine regelmäßige Auswertung oder Gremienvorlage benötigt wird.",
  managed_governance: "Eher nicht nötig bei sehr einfachen Freigabepfaden ohne Teamkomplexität.",
  companion_kommunikation: "Eher nicht nötig bei rein internen Prozessen ohne öffentliche Einbindung.",
  faktencheck_kontingent: "Eher nicht nötig bei unstrittigen Themen ohne erhöhten Prüfbedarf.",
};

const ADD_ON_NOT_NEEDED_HINT_EN: Record<InstitutionalAddOn["id"], string> = {
  event_begleitung: "Usually not needed for purely internal, asynchronous work without event windows.",
  moderation_assistenz: "Usually not needed for very small one-off setups with low friction.",
  reports_outcomes: "Usually not needed when no recurring analytics or committee briefing is required.",
  managed_governance: "Usually not needed for simple approval paths with low team complexity.",
  companion_kommunikation: "Usually not needed for internal-only flows without public communication needs.",
  faktencheck_kontingent: "Usually not needed for non-contentious topics with low verification demand.",
};

const ADD_ON_FOLLOWUP_QUESTIONS_DE: Record<InstitutionalAddOn["id"], readonly string[]> = {
  reports_outcomes: [
    "Für wen sollen die Auswertungen erstellt werden?",
    "Welche Form wird zuerst benötigt (Monatsreport, Abschlussreport, Gremienvorlage)?",
    "Liegt der Fokus auf Rückläufen, Spannungsbildern oder Umsetzung?",
  ],
  moderation_assistenz: [
    "Ist das Format intern, öffentlich oder gemischt?",
    "Wie hoch ist das erwartete Konfliktpotenzial?",
    "Wird die Moderation einmalig oder laufend benötigt?",
  ],
  companion_kommunikation: [
    "Welche Formate sind relevant (Print, QR, Bühne, Streaming, Website, Artikel)?",
    "Soll die Kommunikation einmalig oder fortlaufend laufen?",
    "Welche Zielgruppe steht im Vordergrund?",
  ],
  faktencheck_kontingent: [
    "Geht es um einzelne Themen oder laufenden Bedarf?",
    "Sollen Ergebnisse intern bleiben oder öffentlich sichtbar sein?",
    "Welche Entscheidungsstelle nutzt die Prüfergebnisse?",
  ],
  managed_governance: [
    "Welche Rollen und Freigaben müssen abgebildet werden?",
    "Welche Prozesse sind heute besonders abstimmungsintensiv?",
    "Welche Teams müssen im Regelbetrieb eingebunden sein?",
  ],
  event_begleitung: [
    "Welches Terminformat soll begleitet werden?",
    "Wie öffentlich ist der Einsatzkontext?",
    "Welche Vor- und Nachbereitungsunterstützung wird benötigt?",
  ],
};

const ADD_ON_FOLLOWUP_QUESTIONS_EN: Record<InstitutionalAddOn["id"], readonly string[]> = {
  reports_outcomes: [
    "Who is the primary audience for reports?",
    "Which format is needed first (monthly report, final report, committee brief)?",
    "Should the focus be feedback loops, tensions, or implementation tracking?",
  ],
  moderation_assistenz: [
    "Is the format internal, public, or mixed?",
    "What conflict potential do you expect?",
    "Is moderation needed once or continuously?",
  ],
  companion_kommunikation: [
    "Which channels matter most (print, QR, stage, streaming, website, article)?",
    "Should this run once or continuously?",
    "Which audience is most important?",
  ],
  faktencheck_kontingent: [
    "Do you need checks for single topics or continuously?",
    "Should outputs stay internal or be publicly visible?",
    "Which decision body uses the verification output?",
  ],
  managed_governance: [
    "Which roles and approvals must be represented?",
    "Which workflows currently cause the highest coordination load?",
    "Which teams need to be included in regular operations?",
  ],
  event_begleitung: [
    "Which event format should be supported?",
    "How public is the engagement context?",
    "What pre/post support do you need?",
  ],
};

function resolveSelectionGoals(locale: PricingLocale = "de") {
  return locale === "en" ? INSTITUTIONAL_SELECTION_GOALS_EN : INSTITUTIONAL_SELECTION_GOALS_DE;
}

function resolveSelectionFrames(locale: PricingLocale = "de") {
  return locale === "en" ? INSTITUTIONAL_SELECTION_FRAMES_EN : INSTITUTIONAL_SELECTION_FRAMES_DE;
}

function resolveCompletionPaths(locale: PricingLocale = "de") {
  return locale === "en" ? INSTITUTIONAL_COMPLETION_PATHS_EN : INSTITUTIONAL_COMPLETION_PATHS_DE;
}

function resolvePackageScore(goalId: InstitutionalSelectionGoalId, frameId: InstitutionalSelectionFrameId) {
  let score = 0;
  if (goalId === "betrieb_aufsetzen" || goalId === "auswertung_reports" || goalId === "moderation_begleitung") {
    score += 1;
  }
  if (
    frameId === "laufender_betrieb" ||
    frameId === "oeffentliche_beteiligung" ||
    frameId === "hohe_sichtbarkeit" ||
    frameId === "fokus_reporting"
  ) {
    score += 1;
  }
  if (goalId === "faktencheck_strittig" && frameId === "einmaliger_einsatz") {
    score -= 1;
  }
  return score;
}

function uniqueOrdered(values: readonly InstitutionalAddOn["id"][]) {
  const seen = new Set<InstitutionalAddOn["id"]>();
  const ordered: InstitutionalAddOn["id"][] = [];
  values.forEach((entry) => {
    if (seen.has(entry)) return;
    seen.add(entry);
    ordered.push(entry);
  });
  return ordered;
}

export function normalizeInstitutionalSelectionGoalId(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return GOAL_ID_SET.has(trimmed as InstitutionalSelectionGoalId) ? (trimmed as InstitutionalSelectionGoalId) : null;
}

export function normalizeInstitutionalSelectionFrameId(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return FRAME_ID_SET.has(trimmed as InstitutionalSelectionFrameId) ? (trimmed as InstitutionalSelectionFrameId) : null;
}

export function normalizeInstitutionalCompletionPathId(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return COMPLETION_PATH_ID_SET.has(trimmed as InstitutionalCompletionPathId)
    ? (trimmed as InstitutionalCompletionPathId)
    : null;
}

export function getInstitutionalSelectionGoals(locale: PricingLocale = "de") {
  return resolveSelectionGoals(locale);
}

export function getInstitutionalSelectionFrames(locale: PricingLocale = "de") {
  return resolveSelectionFrames(locale);
}

export function getInstitutionalCompletionPaths(locale: PricingLocale = "de") {
  return resolveCompletionPaths(locale);
}

export function getInstitutionalAddonNotNeededHint(
  addOnId: InstitutionalAddOn["id"],
  locale: PricingLocale = "de",
) {
  return locale === "en" ? ADD_ON_NOT_NEEDED_HINT_EN[addOnId] : ADD_ON_NOT_NEEDED_HINT_DE[addOnId];
}

export function getInstitutionalAddonFollowupQuestions(
  addOnId: InstitutionalAddOn["id"],
  locale: PricingLocale = "de",
) {
  const map = locale === "en" ? ADD_ON_FOLLOWUP_QUESTIONS_EN : ADD_ON_FOLLOWUP_QUESTIONS_DE;
  return map[addOnId] ?? [];
}

export function recommendInstitutionalConfiguration(args: {
  segmentId: InstitutionalPricingSegmentId;
  goalId?: InstitutionalSelectionGoalId | null;
  frameId?: InstitutionalSelectionFrameId | null;
  locale?: PricingLocale;
}): InstitutionalRecommendation {
  const locale = args.locale ?? "de";
  const goals = resolveSelectionGoals(locale);
  const frames = resolveSelectionFrames(locale);
  const goalId = args.goalId ?? goals[0].id;
  const frameId = args.frameId ?? frames[1].id;
  const score = resolvePackageScore(goalId, frameId);
  const recommendedPlus = score >= 2;
  const recommendedPackageId =
    args.segmentId === "organisationen"
      ? (recommendedPlus ? "b2b_pro" : "b2b_basis")
      : (recommendedPlus ? "b2g_pro" : "b2g_basis");
  const alternativePackageId =
    args.segmentId === "organisationen"
      ? (recommendedPlus ? "b2b_basis" : "b2b_pro")
      : (recommendedPlus ? "b2g_basis" : "b2g_pro");

  const segmentAddOns = getInstitutionalAddOnsForSegment(args.segmentId, locale).map((entry) => entry.id);
  const recommendedCandidates = uniqueOrdered([
    ...GOAL_ADD_ON_PRIORITY[goalId],
    ...FRAME_ADD_ON_PRIORITY[frameId],
    ...ADD_ON_PRIORITY_BY_SEGMENT[args.segmentId],
  ]);
  const recommendedAddOnIds = recommendedCandidates
    .filter((id) => segmentAddOns.includes(id))
    .slice(0, 3);
  const optionalAddOnIds = segmentAddOns.filter((id) => !recommendedAddOnIds.includes(id));

  const goalTitle = goals.find((entry) => entry.id === goalId)?.title ?? goalId;
  const frameTitle = frames.find((entry) => entry.id === frameId)?.title ?? frameId;
  const packageTitle = getInstitutionalPricingSegments(locale)
    .find((entry) => entry.id === args.segmentId)
    ?.packageOptions.find((entry) => entry.packageId === recommendedPackageId)?.title;

  const roiHighlights =
    locale === "en"
      ? [
          "Less manual coordination effort in teams and committees.",
          "Structured feedback loops instead of untraceable comment streams.",
          "Clearer decision basis with documented outcomes and tensions.",
          "Better public continuity through participation and communication modules.",
        ]
      : [
          "Weniger manueller Abstimmungsaufwand in Team und Gremien.",
          "Strukturierte Rückläufe statt unübersichtlichem Kommentarchaos.",
          "Belastbarere Entscheidungsgrundlagen mit dokumentierten Spannungsbildern.",
          "Bessere öffentliche Anschlussfähigkeit über Beteiligung und Kommunikationsmodule.",
        ];

  const whyRecommended =
    locale === "en"
      ? `Recommended because your focus "${goalTitle}" in frame "${frameTitle}" is best covered by ${packageTitle || recommendedPackageId}.`
      : `Empfohlen, weil der Fokus "${goalTitle}" im Rahmen "${frameTitle}" am besten durch ${packageTitle || recommendedPackageId} getragen wird.`;
  const coveredByPackage =
    locale === "en"
      ? "Covers baseline operating setup, traceable participation flow and role-based activation path."
      : "Deckt den Betriebsstart, nachvollziehbare Beteiligungsabläufe und den rollenbasierten Aktivierungspfad ab.";
  const gapHint =
    locale === "en"
      ? "If communication pressure or reporting depth increases, add recommended extensions or move to the next package."
      : "Wenn Kommunikationsdruck oder Reportingtiefe steigt, ergänzt ihr die empfohlenen Erweiterungen oder wechselt zur nächsten Paketstufe.";

  return {
    segmentId: args.segmentId,
    goalId,
    frameId,
    recommendedPackageId,
    alternativePackageId,
    whyRecommended,
    coveredByPackage,
    gapHint,
    roiHighlights,
    recommendedAddOnIds,
    optionalAddOnIds,
  };
}

export function getInstitutionalPricingPageContent(locale: PricingLocale = "de") {
  return locale === "en" ? INSTITUTIONAL_PRICING_PAGE_CONTENT_EN : INSTITUTIONAL_PRICING_PAGE_CONTENT;
}

export function getInstitutionalPricingSegments(locale: PricingLocale = "de") {
  return locale === "en" ? INSTITUTIONAL_PRICING_SEGMENTS_EN : INSTITUTIONAL_PRICING_SEGMENTS;
}
