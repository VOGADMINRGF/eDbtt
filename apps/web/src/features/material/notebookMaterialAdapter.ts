import type {
  MaterialExtractionStatus,
  NormalizedMaterialItem,
} from "@/features/create/materialRouting";

export type NotebookMaterialSourceRef = {
  materialItemId: string;
  kind: "youtube_transcript" | "pdf_document" | "material_summary";
  label: string;
  pageRef: string | null;
  timestampRef: string | null;
  extractedBy: string;
};

export type NotebookMaterialAdapterOutput = {
  provider: "notebooklm";
  extractionStatus: "complete" | "partial" | "none";
  summary: string;
  claims: Array<{ id: string; text: string; sourceRefId: string }>;
  openQuestions: string[];
  sourceRefs: NotebookMaterialSourceRef[];
  coverage: {
    transcriptCoverage: MaterialExtractionStatus;
    pageCoverage: MaterialExtractionStatus;
  };
  evidenceItems: Array<Record<string, unknown>>;
};

type NotebookMaterialAdapterInput = {
  locale: string;
  items: NormalizedMaterialItem[];
  userText?: string | null;
};

function sentenceCase(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized[0]!.toUpperCase() + normalized.slice(1);
}

function summarizeItems(items: NormalizedMaterialItem[]): string {
  const labels = items.map((item) => item.label).slice(0, 3);
  if (labels.length === 0) return "Es wurde Material für die Analyse erkannt.";
  if (labels.length === 1) return `Material erkannt: ${labels[0]}.`;
  if (labels.length === 2) return `Material erkannt: ${labels[0]} und ${labels[1]}.`;
  return `Material erkannt: ${labels[0]}, ${labels[1]} und ${labels[2]}.`;
}

function buildClaimText(item: NormalizedMaterialItem): string {
  const core =
    item.text?.trim() ||
    item.fileName ||
    item.label ||
    item.url ||
    "Materialhinweis";
  return sentenceCase(core.length > 180 ? `${core.slice(0, 177).trim()}…` : core);
}

function toSourceRef(item: NormalizedMaterialItem): NotebookMaterialSourceRef {
  return {
    materialItemId: item.id,
    kind:
      item.kind === "youtube_url"
        ? "youtube_transcript"
        : item.kind === "pdf_document" || item.kind === "upload_document"
          ? "pdf_document"
          : "material_summary",
    label: item.label,
    pageRef: item.pageRef,
    timestampRef: item.timestampRef,
    extractedBy: item.extractedBy ?? "notebooklm_adapter_mock",
  };
}

function resolveCoverage(items: NormalizedMaterialItem[], predicate: (item: NormalizedMaterialItem) => boolean): MaterialExtractionStatus {
  const relevant = items.filter(predicate);
  if (relevant.length === 0) return "none";
  if (relevant.every((item) => item.extractionStatus === "full")) return "full";
  if (relevant.every((item) => item.extractionStatus === "none")) return "none";
  return "partial";
}

function resolveExtractionStatus(items: NormalizedMaterialItem[]): "complete" | "partial" | "none" {
  if (items.length === 0) return "none";
  if (items.every((item) => item.extractionStatus === "full")) return "complete";
  if (items.every((item) => item.extractionStatus === "none")) return "none";
  return "partial";
}

export async function runNotebookMaterialAdapter(
  input: NotebookMaterialAdapterInput,
): Promise<NotebookMaterialAdapterOutput> {
  const relevantItems = input.items.slice(0, 6);
  const sourceRefs = relevantItems.map(toSourceRef);
  const claims = relevantItems.slice(0, 4).map((item, index) => ({
    id: `material-claim-${index + 1}`,
    text: buildClaimText(item),
    sourceRefId: sourceRefs[index]?.materialItemId ?? item.id,
  }));

  const openQuestions = relevantItems
    .filter((item) => item.extractionStatus !== "full")
    .slice(0, 2)
    .map((item) =>
      item.kind === "youtube_url"
        ? `Welche Passage aus ${item.label} soll noch genauer transkribiert werden?`
        : `Welche Seite oder Stelle aus ${item.label} soll noch genauer belegt werden?`,
    );

  if (openQuestions.length === 0 && input.userText?.trim()) {
    openQuestions.push("Welche Aussage aus dem Material ist für deinen Beitrag besonders wichtig?");
  }

  const evidenceItems = [
    ...sourceRefs.map((ref) => ({
      id: `material-ref-${ref.materialItemId}`,
      kind: ref.kind,
      label: ref.label,
      text:
        claims.find((claim) => claim.sourceRefId === ref.materialItemId)?.text ??
        `Materialreferenz: ${ref.label}`,
      pageRef: ref.pageRef,
      timestampRef: ref.timestampRef,
      extractedBy: ref.extractedBy,
      extractionStatus:
        relevantItems.find((item) => item.id === ref.materialItemId)?.extractionStatus ?? "partial",
    })),
    {
      id: "material-summary",
      kind: "material_summary",
      label: "Materialzusammenfassung",
      text: sentenceCase(
        input.userText?.trim()
          ? `${summarizeItems(relevantItems)} Bezug zum Eingabetext: ${input.userText.trim()}`
          : summarizeItems(relevantItems),
      ),
      extractedBy: "notebooklm_adapter_mock",
      extractionStatus: resolveExtractionStatus(relevantItems) === "complete" ? "full" : "partial",
    },
  ];

  return {
    provider: "notebooklm",
    extractionStatus: resolveExtractionStatus(relevantItems),
    summary: evidenceItems[evidenceItems.length - 1]?.text as string,
    claims,
    openQuestions,
    sourceRefs,
    coverage: {
      transcriptCoverage: resolveCoverage(relevantItems, (item) => item.kind === "youtube_url"),
      pageCoverage: resolveCoverage(
        relevantItems,
        (item) => item.kind === "pdf_document" || item.kind === "upload_document",
      ),
    },
    evidenceItems,
  };
}
