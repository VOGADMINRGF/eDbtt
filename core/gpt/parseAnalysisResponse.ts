// core/gpt/parseAnalysisResponse.ts
import { AnyAnalysisSchema, AnyAnalysis } from "./schemas";
import parseJsonOrThrow from "../utils/jsonRepair";

/** Standard: Strikter JSON-Parser für unsere AnyAnalysis-Union */
export function parseAnalysisOrThrow(payload: string): AnyAnalysis {
  const data = parseJsonOrThrow<unknown>(payload);
  const res = AnyAnalysisSchema.safeParse(data);
  if (!res.success) {
    const issues = res.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Analysis schema validation failed: ${issues}`);
  }
  return res.data;
}

/** Legacy: sehr einfache Freitext-Extraktion (optional, falls benötigt) */
export interface ParsedFreeText {
  topics: { name: string; confidence?: number }[];
  level: "kommunal" | "regional" | "national" | "eu" | "g7" | "nato" | "unklar";
  statements: string[];
  context: "bestehend" | "neu" | "unklar";
  suggestions: string[];
}

export function parseLegacyFreeText(gptOutput: string): ParsedFreeText {
  const lines = gptOutput.split("\n").map(l => l.trim()).filter(Boolean);
  const topicList = [
    "Umwelt & Klima","Bildung","Gesundheit","Sicherheit","Arbeit & Soziales",
    "Mobilität","Demokratie","Migration","Wirtschaft","Digitalisierung",
    "Familie & Kinder","Landwirtschaft","Kultur & Medien","Außenpolitik","Sonstiges"
  ];

  const topics: ParsedFreeText["topics"] = [];
  const statements: string[] = [];
  let level: ParsedFreeText["level"] = "unklar";
  let context: ParsedFreeText["context"] = "unklar";
  const suggestions: string[] = [];

  for (const line of lines) {
    const lo = line.toLowerCase();

    if (lo.startsWith("themen") || lo.includes("themen:")) {
      topicList.forEach((t) => { if (line.includes(t)) topics.push({ name: t }); });
    }

    if (lo.includes("ebene")) {
      if (lo.includes("kommunal")) level = "kommunal";
      else if (lo.includes("regional")) level = "regional";
      else if (lo.includes("national")) level = "national";
      else if (lo.includes("eu")) level = "eu";
      else if (lo.includes("g7")) level = "g7";
      else if (lo.includes("nato")) level = "nato";
    }

    if (/^[1-9]\./.test(line) || lo.includes("?") || lo.includes("sollte")) {
      if (line.length > 20) statements.push(line);
    }

    if (lo.includes("neuer kontext")) context = "neu";
    else if (lo.includes("bestehend")) context = "bestehend";

    if (lo.includes("schlage vor") || lo.includes("du könntest")) {
      suggestions.push(line);
    }
  }

  return { topics, level, statements, context, suggestions };
}
