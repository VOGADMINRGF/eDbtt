import { NextRequest, NextResponse } from "next/server";
import { analyzeContribution } from "@core/gpt/analyzeContribution";
import {
  parseAnalysisOrThrow,
  parseLegacyFreeText,
} from "@core/gpt/parseAnalysisResponse";
import { formatError } from "@core/utils/errors";
import ErrorLogModel from "@/models/ErrorLog";

// Laufzeit/Cache-Hinweise für Vercel Serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Upload-Limits
const MAX_FILES = 5;
const MAX_FILE_SIZE = 15 * 1024 * 1024;
type FileMeta = { filename: string; mime: string; size: number };

function safeJson<T = any>(s: unknown): T | undefined {
  if (typeof s !== "string") return undefined;
  try {
    return JSON.parse(s) as T;
  } catch {
    return undefined;
  }
}

/** Versucht beliebige Analyse-Ergebnisse in ein einheitliches Format zu bringen */
function normalizeAnalysis(analysis: any, fallbackText: string): any {
  // 1) String → striktes JSON (zod) versuchen, sonst Legacy-Freitext
  if (typeof analysis === "string") {
    try {
      const parsed = parseAnalysisOrThrow(analysis);
      return {
        statements: (parsed as any).statements ?? [],
        topics: (parsed as any).topics ?? [],
        level: (parsed as any).level ?? "unklar",
        context: (parsed as any).context ?? "unklar",
        suggestions: (parsed as any).suggestions ?? [],
        language: (parsed as any).language,
        translations: (parsed as any).translations,
      };
    } catch {
      const legacy = parseLegacyFreeText(analysis);
      return {
        statements: legacy.statements,
        topics: legacy.topics,
        level: legacy.level,
        context: legacy.context,
        suggestions: legacy.suggestions,
      };
    }
  }

  // 2) Objekt mit gptRaw → erst gptRaw parsen, Meta übernehmen
  if (analysis && typeof analysis === "object" && "gptRaw" in analysis) {
    const base: any = normalizeAnalysis((analysis as any).gptRaw, fallbackText);
    return {
      ...base,
      language: (analysis as any).originalLanguage ?? base.language,
      translations: (analysis as any).translations ?? base.translations,
    };
  }

  // 3) Bereits strukturiert?
  if (
    analysis &&
    typeof analysis === "object" &&
    "statements" in analysis &&
    "topics" in analysis
  ) {
    return {
      statements: (analysis as any).statements ?? [],
      topics: (analysis as any).topics ?? [],
      level: (analysis as any).level ?? "unklar",
      context: (analysis as any).context ?? "unklar",
      suggestions: (analysis as any).suggestions ?? [],
      language: (analysis as any).language,
      translations: (analysis as any).translations,
    };
  }

  // 4) Fallback: Impact-ähnliche Struktur in Statements übersetzen
  if (
    analysis &&
    typeof analysis === "object" &&
    Array.isArray((analysis as any).items)
  ) {
    const items = (analysis as any).items as Array<{ claim?: string }>;
    const statements = items.map((i) => i.claim).filter(Boolean) as string[];
    return {
      statements,
      topics: (analysis as any).topics ?? [],
      level: (analysis as any).level ?? "unklar",
      context: (analysis as any).context ?? "unklar",
      suggestions: (analysis as any).suggestions ?? [],
    };
  }

  // 5) Letzter Fallback: Minimalstruktur
  return {
    statements: fallbackText ? [fallbackText] : [],
    topics: [],
    level: "unklar",
    context: "unklar",
    suggestions: [],
  };
}

/** Multipart-Helfer: Datei-Metadaten sammeln und .txt inline einbetten */
async function collectMultipart(form: FormData) {
  const text = String(form.get("text") ?? "").trim();
  const userContext = safeJson(form.get("userContext"));

  const files: File[] = [];
  for (const key of ["file", "files", "file[]", "attachments"]) {
    for (const v of form.getAll(key)) if (v instanceof File) files.push(v);
  }

  if (files.length > MAX_FILES) {
    return { error: `Maximal ${MAX_FILES} Dateien erlaubt.` } as const;
  }

  const metas: FileMeta[] = [];
  const inlineTxt: string[] = [];
  const notes: string[] = [];

  for (const f of files) {
    const meta: FileMeta = {
      filename: f.name || "upload",
      mime: f.type || "application/octet-stream",
      size: f.size,
    };

    if (!ALLOWED_MIME.has(meta.mime)) {
      return {
        error: `Nicht erlaubter Dateityp: ${meta.mime} (${meta.filename})`,
      } as const;
    }
    if (meta.size > MAX_FILE_SIZE) {
      return {
        error: `Datei zu groß (${meta.filename}). Limit ${Math.round(MAX_FILE_SIZE / (1024 * 1024))} MB`,
      } as const;
    }

    metas.push(meta);

    if (meta.mime === "text/plain") {
      const ab = await f.arrayBuffer();
      inlineTxt.push(Buffer.from(ab).toString("utf8").slice(0, 40_000));
    } else {
      notes.push(
        `[Anhang: ${meta.filename} • ${meta.mime} • ${Math.round(meta.size / 1024)} KB]`,
      );
    }
  }

  const mergedText = [text, ...inlineTxt, ...notes]
    .filter(Boolean)
    .join("\n\n")
    .trim();

  return { text: mergedText, userContext, files: metas } as const;
}

export async function POST(req: NextRequest) {
  const routePath = "/api/contributions/analyze";

  try {
    const ct = req.headers.get("content-type") || "";

    // ── Multipart (Uploads)
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      const res = await collectMultipart(form);
      if ("error" in res)
        return NextResponse.json({ error: res.error }, { status: 400 });

      const { text, userContext } = res;
      if (!text || text.length < 10)
        return NextResponse.json({ error: "TEXT_TOO_SHORT" }, { status: 400 });

      // analyzeContribution: akzeptiert je nach Implementierung string ODER { text, userContext }
      const analysis = await (async () => {
        try {
          return await (analyzeContribution as any)(text, userContext);
        } catch {
          // Variante (text, ctx)
          return await (analyzeContribution as any)({ text, userContext });
        } // Variante ({ text, ctx })
      })();

      const normalized = normalizeAnalysis(analysis, text);

      return NextResponse.json(
        {
          success: true,
          language: normalized.language,
          statements: normalized.statements,
          topics: normalized.topics,
          level: normalized.level,
          context: normalized.context,
          suggestions: normalized.suggestions,
          translations: normalized.translations,
        },
        { status: 200 },
      );
    }

    // ── JSON-Fallback
    const { text, userContext } = await req.json();
    const cleanText = String(text ?? "").trim();
    if (!cleanText || cleanText.length < 10) {
      return NextResponse.json({ error: "TEXT_TOO_SHORT" }, { status: 400 });
    }

    const analysis = await (async () => {
      try {
        return await (analyzeContribution as any)(cleanText, userContext);
      } catch {
        return await (analyzeContribution as any)({
          text: cleanText,
          userContext,
        });
      }
    })();

    const normalized = normalizeAnalysis(analysis, cleanText);

    return NextResponse.json(
      {
        success: true,
        language: normalized.language,
        statements: normalized.statements,
        topics: normalized.topics,
        level: normalized.level,
        context: normalized.context,
        suggestions: normalized.suggestions,
        translations: normalized.translations,
      },
      { status: 200 },
    );
  } catch (err: any) {
    const formattedError = formatError({
      message: "Analyse fehlgeschlagen",
      code: "ANALYSIS_ERROR",
      cause: err?.message || err,
    });

    try {
      await ErrorLogModel.create({
        ...formattedError,
        path: "/api/contributions/analyze",
        payload: { contentType: req.headers.get("content-type") },
      });
    } catch {
      /* ignore logging failure */
    }

    return NextResponse.json(formattedError, { status: 500 });
  }
}
