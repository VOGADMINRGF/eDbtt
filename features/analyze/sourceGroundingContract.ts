export type SourceSupportClass = "document_grounded" | "web_grounded" | "inferred" | "open";

export type SourceGroundingTaskType = "analyze" | "media" | "guided";

export type SourceGroundingInventoryItem = {
  id: string;
  kind:
    | "upload_document"
    | "web_reference"
    | "free_note"
    | "youtube_transcript"
    | "pdf_document"
    | "material_summary";
  label: string;
  text: string | null;
  url: string | null;
  pageRef?: string | null;
  timestampRef?: string | null;
  extractedBy?: string | null;
  extractionStatus?: "full" | "partial" | "none";
};

export type SourceGroundingAudit = {
  taskType: SourceGroundingTaskType;
  sourceInventory: {
    total: number;
    uploadDocuments: number;
    webReferences: number;
    freeNotes: number;
    youtubeTranscripts: number;
    pdfDocuments: number;
    materialSummaries: number;
  };
  materialExtraction: {
    total: number;
    complete: number;
    partial: number;
    none: number;
  };
  documentGroundingPass: {
    required: boolean;
    documentsWithText: number;
    startCoverage: boolean;
    middleCoverage: boolean;
    endCoverage: boolean;
    contextRotRisk: "low" | "medium" | "high";
  };
  externalContextPass: {
    webReferences: number;
    policy: "supplement_only";
  };
  synthesis: {
    documentGroundedClaims: number;
    webGroundedClaims: number;
    inferredClaims: number;
    openClaims: number;
  };
  contradictionAudit: {
    contradictionSignals: string[];
    hasSignal: boolean;
  };
  noSourceBluffing: {
    passed: boolean;
    reason: string | null;
  };
  requiresManualReview: boolean;
};

export type SourceGroundingContext = {
  taskType: SourceGroundingTaskType;
  inventory: SourceGroundingInventoryItem[];
  promptAddon: string;
  auditBaseline: Omit<SourceGroundingAudit, "synthesis" | "contradictionAudit" | "noSourceBluffing" | "requiresManualReview">;
  documentsForMatching: Array<{ id: string; label: string; text: string }>;
  webForMatching: Array<{ id: string; label: string; text: string }>;
};

type SourceGroundingAnalyzeResult = {
  claims?: Array<{ text?: string | null }>;
  notes?: Array<{ text?: string | null }>;
  report?: { keyConflicts?: unknown[] } | null;
};

function asOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeTaskType(mode: unknown): SourceGroundingTaskType {
  const normalized = asOptionalString(typeof mode === "string" ? mode.toLowerCase() : null);
  if (normalized === "media") return "media";
  if (normalized === "guided") return "guided";
  return "analyze";
}

function sanitizeUrl(value: unknown): string | null {
  const raw = asOptionalString(value);
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function pickFirstText(input: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = asOptionalString(input[key]);
    if (value) return value;
  }
  return null;
}

function inferKind(input: Record<string, unknown>, url: string | null): SourceGroundingInventoryItem["kind"] {
  const marker = String(input.kind ?? input.type ?? "").toLowerCase();
  const hasUploadKey = Boolean(
    input.uploadId ||
      input.documentId ||
      input.fileName ||
      input.filename ||
      input.mimeType ||
      input.mimetype,
  );

  if (marker.includes("youtube_transcript")) return "youtube_transcript";
  if (marker.includes("pdf_document")) return "pdf_document";
  if (marker.includes("material_summary")) return "material_summary";

  if (hasUploadKey || marker.includes("upload") || marker.includes("document") || marker.includes("file")) {
    return "upload_document";
  }
  if (url || marker.includes("web") || marker.includes("url") || marker.includes("source")) {
    return "web_reference";
  }
  return "free_note";
}

function sanitizeEvidenceItems(input: unknown): SourceGroundingInventoryItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, 18)
    .map((entry, index): SourceGroundingInventoryItem | null => {
      if (typeof entry === "string") {
        const text = asOptionalString(entry);
        if (!text) return null;
        return {
          id: `note-${index + 1}`,
          kind: "free_note",
          label: `Hinweis ${index + 1}`,
          text,
          url: null,
        };
      }
      if (!entry || typeof entry !== "object") return null;
      const raw = entry as Record<string, unknown>;
      const text = pickFirstText(raw, [
        "text",
        "content",
        "body",
        "excerpt",
        "documentText",
        "snippet",
        "quote",
        "summary",
      ]);
      const url = sanitizeUrl(raw.url ?? raw.sourceUrl ?? raw.href ?? null);
      const label =
        pickFirstText(raw, ["label", "title", "fileName", "filename", "name"]) ??
        (url ? `Webquelle ${index + 1}` : `Quelle ${index + 1}`);
      const kind = inferKind(raw, url);
      if (!text && !url && kind !== "upload_document" && kind !== "pdf_document") return null;
      return {
        id: pickFirstText(raw, ["id", "documentId", "uploadId"]) ?? `${kind}-${index + 1}`,
        kind,
        label,
        text,
        url,
        pageRef: pickFirstText(raw, ["pageRef"]),
        timestampRef: pickFirstText(raw, ["timestampRef"]),
        extractedBy: pickFirstText(raw, ["extractedBy"]),
        extractionStatus:
          raw.extractionStatus === "full" || raw.extractionStatus === "partial" || raw.extractionStatus === "none"
            ? raw.extractionStatus
            : null,
      };
    })
    .filter((item): item is SourceGroundingInventoryItem => Boolean(item));
}

function segment(text: string, from: number, to: number): string {
  return text.slice(Math.max(0, from), Math.max(from, to)).trim();
}

function buildCoverageExcerpts(text: string) {
  const normalized = text.trim();
  if (!normalized) {
    return {
      start: "",
      middle: "",
      end: "",
    };
  }
  const len = normalized.length;
  const chunk = Math.max(140, Math.min(360, Math.floor(len / 3)));
  const start = segment(normalized, 0, chunk);
  const middleCenter = Math.floor(len / 2);
  const middle = segment(normalized, middleCenter - Math.floor(chunk / 2), middleCenter + Math.floor(chunk / 2));
  const end = segment(normalized, len - chunk, len);
  return { start, middle, end };
}

function redactForPrompt(value: string, max = 380): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1)}…`;
}

function buildPromptAddon(params: {
  taskType: SourceGroundingTaskType;
  inventory: SourceGroundingInventoryItem[];
  documents: Array<{ id: string; label: string; text: string }>;
  web: Array<{ id: string; label: string; text: string }>;
}) {
  const lines: string[] = [];
  lines.push("SOURCE ORCHESTRATION CONTRACT (strict):");
  lines.push("1) Source inventory first.");
  lines.push(`Task type: ${params.taskType}.`);
  lines.push("2) Document grounding pass has priority over model memory.");
  lines.push("3) Web context is supplement-only; do not override document evidence silently.");
  lines.push("4) Synthesis must label support as: document_grounded | web_grounded | inferred | open.");
  lines.push("5) Mark contradictions explicitly; do not smooth them away.");
  lines.push("6) No-source-bluffing: if support is missing, keep it open.");

  if (params.documents.length > 0) {
    lines.push("");
    lines.push("DOCUMENT GROUNDING INPUT:");
    params.documents.slice(0, 4).forEach((doc, index) => {
      const excerpts = buildCoverageExcerpts(doc.text);
      lines.push(`- Doc ${index + 1} [${doc.id}] ${doc.label}`);
      lines.push(`  start: ${redactForPrompt(excerpts.start)}`);
      lines.push(`  middle: ${redactForPrompt(excerpts.middle)}`);
      lines.push(`  end: ${redactForPrompt(excerpts.end)}`);
    });
  }

  if (params.web.length > 0) {
    lines.push("");
    lines.push("EXTERNAL CONTEXT (supplement only):");
    params.web.slice(0, 4).forEach((item, index) => {
      lines.push(
        `- Web ${index + 1} [${item.id}] ${item.label}: ${redactForPrompt(item.text)}`,
      );
    });
  }

  if (params.inventory.length > 0) {
    lines.push("");
    lines.push("SOURCE LABELS:");
    params.inventory.slice(0, 8).forEach((item, index) => {
      lines.push(`- S${index + 1}: ${item.kind} · ${item.label}`);
    });
  }

  return lines.join("\n");
}

function collectSourceTextTokens(value: string): Set<string> {
  const stopWords = new Set([
    "und",
    "oder",
    "aber",
    "dass",
    "eine",
    "einer",
    "einem",
    "eines",
    "der",
    "die",
    "das",
    "with",
    "from",
    "this",
    "that",
    "have",
    "been",
  ]);
  const tokens = value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !stopWords.has(token));
  return new Set(tokens.slice(0, 300));
}

function hasTokenOverlap(text: string, pool: Array<{ text: string }>) {
  const claimTokens = collectSourceTextTokens(text);
  if (claimTokens.size === 0) return false;
  for (const item of pool) {
    const sourceTokens = collectSourceTextTokens(item.text);
    let overlap = 0;
    for (const token of claimTokens) {
      if (sourceTokens.has(token)) overlap += 1;
      if (overlap >= 2) return true;
    }
  }
  return false;
}

function collectContradictionSignals(result: SourceGroundingAnalyzeResult): string[] {
  const signals = new Set<string>();
  const reportConflicts = Array.isArray(result.report?.keyConflicts) ? result.report.keyConflicts : [];
  reportConflicts.forEach((entry) => {
    const text = asOptionalString(entry);
    if (text) signals.add(text);
  });

  const noteTexts = Array.isArray(result.notes) ? result.notes.map((item) => asOptionalString(item?.text)) : [];
  noteTexts.forEach((text) => {
    if (!text) return;
    const lowered = text.toLowerCase();
    if (
      lowered.includes("widerspruch") ||
      lowered.includes("konflikt") ||
      lowered.includes("inconsisten") ||
      lowered.includes("contradict")
    ) {
      signals.add(text);
    }
  });
  return Array.from(signals).slice(0, 12);
}

export function buildSourceGroundingContext(input: {
  analysisMode?: unknown;
  evidenceItems?: unknown;
}): SourceGroundingContext {
  const taskType = normalizeTaskType(input.analysisMode);
  const inventory = sanitizeEvidenceItems(input.evidenceItems);
  const documents = inventory
    .filter(
      (item) =>
        (item.kind === "upload_document" ||
          item.kind === "pdf_document" ||
          item.kind === "youtube_transcript" ||
          item.kind === "material_summary") &&
        item.text,
    )
    .map((item) => ({ id: item.id, label: item.label, text: item.text as string }));
  const web = inventory
    .filter((item) => item.kind === "web_reference")
    .map((item) => ({
      id: item.id,
      label: item.label,
      text: item.text ?? item.url ?? item.label,
    }))
    .filter((item) => item.text.trim().length > 0);

  const startCoverage = documents.every((doc) => buildCoverageExcerpts(doc.text).start.length > 0);
  const middleCoverage = documents.every((doc) => buildCoverageExcerpts(doc.text).middle.length > 0);
  const endCoverage = documents.every((doc) => buildCoverageExcerpts(doc.text).end.length > 0);

  const contextRotRisk: "low" | "medium" | "high" =
    documents.length === 0 &&
    inventory.some(
      (item) =>
        item.kind === "upload_document" ||
        item.kind === "pdf_document" ||
        item.kind === "youtube_transcript",
    )
      ? "high"
      : documents.length > 0 && !middleCoverage
        ? "medium"
        : "low";
  const materialItems = inventory.filter((item) =>
    item.kind === "upload_document" ||
    item.kind === "pdf_document" ||
    item.kind === "youtube_transcript" ||
    item.kind === "material_summary",
  );
  const extractionBuckets = materialItems.reduce(
    (acc, item) => {
      const bucket = item.extractionStatus ?? "none";
      acc[bucket] += 1;
      return acc;
    },
    { full: 0, partial: 0, none: 0 },
  );

  return {
    taskType,
    inventory,
    promptAddon: buildPromptAddon({
      taskType,
      inventory,
      documents,
      web,
    }),
    auditBaseline: {
      taskType,
      sourceInventory: {
        total: inventory.length,
        uploadDocuments: inventory.filter((item) => item.kind === "upload_document").length,
        webReferences: inventory.filter((item) => item.kind === "web_reference").length,
        freeNotes: inventory.filter((item) => item.kind === "free_note").length,
        youtubeTranscripts: inventory.filter((item) => item.kind === "youtube_transcript").length,
        pdfDocuments: inventory.filter((item) => item.kind === "pdf_document").length,
        materialSummaries: inventory.filter((item) => item.kind === "material_summary").length,
      },
      materialExtraction: {
        total: materialItems.length,
        complete: extractionBuckets.full,
        partial: extractionBuckets.partial,
        none: extractionBuckets.none,
      },
      documentGroundingPass: {
        required: inventory.some(
          (item) =>
            item.kind === "upload_document" ||
            item.kind === "pdf_document" ||
            item.kind === "youtube_transcript",
        ),
        documentsWithText: documents.length,
        startCoverage,
        middleCoverage,
        endCoverage,
        contextRotRisk,
      },
      externalContextPass: {
        webReferences: web.length,
        policy: "supplement_only",
      },
    },
    documentsForMatching: documents,
    webForMatching: web,
  };
}

export function finalizeSourceGroundingAudit(input: {
  context: SourceGroundingContext;
  result: SourceGroundingAnalyzeResult;
}): SourceGroundingAudit {
  const claims = Array.isArray(input.result.claims) ? input.result.claims : [];
  let documentGroundedClaims = 0;
  let webGroundedClaims = 0;
  let inferredClaims = 0;
  let openClaims = 0;

  claims.forEach((claim) => {
    const text = asOptionalString(claim?.text) ?? "";
    if (!text) {
      openClaims += 1;
      return;
    }
    if (hasTokenOverlap(text, input.context.documentsForMatching)) {
      documentGroundedClaims += 1;
      return;
    }
    if (hasTokenOverlap(text, input.context.webForMatching)) {
      webGroundedClaims += 1;
      return;
    }
    if (
      input.context.documentsForMatching.length > 0 ||
      input.context.webForMatching.length > 0
    ) {
      inferredClaims += 1;
      return;
    }
    openClaims += 1;
  });

  const contradictionSignals = collectContradictionSignals(input.result);
  const hasUploadRequirement = input.context.auditBaseline.documentGroundingPass.required;

  const noSourceBluffingPassed = !hasUploadRequirement || documentGroundedClaims > 0;
  const noSourceBluffingReason = noSourceBluffingPassed
    ? null
    : "uploads_present_but_no_document_grounded_claims";

  const requiresManualReview =
    input.context.auditBaseline.documentGroundingPass.contextRotRisk !== "low" ||
    !noSourceBluffingPassed;

  return {
    ...input.context.auditBaseline,
    synthesis: {
      documentGroundedClaims,
      webGroundedClaims,
      inferredClaims,
      openClaims,
    },
    contradictionAudit: {
      contradictionSignals,
      hasSignal: contradictionSignals.length > 0,
    },
    noSourceBluffing: {
      passed: noSourceBluffingPassed,
      reason: noSourceBluffingReason,
    },
    requiresManualReview,
  };
}
