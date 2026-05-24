import type { CreateHandoffDraft } from "@/features/create/createHandoff";
import { detectCreateLinkIntake } from "@/features/create/linkIntake";
import type { NormalizedMaterialItem } from "@/features/create/materialRouting";

export const CREATE_INPUT_CLASSIFICATIONS = [
  "free_text",
  "claim",
  "question_topic",
  "link",
  "document_url",
  "youtube_video_url",
  "material_reference",
  "source_snapshot_reference",
  "dossier_handoff",
] as const;

export type CreateInputClassification =
  (typeof CREATE_INPUT_CLASSIFICATIONS)[number];

function hasQuestionShape(text: string) {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.includes("?")) return true;
  return /^(wie|was|warum|wieso|weshalb|welche|welcher|welches)\b/.test(normalized);
}

function looksLikeClaim(text: string) {
  const normalized = text.trim().toLowerCase();
  if (!normalized || normalized.length < 24) return false;
  if (hasQuestionShape(normalized)) return false;
  return (
    /\b(ist|sind|bleibt|braucht|fehlt|muss|soll|hat|haben|zeigt|belegt|bedeutet)\b/.test(normalized) ||
    /\b(damit|deshalb|daher|folglich)\b/.test(normalized)
  );
}

function materialLooksLikeSourceSnapshot(item: NormalizedMaterialItem) {
  const haystack = [
    item.id,
    item.label,
    item.fileName,
    item.url,
    item.text,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return (
    haystack.includes("source snapshot") ||
    haystack.includes("source-snapshot") ||
    haystack.includes("source_snapshot") ||
    haystack.includes("snapshot-template")
  );
}

function classifyFromUrl(url: string): CreateInputClassification {
  const normalized = url.toLowerCase();
  if (normalized.includes("youtube.com") || normalized.includes("youtu.be")) {
    return "youtube_video_url";
  }
  if (/\.(pdf|doc|docx)(?:$|[?#])/.test(normalized)) {
    return "document_url";
  }
  return "link";
}

export function classifyCreateInput(params: {
  text?: string | null;
  sourceUrls?: string[] | null;
  materialItems?: NormalizedMaterialItem[] | null;
  dossierId?: string | null;
  anlassraumId?: string | null;
}): CreateInputClassification {
  if (params.dossierId || params.anlassraumId) return "dossier_handoff";

  const materialItems = params.materialItems ?? [];
  if (materialItems.some(materialLooksLikeSourceSnapshot)) {
    return "source_snapshot_reference";
  }
  if (materialItems.length > 0) {
    return "material_reference";
  }

  const sourceUrls = (params.sourceUrls ?? []).filter(Boolean);
  if (sourceUrls.length > 0) {
    return classifyFromUrl(sourceUrls[0] ?? "");
  }

  const detection = detectCreateLinkIntake(params.text ?? "");
  if (detection.primaryUrl) {
    return classifyFromUrl(detection.primaryUrl);
  }

  const text = String(params.text ?? "").trim();
  if (!text) return "free_text";
  if (hasQuestionShape(text)) return "question_topic";
  if (looksLikeClaim(text)) return "claim";
  return "free_text";
}

export function classifyCreateHandoffDraft(
  draft: Pick<CreateHandoffDraft, "sourceText" | "sourceGrounding">,
): CreateInputClassification {
  const sourceUrls = draft.sourceGrounding
    .filter((entry) => entry.status === "link_reference" && entry.detail)
    .map((entry) => String(entry.detail));
  const materialItems = draft.sourceGrounding
    .filter((entry) => entry.id.startsWith("material-reference-"))
    .map(
      (entry): NormalizedMaterialItem => ({
        id: entry.id,
        kind: "upload_document",
        label: entry.label,
        url: entry.detail ?? null,
        uploadId: null,
        mimeType: null,
        fileName: entry.label,
        text: entry.detail ?? null,
        pageRef: null,
        timestampRef: null,
        extractedBy: null,
        extractionStatus: "none",
      }),
    );
  return classifyCreateInput({
    text: draft.sourceText,
    sourceUrls,
    materialItems,
  });
}

export function labelCreateInputClassification(
  classification: CreateInputClassification,
): string {
  switch (classification) {
    case "claim":
      return "Behauptung";
    case "question_topic":
      return "Frage oder Thema";
    case "link":
      return "Link";
    case "document_url":
      return "Dokument-Link";
    case "youtube_video_url":
      return "YouTube- oder Video-Link";
    case "material_reference":
      return "Materialhinweis";
    case "source_snapshot_reference":
      return "Source-Snapshot-Hinweis";
    case "dossier_handoff":
      return "Dossier- oder Anlassraum-Handoff";
    case "free_text":
    default:
      return "Freitext";
  }
}
