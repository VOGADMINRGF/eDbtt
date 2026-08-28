export const GO_TO_MARKET_PACKAGING = {
  freeParticipantGuideline: 30,
  freeUseIsAvailable: true,
  guidelineIsHardLimit: false,
  checkoutIsAvailable: false,
  publishedPricesAreAvailable: false,
  documentAnalysis: {
    unitLabel: "Voxy-Analyse-Einheit",
    unitSizeChars: 60_000,
    singleUnitIncludedInEntryFlow: true,
    largeDocumentApprovalFromUnits: 2,
    pricingModel: "included_quota_plus_topup",
    publicTokenPricing: false,
    publicPerPagePricing: false,
    publicPerCharacterPricing: false,
    checkoutIsAvailable: false,
    publishedTopUpPriceIsAvailable: false,
  },
} as const;

export const GO_TO_MARKET_TEMPLATE_IDS = [
  "member-priorities",
  "project-ideas",
  "option-comparison",
  "opinion-check",
  "event-planning",
] as const;

export type GoToMarketTemplateId = (typeof GO_TO_MARKET_TEMPLATE_IDS)[number];

export type GoToMarketTemplate = {
  id: GoToMarketTemplateId;
  title: { de: string; en: string };
  description: { de: string; en: string };
  question: { de: string; en: string };
  options: {
    de: readonly [string, string, string];
    en: readonly [string, string, string];
  };
};

export const GO_TO_MARKET_TEMPLATES: readonly GoToMarketTemplate[] = [
  {
    id: "member-priorities",
    title: { de: "Prioritäten im Verein", en: "Club priorities" },
    description: {
      de: "Gemeinsam klären, was als Nächstes wichtig ist.",
      en: "Decide together what matters next.",
    },
    question: {
      de: "Welches Thema soll unser Verein als Nächstes angehen?",
      en: "Which topic should our club tackle next?",
    },
    options: {
      de: ["Mitglieder gewinnen", "Angebote verbessern", "Gemeinschaft stärken"],
      en: ["Attract members", "Improve activities", "Strengthen community"],
    },
  },
  {
    id: "project-ideas",
    title: { de: "Projektideen sammeln", en: "Collect project ideas" },
    description: {
      de: "Ideen sichtbar machen und gemeinsam priorisieren.",
      en: "Make ideas visible and set priorities together.",
    },
    question: {
      de: "Welche Projektidee sollten wir zuerst weiterverfolgen?",
      en: "Which project idea should we pursue first?",
    },
    options: {
      de: ["Nachbarschaftsaktion", "Informationsabend", "Gemeinsame Kampagne"],
      en: ["Neighbourhood action", "Information evening", "Joint campaign"],
    },
  },
  {
    id: "option-comparison",
    title: { de: "Optionen vergleichen", en: "Compare options" },
    description: {
      de: "Mehrere Wege verständlich zur Auswahl stellen.",
      en: "Present several paths in a clear choice.",
    },
    question: {
      de: "Welche Option passt am besten zu unserem gemeinsamen Ziel?",
      en: "Which option best supports our shared goal?",
    },
    options: {
      de: ["Option A", "Option B", "Weitere Option prüfen"],
      en: ["Option A", "Option B", "Explore another option"],
    },
  },
  {
    id: "opinion-check",
    title: { de: "Stimmungsbild einholen", en: "Check the mood" },
    description: {
      de: "Positionen erkennen, bevor eine Entscheidung fällt.",
      en: "Understand positions before a decision is made.",
    },
    question: {
      de: "Wie steht unsere Gruppe zu diesem Vorschlag?",
      en: "How does our group feel about this proposal?",
    },
    options: {
      de: ["Dafür", "Noch offen", "Dagegen"],
      en: ["In favour", "Still open", "Against"],
    },
  },
  {
    id: "event-planning",
    title: { de: "Termin oder Veranstaltung", en: "Date or event" },
    description: {
      de: "Ein gemeinsames Vorhaben konkret vorbereiten.",
      en: "Prepare a shared activity together.",
    },
    question: {
      de: "Welcher Vorschlag eignet sich am besten für unsere nächste Veranstaltung?",
      en: "Which proposal works best for our next event?",
    },
    options: {
      de: ["Workshop", "Offenes Treffen", "Aktionstag"],
      en: ["Workshop", "Open meeting", "Action day"],
    },
  },
] as const;

export function getGoToMarketTemplate(
  templateId: string | null | undefined,
): GoToMarketTemplate | null {
  if (!templateId) return null;
  return GO_TO_MARKET_TEMPLATES.find((template) => template.id === templateId) ?? null;
}

export function buildFreeBallotStartHref(
  templateId?: GoToMarketTemplateId,
  source = "homepage",
): string {
  const search = new URLSearchParams({ gtm: "1", source });
  if (templateId) search.set("template", templateId);
  return `/runden/new?${search.toString()}`;
}
