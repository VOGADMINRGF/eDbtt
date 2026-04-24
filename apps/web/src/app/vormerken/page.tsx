"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductSurfaceShell from "@/components/layout/ProductSurfaceShell";
import { HumanCheck } from "@/components/security/HumanCheck";
import {
  ORDER_SEGMENT_ORDER,
  formatPackagePriceLabel,
  getInstitutionalAddonFollowupQuestions,
  getInstitutionalAddOnMaturityMeta,
  getInstitutionalAddonNotNeededHint,
  getInstitutionalAddOnsForSegment,
  getInstitutionalCompletionPaths,
  getInstitutionalSelectionFrames,
  getInstitutionalSelectionGoals,
  getPackagesForJourneySegment,
  normalizeInstitutionalCompletionPathId,
  normalizeInstitutionalSelectionFrameId,
  normalizeInstitutionalSelectionGoalId,
  normalizePackageId,
  normalizePricingLocale,
  recommendInstitutionalConfiguration,
  resolvePricingOrderEntrySelection,
  type EDebattePackageDefinition,
  type EDebattePackageId,
  type InstitutionalCompletionPathId,
  type InstitutionalAddOn,
  type InstitutionalSelectionFrameId,
  type InstitutionalSelectionGoalId,
  type PricingLocale,
  type PricingSegmentId,
} from "@features/pricing";

const SALES_EMAIL = "sales@edebatte.org";

type QuoteCadence = "monthly" | "variable";

type QuoteLine = {
  id: string;
  title: string;
  priceLabel: string;
  amount: number | null;
  cadence: QuoteCadence;
  detail?: string;
};

const VORMERKEN_LABELS = {
  de: {
    pageKicker: "Paketstart",
    heroTitle: "Paket wählen und Start vorbereiten",
    heroText:
      "Ein klarer Bestellfluss: Segment und Paket wählen, relevante Angaben ergänzen und Bestellung absenden.",
    toPricing: "Zur Preisübersicht",
    toInstitutional: "Zu B2B/B2G-Konditionen",
    orderEntryHintTitle: "Vorauswahl aktiv",
    orderEntryHintText:
      "Du bist im Order-Einstieg. Segment- und Paketwahl bleiben jederzeit direkt hier änderbar.",
    segmentTitle: "Segment wählen",
    segmentLabels: {
      privat: "Einzelpersonen",
      journalismus: "Journalismus",
      organisationen: "Organisationen",
      kommunen: "Kommunen / Verwaltung",
    } as Record<PricingSegmentId, string>,
    packageSectionTitle: "Paketauswahl",
    packageSectionText: {
      privat: "Interessiert: 0 € für Mitglieder / 3,99 € regulär · Aktiv: 9,90 € · Mitgestaltend: 29,90 €",
      journalismus: "Journalistische Pakete mit Anlassraum-/Dossier-Fokus und optionalen Prüfpfaden.",
      organisationen: "Organisationen wählen zwischen Aktivierung und Betrieb Plus.",
      kommunen: "Kommunen wählen zwischen Aktivierung und Betrieb Plus mit kommunalem Betriebsrahmen.",
    } as Record<PricingSegmentId, string>,
    institutionalGuidedTitle: "Triff deine Vorauswahl",
    goalTitle: "Was steht im Vordergrund?",
    frameTitle: "Wie sieht euer Einsatzrahmen aus?",
    recommendationTitle: "Empfohlene Konfiguration",
    recommendationReason: "Warum empfohlen",
    recommendationCovered: "Was damit abgedeckt ist",
    recommendationGap: "Was optional ergänzt werden kann",
    recommendationValue: "Welchen Unterschied es macht",
    priceRangeTitle: "Preisrahmen",
    recommendedAddOnsTitle: "Empfohlene Erweiterungen",
    optionalAddOnsTitle: "Optional",
    optionalAddOnsHint: "Ergänzen, wenn es im Einsatzkontext wirklich hilft.",
    needBasedAddOnsTitle: "Nur bei Bedarf",
    needBasedAddOnsHint: "Diese Bausteine brauchen meist zusätzliche Klärung.",
    selectedPackageTitle: "Ausgewähltes Paket",
    forWhom: "Für wen?",
    intendedFor: "Wofür gedacht?",
    differenceToNext: "Unterschied zur nächsten Stufe",
    choosePackage: "Paket auswählen",
    selected: "Ausgewählt",
    addOnsTitle: "Add-ons",
    addOnsHint:
      "Add-ons sind optional. Auswahl wird in Bestellung und Kostenvoranschlag übernommen.",
    addOnStatus: "Status",
    addOnStatusDirect: "Direkt bestellbar",
    addOnStatusWithQuestions: "Mit Rückfragen",
    addOnStatusClarification: "Nur nach Klärung",
    addOnAdd: "Ergänzen",
    noAddOns: "Für dieses Segment sind hier keine Add-ons auswählbar.",
    addOnFollowupTitle: "Relevante Rückfragen",
    addOnFollowupHint:
      "Diese Rückfragen erscheinen nur für ausgewählte Add-ons und werden in die Bestellung übernommen.",
    addOnFollowupPlaceholder: "Kurz beantworten",
    quoteTitle: "Kostenvoranschlag (B2B/B2G)",
    quoteIntro:
      "Auf Knopfdruck wird ein strukturierter Kostenvoranschlag mit Leistungen erzeugt. Du kannst ihn durch Paket- und Add-on-Auswahl selbst konfigurieren.",
    createQuote: "Kostenvoranschlag erstellen",
    updateQuote: "Kostenvoranschlag aktualisieren",
    downloadQuote: "Downloadlink per E-Mail anfordern",
    downloadQuoteHint:
      "Der Downloadlink wird nach Prüfung separat per E-Mail gesendet.",
    downloadQuoteMissing: "Für den Downloadlink fehlen noch Pflichtangaben oder Zustimmungen.",
    downloadQuoteSent: "Downloadlink angefordert. Die E-Mail wird separat versendet.",
    downloadQuoteFailed: "Downloadlink konnte nicht angefordert werden.",
    quoteRecurring: "Monatlich planbare Positionen",
    quoteVariable: "Variable Positionen",
    quoteNoVariable: "Keine zusätzlichen variablen Positionen ausgewählt.",
    quoteMonthlyTotal: "Monatliche Summe",
    quoteMinimumTotal: "Monatliche Mindestsumme",
    quoteApproximation:
      "Positionen mit Einsatz- oder Kontextstaffelung sind als variable Posten separat ausgewiesen.",
    quoteServices: "Leistungsübersicht",
    membershipSectionTitle: "Initiative & Mitgliedschaft (optional)",
    membershipSectionIntro:
      "Mitgliedschaft ist keine Abo-Option, sondern eine gesellschaftliche Beteiligungsentscheidung.",
    membershipCheckbox: "Ich möchte zusätzlich die VoiceOpenGov-Mitgliedschaft beantragen.",
    membershipHint:
      "Mitgliedschaft und Paketfreischaltung werden getrennt geführt. Die finale Bestätigung erfolgt separat per E-Mail-Link.",
    membershipInterestedHint:
      "Für Mitglieder gilt beim Paket „Interessiert“ der kostenfreie Einstieg. Regulär sind es 3,99 €.",
    membershipContributionHint:
      "Der frei gewählte Mitgliedsbeitrag bleibt davon unabhängig. Empfohlener Mitgliedsbeitrag: 5,63 € (aus sozialen Erwägungen).",
    membershipSystemsHint:
      "eDebatte.org und VoiceOpenGov.org können organisatorisch und technisch getrennte Systeme mit zusätzlicher Sicherheitslogik nutzen.",
    formTitle: "Bestellung absenden",
    emailLabel: "E-Mail für Bestätigung",
    nameLabel: "Ansprechpartner",
    phoneLabel: "Telefon",
    organizationNameLabel: "Organisation / Kommune",
    roleLabel: "Rolle / Funktion",
    noteLabel: "Kontext (optional)",
    notePlaceholder: "Welche Einführung, Rollen oder Anlässe sollen wir beim Start berücksichtigen?",
    completionTitle: "Abschlussweg",
    completionHint: "Kostenvoranschlag ist optional und nicht der Primärpfad.",
    completionPaths: {
      direct_order: "Direkt bestellen",
      quote_request: "Kostenvoranschlag anfordern",
      conversation_request: "Gespräch anfragen",
    } as Record<InstitutionalCompletionPathId, string>,
    privacyConsent:
      "Ich bestätige, dass ich die Datenschutzhinweise gelesen habe und mit der Verarbeitung meiner Angaben einverstanden bin.",
    termsConsent: "Ich akzeptiere die AGB.",
    contactConsent:
      "Ich stimme der Kontaktaufnahme zur Bearbeitung meines Antrags zu (E-Mail/Telefon).",
    privacyLink: "Datenschutz",
    termsLink: "AGB",
    consentRequired: "Bitte Datenschutz, AGB und Kontaktzustimmung bestätigen.",
    sending: "Sende …",
    submit: "Absenden",
    saveError: "Bestellung konnte nicht gespeichert werden",
    securityDone: "Sicherheitscheck abgeschlossen.",
    securityError: "Sicherheitscheck fehlgeschlagen. Bitte erneut versuchen.",
    securityMissing: "Bitte zuerst den Sicherheitscheck bestätigen.",
    successTitle: "Bestellung eingegangen",
    orderIdLabel: "Order-ID",
    priceLabel: "Preis / Modell",
    addOnsLabel: "Add-ons",
    membershipRequested: "Mitgliedschaft zusätzlich beantragt",
    membershipNotRequested: "Keine zusätzliche Mitgliedschaft markiert",
    accountCta: "Zum Konto",
    contactSales: "Kontakt an sales@edebatte.org",
    institutionalHint:
      "Direktbestellung bleibt möglich. Alternativ kannst du einen Downloadlink anfordern oder das Team kontaktieren.",
    contactPathsTitle: "Kontaktwege",
    contactPathsIntro: "Bei Bedarf erreichst du das Team über den passenden Kanal.",
    contactPathTeam: "Kontakt zum Team",
    contactPathTeams: "MS Teams",
    contactPathEmail: "E-Mail",
    contactPathPhone: "Telefonisch",
  },
  en: {
    pageKicker: "Package start",
    heroTitle: "Choose package and prepare start",
    heroText:
      "One clear ordering flow: choose segment and package, complete relevant details and submit.",
    toPricing: "Back to pricing",
    toInstitutional: "Go to B2B/B2G conditions",
    orderEntryHintTitle: "Preselection active",
    orderEntryHintText:
      "You are in the order entry path. Segment and package can still be changed here at any time.",
    segmentTitle: "Choose segment",
    segmentLabels: {
      privat: "Individuals",
      journalismus: "Journalism",
      organisationen: "Organizations",
      kommunen: "Municipalities / administration",
    } as Record<PricingSegmentId, string>,
    packageSectionTitle: "Package selection",
    packageSectionText: {
      privat: "Interested: €0 for members / €3.99 regular · Active: €9.90 · Co-creating: €29.90",
      journalismus: "Journalism packages with issue-room/dossier focus and optional review paths.",
      organisationen: "Organizations choose between activation and operations plus.",
      kommunen: "Municipalities choose between activation and operations plus in municipal operating mode.",
    } as Record<PricingSegmentId, string>,
    institutionalGuidedTitle: "Make your preselection",
    goalTitle: "What is your primary goal?",
    frameTitle: "What is your operating frame?",
    recommendationTitle: "Recommended configuration",
    recommendationReason: "Why recommended",
    recommendationCovered: "What this covers",
    recommendationGap: "What can be added optionally",
    recommendationValue: "What difference it makes",
    priceRangeTitle: "Price range",
    recommendedAddOnsTitle: "Recommended extensions",
    optionalAddOnsTitle: "Optional",
    optionalAddOnsHint: "Add when it clearly helps in your setup.",
    needBasedAddOnsTitle: "Need-based only",
    needBasedAddOnsHint: "These modules usually require additional alignment.",
    selectedPackageTitle: "Selected package",
    forWhom: "For whom?",
    intendedFor: "Intended for",
    differenceToNext: "Difference to the next tier",
    choosePackage: "Select package",
    selected: "Selected",
    addOnsTitle: "Add-ons",
    addOnsHint: "Add-ons are optional. Selection is included in order and cost estimate.",
    addOnStatus: "Status",
    addOnStatusDirect: "Directly orderable",
    addOnStatusWithQuestions: "With follow-up questions",
    addOnStatusClarification: "Clarification required",
    addOnAdd: "Add",
    noAddOns: "No add-ons available for this segment on this surface.",
    addOnFollowupTitle: "Relevant follow-up questions",
    addOnFollowupHint:
      "These questions appear only for selected add-ons and are included in your order.",
    addOnFollowupPlaceholder: "Short answer",
    quoteTitle: "Cost estimate (B2B/B2G)",
    quoteIntro:
      "Generate a structured cost estimate with service listing on button click. You can configure it yourself through package and add-on selection.",
    createQuote: "Create cost estimate",
    updateQuote: "Update cost estimate",
    downloadQuote: "Request download link by email",
    downloadQuoteHint:
      "The download link is sent separately by email after review.",
    downloadQuoteMissing: "Required details or consents are still missing for the download link.",
    downloadQuoteSent: "Download link requested. The email is sent separately.",
    downloadQuoteFailed: "Download link request failed.",
    quoteRecurring: "Monthly recurring positions",
    quoteVariable: "Variable positions",
    quoteNoVariable: "No additional variable positions selected.",
    quoteMonthlyTotal: "Monthly total",
    quoteMinimumTotal: "Monthly minimum total",
    quoteApproximation:
      "Positions with engagement- or context-based scaling are listed separately as variable items.",
    quoteServices: "Service overview",
    membershipSectionTitle: "Initiative and membership (optional)",
    membershipSectionIntro:
      "Membership is not an add-on subscription. It is a civic participation decision.",
    membershipCheckbox: "I also want to request VoiceOpenGov membership.",
    membershipHint:
      "Membership and package activation are handled separately. Final confirmation runs via a dedicated email link.",
    membershipInterestedHint:
      "For members, package “Interested” stays free. Regular price is €3.99.",
    membershipContributionHint:
      "The freely chosen membership contribution stays independent from package pricing. Recommended membership contribution: €5.63 (social benchmark).",
    membershipSystemsHint:
      "eDebatte.org and VoiceOpenGov.org can run on separate systems and databases with additional security logic.",
    formTitle: "Submit order",
    emailLabel: "Email for confirmation",
    nameLabel: "Contact person",
    phoneLabel: "Phone",
    organizationNameLabel: "Organization / municipality",
    roleLabel: "Role / function",
    noteLabel: "Context (optional)",
    notePlaceholder: "Which onboarding context, roles or issue spaces should we account for?",
    completionTitle: "Completion path",
    completionHint: "Quote request is optional, not the primary path.",
    completionPaths: {
      direct_order: "Direct order",
      quote_request: "Request quote",
      conversation_request: "Request conversation",
    } as Record<InstitutionalCompletionPathId, string>,
    privacyConsent:
      "I confirm that I have read the privacy information and agree to processing of my details.",
    termsConsent: "I accept the terms and conditions.",
    contactConsent:
      "I agree to be contacted for processing this request (email/phone).",
    privacyLink: "Privacy",
    termsLink: "Terms",
    consentRequired: "Please confirm privacy, terms and contact consent.",
    sending: "Sending …",
    submit: "Submit",
    saveError: "Order could not be saved",
    securityDone: "Security check complete.",
    securityError: "Security check failed. Please try again.",
    securityMissing: "Please complete the security confirmation first.",
    successTitle: "Order received",
    orderIdLabel: "Order ID",
    priceLabel: "Price / model",
    addOnsLabel: "Add-ons",
    membershipRequested: "Membership additionally requested",
    membershipNotRequested: "No additional membership selected",
    accountCta: "Open account",
    contactSales: "Contact sales@edebatte.org",
    institutionalHint:
      "Direct order remains available. Alternatively request a download link or contact the team.",
    contactPathsTitle: "Contact paths",
    contactPathsIntro: "Use the channel that best fits your process.",
    contactPathTeam: "Contact team",
    contactPathTeams: "MS Teams",
    contactPathEmail: "Email",
    contactPathPhone: "Phone",
  },
} as const;

function sanitizeNext(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (trimmed.includes("://")) return null;
  return trimmed;
}

function withPreorderFlag(nextUrl: string) {
  if (!nextUrl.startsWith("/account")) return nextUrl;
  try {
    const url = new URL(nextUrl, "http://local");
    url.searchParams.set("preorder", "thanks");
    return `${url.pathname}${url.search}`;
  } catch {
    return nextUrl;
  }
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

function resolveDefaultPackageId(packages: EDebattePackageDefinition[], queryPackageId: string | null) {
  const normalizedPackage = normalizePackageId(queryPackageId);
  if (normalizedPackage && packages.some((pkg) => pkg.id === normalizedPackage)) {
    return normalizedPackage;
  }
  return packages[0]?.id ?? ("basis" as EDebattePackageId);
}

function parseAddOnQuery(params: { getAll: (name: string) => string[] }) {
  const raw = [
    ...params.getAll("addons"),
    ...params.getAll("addOns"),
    ...params.getAll("addon"),
  ];
  const entries = raw
    .flatMap((entry) => entry.split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);
  return Array.from(new Set(entries));
}

function priceLabel(pkg: EDebattePackageDefinition, locale: PricingLocale) {
  return formatPackagePriceLabel(pkg, locale);
}

function parseEuroAmount(value: string) {
  const normalized = value
    .replace(/\u00a0/g, " ")
    .replace(/[€]/g, "")
    .replace(/ab\s+/gi, "")
    .replace(/from\s+/gi, "")
    .trim();

  const match = normalized.match(/([0-9][0-9.,]*)/);
  if (!match) return null;
  const candidate = match[1].includes(",") && match[1].includes(".")
    ? match[1].replace(/\./g, "").replace(",", ".")
    : match[1].includes(",")
      ? match[1].replace(".", "").replace(",", ".")
      : match[1].replace(/,/g, "");
  let normalizedNumber = candidate;
  if (candidate.includes(".") && !candidate.includes(",")) {
    if (/\.\d{3}(?:\.|$)/.test(candidate)) {
      normalizedNumber = candidate.replace(/\./g, "");
    }
  }
  const parsed = Number(normalizedNumber);
  return Number.isFinite(parsed) ? parsed : null;
}

function detectCadence(value: string): QuoteCadence {
  if (/\/(monat|month)/i.test(value)) return "monthly";
  if (/je\s+einsatz|per\s+engagement|\/\s*aktiver\s+raum|\/\s*active\s+room/i.test(value)) return "variable";
  return "variable";
}

function formatCurrency(amount: number, locale: PricingLocale) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function buildQuoteLines(args: {
  selectedPackage: EDebattePackageDefinition;
  selectedAddOns: InstitutionalAddOn[];
  locale: PricingLocale;
}): QuoteLine[] {
  const packagePriceLabel = priceLabel(args.selectedPackage, args.locale);
  const packageLine: QuoteLine = {
    id: `pkg-${args.selectedPackage.id}`,
    title: args.selectedPackage.titel,
    priceLabel: packagePriceLabel,
    amount: args.selectedPackage.preisMonat ?? parseEuroAmount(packagePriceLabel),
    cadence: "monthly",
    detail: args.selectedPackage.beschreibungKurz,
  };

  const addOnLines: QuoteLine[] = args.selectedAddOns.map((addOn) => ({
    id: `addon-${addOn.id}`,
    title: addOn.title,
    priceLabel: addOn.priceLabel,
    amount: parseEuroAmount(addOn.priceLabel),
    cadence: detectCadence(addOn.priceLabel),
    detail: addOn.detail,
  }));

  return [packageLine, ...addOnLines];
}

function addOnStatusLabel(addOn: InstitutionalAddOn, text: (typeof VORMERKEN_LABELS)["de"] | (typeof VORMERKEN_LABELS)["en"]) {
  if (addOn.maturity === "direct_orderable") return text.addOnStatusDirect;
  if (addOn.maturity === "orderable_review_required") return text.addOnStatusWithQuestions;
  return text.addOnStatusClarification;
}

function buildVormerkenHref(args: {
  locale: PricingLocale;
  segment: PricingSegmentId;
  goalId?: InstitutionalSelectionGoalId | null;
  frameId?: InstitutionalSelectionFrameId | null;
  completionPath?: InstitutionalCompletionPathId | null;
}) {
  const params = new URLSearchParams();
  params.set("segment", args.segment);
  if (args.goalId) params.set("goal", args.goalId);
  if (args.frameId) params.set("frame", args.frameId);
  if (args.completionPath) params.set("completion", args.completionPath);
  if (args.locale === "en") params.set("lang", "en");
  return `/order?${params.toString()}`;
}

type VormerkenPageProps = {
  entrySurface?: "order" | "vormerken";
};

export default function VormerkenPage({ entrySurface = "vormerken" }: VormerkenPageProps = {}) {
  const searchParams = useSearchParams();
  const locale = useMemo(() => normalizePricingLocale(searchParams.get("lang")), [searchParams]);
  const text = VORMERKEN_LABELS[locale];

  const queryPackageId = useMemo(() => searchParams.get("paket"), [searchParams]);
  const querySelection = useMemo(
    () =>
      resolvePricingOrderEntrySelection({
        segmentId: searchParams.get("segment"),
        packageId: queryPackageId,
      }),
    [searchParams, queryPackageId],
  );
  const queryQuoteRequested = useMemo(() => searchParams.get("quote") === "1", [searchParams]);
  const queryAddOnIds = useMemo(() => parseAddOnQuery(searchParams), [searchParams]);
  const queryGoalId = useMemo(
    () => normalizeInstitutionalSelectionGoalId(searchParams.get("goal")),
    [searchParams],
  );
  const queryFrameId = useMemo(
    () => normalizeInstitutionalSelectionFrameId(searchParams.get("frame")),
    [searchParams],
  );
  const queryCompletionPath = useMemo(
    () => normalizeInstitutionalCompletionPathId(searchParams.get("completion")),
    [searchParams],
  );
  const nextParam = useMemo(() => sanitizeNext(searchParams.get("next")), [searchParams]);

  const [selectedSegment, setSelectedSegment] = useState<PricingSegmentId>(
    () => querySelection.segmentId,
  );
  const isPrivateSegment = selectedSegment === "privat";
  const isInstitutionalSegment = selectedSegment === "organisationen" || selectedSegment === "kommunen";

  const institutionalGoals = useMemo(() => getInstitutionalSelectionGoals(locale), [locale]);
  const institutionalFrames = useMemo(() => getInstitutionalSelectionFrames(locale), [locale]);
  const completionPaths = useMemo(() => getInstitutionalCompletionPaths(locale), [locale]);
  const [selectedGoalId, setSelectedGoalId] = useState<InstitutionalSelectionGoalId>(
    () => queryGoalId ?? institutionalGoals[0]?.id ?? "beteiligung_starten",
  );
  const [selectedFrameId, setSelectedFrameId] = useState<InstitutionalSelectionFrameId>(
    () => queryFrameId ?? institutionalFrames[1]?.id ?? institutionalFrames[0]?.id ?? "pilot",
  );
  const [completionPath, setCompletionPath] = useState<InstitutionalCompletionPathId>(
    () => queryCompletionPath ?? "direct_order",
  );
  const selectedGoal = useMemo(
    () => institutionalGoals.find((goal) => goal.id === selectedGoalId) ?? institutionalGoals[0] ?? null,
    [institutionalGoals, selectedGoalId],
  );
  const selectedFrame = useMemo(
    () => institutionalFrames.find((frame) => frame.id === selectedFrameId) ?? institutionalFrames[0] ?? null,
    [institutionalFrames, selectedFrameId],
  );

  const segmentPackages = useMemo(
    () => getPackagesForJourneySegment(selectedSegment, locale),
    [selectedSegment, locale],
  );

  const availableAddOns = useMemo(
    () => (selectedSegment === "organisationen" || selectedSegment === "kommunen"
      ? getInstitutionalAddOnsForSegment(selectedSegment, locale)
      : []),
    [selectedSegment, locale],
  );

  const institutionalSegmentId =
    selectedSegment === "organisationen" || selectedSegment === "kommunen" ? selectedSegment : null;

  const institutionalRecommendation = useMemo(
    () =>
      institutionalSegmentId
        ? recommendInstitutionalConfiguration({
            segmentId: institutionalSegmentId,
            goalId: selectedGoalId,
            frameId: selectedFrameId,
            locale,
          })
        : null,
    [institutionalSegmentId, selectedGoalId, selectedFrameId, locale],
  );

  const [selectedPackageId, setSelectedPackageId] = useState<EDebattePackageId>(() =>
    resolveDefaultPackageId(segmentPackages, queryPackageId),
  );
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>(() => {
    const allowedIds = new Set(availableAddOns.map((entry) => entry.id));
    const fromQuery = queryAddOnIds.filter((entry) => allowedIds.has(entry as InstitutionalAddOn["id"]));
    return fromQuery;
  });
  const [quoteVisible, setQuoteVisible] = useState<boolean>(queryQuoteRequested);
  const [followupAnswers, setFollowupAnswers] = useState<Record<string, string>>({});

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [note, setNote] = useState("");
  const [membershipRequested, setMembershipRequested] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentContact, setConsentContact] = useState(false);
  const [humanToken, setHumanToken] = useState<string | null>(null);
  const [humanNote, setHumanNote] = useState<string | null>(null);
  const [quoteRequestBusy, setQuoteRequestBusy] = useState(false);
  const [quoteRequestState, setQuoteRequestState] = useState<{ tone: "ok" | "error"; message: string } | null>(null);
  const [formStartedAt, setFormStartedAt] = useState<number | null>(null);
  const [hpPreorder, setHpPreorder] = useState("");
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    planLabel: string;
    packagePriceLabel: string;
    orderId: string;
    membershipRequested: boolean;
    addOnLabels: string[];
  } | null>(null);

  useEffect(() => {
    setFormStartedAt(Date.now());
  }, []);

  useEffect(() => {
    const nextSegment = querySelection.segmentId;
    if (nextSegment !== selectedSegment) {
      setSelectedSegment(nextSegment);
    }
  }, [querySelection.segmentId, selectedSegment]);

  useEffect(() => {
    const nextGoal = queryGoalId ?? institutionalGoals[0]?.id ?? "beteiligung_starten";
    if (nextGoal !== selectedGoalId) {
      setSelectedGoalId(nextGoal);
    }
  }, [queryGoalId, institutionalGoals, selectedGoalId]);

  useEffect(() => {
    const nextFrame = queryFrameId ?? institutionalFrames[1]?.id ?? institutionalFrames[0]?.id ?? "pilot";
    if (nextFrame !== selectedFrameId) {
      setSelectedFrameId(nextFrame);
    }
  }, [queryFrameId, institutionalFrames, selectedFrameId]);

  useEffect(() => {
    const nextCompletion = queryCompletionPath ?? "direct_order";
    if (nextCompletion !== completionPath) {
      setCompletionPath(nextCompletion);
    }
  }, [queryCompletionPath, completionPath]);

  useEffect(() => {
    const fromDefaults = resolveDefaultPackageId(segmentPackages, queryPackageId);
    const recommended = institutionalRecommendation?.recommendedPackageId ?? null;
    const resolved =
      !queryPackageId && recommended && segmentPackages.some((pkg) => pkg.id === recommended)
        ? (recommended as EDebattePackageId)
        : fromDefaults;
    if (resolved !== selectedPackageId) setSelectedPackageId(resolved);
  }, [segmentPackages, queryPackageId, selectedPackageId, institutionalRecommendation]);

  useEffect(() => {
    const allowedIds = new Set(availableAddOns.map((entry) => entry.id));
    const fromQuery = queryAddOnIds.filter((entry) => allowedIds.has(entry as InstitutionalAddOn["id"]));
    if (fromQuery.length > 0) {
      setSelectedAddOnIds(fromQuery);
      return;
    }
    setSelectedAddOnIds((prev) => prev.filter((entry) => allowedIds.has(entry as InstitutionalAddOn["id"])));
  }, [queryAddOnIds, availableAddOns]);

  useEffect(() => {
    if (queryQuoteRequested && isInstitutionalSegment) setQuoteVisible(true);
  }, [queryQuoteRequested, isInstitutionalSegment]);

  useEffect(() => {
    if (isInstitutionalSegment && completionPath === "quote_request") {
      setQuoteVisible(true);
    }
  }, [completionPath, isInstitutionalSegment]);

  useEffect(() => {
    if (!isInstitutionalSegment && quoteVisible) {
      setQuoteVisible(false);
    }
  }, [isInstitutionalSegment, quoteVisible]);

  useEffect(() => {
    if (selectedSegment !== "privat" && membershipRequested) {
      setMembershipRequested(false);
    }
  }, [selectedSegment, membershipRequested]);

  useEffect(() => {
    const selected = new Set(selectedAddOnIds);
    setFollowupAnswers((prev) => {
      const next: Record<string, string> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const match = key.match(/^addon:([^:]+):/);
        if (!match) return;
        if (selected.has(match[1])) {
          next[key] = value;
        }
      });
      return next;
    });
  }, [selectedAddOnIds]);

  const selectedPackage = useMemo(
    () => segmentPackages.find((pkg) => pkg.id === selectedPackageId) ?? segmentPackages[0] ?? null,
    [segmentPackages, selectedPackageId],
  );

  const selectedAddOns = useMemo(() => {
    const byId = new Set(selectedAddOnIds);
    return availableAddOns.filter((entry) => byId.has(entry.id));
  }, [availableAddOns, selectedAddOnIds]);

  const recommendedAddOns = useMemo(() => {
    if (!institutionalRecommendation) return [] as InstitutionalAddOn[];
    const byId = new Set(institutionalRecommendation.recommendedAddOnIds);
    return availableAddOns.filter((entry) => byId.has(entry.id));
  }, [availableAddOns, institutionalRecommendation]);

  const optionalAddOns = useMemo(() => {
    const recommendedIds = new Set(recommendedAddOns.map((entry) => entry.id));
    return availableAddOns.filter((entry) => !recommendedIds.has(entry.id));
  }, [availableAddOns, recommendedAddOns]);

  const optionalAddOnsTier = useMemo(
    () =>
      optionalAddOns.filter((addOn) => {
        const maturity = getInstitutionalAddOnMaturityMeta(addOn.maturity, locale);
        return maturity.fullyOperational && !maturity.requiresFollowupAlignment;
      }),
    [optionalAddOns, locale],
  );

  const needBasedAddOns = useMemo(
    () =>
      optionalAddOns.filter((addOn) => {
        const maturity = getInstitutionalAddOnMaturityMeta(addOn.maturity, locale);
        return !maturity.fullyOperational || maturity.requiresFollowupAlignment;
      }),
    [optionalAddOns, locale],
  );

  const quoteLines = useMemo(() => {
    if (!selectedPackage) return [] as QuoteLine[];
    return buildQuoteLines({
      selectedPackage,
      selectedAddOns,
      locale,
    });
  }, [selectedPackage, selectedAddOns, locale]);

  const recurringLines = useMemo(
    () => quoteLines.filter((line) => line.cadence === "monthly"),
    [quoteLines],
  );
  const variableLines = useMemo(
    () => quoteLines.filter((line) => line.cadence === "variable"),
    [quoteLines],
  );

  const monthlyKnownTotal = useMemo(() => {
    const known = recurringLines.filter((line) => line.amount !== null);
    if (known.length === 0) return null;
    return known.reduce((sum, entry) => sum + (entry.amount || 0), 0);
  }, [recurringLines]);

  const priceRangeLabel = useMemo(() => {
    if (monthlyKnownTotal !== null) {
      const prefix = variableLines.length > 0
        ? (locale === "en" ? "from" : "ab")
        : (locale === "en" ? "total" : "gesamt");
      return `${prefix} ${formatCurrency(monthlyKnownTotal, locale)}${locale === "en" ? " / month" : " / Monat"}`;
    }
    return selectedPackage ? priceLabel(selectedPackage, locale) : null;
  }, [monthlyKnownTotal, variableLines.length, locale, selectedPackage]);

  const targetAfterSuccess = withLocaleHref(
    nextParam ? withPreorderFlag(nextParam) : "/account?preorder=thanks",
    locale,
  );

  const submitLabel = isInstitutionalSegment ? text.completionPaths[completionPath] : text.submit;
  const quoteDownloadReady =
    isInstitutionalSegment &&
    Boolean(
      organizationName.trim() &&
      name.trim() &&
      phone.trim() &&
      email.trim() &&
      consentPrivacy &&
      consentContact,
    );
  const teamContactHref = withLocaleHref("/kontakt?channel=team", locale);
  const teamsHref = "https://teams.microsoft.com/l/chat/0/0?users=sales@edebatte.org";
  const phoneContactHref = withLocaleHref("/kontakt?channel=phone", locale);
  const submitButtonClass =
    isInstitutionalSegment && completionPath !== "direct_order"
      ? completionPath === "quote_request"
        ? "mt-6 inline-flex w-full items-center justify-center rounded-full border border-sky-300 bg-sky-50 px-5 py-3.5 text-sm font-semibold text-sky-900 hover:bg-sky-100 disabled:opacity-60"
        : "mt-6 inline-flex w-full items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-5 py-3.5 text-sm font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))] disabled:opacity-60"
      : "mt-6 inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#0ea5e9,#22c55e)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(14,165,233,0.28)] hover:opacity-90 disabled:opacity-60";

  function toggleAddOn(addOnId: string) {
    setSelectedAddOnIds((prev) => {
      if (prev.includes(addOnId)) {
        return prev.filter((entry) => entry !== addOnId);
      }
      return [...prev, addOnId];
    });
  }

  function updateFollowupAnswer(addOnId: string, questionIndex: number, value: string) {
    const key = `addon:${addOnId}:q${questionIndex}`;
    setFollowupAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function requestQuoteDownloadLink() {
    if (!quoteDownloadReady || !selectedPackage) {
      setQuoteRequestState({ tone: "error", message: text.downloadQuoteMissing });
      return;
    }

    setQuoteRequestBusy(true);
    setQuoteRequestState(null);
    try {
      const res = await fetch("/api/edebatte/preorder/quote-download-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          locale,
          segment: selectedSegment,
          packageId: selectedPackage.id,
          packageLabel: selectedPackage.titel,
          packagePriceLabel: priceLabel(selectedPackage, locale),
          organizationName: organizationName.trim(),
          contactPerson: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          acceptedPrivacy: consentPrivacy,
          acceptedContact: consentContact,
          selectedAddOns: selectedAddOns.map((entry) => ({
            id: entry.id,
            title: entry.title,
            priceLabel: entry.priceLabel,
          })),
          recurringLines: recurringLines.map((line) => ({
            title: line.title,
            priceLabel: line.priceLabel,
          })),
          variableLines: variableLines.map((line) => ({
            title: line.title,
            priceLabel: line.priceLabel,
          })),
          monthlyTotalLabel:
            monthlyKnownTotal !== null
              ? formatCurrency(monthlyKnownTotal, locale)
              : locale === "en"
                ? "on request"
                : "auf Anfrage",
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(typeof body?.message === "string" ? body.message : text.downloadQuoteFailed);
      }
      setQuoteRequestState({
        tone: "ok",
        message: typeof body?.message === "string" ? body.message : text.downloadQuoteSent,
      });
    } catch (error: any) {
      setQuoteRequestState({
        tone: "error",
        message: error?.message ?? text.downloadQuoteFailed,
      });
    } finally {
      setQuoteRequestBusy(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPackage) return;
    if (!consentPrivacy || !consentTerms || !consentContact) {
      setErrMsg(text.consentRequired);
      return;
    }
    if (!humanToken) {
      setErrMsg(text.securityMissing);
      return;
    }

    setErrMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/edebatte/preorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          package: selectedPackage.id,
          locale,
          email: email.trim() || undefined,
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
          note: note.trim() || undefined,
          organizationName: isInstitutionalSegment ? organizationName.trim() || undefined : undefined,
          contactRole: isInstitutionalSegment ? contactRole.trim() || undefined : undefined,
          selectedAddOns: selectedAddOns.map((entry) => entry.id),
          selectedOptions: isInstitutionalSegment
            ? {
                institutionalGoal: selectedGoalId,
                institutionalFrame: selectedFrameId,
                completionPath,
                ...Object.fromEntries(
                  Object.entries(followupAnswers)
                    .map(([key, value]) => [key, value.trim()])
                    .filter(([, value]) => value.length > 0),
                ),
              }
            : undefined,
          conversationRequested: isInstitutionalSegment ? completionPath === "conversation_request" : false,
          conversationChannel: isInstitutionalSegment && completionPath === "conversation_request" ? "email" : undefined,
          membershipRequested: isPrivateSegment ? membershipRequested : false,
          humanToken,
          formStartedAt: formStartedAt ?? Date.now(),
          hp_preorder: hpPreorder,
          type: selectedPackage.typ,
          segment: selectedSegment,
          acceptedPrivacy: consentPrivacy,
          acceptedTerms: consentTerms,
          acceptedContact: consentContact,
          source: isInstitutionalSegment ? `package_start_${completionPath}` : "package_start",
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        const nextRoute = typeof body?.nextStep?.route === "string" ? body.nextStep.route : null;
        if (nextRoute) {
          setErrMsg(body?.message || text.saveError);
          window.location.assign(nextRoute);
          return;
        }
        const errorCode = typeof body?.error === "string" ? body.error : "";
        if (errorCode === "human_token_invalid" || errorCode === "human_token_expired") {
          setHumanToken(null);
          setHumanNote(text.securityError);
        }
        throw new Error(body?.message || body?.error || text.saveError);
      }

      setSuccess({
        planLabel: selectedPackage.titel,
        packagePriceLabel: priceLabel(selectedPackage, locale),
        orderId: typeof body.orderId === "string" ? body.orderId : "n/a",
        membershipRequested,
        addOnLabels: selectedAddOns.map((entry) => entry.title),
      });
      setName("");
      setEmail("");
      setPhone("");
      setOrganizationName("");
      setContactRole("");
      setNote("");
      setMembershipRequested(false);
      setConsentPrivacy(false);
      setConsentTerms(false);
      setConsentContact(false);
      setHumanToken(null);
      setHumanNote(null);
    } catch (err: any) {
      setErrMsg(err?.message ?? text.saveError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ProductSurfaceShell>
      <header className="relative overflow-hidden rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_95%_0%,rgba(14,165,233,0.1),transparent_42%)]" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.pageKicker}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[rgb(var(--fg))] sm:text-4xl">{text.heroTitle}</h1>
          <p className="mt-4 max-w-4xl text-base leading-relaxed text-[rgb(var(--muted))]">{text.heroText}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={withLocaleHref("/pricing", locale)} className="btn-secondary">
              {text.toPricing}
            </Link>
            <Link href={withLocaleHref("/pricing/institutionen", locale)} className="btn-secondary">
              {text.toInstitutional}
            </Link>
          </div>
          {entrySurface === "order" ? (
            <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
              <p className="font-semibold">{text.orderEntryHintTitle}</p>
              <p className="mt-1">{text.orderEntryHintText}</p>
            </div>
          ) : null}
        </div>
      </header>

      <section className="mt-8 space-y-5">
        <div className="max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.segmentTitle}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {ORDER_SEGMENT_ORDER.map((segmentId) => (
              <button
                key={segmentId}
                type="button"
                onClick={() => setSelectedSegment(segmentId)}
                className={[
                  "inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold",
                  selectedSegment === segmentId
                    ? "border-sky-300 bg-sky-50 text-sky-800"
                    : "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]",
                ].join(" ")}
              >
                {text.segmentLabels[segmentId]}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.packageSectionTitle}</p>
          <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">{text.packageSectionText[selectedSegment]}</p>
        </div>

        {isInstitutionalSegment ? (
          <div className="rounded-3xl border border-sky-300/70 bg-sky-500/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-900 dark:text-sky-100">{text.institutionalGuidedTitle}</p>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-900 dark:text-sky-100">{text.goalTitle}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {institutionalGoals.map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setSelectedGoalId(goal.id)}
                    className={[
                      "rounded-xl border px-3 py-2 text-left text-xs",
                      selectedGoalId === goal.id
                        ? "border-sky-300 bg-sky-50 text-sky-900"
                        : "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--muted))]",
                    ].join(" ")}
                  >
                    <span className="block font-semibold">{goal.title}</span>
                    <span className="mt-1 block">{goal.detail}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-900 dark:text-sky-100">{text.frameTitle}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {institutionalFrames.map((frame) => (
                  <button
                    key={frame.id}
                    type="button"
                    onClick={() => setSelectedFrameId(frame.id)}
                    className={[
                      "rounded-xl border px-3 py-2 text-left text-xs",
                      selectedFrameId === frame.id
                        ? "border-sky-300 bg-sky-50 text-sky-900"
                        : "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--muted))]",
                    ].join(" ")}
                  >
                    <span className="block font-semibold">{frame.title}</span>
                    <span className="mt-1 block">{frame.detail}</span>
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-4 text-xs text-sky-900/90 dark:text-sky-100/90">
              {text.segmentLabels[selectedSegment]} · {selectedGoal?.title ?? ""} · {selectedFrame?.title ?? ""}
            </p>
          </div>
        ) : null}

        <div className={isInstitutionalSegment ? "grid gap-5 lg:grid-cols-2" : "grid gap-5 lg:grid-cols-3"}>
          {segmentPackages.map((pkg) => {
            const isSelected = pkg.id === selectedPackageId;
            return (
              <article
                key={pkg.id}
                className={[
                  "rounded-3xl border bg-[rgb(var(--card))] p-5 shadow-sm",
                  isSelected ? "border-sky-300 ring-1 ring-sky-200/70" : "border-[rgb(var(--border))]",
                ].join(" ")}
              >
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">{pkg.titel}</p>
                <p className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">{priceLabel(pkg, locale)}</p>
                {isInstitutionalSegment ? (
                  <div className="mt-3 space-y-2 text-xs leading-relaxed text-[rgb(var(--muted))]">
                    <p>{pkg.wofuerGedacht}</p>
                    <p>{pkg.unterschiedZurNaechstenStufe}</p>
                  </div>
                ) : (
                  <dl className="mt-3 space-y-2 text-xs leading-relaxed text-[rgb(var(--muted))]">
                    <div>
                      <dt className="font-semibold uppercase tracking-wide">{text.forWhom}</dt>
                      <dd>{pkg.fuerWen}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold uppercase tracking-wide">{text.intendedFor}</dt>
                      <dd>{pkg.wofuerGedacht}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold uppercase tracking-wide">{text.differenceToNext}</dt>
                      <dd>{pkg.unterschiedZurNaechstenStufe}</dd>
                    </div>
                  </dl>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedPackageId(pkg.id)}
                  className="btn-secondary mt-4 inline-flex"
                >
                  {isSelected ? text.selected : text.choosePackage}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] xl:items-start">
        <div className="space-y-6">
          {isInstitutionalSegment && institutionalRecommendation ? (
            <section className="rounded-3xl border-2 border-sky-400/80 bg-[linear-gradient(145deg,rgba(14,165,233,0.16),rgba(255,255,255,0.9))] p-7 shadow-[0_22px_60px_rgba(14,165,233,0.18)] dark:bg-[linear-gradient(145deg,rgba(14,165,233,0.2),rgba(15,23,42,0.5))]">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-900 dark:text-sky-100">{text.recommendationTitle}</p>
              <p className="mt-2 text-sm font-medium text-sky-900 dark:text-sky-100">{text.recommendationReason}</p>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">{institutionalRecommendation.whyRecommended}</p>
              {priceRangeLabel ? (
                <>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.priceRangeTitle}</p>
                  <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">{priceRangeLabel}</p>
                </>
              ) : null}
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.recommendationCovered}</p>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">{institutionalRecommendation.coveredByPackage}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.recommendationGap}</p>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">{institutionalRecommendation.gapHint}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.recommendationValue}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[rgb(var(--muted))]">
                {institutionalRecommendation.roiHighlights.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {!isPrivateSegment ? (
            <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.addOnsTitle}</p>
            <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">{text.addOnsHint}</p>
            {availableAddOns.length === 0 ? (
              <p className="mt-3 text-sm text-[rgb(var(--muted))]">{text.noAddOns}</p>
            ) : (
              <>
                {isInstitutionalSegment ? (
                  <>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                      {text.recommendedAddOnsTitle}
                    </p>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      {recommendedAddOns.map((addOn) => {
                        const isSelected = selectedAddOnIds.includes(addOn.id);
                        const status = addOnStatusLabel(addOn, text);
                        return (
                          <article
                            key={addOn.id}
                            className={[
                              "rounded-2xl border bg-[rgb(var(--bg))] p-3 text-sm",
                              isSelected ? "border-sky-300 ring-1 ring-sky-200/70" : "border-[rgb(var(--border))]",
                            ].join(" ")}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-[rgb(var(--fg))]">{addOn.title}</p>
                                <p className="text-[rgb(var(--muted))]">{addOn.priceLabel}</p>
                              </div>
                              <button type="button" onClick={() => toggleAddOn(addOn.id)} className="btn-secondary">
                                {isSelected ? text.selected : text.addOnAdd}
                              </button>
                            </div>
                            <p className="mt-2 text-xs text-[rgb(var(--muted))]">{addOn.whenUseful}</p>
                            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.addOnStatus}</p>
                            <p className="text-xs text-[rgb(var(--muted))]">{status}</p>
                          </article>
                        );
                      })}
                    </div>

                    <details className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">
                        {text.optionalAddOnsTitle}
                      </summary>
                      <p className="mt-2 text-xs text-[rgb(var(--muted))]">{text.optionalAddOnsHint}</p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {optionalAddOnsTier.map((addOn) => {
                          const isSelected = selectedAddOnIds.includes(addOn.id);
                          return (
                            <label
                              key={addOn.id}
                              className={[
                                "flex cursor-pointer gap-3 rounded-2xl border bg-[rgb(var(--card))] p-3 text-sm",
                                isSelected ? "border-sky-300 ring-1 ring-sky-200/70" : "border-[rgb(var(--border))]",
                              ].join(" ")}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleAddOn(addOn.id)}
                                className="mt-1 h-4 w-4"
                              />
                              <span>
                                <span className="block font-semibold text-[rgb(var(--fg))]">{addOn.title}</span>
                                <span className="mt-0.5 block text-[rgb(var(--muted))]">{addOn.priceLabel}</span>
                                <span className="mt-1 block text-xs text-[rgb(var(--muted))]">{addOn.whenUseful}</span>
                                <span className="mt-1 block text-xs text-[rgb(var(--muted))]">{text.addOnStatus}: {addOnStatusLabel(addOn, text)}</span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </details>

                    <details className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">
                        {text.needBasedAddOnsTitle}
                      </summary>
                      <p className="mt-2 text-xs text-[rgb(var(--muted))]">{text.needBasedAddOnsHint}</p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {needBasedAddOns.map((addOn) => {
                          const isSelected = selectedAddOnIds.includes(addOn.id);
                          return (
                            <label
                              key={addOn.id}
                              className={[
                                "flex cursor-pointer gap-3 rounded-2xl border bg-[rgb(var(--card))] p-3 text-sm",
                                isSelected ? "border-sky-300 ring-1 ring-sky-200/70" : "border-[rgb(var(--border))]",
                              ].join(" ")}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleAddOn(addOn.id)}
                                className="mt-1 h-4 w-4"
                              />
                              <span>
                                <span className="block font-semibold text-[rgb(var(--fg))]">{addOn.title}</span>
                                <span className="mt-0.5 block text-[rgb(var(--muted))]">{addOn.priceLabel}</span>
                                <span className="mt-1 block text-xs text-[rgb(var(--muted))]">{addOn.whenUseful}</span>
                                <span className="mt-1 block text-xs text-[rgb(var(--muted))]">{text.addOnStatus}: {text.addOnStatusClarification}</span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </details>
                  </>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {availableAddOns.map((addOn) => {
                      const isSelected = selectedAddOnIds.includes(addOn.id);
                      return (
                        <label
                          key={addOn.id}
                          className={[
                            "flex cursor-pointer gap-3 rounded-2xl border bg-[rgb(var(--bg))] p-3 text-sm",
                            isSelected ? "border-sky-300 ring-1 ring-sky-200/70" : "border-[rgb(var(--border))]",
                          ].join(" ")}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAddOn(addOn.id)}
                            className="mt-1 h-4 w-4"
                          />
                          <span>
                            <span className="block font-semibold text-[rgb(var(--fg))]">{addOn.title}</span>
                            <span className="mt-0.5 block text-[rgb(var(--muted))]">{addOn.priceLabel}</span>
                            <span className="mt-1 block text-xs text-[rgb(var(--muted))]">{addOn.detail}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </>
            )}
            </section>
          ) : null}

          {isInstitutionalSegment && selectedAddOns.length > 0 ? (
            <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.addOnFollowupTitle}</p>
              <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">{text.addOnFollowupHint}</p>
              <div className="mt-4 space-y-4">
                {selectedAddOns.map((addOn) => {
                  const questions = getInstitutionalAddonFollowupQuestions(addOn.id, locale);
                  if (questions.length === 0) return null;
                  return (
                    <fieldset key={addOn.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                      <legend className="px-1 text-sm font-semibold text-[rgb(var(--fg))]">{addOn.title}</legend>
                      <p className="mt-1 text-xs text-[rgb(var(--muted))]">{addOn.detail}</p>
                      <p className="mt-1 text-xs text-[rgb(var(--muted))]">{getInstitutionalAddonNotNeededHint(addOn.id, locale)}</p>
                      <div className="mt-2 space-y-3">
                        {questions.map((question, index) => {
                          const key = `addon:${addOn.id}:q${index + 1}`;
                          return (
                            <label key={key} className="block space-y-1">
                              <span className="text-xs font-semibold text-[rgb(var(--muted))]">{question}</span>
                              <input
                                value={followupAnswers[key] || ""}
                                onChange={(event) => updateFollowupAnswer(addOn.id, index + 1, event.target.value)}
                                placeholder={text.addOnFollowupPlaceholder}
                                className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  );
                })}
              </div>
            </section>
          ) : null}

          {isInstitutionalSegment ? (
            <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.quoteTitle}</p>
                <button
                  type="button"
                  onClick={() => setQuoteVisible(true)}
                  className="btn-secondary inline-flex"
                >
                  {quoteVisible ? text.updateQuote : text.createQuote}
                </button>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">{text.quoteIntro}</p>

              {quoteVisible ? (
                <div className="mt-4 space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.quoteRecurring}</p>
                    <ul className="mt-2 space-y-2 text-sm text-[rgb(var(--muted))]">
                      {recurringLines.map((line) => (
                        <li key={line.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
                          <p className="font-semibold text-[rgb(var(--fg))]">{line.title}</p>
                          <p>{line.priceLabel}</p>
                          {line.detail ? <p className="mt-1 text-xs">{line.detail}</p> : null}
                        </li>
                      ))}
                    </ul>
                    {monthlyKnownTotal !== null ? (
                      <p className="mt-3 text-sm font-semibold text-[rgb(var(--fg))]">
                        {(variableLines.length > 0 ? text.quoteMinimumTotal : text.quoteMonthlyTotal)}: {formatCurrency(monthlyKnownTotal, locale)}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.quoteVariable}</p>
                    {variableLines.length === 0 ? (
                      <p className="mt-2 text-sm text-[rgb(var(--muted))]">{text.quoteNoVariable}</p>
                    ) : (
                      <ul className="mt-2 space-y-2 text-sm text-[rgb(var(--muted))]">
                        {variableLines.map((line) => (
                          <li key={line.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
                            <p className="font-semibold text-[rgb(var(--fg))]">{line.title}</p>
                            <p>{line.priceLabel}</p>
                            {line.detail ? <p className="mt-1 text-xs">{line.detail}</p> : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <p className="text-xs text-[rgb(var(--muted))]">{text.quoteApproximation}</p>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.quoteServices}</p>
                    <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--muted))]">
                      {(selectedPackage?.leistungen || []).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                      {selectedAddOns.map((addOn) => (
                        <li key={addOn.id}>{addOn.title}: {addOn.usp}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                    <button
                      type="button"
                      onClick={requestQuoteDownloadLink}
                      disabled={!quoteDownloadReady || quoteRequestBusy}
                      className="btn-secondary inline-flex disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {quoteRequestBusy ? text.sending : text.downloadQuote}
                    </button>
                    <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                      {quoteDownloadReady ? text.downloadQuoteHint : text.downloadQuoteMissing}
                    </p>
                    {quoteRequestState ? (
                      <p className={quoteRequestState.tone === "ok" ? "mt-1 text-xs text-emerald-700" : "mt-1 text-xs text-rose-600"}>
                        {quoteRequestState.message}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {isInstitutionalSegment ? (
            <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 text-sm text-[rgb(var(--muted))] shadow-sm">
              <p>{text.institutionalHint}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide">{text.contactPathsTitle}</p>
              <p className="mt-1 text-xs">{text.contactPathsIntro}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <a href={teamContactHref} className="btn-secondary">{text.contactPathTeam}</a>
                <a href={teamsHref} target="_blank" rel="noreferrer" className="btn-secondary">{text.contactPathTeams}</a>
                <a href={`mailto:${SALES_EMAIL}`} className="btn-secondary">{text.contactPathEmail}</a>
                <a href={phoneContactHref} className="btn-secondary">{text.contactPathPhone}</a>
              </div>
            </section>
          ) : null}
        </div>

        <aside className="xl:sticky xl:top-24">
          {success ? (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-6 text-sm text-emerald-900 shadow-sm">
              <h2 className="text-lg font-semibold">{text.successTitle}</h2>
              <p className="mt-1">
                {text.selectedPackageTitle}: <strong>{success.planLabel}</strong>
              </p>
              <p className="mt-1 text-xs uppercase tracking-wide text-emerald-800/80">
                {text.orderIdLabel}: {success.orderId}
              </p>
              <p className="mt-2">
                <strong>{text.priceLabel}:</strong> {success.packagePriceLabel}
              </p>
              {success.addOnLabels.length > 0 ? (
                <p className="mt-2">
                  <strong>{text.addOnsLabel}:</strong> {success.addOnLabels.join(", ")}
                </p>
              ) : null}
              {isPrivateSegment ? (
                <p className="mt-2">
                  {success.membershipRequested ? text.membershipRequested : text.membershipNotRequested}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={targetAfterSuccess}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                >
                  {text.accountCta}
                </Link>
                <Link
                  href={withLocaleHref("/pricing", locale)}
                  className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-[rgb(var(--card))] px-5 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
                >
                  {text.toPricing}
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
              <div className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
                <label htmlFor="hp_preorder">Bitte leer lassen</label>
                <input
                  id="hp_preorder"
                  name="hp_preorder"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={hpPreorder}
                  onChange={(event) => setHpPreorder(event.target.value)}
                />
              </div>

              <p className="text-sm font-semibold text-[rgb(var(--fg))]">{text.formTitle}</p>

              {isInstitutionalSegment ? (
                <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{text.completionTitle}</p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">{text.completionHint}</p>
                  <div className="mt-3 space-y-2">
                    {completionPaths.map((path) => (
                      <button
                        key={path.id}
                        type="button"
                        onClick={() => setCompletionPath(path.id)}
                        className={[
                          "w-full rounded-xl border px-3 py-2 text-left text-sm",
                          completionPath === path.id
                            ? path.id === "direct_order"
                              ? "border-sky-300 bg-sky-50 text-sky-900"
                              : path.id === "quote_request"
                                ? "border-sky-300 bg-white text-sky-900"
                                : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]"
                            : "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--muted))]",
                        ].join(" ")}
                      >
                        <span className="block font-semibold">{text.completionPaths[path.id]}</span>
                        <span className="mt-0.5 block text-xs">{path.detail}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-4 space-y-4">
                <div className="space-y-1">
                  <label htmlFor="email" className="text-xs font-semibold text-[rgb(var(--muted))]">
                    {text.emailLabel}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    placeholder="name@example.org"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="name" className="text-xs font-semibold text-[rgb(var(--muted))]">
                    {text.nameLabel}
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    required={isInstitutionalSegment}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="phone" className="text-xs font-semibold text-[rgb(var(--muted))]">
                    {text.phoneLabel}
                  </label>
                  <input
                    id="phone"
                    type="text"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    required={isInstitutionalSegment}
                  />
                </div>

                {isInstitutionalSegment ? (
                  <>
                    <div className="space-y-1">
                      <label htmlFor="organizationName" className="text-xs font-semibold text-[rgb(var(--muted))]">
                        {text.organizationNameLabel}
                      </label>
                      <input
                        id="organizationName"
                        type="text"
                        value={organizationName}
                        onChange={(event) => setOrganizationName(event.target.value)}
                        className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="contactRole" className="text-xs font-semibold text-[rgb(var(--muted))]">
                        {text.roleLabel}
                      </label>
                      <input
                        id="contactRole"
                        type="text"
                        value={contactRole}
                        onChange={(event) => setContactRole(event.target.value)}
                        className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      />
                    </div>
                  </>
                ) : null}

                <div className="space-y-1">
                  <label htmlFor="note" className="text-xs font-semibold text-[rgb(var(--muted))]">
                    {text.noteLabel}
                  </label>
                  <textarea
                    id="note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className="min-h-[120px] w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    placeholder={text.notePlaceholder}
                  />
                </div>

                {isPrivateSegment ? (
                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3 text-sm text-[rgb(var(--muted))]">
                    <p className="text-xs font-semibold uppercase tracking-wide">{text.membershipSectionTitle}</p>
                    <p className="mt-2 text-sm">{text.membershipSectionIntro}</p>
                    <label className="mt-3 flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={membershipRequested}
                        onChange={(event) => setMembershipRequested(event.target.checked)}
                        className="mt-1 h-4 w-4"
                      />
                      <span>
                        {text.membershipCheckbox}
                        <span className="mt-1 block text-xs">{text.membershipHint}</span>
                        <span className="mt-1 block text-xs">{text.membershipInterestedHint}</span>
                        <span className="mt-1 block text-xs">{text.membershipContributionHint}</span>
                        <span className="mt-1 block text-xs">{text.membershipSystemsHint}</span>
                      </span>
                    </label>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3 text-xs text-[rgb(var(--muted))]">
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={consentPrivacy}
                      onChange={(event) => setConsentPrivacy(event.target.checked)}
                      className="mt-0.5 h-4 w-4"
                      required
                    />
                    <span>
                      {text.privacyConsent}{" "}
                      <Link href={withLocaleHref("/datenschutz", locale)} className="underline">
                        {text.privacyLink}
                      </Link>
                    </span>
                  </label>
                  <label className="mt-2 flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={consentTerms}
                      onChange={(event) => setConsentTerms(event.target.checked)}
                      className="mt-0.5 h-4 w-4"
                      required
                    />
                    <span>
                      {text.termsConsent}{" "}
                      <Link href={withLocaleHref("/agb", locale)} className="underline">
                        {text.termsLink}
                      </Link>
                    </span>
                  </label>
                  <label className="mt-2 flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={consentContact}
                      onChange={(event) => setConsentContact(event.target.checked)}
                      className="mt-0.5 h-4 w-4"
                      required
                    />
                    <span>{text.contactConsent}</span>
                  </label>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <HumanCheck
                  formId="edebatte-preorder"
                  variant="compact"
                  onSolved={({ token }) => {
                    setHumanToken(token);
                    setHumanNote(text.securityDone);
                  }}
                  onError={() => {
                    setHumanToken(null);
                    setHumanNote(text.securityError);
                  }}
                />
                {humanNote ? <p className="text-xs text-[rgb(var(--muted))]">{humanNote}</p> : null}
              </div>

              {errMsg ? <p className="mt-3 text-sm text-rose-600">{errMsg}</p> : null}

              <button
                type="submit"
                className={submitButtonClass}
                disabled={busy}
              >
                {busy ? text.sending : submitLabel}
              </button>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  href={withLocaleHref("/pricing", locale)}
                  className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
                >
                  {text.toPricing}
                </Link>
                <Link
                  href={buildVormerkenHref({
                    locale,
                    segment: selectedSegment,
                    goalId: isInstitutionalSegment ? selectedGoalId : null,
                    frameId: isInstitutionalSegment ? selectedFrameId : null,
                    completionPath: isInstitutionalSegment ? completionPath : null,
                  })}
                  className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
                >
                  {text.segmentLabels[selectedSegment]}
                </Link>
                <Link
                  href={withLocaleHref("/pricing/institutionen", locale)}
                  className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
                >
                  {text.toInstitutional}
                </Link>
              </div>
            </form>
          )}
        </aside>
      </div>
    </ProductSurfaceShell>
  );
}
