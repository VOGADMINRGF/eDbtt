import { z } from "zod";

export const REGION_FEED_SOURCE_TYPES = [
  "news",
  "official_update",
  "community_signal",
  "feed_draft",
  "manual_note",
] as const;

export type RegionFeedSourceType = (typeof REGION_FEED_SOURCE_TYPES)[number];

export const REGION_SIGNAL_REVIEW_STATUSES = [
  "draft",
  "needs_review",
  "accepted",
  "rejected",
  "archived",
] as const;

export type RegionSignalReviewState = (typeof REGION_SIGNAL_REVIEW_STATUSES)[number];

export const REGION_SIGNAL_SUGGESTED_ACTIONS = [
  "create_anlassraum",
  "attach_to_anlassraum",
  "create_dossier",
  "attach_source_to_dossier",
  "ask_clarifying_question",
  "ignore",
] as const;

export type RegionSignalSuggestedAction = (typeof REGION_SIGNAL_SUGGESTED_ACTIONS)[number];

const RegionSignalProvenanceSchema = z
  .object({
    dataOrigin: z.enum(["pilot_fixture", "runtime_review_queue"]),
    isFixture: z.boolean(),
    fixtureMarker: z.enum(["pilot_fixture_only", "runtime_review_queue"]).nullable(),
  })
  .strict();

export type RegionSignalProvenance = z.infer<typeof RegionSignalProvenanceSchema>;

export const RegionFeedSourceSchema = z
  .object({
    id: z.string().trim().min(1),
    regionId: z.string().trim().min(1),
    sourceType: z.enum(REGION_FEED_SOURCE_TYPES),
    label: z.string().trim().min(1),
    description: z.string().trim().min(1).nullable(),
    url: z.string().trim().url().nullable(),
    provenance: RegionSignalProvenanceSchema,
    noScrapingByDefault: z.literal(true),
    noTenderMonitoring: z.literal(true),
    noProcurementMonitoring: z.literal(true),
  })
  .strict();

export type RegionFeedSource = z.infer<typeof RegionFeedSourceSchema>;

const RegionFeedItemBaseSchema = z
  .object({
    id: z.string().trim().min(1),
    regionId: z.string().trim().min(1),
    sourceId: z.string().trim().min(1),
    sourceType: z.enum(REGION_FEED_SOURCE_TYPES),
    title: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    url: z.string().trim().url().nullable().optional(),
    publishedAt: z.string().datetime({ offset: true }).nullable().optional(),
    detectedTopics: z.array(z.string().trim().min(1)).default([]),
    detectedPlaces: z.array(z.string().trim().min(1)).default([]),
    relatedClaims: z.array(z.string().trim().min(1)).default([]),
    relatedDossiers: z.array(z.string().trim().min(1)).default([]),
    relatedAnlassraumIds: z.array(z.string().trim().min(1)).default([]),
    suggestedAction: z.enum(REGION_SIGNAL_SUGGESTED_ACTIONS),
    confidence: z.number().min(0).max(1),
    reviewStatus: z.enum(REGION_SIGNAL_REVIEW_STATUSES),
    noAutoPublish: z.literal(true),
    noAutoCreateDossier: z.literal(true),
    noAutoCreateAnlassraum: z.literal(true),
    noTenderMonitoring: z.literal(true),
    noProcurementMonitoring: z.literal(true),
    provenance: RegionSignalProvenanceSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    const keys = [
      "detectedTopics",
      "detectedPlaces",
      "relatedClaims",
      "relatedDossiers",
      "relatedAnlassraumIds",
    ] as const;

    for (const key of keys) {
      if (new Set(value[key]).size !== value[key].length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `duplicate_${key}`,
        });
      }
    }
  });

export const RegionFeedItemSchema = RegionFeedItemBaseSchema.safeExtend({
  clusterKey: z.string().trim().min(1).nullable().optional(),
  openQuestions: z.array(z.string().trim().min(1)).default([]),
  reviewHint: z.string().trim().min(1).nullable().optional(),
});

export type RegionFeedItem = z.infer<typeof RegionFeedItemSchema>;

export const RegionFeedSignalSchema = RegionFeedItemSchema.safeExtend({
  kind: z.literal("region_feed_signal"),
  suggestedAnlassraumTitle: z.string().trim().min(1).nullable().optional(),
  suggestedDossierTitle: z.string().trim().min(1).nullable().optional(),
});

export type RegionFeedSignal = z.infer<typeof RegionFeedSignalSchema>;

export const RegionTopicClusterSchema = z
  .object({
    id: z.string().trim().min(1),
    regionId: z.string().trim().min(1),
    label: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    signalIds: z.array(z.string().trim().min(1)).min(1),
    sourceIds: z.array(z.string().trim().min(1)).min(1),
    detectedTopics: z.array(z.string().trim().min(1)).min(1),
    openQuestions: z.array(z.string().trim().min(1)).default([]),
    suggestedAction: z.enum(REGION_SIGNAL_SUGGESTED_ACTIONS),
    confidence: z.number().min(0).max(1),
    reviewStatus: z.enum(REGION_SIGNAL_REVIEW_STATUSES),
    provenance: RegionSignalProvenanceSchema,
    noAutoPublish: z.literal(true),
    noAutoCreateDossier: z.literal(true),
    noAutoCreateAnlassraum: z.literal(true),
    noTenderMonitoring: z.literal(true),
    noProcurementMonitoring: z.literal(true),
  })
  .strict();

export type RegionTopicCluster = z.infer<typeof RegionTopicClusterSchema>;

export const RegionDossierSuggestionSchema = z
  .object({
    id: z.string().trim().min(1),
    regionId: z.string().trim().min(1),
    title: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    relatedSignalIds: z.array(z.string().trim().min(1)).min(1),
    relatedDossiers: z.array(z.string().trim().min(1)).default([]),
    openQuestions: z.array(z.string().trim().min(1)).default([]),
    suggestedAction: z.enum(REGION_SIGNAL_SUGGESTED_ACTIONS),
    confidence: z.number().min(0).max(1),
    reviewStatus: z.enum(REGION_SIGNAL_REVIEW_STATUSES),
    provenance: RegionSignalProvenanceSchema,
    noAutoPublish: z.literal(true),
    noAutoCreateDossier: z.literal(true),
    noAutoCreateAnlassraum: z.literal(true),
    noTenderMonitoring: z.literal(true),
    noProcurementMonitoring: z.literal(true),
  })
  .strict();

export type RegionDossierSuggestion = z.infer<typeof RegionDossierSuggestionSchema>;

export const RegionAnlassraumSuggestionSchema = z
  .object({
    id: z.string().trim().min(1),
    regionId: z.string().trim().min(1),
    title: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    relatedSignalIds: z.array(z.string().trim().min(1)).min(1),
    relatedAnlassraumIds: z.array(z.string().trim().min(1)).default([]),
    openQuestions: z.array(z.string().trim().min(1)).default([]),
    suggestedAction: z.enum(REGION_SIGNAL_SUGGESTED_ACTIONS),
    confidence: z.number().min(0).max(1),
    reviewStatus: z.enum(REGION_SIGNAL_REVIEW_STATUSES),
    provenance: RegionSignalProvenanceSchema,
    noAutoPublish: z.literal(true),
    noAutoCreateDossier: z.literal(true),
    noAutoCreateAnlassraum: z.literal(true),
    noTenderMonitoring: z.literal(true),
    noProcurementMonitoring: z.literal(true),
  })
  .strict();

export type RegionAnlassraumSuggestion = z.infer<typeof RegionAnlassraumSuggestionSchema>;

export function parseRegionFeedSource(value: unknown): RegionFeedSource {
  return RegionFeedSourceSchema.parse(value);
}

export function parseRegionFeedItem(value: unknown): RegionFeedItem {
  return RegionFeedItemSchema.parse(value);
}

export function parseRegionFeedSignal(value: unknown): RegionFeedSignal {
  return RegionFeedSignalSchema.parse(value);
}

export function parseRegionTopicCluster(value: unknown): RegionTopicCluster {
  return RegionTopicClusterSchema.parse(value);
}

export function parseRegionDossierSuggestion(value: unknown): RegionDossierSuggestion {
  return RegionDossierSuggestionSchema.parse(value);
}

export function parseRegionAnlassraumSuggestion(value: unknown): RegionAnlassraumSuggestion {
  return RegionAnlassraumSuggestionSchema.parse(value);
}

export function supportsRegionTenderSignalTypes(): false {
  return false;
}

const PILOT_PROVENANCE: RegionSignalProvenance = {
  dataOrigin: "pilot_fixture",
  isFixture: true,
  fixtureMarker: "pilot_fixture_only",
};

const RUNTIME_PROVENANCE: RegionSignalProvenance = {
  dataOrigin: "runtime_review_queue",
  isFixture: false,
  fixtureMarker: "runtime_review_queue",
};

export const REGION_FEED_SOURCE_FIXTURES: readonly RegionFeedSource[] = [
  parseRegionFeedSource({
    id: "feed-source-reinickendorf-pilot-briefing",
    regionId: "bezirk-berlin-reinickendorf",
    sourceType: "manual_note",
    label: "Pilot-Briefing Reinickendorf",
    description:
      "Pilot-Szenarien fuer den regionalen Review-Pfad. Keine echten Nachrichten, keine Live-Quelle.",
    url: null,
    provenance: PILOT_PROVENANCE,
    noScrapingByDefault: true,
    noTenderMonitoring: true,
    noProcurementMonitoring: true,
  }),
  parseRegionFeedSource({
    id: "feed-source-reinickendorf-official-pilot",
    regionId: "bezirk-berlin-reinickendorf",
    sourceType: "official_update",
    label: "Pilot-Fall Verwaltungshinweis Reinickendorf",
    description:
      "Pilotische Verwaltungsinformation fuer Review- und Dossiervorschlaege. Nicht als Live-Verwaltungsmitteilung bewerben.",
    url: null,
    provenance: PILOT_PROVENANCE,
    noScrapingByDefault: true,
    noTenderMonitoring: true,
    noProcurementMonitoring: true,
  }),
  parseRegionFeedSource({
    id: "feed-source-magdeburg-pilot-briefing",
    regionId: "kommune-magdeburg",
    sourceType: "manual_note",
    label: "Pilot-Briefing Magdeburg",
    description:
      "Kommunale Pilot-Szenarien fuer getrennte Region-Tests. Keine Live-Quelle und kein Produktionsfeed.",
    url: null,
    provenance: PILOT_PROVENANCE,
    noScrapingByDefault: true,
    noTenderMonitoring: true,
    noProcurementMonitoring: true,
  }),
] as const;

export const REGION_FEED_SIGNAL_FIXTURES: readonly RegionFeedSignal[] = [
  parseRegionFeedSignal({
    id: "region-feed-signal-reinickendorf-school-renovation-001",
    kind: "region_feed_signal",
    regionId: "bezirk-berlin-reinickendorf",
    sourceId: "feed-source-reinickendorf-official-pilot",
    sourceType: "official_update",
    title: "Pilot-Fall: Hinweise zu Schulsanierung und Bauzustand",
    summary:
      "Pilotisches Review-Szenario zu wiederkehrenden Hinweisen auf Schulgebaeude, Sanierungsbedarf und offene Zustandsfragen im Bezirk.",
    url: null,
    publishedAt: "2026-05-14T00:00:00.000Z",
    detectedTopics: ["Schulsanierung", "Schulgebaeude", "Bauzustand"],
    detectedPlaces: ["Reinickendorf"],
    relatedClaims: [],
    relatedDossiers: [],
    relatedAnlassraumIds: ["regional-anlassraum-reinickendorf"],
    suggestedAction: "create_dossier",
    confidence: 0.87,
    reviewStatus: "needs_review",
    noAutoPublish: true,
    noAutoCreateDossier: true,
    noAutoCreateAnlassraum: true,
    noTenderMonitoring: true,
    noProcurementMonitoring: true,
    provenance: PILOT_PROVENANCE,
    clusterKey: "bildung-schulinfrastruktur",
    openQuestions: [
      "Welche Schulen sind betroffen?",
      "Welche Zustaendigkeit liegt beim Bezirk, welche beim Land Berlin?",
    ],
    reviewHint: "Vor Dossieranlage Quellen und Bezirkszustaendigkeit manuell bestaetigen.",
    suggestedAnlassraumTitle: "Bildung & Schulinfrastruktur Reinickendorf",
    suggestedDossierTitle: "Sanierung von Schulen im Bezirk",
  }),
  parseRegionFeedSignal({
    id: "region-feed-signal-reinickendorf-school-routes-001",
    kind: "region_feed_signal",
    regionId: "bezirk-berlin-reinickendorf",
    sourceId: "feed-source-reinickendorf-pilot-briefing",
    sourceType: "feed_draft",
    title: "Pilot-Fall: Wiederkehrendes Thema Schulwege und Verkehr vor Schulen",
    summary:
      "Mehrere pilotische Hinweise verdichten sich auf Schulwege, Querungen und OePNV-nahe Verkehrslagen rund um Schulen.",
    url: null,
    publishedAt: "2026-05-14T00:00:00.000Z",
    detectedTopics: ["Verkehr", "OePNV", "Schulwege"],
    detectedPlaces: ["Reinickendorf"],
    relatedClaims: [],
    relatedDossiers: [],
    relatedAnlassraumIds: ["regional-anlassraum-reinickendorf"],
    suggestedAction: "create_dossier",
    confidence: 0.82,
    reviewStatus: "needs_review",
    noAutoPublish: true,
    noAutoCreateDossier: true,
    noAutoCreateAnlassraum: true,
    noTenderMonitoring: true,
    noProcurementMonitoring: true,
    provenance: PILOT_PROVENANCE,
    clusterKey: "verkehr-schulwege",
    openQuestions: [
      "Welche Wegebeziehungen sind besonders betroffen?",
      "Welche Rueckmeldungen liegen bereits aus Schulen und Elternschaft vor?",
    ],
    reviewHint: "Vor Dossieranlage Ortswissen und bestehende Verkehrsplanung manuell abgleichen.",
    suggestedAnlassraumTitle: "Bildung & Schulinfrastruktur Reinickendorf",
    suggestedDossierTitle: "Sichere Schulwege / Verkehr vor Schulen",
  }),
  parseRegionFeedSignal({
    id: "region-feed-signal-reinickendorf-citizen-office-001",
    kind: "region_feed_signal",
    regionId: "bezirk-berlin-reinickendorf",
    sourceId: "feed-source-reinickendorf-pilot-briefing",
    sourceType: "manual_note",
    title: "Pilot-Fall: Offene Fragen zu Buergeramt und Verwaltungszugang",
    summary:
      "Pilotischer Themenhinweis zu Wartezeiten, Terminzugang und Rueckmeldelogik fuer Verwaltungsleistungen.",
    url: null,
    publishedAt: "2026-05-14T00:00:00.000Z",
    detectedTopics: ["Buergeraemter", "Verwaltung", "Wartezeiten"],
    detectedPlaces: ["Reinickendorf"],
    relatedClaims: [],
    relatedDossiers: [],
    relatedAnlassraumIds: ["regional-anlassraum-reinickendorf"],
    suggestedAction: "ask_clarifying_question",
    confidence: 0.74,
    reviewStatus: "draft",
    noAutoPublish: true,
    noAutoCreateDossier: true,
    noAutoCreateAnlassraum: true,
    noTenderMonitoring: true,
    noProcurementMonitoring: true,
    provenance: PILOT_PROVENANCE,
    clusterKey: "verwaltungszugang",
    openQuestions: [
      "Welche Leistungen sind besonders betroffen?",
      "Welche Hinweise sind Verwaltungsinformation und welche sind Buergerhinweise?",
    ],
    reviewHint: "Erst klaeren, ob Anlassraum-Erweiterung oder separates Dossier sinnvoll ist.",
    suggestedAnlassraumTitle: "Verwaltungszugang Reinickendorf",
    suggestedDossierTitle: null,
  }),
  parseRegionFeedSignal({
    id: "region-feed-signal-reinickendorf-social-infrastructure-001",
    kind: "region_feed_signal",
    regionId: "bezirk-berlin-reinickendorf",
    sourceId: "feed-source-reinickendorf-pilot-briefing",
    sourceType: "community_signal",
    title: "Pilot-Fall: Soziale Infrastruktur, Jugend-, Sport- und Kulturangebote",
    summary:
      "Pilotischer Community-Hinweis auf Nachbarschaft, Jugendangebote und lokale Infrastrukturfragen ohne automatische Ableitung.",
    url: null,
    publishedAt: "2026-05-14T00:00:00.000Z",
    detectedTopics: ["Wohnen", "Nachbarschaft", "soziale Infrastruktur", "Jugend", "Sport", "Kulturangebote"],
    detectedPlaces: ["Reinickendorf"],
    relatedClaims: [],
    relatedDossiers: [],
    relatedAnlassraumIds: ["regional-anlassraum-reinickendorf"],
    suggestedAction: "create_anlassraum",
    confidence: 0.68,
    reviewStatus: "needs_review",
    noAutoPublish: true,
    noAutoCreateDossier: true,
    noAutoCreateAnlassraum: true,
    noTenderMonitoring: true,
    noProcurementMonitoring: true,
    provenance: PILOT_PROVENANCE,
    clusterKey: "soziale-infrastruktur",
    openQuestions: [
      "Welche Zielgruppen sind konkret betroffen?",
      "Liegt bereits ein bestehender Anlassraum mit anschlussfaehigem Scope vor?",
    ],
    reviewHint: "Nur als Anlassraum-Vorschlag, nicht als automatische Themenfreigabe.",
    suggestedAnlassraumTitle: "Nachbarschaft & soziale Infrastruktur Reinickendorf",
    suggestedDossierTitle: null,
  }),
  parseRegionFeedSignal({
    id: "region-feed-signal-reinickendorf-public-space-001",
    kind: "region_feed_signal",
    regionId: "bezirk-berlin-reinickendorf",
    sourceId: "feed-source-reinickendorf-pilot-briefing",
    sourceType: "manual_note",
    title: "Pilot-Fall: Gruenflaechen, Sauberkeit und oeffentlicher Raum",
    summary:
      "Pilotische Themenverdichtung zu Gruenflaechenpflege und Aufenthaltsqualitaet im oeffentlichen Raum.",
    url: null,
    publishedAt: "2026-05-14T00:00:00.000Z",
    detectedTopics: ["Gruenflaechen", "Sauberkeit", "oeffentlicher Raum"],
    detectedPlaces: ["Reinickendorf"],
    relatedClaims: [],
    relatedDossiers: [],
    relatedAnlassraumIds: ["regional-anlassraum-reinickendorf"],
    suggestedAction: "attach_to_anlassraum",
    confidence: 0.63,
    reviewStatus: "draft",
    noAutoPublish: true,
    noAutoCreateDossier: true,
    noAutoCreateAnlassraum: true,
    noTenderMonitoring: true,
    noProcurementMonitoring: true,
    provenance: PILOT_PROVENANCE,
    clusterKey: "oeffentlicher-raum",
    openQuestions: ["Ist ein neues Dossier notwendig oder reicht die Zuordnung zum bestehenden Anlassraum?"],
    reviewHint: "Zuerst am bestehenden Anlassraum pruefen, keine neue Struktur automatisch erzeugen.",
    suggestedAnlassraumTitle: "Nachbarschaft & soziale Infrastruktur Reinickendorf",
    suggestedDossierTitle: null,
  }),
  parseRegionFeedSignal({
    id: "region-feed-signal-magdeburg-sports-001",
    kind: "region_feed_signal",
    regionId: "kommune-magdeburg",
    sourceId: "feed-source-magdeburg-pilot-briefing",
    sourceType: "manual_note",
    title: "Pilot-Fall: Jugend- und Sportangebote in der Kommune",
    summary:
      "Getrenntes Kommunal-Szenario fuer Magdeburg zur Verifikation sauberer Regionstrennung im Readmodel.",
    url: null,
    publishedAt: "2026-05-14T00:00:00.000Z",
    detectedTopics: ["Jugend", "Sport", "Kulturangebote"],
    detectedPlaces: ["Magdeburg"],
    relatedClaims: [],
    relatedDossiers: [],
    relatedAnlassraumIds: [],
    suggestedAction: "create_anlassraum",
    confidence: 0.71,
    reviewStatus: "needs_review",
    noAutoPublish: true,
    noAutoCreateDossier: true,
    noAutoCreateAnlassraum: true,
    noTenderMonitoring: true,
    noProcurementMonitoring: true,
    provenance: PILOT_PROVENANCE,
    clusterKey: "jugend-sport-kultur",
    openQuestions: ["Welche Traeger und Verwaltungsstellen sind zustaendig?"],
    reviewHint: "Dient nur als getrenntes Kommunal-Pilotsignal fuer Test und Review.",
    suggestedAnlassraumTitle: "Jugend, Sport & Kultur Magdeburg",
    suggestedDossierTitle: null,
  }),
] as const;

export function buildRuntimeRegionSignalProvenance(): RegionSignalProvenance {
  return RUNTIME_PROVENANCE;
}
