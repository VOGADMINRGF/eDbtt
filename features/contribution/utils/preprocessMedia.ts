import { extractTextFromPDF, extractTextFromImage, extractTextFromExcel } from "@/utils/mediaExtractors";

export async function preprocessMedia(files: any[]) {
  const processed = [];
  for (const file of files) {
    let extractedText = "";
    if (file.mimeType?.includes("pdf")) {
      extractedText = await extractTextFromPDF(file.url);
    } else if (file.mimeType?.includes("image")) {
      extractedText = await extractTextFromImage(file.url);
    } else if (file.mimeType?.includes("excel") || file.mimeType?.includes("spreadsheet")) {
      extractedText = await extractTextFromExcel(file.url);
    }
    processed.push({
      ...file,
      extractedText,
      previewUrl: file.previewUrl || file.url
    });
  }
  return processed;
}
