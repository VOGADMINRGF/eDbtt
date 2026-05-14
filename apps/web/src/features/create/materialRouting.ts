import { detectCreateLinkIntake } from "@/features/create/linkIntake";

export type MaterialResearchMode = "none" | "gemini" | "gpt_deepsearch" | "auto";
export type MaterialLane = "standard" | "material_grounding";
export type MaterialProvider = "none" | "notebooklm";
export type MaterialResearchProvider = "none" | "gemini" | "openai_deep_research";
export type MaterialExtractionStatus = "full" | "partial" | "none";

export type NormalizedMaterialItemKind =
  | "youtube_url"
  | "pdf_document"
  | "upload_document"
  | "web_document";

export type NormalizedMaterialItem = {
  id: string;
  kind: NormalizedMaterialItemKind;
  label: string;
  url: string | null;
  uploadId: string | null;
  mimeType: string | null;
  fileName: string | null;
  text: string | null;
  pageRef: string | null;
  timestampRef: string | null;
  extractedBy: string | null;
  extractionStatus: MaterialExtractionStatus;
};

export type CreateAttachmentLike = {
  name: string;
  type?: string | null;
  size?: number | null;
};

export type MaterialRoutingResult = {
  lane: MaterialLane;
  materialProvider: MaterialProvider;
  researchMode: MaterialResearchMode;
  researchUsed: "none" | "gemini" | "deep_search";
  researchProvider: MaterialResearchProvider;
  fallbackUsed: boolean;
  allowDeepSearch: boolean;
  clarificationState: "none" | "clarification_required";
  requiresHumanReview: boolean;
  sourceUrls: string[];
  materialItems: NormalizedMaterialItem[];
};

type ResolveMaterialRoutingInput = {
  text?: string | null;
  sourceUrls?: unknown;
  uploadIds?: unknown;
  materialItems?: unknown;
  evidenceItems?: unknown;
  researchMode?: unknown;
  allowDeepSearch?: unknown;
  researchConfirmed?: unknown;
};

function parseBool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
  if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  return fallback;
}

function asOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function sanitizeUrl(value: unknown): string | null {
  const raw = asOptionalString(value);
  if (!raw) return null;
  try {
    const parsed = new URL(raw.startsWith("www.") ? `https://${raw}` : raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function normalizeResearchMode(value: unknown): MaterialResearchMode {
  const normalized = asOptionalString(value)?.toLowerCase();
  if (normalized === "none") return "none";
  if (normalized === "gemini") return "gemini";
  if (normalized === "gpt_deepsearch") return "gpt_deepsearch";
  return "auto";
}

function inferMaterialKind(params: {
  url: string | null;
  mimeType: string | null;
  fileName: string | null;
  marker: string;
}): NormalizedMaterialItemKind | null {
  const { url, mimeType, fileName, marker } = params;
  const haystack = `${marker} ${mimeType ?? ""} ${fileName ?? ""} ${url ?? ""}`.toLowerCase();

  if (haystack.includes("youtube.com") || haystack.includes("youtu.be") || haystack.includes("youtube")) {
    return "youtube_url";
  }
  if (haystack.includes("pdf") || /\.pdf(?:$|[?#])/i.test(haystack)) {
    return fileName || mimeType ? "pdf_document" : "pdf_document";
  }
  if (fileName || mimeType || marker.includes("upload") || marker.includes("document")) {
    return "upload_document";
  }
  if (url) {
    return "web_document";
  }
  return null;
}

function inferExtractionStatus(text: string | null, kind: NormalizedMaterialItemKind): MaterialExtractionStatus {
  if (text && text.trim().length >= 140) return "full";
  if (text && text.trim().length > 0) return "partial";
  if (kind === "youtube_url" || kind === "pdf_document" || kind === "upload_document") return "none";
  return "partial";
}

function pushUniqueItem(target: NormalizedMaterialItem[], candidate: NormalizedMaterialItem) {
  if (
    target.some(
      (item) =>
        item.id === candidate.id ||
        (item.url && candidate.url && item.url === candidate.url) ||
        (item.uploadId && candidate.uploadId && item.uploadId === candidate.uploadId),
    )
  ) {
    return;
  }
  target.push(candidate);
}

function collectMaterialItemsFromEvidence(input: unknown): NormalizedMaterialItem[] {
  if (!Array.isArray(input)) return [];
  const items: NormalizedMaterialItem[] = [];

  input.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") return;
    const raw = entry as Record<string, unknown>;
    const url = sanitizeUrl(raw.url ?? raw.sourceUrl ?? raw.href);
    const mimeType = asOptionalString(raw.mimeType ?? raw.mimetype);
    const fileName = asOptionalString(raw.fileName ?? raw.filename ?? raw.name);
    const marker = String(raw.kind ?? raw.type ?? "").toLowerCase();
    const kind = inferMaterialKind({ url, mimeType, fileName, marker });
    if (!kind) return;
    const text =
      asOptionalString(raw.documentText) ??
      asOptionalString(raw.text) ??
      asOptionalString(raw.content) ??
      asOptionalString(raw.summary) ??
      null;
    const label =
      asOptionalString(raw.label) ??
      asOptionalString(raw.title) ??
      fileName ??
      url ??
      `Material ${index + 1}`;
    pushUniqueItem(items, {
      id:
        asOptionalString(raw.id) ??
        asOptionalString(raw.uploadId) ??
        asOptionalString(raw.documentId) ??
        `material-evidence-${index + 1}`,
      kind,
      label,
      url,
      uploadId: asOptionalString(raw.uploadId ?? raw.documentId),
      mimeType,
      fileName,
      text,
      pageRef: asOptionalString(raw.pageRef),
      timestampRef: asOptionalString(raw.timestampRef),
      extractedBy: asOptionalString(raw.extractedBy),
      extractionStatus:
        (raw.extractionStatus === "full" || raw.extractionStatus === "partial" || raw.extractionStatus === "none")
          ? raw.extractionStatus
          : inferExtractionStatus(text, kind),
    });
  });

  return items;
}

function collectMaterialItemsFromStructured(input: unknown): NormalizedMaterialItem[] {
  if (!Array.isArray(input)) return [];
  const items: NormalizedMaterialItem[] = [];

  input.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") return;
    const raw = entry as Record<string, unknown>;
    const url = sanitizeUrl(raw.url ?? raw.sourceUrl ?? raw.href);
    const mimeType = asOptionalString(raw.mimeType ?? raw.mimetype);
    const fileName = asOptionalString(raw.fileName ?? raw.filename ?? raw.name);
    const marker = String(raw.kind ?? raw.type ?? "").toLowerCase();
    const kind = inferMaterialKind({ url, mimeType, fileName, marker });
    if (!kind) return;
    const text =
      asOptionalString(raw.text) ??
      asOptionalString(raw.documentText) ??
      asOptionalString(raw.excerpt) ??
      asOptionalString(raw.summary) ??
      null;
    pushUniqueItem(items, {
      id:
        asOptionalString(raw.id) ??
        asOptionalString(raw.uploadId) ??
        asOptionalString(raw.documentId) ??
        `material-item-${index + 1}`,
      kind,
      label:
        asOptionalString(raw.label) ??
        asOptionalString(raw.title) ??
        fileName ??
        url ??
        `Material ${index + 1}`,
      url,
      uploadId: asOptionalString(raw.uploadId ?? raw.documentId),
      mimeType,
      fileName,
      text,
      pageRef: asOptionalString(raw.pageRef),
      timestampRef: asOptionalString(raw.timestampRef),
      extractedBy: asOptionalString(raw.extractedBy),
      extractionStatus:
        (raw.extractionStatus === "full" || raw.extractionStatus === "partial" || raw.extractionStatus === "none")
          ? raw.extractionStatus
          : inferExtractionStatus(text, kind),
    });
  });

  return items;
}

function collectSourceUrls(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const urls: string[] = [];
  input.forEach((entry) => {
    const url = sanitizeUrl(entry);
    if (!url || urls.includes(url)) return;
    urls.push(url);
  });
  return urls;
}

function collectUploadItems(input: unknown): NormalizedMaterialItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((entry, index) => {
      const uploadId = asOptionalString(entry);
      if (!uploadId) return null;
      return {
        id: uploadId,
        kind: "upload_document" as const,
        label: `Upload ${index + 1}`,
        url: null,
        uploadId,
        mimeType: null,
        fileName: null,
        text: null,
        pageRef: null,
        timestampRef: null,
        extractedBy: null,
        extractionStatus: "none" as const,
      };
    })
    .filter(Boolean) as NormalizedMaterialItem[];
}

export function buildCreateAttachmentMaterialItems(
  files: readonly CreateAttachmentLike[],
): NormalizedMaterialItem[] {
  return files
    .map((file, index) => {
      const fileName = asOptionalString(file?.name);
      if (!fileName) return null;
      const mimeType = asOptionalString(file?.type);
      const kind = inferMaterialKind({
        url: null,
        mimeType,
        fileName,
        marker: "attachment",
      });
      if (!kind) return null;
      return {
        id: `create-attachment-${index + 1}`,
        kind,
        label: fileName,
        url: null,
        uploadId: null,
        mimeType,
        fileName,
        text: null,
        pageRef: null,
        timestampRef: null,
        extractedBy: null,
        extractionStatus: inferExtractionStatus(null, kind),
      };
    })
    .filter((item): item is NormalizedMaterialItem => Boolean(item));
}

function collectTextLinkItems(text: string): NormalizedMaterialItem[] {
  const detection = detectCreateLinkIntake(text);
  return detection.urls
    .map((url, index) => {
      const kind = inferMaterialKind({
        url,
        mimeType: null,
        fileName: null,
        marker: detection.linkKind,
      });
      if (!kind) return null;
      return {
        id: `text-url-${index + 1}`,
        kind,
        label: detection.linkKind === "youtube" ? "YouTube-Link" : `Quelle ${index + 1}`,
        url,
        uploadId: null,
        mimeType: null,
        fileName: null,
        text: detection.remainingText || null,
        pageRef: null,
        timestampRef: null,
        extractedBy: null,
        extractionStatus: inferExtractionStatus(detection.remainingText || null, kind),
      };
    })
    .filter((item): item is NormalizedMaterialItem => Boolean(item));
}

function hasClarificationOnlyLocation(text: string): boolean {
  const lowered = text.toLowerCase();
  return (
    /\b(bei uns|in unserer stadt|hier|im kiez|vor ort|bei der schule)\b/.test(lowered) &&
    !/\b(berlin|hamburg|münchen|munich|köln|koeln|leipzig|stuttgart|bremen|dresden|frankfurt)\b/.test(lowered)
  );
}

function resolveDeepSearchEnabled(): boolean {
  return parseBool(
    process.env.E150_DEEPSEARCH_ENABLED ?? process.env.OPENAI_DEEP_RESEARCH_ENABLED ?? "false",
    false,
  );
}

function resolveDeepSearchRequiresConfirmation(): boolean {
  return parseBool(process.env.E150_DEEPSEARCH_REQUIRE_CONFIRMATION ?? "true", true);
}

export function resolveMaterialRouting(input: ResolveMaterialRoutingInput): MaterialRoutingResult {
  const text = String(input.text ?? "").trim();
  const structuredItems = collectMaterialItemsFromStructured(input.materialItems);
  const evidenceItems = collectMaterialItemsFromEvidence(input.evidenceItems);
  const uploadItems = collectUploadItems(input.uploadIds);
  const textLinkItems = collectTextLinkItems(text);
  const sourceUrls = collectSourceUrls(input.sourceUrls);

  const materialItems: NormalizedMaterialItem[] = [];
  [...structuredItems, ...evidenceItems, ...uploadItems, ...textLinkItems].forEach((item) =>
    pushUniqueItem(materialItems, item),
  );

  sourceUrls.forEach((url, index) => {
    const kind = inferMaterialKind({ url, mimeType: null, fileName: null, marker: "source_url" });
    if (!kind) return;
    pushUniqueItem(materialItems, {
      id: `source-url-${index + 1}`,
      kind,
      label: kind === "youtube_url" ? "YouTube-Link" : `Quelle ${index + 1}`,
      url,
      uploadId: null,
      mimeType: null,
      fileName: null,
      text: null,
      pageRef: null,
      timestampRef: null,
      extractedBy: null,
      extractionStatus: inferExtractionStatus(null, kind),
    });
  });

  const lane: MaterialLane = materialItems.length > 0 ? "material_grounding" : "standard";
  const researchMode = normalizeResearchMode(input.researchMode);
  const deepSearchEnabled = resolveDeepSearchEnabled();
  const deepSearchRequiresConfirmation = resolveDeepSearchRequiresConfirmation();
  const deepSearchConfirmed = parseBool(input.researchConfirmed, false);
  const allowDeepSearch = parseBool(input.allowDeepSearch, false);

  let researchProvider: MaterialResearchProvider = "none";
  let researchUsed: MaterialRoutingResult["researchUsed"] = "none";
  let fallbackUsed = false;
  let requiresHumanReview = false;

  if (lane === "material_grounding" && researchMode !== "none") {
    researchProvider = "gemini";
    researchUsed = "gemini";

    const deepSearchAllowed =
      allowDeepSearch &&
      deepSearchEnabled &&
      (!deepSearchRequiresConfirmation || deepSearchConfirmed);

    if (researchMode === "gpt_deepsearch" && deepSearchAllowed) {
      researchProvider = "openai_deep_research";
      researchUsed = "deep_search";
      fallbackUsed = true;
    } else if (researchMode === "gpt_deepsearch" && !deepSearchAllowed) {
      requiresHumanReview = true;
    }
  }

  const extractionGaps = materialItems.filter((item) => item.extractionStatus !== "full").length;
  const clarificationState =
    lane === "standard" && hasClarificationOnlyLocation(text) ? "clarification_required" : "none";

  if (lane === "material_grounding" && extractionGaps > 0) {
    requiresHumanReview = true;
  }

  return {
    lane,
    materialProvider: lane === "material_grounding" ? "notebooklm" : "none",
    researchMode,
    researchUsed,
    researchProvider,
    fallbackUsed,
    allowDeepSearch,
    clarificationState,
    requiresHumanReview,
    sourceUrls,
    materialItems,
  };
}
