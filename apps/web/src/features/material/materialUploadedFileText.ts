export type UploadedFileTextExtraction = {
  status: "full" | "none";
  text: string | null;
  extractedBy: "server_file_text" | null;
  providerRequired: boolean;
  blocker: "external_extraction_required" | null;
};

const TEXT_EXTENSIONS = [
  ".txt",
  ".md",
  ".markdown",
  ".csv",
  ".tsv",
  ".json",
  ".xml",
  ".html",
  ".htm",
] as const;

function normalizedFileName(file: Pick<File, "name">) {
  return String(file.name ?? "").trim().toLowerCase();
}

export function isDirectTextUpload(file: Pick<File, "name" | "type">) {
  const mimeType = String(file.type ?? "").trim().toLowerCase();
  if (mimeType.startsWith("text/")) return true;
  if (
    mimeType === "application/json" ||
    mimeType === "application/xml" ||
    mimeType === "application/xhtml+xml"
  ) {
    return true;
  }
  const name = normalizedFileName(file);
  return TEXT_EXTENSIONS.some((extension) => name.endsWith(extension));
}

export function requiresExternalDocumentExtraction(file: Pick<File, "name" | "type">) {
  const mimeType = String(file.type ?? "").trim().toLowerCase();
  const name = normalizedFileName(file);
  return (
    mimeType === "application/pdf" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword" ||
    name.endsWith(".pdf") ||
    name.endsWith(".docx") ||
    name.endsWith(".doc")
  );
}

export async function extractUploadedFileText(file: File): Promise<UploadedFileTextExtraction> {
  if (isDirectTextUpload(file)) {
    const text = (await file.text()).replace(/\u0000/g, "").trim();
    return {
      status: text ? "full" : "none",
      text: text || null,
      extractedBy: text ? "server_file_text" : null,
      providerRequired: false,
      blocker: null,
    };
  }

  if (requiresExternalDocumentExtraction(file)) {
    return {
      status: "none",
      text: null,
      extractedBy: null,
      providerRequired: true,
      blocker: "external_extraction_required",
    };
  }

  return {
    status: "none",
    text: null,
    extractedBy: null,
    providerRequired: false,
    blocker: null,
  };
}
