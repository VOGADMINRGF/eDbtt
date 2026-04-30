import {
  DISTRIBUTION_CHANNELS,
  OUTPUT_FORMATS,
  OutputPackageSchema,
  type DistributionChannel,
  type DossierOutput,
  type OutputAudience,
  type OutputFormat,
  type OutputPackage,
  type OutputReviewStatus,
  type SourceTrace,
} from "./contracts";

export type MinimalDossierInput = {
  id: string;
  title: string;
  summary: string;
  claims: Array<{ id?: string; text: string; status?: string | null }>;
  sources: Array<{ id?: string; title: string; url: string }>;
  openQuestions: Array<string | { text: string }>;
  options: Array<string | { title: string }>;
  status?: string | null;
  updatedAt: string;
};

export type GenerateOutputPackageOptions = {
  generatedAt?: string;
  baseUrl?: string;
  audience?: OutputAudience;
  formats?: readonly OutputFormat[];
};

function toCleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toIsoDate(input?: string): string {
  if (input) {
    const parsed = new Date(input);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return new Date().toISOString();
}

function truncate(input: string, max: number): string {
  if (input.length <= max) return input;
  return `${input.slice(0, max - 1).trimEnd()}…`;
}

function normalizeBacklink(baseUrl: string | undefined, dossierId: string): string {
  const path = `/dossier/${encodeURIComponent(dossierId)}`;
  const normalizedBase = toCleanString(baseUrl);
  if (!normalizedBase) return path;
  try {
    return new URL(path, normalizedBase).toString();
  } catch {
    return path;
  }
}

function normalizeOpenQuestion(entry: string | { text: string }): string {
  if (typeof entry === "string") return toCleanString(entry);
  return toCleanString(entry?.text);
}

function normalizeOption(entry: string | { title: string }): string {
  if (typeof entry === "string") return toCleanString(entry);
  return toCleanString(entry?.title);
}

function stableKey(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

function mapChannel(format: OutputFormat): DistributionChannel {
  if (format === "qr_poster") return "print";
  if (format === "voiceover_text" || format === "podcast_script" || format === "reel_script") {
    return "audio";
  }
  if (format === "social_carousel") return "social";
  if (format === "citizen_letter") return "mail";
  if (format === "administrative_note") return "internal";
  return "web";
}

function buildStructuredSummary(dossier: MinimalDossierInput): string[] {
  const summary = toCleanString(dossier.summary);
  const claimCount = dossier.claims.length;
  const sourceCount = dossier.sources.length;
  const status = toCleanString(dossier.status) || "unknown";
  const lines = [
    summary || `Dossier ${dossier.id} ohne redaktionelle Zusammenfassung.`,
    `Status: ${status}. Claims: ${claimCount}. Sources: ${sourceCount}.`,
  ];

  const topClaims = dossier.claims
    .map((claim) => toCleanString(claim?.text))
    .filter(Boolean)
    .slice(0, 3)
    .map((claim, index) => `Claim ${index + 1}: ${truncate(claim, 220)}`);

  return [...lines, ...topClaims];
}

function buildSourceTraces(dossier: MinimalDossierInput): SourceTrace[] {
  return dossier.sources
    .map((source, index) => {
      const title = toCleanString(source?.title);
      const url = toCleanString(source?.url);
      if (!title || !url) return null;
      return {
        sourceId: toCleanString(source?.id) || `source_${index + 1}`,
        title,
        url,
        claimRefs: dossier.claims
          .map((claim) => toCleanString(claim?.id))
          .filter(Boolean)
          .slice(0, 3),
        note: null,
      };
    })
    .filter((entry): entry is SourceTrace => Boolean(entry));
}

function resolveNeedsInputMarkers(input: {
  sourceTraces: SourceTrace[];
  options: string[];
  summary: string;
}): string[] {
  const markers: string[] = [];
  if (input.sourceTraces.length === 0) markers.push("sources_missing");
  if (input.options.length === 0) markers.push("decision_options_missing");
  if (!input.summary) markers.push("summary_missing");
  return markers;
}

function resolveReviewStatus(needsInputMarkers: string[]): OutputReviewStatus {
  return needsInputMarkers.length > 0 ? "needs_review" : "draft";
}

function buildDistributionOutputs(input: {
  formats: readonly OutputFormat[];
  title: string;
  shortSummary: string;
  structuredSummary: string[];
  openQuestions: string[];
  options: string[];
  reviewStatus: OutputReviewStatus;
  completenessStatus: "complete" | "needs_input";
}): DossierOutput[] {
  return input.formats.map((format) => ({
    format,
    channel: mapChannel(format),
    headline: `${input.title} (${format})`,
    shortSummary: input.shortSummary,
    structuredSummary: input.structuredSummary,
    openQuestions: input.openQuestions,
    options: input.options,
    reviewStatus: input.reviewStatus,
    completenessStatus: input.completenessStatus,
    mapperReady: false,
  }));
}

export function generateOutputPackage(
  dossier: MinimalDossierInput,
  options: GenerateOutputPackageOptions = {},
): OutputPackage {
  const dossierId = toCleanString(dossier?.id);
  if (!dossierId) {
    throw new Error("dossier_id_required");
  }

  const title = truncate(toCleanString(dossier.title) || `Dossier ${dossierId}`, 160);
  const summary = truncate(toCleanString(dossier.summary), 280);
  const shortSummary = summary || "Noch keine verifizierte Zusammenfassung verfügbar.";
  const structuredSummary = buildStructuredSummary(dossier);
  const sourceTraces = buildSourceTraces(dossier);
  const openQuestions = dossier.openQuestions.map(normalizeOpenQuestion).filter(Boolean);
  const decisionOptions = dossier.options.map(normalizeOption).filter(Boolean);
  const needsInputMarkers = resolveNeedsInputMarkers({
    sourceTraces,
    options: decisionOptions,
    summary,
  });
  const reviewStatus = resolveReviewStatus(needsInputMarkers);
  const completenessStatus = needsInputMarkers.length > 0 ? "needs_input" : "complete";
  const generatedAt = toIsoDate(options.generatedAt ?? dossier.updatedAt);
  const dossierBacklinkTarget = normalizeBacklink(options.baseUrl, dossierId);
  const selectedFormats = options.formats?.length ? options.formats : OUTPUT_FORMATS;

  const outputPackage: OutputPackage = {
    packageId: `outpkg_${stableKey([dossierId, generatedAt, selectedFormats.join(",")].join("|"))}`,
    dossierId,
    generatedAt,
    reviewStatus,
    completenessStatus,
    audience: options.audience ?? "general_public",
    title,
    shortSummary,
    structuredSummary,
    sourceState: {
      status: sourceTraces.length > 0 ? "sufficient" : "missing",
      sourceCount: sourceTraces.length,
      traces: sourceTraces,
      notes:
        sourceTraces.length > 0
          ? []
          : ["Keine belastbaren Quellen verknüpft. Paket bleibt in der Review-Warteschlange."],
    },
    sourceTraces,
    openQuestions,
    options: decisionOptions,
    needsInputMarkers,
    cta: {
      label: "Dossier prüfen und Quellenlage nachvollziehen",
      action: "open_dossier",
      target: dossierBacklinkTarget,
    },
    dossierBacklinkTarget,
    qrCodeTarget: {
      type: "dossier",
      label: "Dossier-QR",
      target: dossierBacklinkTarget,
    },
    distributionOutputs: buildDistributionOutputs({
      formats: selectedFormats,
      title,
      shortSummary,
      structuredSummary,
      openQuestions,
      options: decisionOptions,
      reviewStatus,
      completenessStatus,
    }),
    autoPublish: false,
  };

  return OutputPackageSchema.parse(outputPackage);
}

export const OUTPUT_ENGINE_SUPPORTED_FORMATS = OUTPUT_FORMATS;
export const OUTPUT_ENGINE_SUPPORTED_CHANNELS = DISTRIBUTION_CHANNELS;
