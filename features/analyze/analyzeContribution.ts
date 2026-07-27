import { AnalyzeResultSchema, normalizeDomains } from "./schemas";
import type { AnalyzeResult, StatementRecord } from "./schemas";
import { normalizeStatementRecord } from "./normalizeClaim";
import { ensureDebateFrame } from "./debateFrame";
import { parseJsonLoose } from "./llmJson";
import { computeEditorialAudit } from "./editorialAudit";
import { computeRunReceipt } from "./runReceipt";
import { computeEvidenceGraph } from "./evidenceGraph";
import type { ZodIssue } from "zod";
import {
  callE150Orchestrator,
  OrchestratorNoProviderError,
  OrchestratorAllFailedError,
} from "@features/ai/orchestratorE150";
import { resolveJourneyProfile } from "@features/ai/e150/roleRouting";
import { resolveAiRouteClassification } from "@features/ai/e150/routeClassification";
import {
  deriveTruthGuardContract,
  deriveVerificationLabel,
  type SourceSupport,
  type TruthStatus,
} from "@features/ai/e150/verificationContract";
import {
  normalizePresentationText,
  normalizePresentationTextList,
  runNonMutativePresentationPass,
  type PresentationPassApplyResult,
  type PresentationPassProtectedSnapshot,
} from "@features/ai/e150/presentationPass";
import type { AiPipelineName } from "@core/telemetry/aiUsageTypes";
import { EDITORIAL_DOMAIN_GUIDE } from "./domainLabels";
export type { AnalyzeResult } from "./schemas";

export type AnalyzeInput = {
  text: string;
  locale?: string; // "de" | "en" | ...
  audienceRole?: "citizen" | "staff" | "institution";
  analysisMode?: "analyze" | "media" | "guided";
  journeyHint?: "analyze" | "media" | "guided" | "sealed_factcheck" | "material_grounding";
  routePath?: string;
  sealedFactcheck?: boolean;
  sourceGroundingPromptAddon?: string | null;
  maxClaims?: number;
  pipeline?: AiPipelineName;
  domain?: string;
  domains?: string[];
  contextPackIds?: string[];
  contextPacks?: string[];
  presentationPassEnabled?: boolean;
  runId?: string | null;
  userId?: string | null;
  dossierId?: string | null;
  operationId?: string | null;
  operationType?: string | null;
  requestId?: string | null;
  organizationId?: string | null;
};

// Reduzierte Default-Anzahl, um JSON-Truncation zu vermeiden
const DEFAULT_MAX_CLAIMS = 10;

// --- NEU: Regeln für "kurzer Text" & Minimum Claims ---
const MIN_CLAIMS_NORMAL_TEXT = 3;
const SHORT_TEXT_MAX_CHARS = 160;
const SHORT_TEXT_MAX_WORDS = 22;

function isShortContribution(text: string): boolean {
  const t = (text ?? "").trim();
  if (!t) return true;
  const words = t.split(/\s+/).filter(Boolean).length;
  return t.length <= SHORT_TEXT_MAX_CHARS || words <= SHORT_TEXT_MAX_WORDS;
}

function requiredMinClaims(sourceText: string): number {
  return isShortContribution(sourceText) ? 1 : MIN_CLAIMS_NORMAL_TEXT;
}

// --- ÄNDERN: validateAnalyzeRaw bekommt sourceText und prüft minClaims ---
function validateAnalyzeRaw(rawText: string, sourceText: string): boolean {
  try {
    const parsed = safeParseJson(rawText);
    if (!parsed || typeof parsed !== "object") return false;

    const minClaims = requiredMinClaims(sourceText);
    const claimCount =
      Array.isArray((parsed as any)?.claims)
        ? (parsed as any).claims.filter(
            (c: any) =>
              c &&
              typeof c === "object" &&
              typeof c.text === "string" &&
              c.text.trim().length > 0,
          ).length
        : 0;

    return claimCount >= minClaims;
  } catch {
    return false;
  }
}

// --- NEU: Helper zum "String picken" ---
function pickString(...vals: any[]): string | null {
  for (const v of vals) {
    const normalized = asOptionalString(v);
    if (normalized) return normalized;
  }
  return null;
}

function asOptionalString(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    const normalized = String(value).trim();
    return normalized ? normalized : undefined;
  }
  return undefined;
}

function asRequiredString(value: unknown, fallback = ""): string {
  return asOptionalString(value) ?? fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => asOptionalString(entry))
    .filter((entry): entry is string => Boolean(entry));
}

function formatZodIssues(issues: readonly ZodIssue[]) {
  return issues.map((issue) => ({
    path: issue.path.join("."),
    code: issue.code,
    message: issue.message,
    expected: (issue as any).expected,
    received: (issue as any).received,
  }));
}

// --- NEU: typisierte Sanitizer (lösen deine TS-unknown[] Errors) ---
type NoteT = AnalyzeResult["notes"][number];
type QuestionT = AnalyzeResult["questions"][number];
type KnotT = AnalyzeResult["knots"][number];
type MissingPerspectiveT = AnalyzeResult["missingPerspectives"][number];
type ParticipationCandidateT = AnalyzeResult["participationCandidates"][number];
type RespPathT = NonNullable<AnalyzeResult["responsibilityPaths"]>[number];
type EventualityT = NonNullable<AnalyzeResult["eventualities"]>[number];
type DecisionTreeT = NonNullable<AnalyzeResult["decisionTrees"]>[number];
type ConsequenceT = AnalyzeResult["consequences"]["consequences"][number];
type ResponsibilityT = AnalyzeResult["consequences"]["responsibilities"][number];

const CONSEQUENCE_SCOPES = new Set([
  "local_short",
  "local_long",
  "national",
  "global",
  "systemic",
]);

function sanitizeConsequenceRecord(input: unknown): ConsequenceT | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as any;
  const id = pickString(raw.id);
  const scope = pickString(raw.scope);
  const text = pickString(raw.text, raw.description, raw.label);
  const statementIndex =
    typeof raw.statementIndex === "number" && Number.isInteger(raw.statementIndex) && raw.statementIndex >= 0
      ? raw.statementIndex
      : null;
  if (!id || !scope || !CONSEQUENCE_SCOPES.has(scope) || !text || statementIndex === null) return null;
  const confidence =
    typeof raw.confidence === "number" && raw.confidence >= 0 && raw.confidence <= 1 ? raw.confidence : null;
  return {
    id,
    scope: scope as ConsequenceT["scope"],
    statementIndex,
    text,
    ...(confidence !== null ? { confidence } : {}),
  } as ConsequenceT;
}

function sanitizeResponsibilityRecord(input: unknown): ResponsibilityT | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as any;
  const id = pickString(raw.id);
  const level = pickString(raw.level);
  const text = pickString(raw.text, raw.description, raw.label);
  if (!id || !level || !RESPONSIBILITY_LEVELS.has(level) || !text) return null;
  const actor = pickString(raw.actor);
  const relevance =
    typeof raw.relevance === "number" && raw.relevance >= 0 && raw.relevance <= 1 ? raw.relevance : null;
  return {
    id,
    level: level as ResponsibilityT["level"],
    text,
    ...(actor ? { actor } : {}),
    ...(relevance !== null ? { relevance } : {}),
  } as ResponsibilityT;
}

function sanitizeNotes(input: unknown, max = 6): AnalyzeResult["notes"] {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, max)
    .map((n: any, idx): NoteT | null => {
      if (!n || typeof n !== "object") return null;
      const text = pickString(n.text, n.body, n.content, n.description);
      if (!text) return null;
      const id = pickString(n.id) ?? `note-${idx + 1}`;
      const kind = pickString(n.kind, n.title, n.heading, n.label) ?? null;
      return { id, text, ...(kind !== null ? { kind } : {}) } as NoteT;
    })
    .filter((x): x is NoteT => Boolean(x));
}

function sanitizeQuestions(input: unknown, max = 5): AnalyzeResult["questions"] {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, max)
    .map((q: any, idx): QuestionT | null => {
      if (!q || typeof q !== "object") return null;
      const text = pickString(q.text, q.body, q.content);
      if (!text) return null;
      const id = pickString(q.id) ?? `q-${idx + 1}`;
      const dimension =
        pickString(q.dimension, q.category, q.domain, q.topic, q.kind, q.type) ?? null;
      return { id, text, ...(dimension !== null ? { dimension } : {}) } as QuestionT;
    })
    .filter((x): x is QuestionT => Boolean(x));
}

function sanitizeMissingPerspectives(input: unknown, fallbackFromQuestions: QuestionT[]): AnalyzeResult["missingPerspectives"] {
  if (Array.isArray(input)) {
    return input
      .slice(0, 8)
      .map((p: any, idx): MissingPerspectiveT | null => {
        if (!p || typeof p !== "object") return null;
        const text = pickString(p.text, p.body, p.description);
        if (!text) return null;
        const id = pickString(p.id) ?? `mp-${idx + 1}`;
        const dimension = pickString(p.dimension, p.topic, p.domain, p.kind) ?? undefined;
        return { id, text, ...(dimension ? { dimension } : {}) };
      })
      .filter((x): x is MissingPerspectiveT => Boolean(x));
  }
  // fall back to open questions flagged as potential perspective gaps
  return fallbackFromQuestions
    .filter((q) => /perspektive|bias|luecke|lücke|gap/i.test(q.text))
    .slice(0, 5)
    .map((q, idx) => ({
      id: q.id || `mp-q-${idx + 1}`,
      text: q.text,
      ...(q.dimension ? { dimension: q.dimension } : {}),
    }));
}

function sanitizeParticipationCandidates(
  input: unknown,
  claims: AnalyzeResult["claims"],
): AnalyzeResult["participationCandidates"] {
  if (Array.isArray(input)) {
    const out = input
      .slice(0, 8)
      .map((p: any, idx): ParticipationCandidateT | null => {
        if (!p || typeof p !== "object") return null;
        const text = pickString(p.text, p.statement, p.title, p.label);
        if (!text) return null;
        const id = pickString(p.id) ?? `pc-${idx + 1}`;
        const rationale = pickString(p.rationale, p.reason, p.body, p.description) ?? undefined;
        const stanceRaw = pickString(p.stance);
        const stance =
          stanceRaw === "pro" || stanceRaw === "neutral" || stanceRaw === "contra"
            ? stanceRaw
            : undefined;
        const dimension = pickString(p.dimension, p.domain, p.topic) ?? undefined;
        return {
          id,
          text,
          ...(rationale ? { rationale } : {}),
          ...(stance ? { stance } : {}),
          ...(dimension ? { dimension } : {}),
        };
      })
      .filter((x): x is ParticipationCandidateT => Boolean(x));
    if (out.length) return out;
  }
  // derive neutral participation candidates from claims when none provided
  return claims.slice(0, 6).map((claim, idx) => ({
    id: `pc-auto-${idx + 1}`,
    text: claim.text,
    stance: claim.stance ?? "neutral",
    dimension: claim.domain ?? claim.topic ?? undefined,
  }));
}

function sanitizeKnots(input: unknown, max = 5): AnalyzeResult["knots"] {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, max)
    .map((k: any, idx): KnotT | null => {
      if (!k || typeof k !== "object") return null;
      const label = pickString(k.label, k.title, k.heading);
      const description = pickString(k.description, k.text, k.body, k.content);
      if (!label || !description) return null;
      const id = pickString(k.id) ?? `knot-${idx + 1}`;
      return { id, label, description } as KnotT;
    })
    .filter((x): x is KnotT => Boolean(x));
}

const RESPONSIBILITY_LEVELS = new Set([
  "municipality",
  "district",
  "state",
  "federal",
  "eu",
  "ngo",
  "private",
  "unknown",
]);

function normRespLevel(x: any) {
  if (typeof x === "string" && RESPONSIBILITY_LEVELS.has(x)) return x;
  return "unknown";
}

function sanitizeResponsibilityPaths(
  input: unknown,
  max = 8,
): AnalyzeResult["responsibilityPaths"] {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, max)
    .map((p: any, idx): RespPathT | null => {
      if (!p || typeof p !== "object") return null;

      const id = pickString(p.id) ?? `path-${idx + 1}`;
      const statementId = pickString(p.statementId, p.rootStatementId, p.claimId);
      if (!statementId) return null;

      const locale = pickString(p.locale) ?? "de";
      const nodesRaw = Array.isArray(p.nodes) ? p.nodes : [];
      const nodes = nodesRaw
        .filter((n: any) => n && typeof n === "object")
        .map((n: any) => {
          const actorKey = asOptionalString(n.actorKey) ?? asOptionalString(n.actor) ?? asOptionalString(n.key);
          const displayName =
            asOptionalString(n.displayName) ?? asOptionalString(n.label) ?? asOptionalString(n.name);
          if (!actorKey || !displayName) return null;
          const relevance =
            typeof n.relevance === "number" && n.relevance >= 0 && n.relevance <= 1 ? n.relevance : undefined;
          return {
            level: normRespLevel(n.level),
            actorKey,
            displayName,
            description: asOptionalString(n.description ?? n.text) ?? null,
            contactUrl: asOptionalString(n.contactUrl ?? n.url) ?? null,
            processHint: asOptionalString(n.processHint ?? n.hint) ?? null,
            ...(typeof relevance === "number" ? { relevance } : {}),
          };
        })
        .filter((n): n is NonNullable<typeof n> => Boolean(n));

      const createdAt = asOptionalString(p.createdAt);
      const updatedAt = asOptionalString(p.updatedAt);
      return {
        id,
        statementId,
        locale,
        nodes,
        ...(createdAt ? { createdAt } : {}),
        ...(updatedAt ? { updatedAt } : {}),
      } as RespPathT;
    })
    .filter((x): x is RespPathT => Boolean(x));
}

/* ---------- Prompt-Bausteine ---------- */

function buildSystemPrompt(locale: string = "de"): string {
  const isDe = locale.toLowerCase().startsWith("de");

  if (isDe) {
  return [
      "Antworte NUR mit dem JSON-Objekt. KEIN Markdown. KEIN zusätzlicher Text.",
      "Wiederhole NICHT den Eingabetext. Gib kein 'sourceText', keine Originalpassagen, keine Zitate zurück.",
      "Du bist eine unparteiische redaktionelle KI für eDebatte.",
      "Du arbeitest entlang der eDebatte-Logik: 1) Check (Behauptung prüfen), 2) Dossier (Quellen, Claims, offene Fragen), 3) Beteiligung (Abstimmung, Umsetzung).",
      "Du erfüllst einen demokratischen Bildungsauftrag:",
      "- Du hilfst Bürger:innen, komplexe Themen zu verstehen, abzuwägen und fundiert zu entscheiden.",
      "- Du gibst KEINE Empfehlung, wie man abstimmen soll.",
      "- Du machst fehlende Perspektiven, Wertkonflikte, Bias oder methodische Defizite sichtbar (in notes/questions).",
      "",
      "WICHTIG:",
      "- Du arbeitest streng textbasiert.",
      "- Du erfindest keine Fakten und keine Inhalte, die im Text nicht angelegt sind.",
      "- Wenn du unsicher bist, lasse keine Keys weg. Gib Unsicherheit über eine Note mit kind 'Unsicherheit' oder confidence=null aus.",
      "",
      EDITORIAL_DOMAIN_GUIDE,
    ].join("\n");
  }

  return [
    "You are an impartial editorial AI for eDebatte.",
    "Follow the eDebatte funnel: 1) Check (claim/theme check), 2) Dossier (sources, claims, open questions), 3) Participation (vote, mandate, follow-up).",
    "Your role is educational:",
    "- Help citizens understand complex issues, weigh pros and cons, and decide in an informed way.",
    "- Do NOT recommend how to vote.",
    "- Surface missing perspectives, value trade-offs, biases or methodological gaps (use notes/questions).",
    "",
    "IMPORTANT:",
    "- Work strictly text-based.",
    "- Do NOT invent facts or content that is not grounded in the input text.",
    "- If you are unsure, keep keys present but signal uncertainty via null/confidence or a note labeled 'uncertainty'.",
    "",
    EDITORIAL_DOMAIN_GUIDE,
  ].join("\n");
}

function buildModeSpecificPromptNote(
  analysisMode: AnalyzeInput["analysisMode"],
  locale: string,
): string[] {
  const mode = analysisMode ?? "analyze";
  const isDe = locale.toLowerCase().startsWith("de");
  if (isDe) {
    if (mode === "media") {
      return [
        "MODUS: Für Bericht nutzen.",
        "- Originaltext unverändert lassen und nicht journalistisch umschreiben.",
        "- Ergänze nur Prüfstellen, Faktencheck-Hinweise, Recherchelücken und kontextrelevante Rückfragen.",
        "- Konflikte und Unsicherheiten klar markieren, aber ohne Abstimmungsaufruf.",
      ];
    }
    if (mode === "guided") {
      return [
        "MODUS: Thema gemeinsam erarbeiten.",
        "- Priorisiere klärende Rückfragen und nächsten sinnvollen Arbeitsschritt.",
        "- Formuliere offene Punkte so, dass ein iterativer Dossier-Prozess möglich wird.",
        "- Fokus auf Konfliktlinien, Akteure, Quellenbedarf und konkrete Folgefragen.",
      ];
    }
    return [
      "MODUS: Beitrag analysieren.",
      "- Priorisiere Themenstruktur, Standpunkte, Spannungen und offene Fragen.",
      "- Zeige mögliche Anknüpfungen zu bestehendem Kontext, ohne Auto-Zuordnung oder Auto-Publish.",
    ];
  }

  if (mode === "media") {
    return [
      "MODE: Prepare for report usage.",
      "- Preserve the original text and do not rewrite it into journalistic prose.",
      "- Add verification points, fact-check hints, research gaps, and contextual follow-up questions only.",
    ];
  }
  if (mode === "guided") {
    return [
      "MODE: Co-develop the topic.",
      "- Prioritize clarifying questions and the next practical work step.",
      "- Surface conflict lines, actors, source needs, and unresolved points for iterative dossier work.",
    ];
  }
  return [
    "MODE: Analyze contribution.",
    "- Prioritize topic structure, stances, tensions, and open questions.",
    "- Suggest contextual anchoring without auto-linking or auto-publish behavior.",
  ];
}

function buildUserPrompt(
  text: string,
  locale: string = "de",
  maxClaims: number = DEFAULT_MAX_CLAIMS,
  analysisMode: AnalyzeInput["analysisMode"] = "analyze",
  sourceGroundingPromptAddon?: string | null,
): string {
  const isDe = locale.toLowerCase().startsWith("de");
  const modeNotes = buildModeSpecificPromptNote(analysisMode, locale);
  const groundingNotes = asOptionalString(sourceGroundingPromptAddon);

  if (isDe) {
    return [
      "AUFGABE:",
      "Antworte NUR mit dem JSON-Objekt. KEIN Markdown. KEIN zusätzlicher Text.",
      "Das JSON muss exakt dem unten stehenden Schema entsprechen; jede Eigenschaft ist immer vorhanden.",
      "Wenn du zu einem Feld nichts beitragen kannst, nutze null oder [] – lass Felder nicht weg.",
      "Für normale Beiträge benötigen wir mindestens 3 Claims; sehr kurze Texte (≤160 Zeichen oder ≤22 Wörter) dürfen nur 1–3 Claims enthalten.",
      "Das Feld 'sourceText' darf enthalten sein, sollte aber standardmäßig null sein, da wir den Beitrag nicht erneut wiederholen.",
      "Wiederhole NICHT den Eingabetext. Gib keine Originalpassagen oder Zitate zurück.",
      `1) Zerlege den Beitrag in maximal ${maxClaims} atomare Aussagen (Claims, hartes Limit 10). Jede Aussage:`,
      "   - ist ein einzelner, prüfbarer Satz;",
      "   - hat genau eine Kernforderung oder Behauptung;",
      "   - ist so formuliert, dass man später zustimmen oder ablehnen kann.",
      "   - ist nach Möglichkeit positiv und konstruktiv formuliert (z.B. „X sollte eingeführt werden“ statt „X wird abgelehnt“).",
      "   - vermeidet Dopplungen: eng verwandte Inhalte und Kontexte fasst du zu EINEM Claim zusammen.",
      "",
      "   Ziel: eher 3–8 gut unterscheidbare Kern-Claims statt sehr vieler ähnlicher Aussagen.",
      "",
      "2) Für jeden Claim bestimmst du zusätzlich (sofern möglich):",
      '   - title: sehr kurzer Oberbegriff (max. 6–8 Wörter), z.B. „Stufe 4 als Tierwohl-Standard“.',
      "   - topic: 1–3 Stichworte als Thema (z.B. „Tierwohl“, „Mieten“, „Migration“).",
      '   - responsibility: grobe Zuständigkeit, z.B. "EU", "Bund", "Land", "Kommune", "privat", "unbestimmt".',
      "     Wenn die Ebene unklar ist, nutze unbestimmt (Key immer vorhanden).",
      "   - stance: pro | contra | neutral (bezogen auf den Claim im Beitrag).",
      "   - importance: 1–5 (Wichtigkeit aus Sicht des Beitrags).",
      "   - domain/domains: redaktionelle Einordnung als Taxonomie-Keys (siehe Liste).",
      "",
      "   Domains: nutze Taxonomie-Keys (z.B. gesellschaft, nachbarschaft, aussenbeziehungen_eu, klima_umwelt).",
      '   Wenn mehrere passen: domains als Array (z.B. ["gesellschaft","aussenbeziehungen_nachbarlaender"]) und domain = erstes Element.',
      "",
      "3) Kontext-Notizen (mindestens 2, maximal 6):",
      "   - Erkenne thematische Abschnitte im Beitrag und fasse sie als `notes` zusammen.",
      "   - Jede Note: { id, kind, text } – kind ist ein kurzer Label wie „Faktenlage“, „Beispiel“, „Emotion“. Text ist ein prägnanter Absatz aus dem Beitrag bzw. eine saubere Paraphrase.",
      "",
      "4) Fragen zum Weiterdenken (2–5 Einträge, hartes Limit 5):",
      "   - Zeige Lücken oder Prüf-Aufgaben auf (z.B. „Welche Kosten entstehen dadurch?“).",
      "   - Markiere fehlende Perspektiven, Wertkonflikte oder Bias explizit als Fragen, falls im Text offen.",
      "   - Jede Frage: { id, text, dimension } – dimension benennt das Themenfeld („Finanzen“, „Recht“, „Betroffene“).",
      "",
      "5) Fehlende Perspektiven (1–8, hartes Limit 8):",
      "   - Liste Perspektiven/Bias/Gaps als { id, text, dimension? } – klar, knapp, neutral.",
      "",
      "6) Thematische Knoten / Schwerpunkte (mindestens 1, maximal 5):",
      "   - Zeige Spannungsfelder oder harte Zielkonflikte.",
      "   - Jeder Knoten: { id, label, description } – label kurz (z.B. „Tierwohl vs. Kosten“), description mit 1–2 Sätzen.",
      "",
      "   Wichtig: Erfinde keine Inhalte – nur was im Beitrag angelegt ist.",
      "",
      "7) Beteiligungs-Vorlagen (2–8):",
      "   - Neutrale Statements, die abstimmbar wären: { id, text, rationale?, stance?, dimension? }.",
      "   - Keine Wahlempfehlung, keine Abstimmungsaufforderung; nur Optionen sichtbar machen.",
      "",
      "8) Eventualitäten & Entscheidungsbäume (Part08, falls im Text Hinweise enthalten sind):",
      "   - Baue für jede relevante Aussage einen DecisionTree mit den drei Optionen pro/neutral/contra.",
      "   - DecisionTree: { rootStatementId, createdAt (ISO), options: { pro, neutral?, contra } }.",
      "   - Jede Option ist ein EventualityNode: { id, statementId, label, narrative, stance, consequences[], responsibilities[], children[] }.",
      "   - Konsequenz (ConsequenceRecord): { id, scope, statementIndex, text, confidence? }.",
      "     scope ∈ local_short | local_long | national | global | systemic.",
      "   - Zustaendigkeit (ResponsibilityRecord): { id, level, actor?, text, relevance? }.",
      "     level ∈ municipality | district | state | federal | eu | ngo | private | unknown.",
      "   - Konsequenzen spiegeln regionale Tragweiten (local_short, local_long, national, global, systemic) wider; Zuständigkeiten nutzen Part06/10-Level.",
      "   - Zusätzliche What-if-Hinweise, die nicht direkt in die drei Optionen passen, gehen in `eventualities` (freistehende EventualityNodes).",
      "   - Wenn es keine Hinweise auf Eventualitäten gibt, liefere leere Arrays für decisionTrees/eventualities.",
      "",
      "9) Begrenze alle Listen strikt: claims ≤ 10, notes ≤ 6, questions ≤ 5, missingPerspectives ≤ 8, knots ≤ 5, participationCandidates ≤ 8, consequences/responsibilities ≤ 8 Einträge.",
      "",
      "10) Gib das Ergebnis ausschließlich als JSON (keine ```-Blöcke), alle Keys vorhanden, fehlende Inhalte = null oder [].",
      "",
      '   }',
      "",
      "11) Do NOT echo the input text. Keep sourceText null unless we explicitly ask you to quote the contribution.",
      "",
      "12) Antworte NUR mit JSON – keine Erklärungen, keine Kommentare, keine Markdown-Formatierung. Beende alle Objekte und Arrays vollständig.",
      "",
      ...modeNotes,
      ...(groundingNotes ? ["", groundingNotes] : []),
      "",
      "BEITRAG:",
      text,
    ].join("\n");
  }

    return [
      "TASK:",
      "Respond ONLY with the JSON object. NO Markdown. NO extra text.",
      "Do NOT echo the input. Return EXACT JSON matching the schema below.",
      "Include every key; use null for missing values and [] for empty arrays.",
      "sourceText is allowed but keep it null unless we specifically ask you to repeat the contribution.",
      "Work along the eDebatte funnel: 1) Check (validate claim), 2) Dossier (sources, claims, open questions), 3) Participation (vote, mandate, follow-up).",
      "Surface missing perspectives, value trade-offs, biases or methodological gaps explicitly via notes/questions.",
      "Normal-length contributions require at least 3 claims; very short texts (≤160 characters or ≤22 words) may provide 1–3 claims.",
    `1) Split the contribution into at most ${maxClaims} atomic statements (claims, hard cap 10). Each claim:`,
    "   - is a single, verifiable sentence;",
    "   - contains exactly one actionable demand or assertion;",
    "   - can later receive a pro/neutral/contra vote;",
    "   - avoids duplicates by merging near-identical content.",
    "",
    "   Target 3–8 distinct core claims rather than dozens of small variations.",
    "",
    "2) For each claim also provide (when possible):",
    "   - title: concise label (≤8 words).",
    "   - topic: 1–3 keywords for the topic.",
    '   - responsibility: one of "EU", "Bund", "Land", "Kommune", "privat", "unbestimmt".',
    "     If unclear, use 'unclear' (key must always be present).",
    "   - stance: pro | contra | neutral (with respect to the claim as expressed in the text).",
    "   - importance: 1–5 (importance from the author/text perspective).",
    "   - domain/domains: editorial classification using taxonomy keys (see list).",
    "",
    "   Editorial domain taxonomy keys (lowercase, underscore):",
    "   gesellschaft | nachbarschaft | aussenbeziehungen_nachbarlaender | aussenbeziehungen_eu |",
    "   innenpolitik | wirtschaft | bildung | gesundheit | sicherheit | klima_umwelt | digitales |",
    "   infrastruktur | justiz | kultur_medien | sonstiges",
    "",
    "   Short definitions (important):",
    "   - gesellschaft: social cohesion, participation, welfare, equality, integration.",
    "   - nachbarschaft: immediate neighborhood / local community / housing environment.",
    "   - aussenbeziehungen_nachbarlaender: relations with specific neighboring countries (not generic EU).",
    "   - aussenbeziehungen_eu: EU institutions, EU law, EU programs/regulations.",
    "",
    '   If multiple apply: set domains as an array (e.g. ["gesellschaft","aussenbeziehungen_nachbarlaender"])',
    "   and domain as the primary domain (first element).",
    "",
    "3) Context notes (≥2, ≤6):",
    "   - { id, kind, text } with kind such as FACTS / EXAMPLE / MOTIVATION.",
    "",
    "4) Critical questions (2–5 items, hard cap 5):",
    "   - highlight gaps or checks citizens should raise; payload { id, dimension, text }.",
    "   - call out missing perspectives, value conflicts or bias as questions when relevant.",
    "",
    "5) Missing perspectives (1–8):",
    "   - neutral list of gaps/bias: { id, text, dimension? }.",
    "",
    "6) Knots / topic hotspots (≥1, ≤5):",
    "   - describe tensions/trade-offs in 1–2 sentences.",
    "   - stay strictly grounded in the provided text (never invent facts).",
    "",
    "7) Participation candidates (2–8):",
    "   - neutral, vote-ready statements: { id, text, rationale?, stance?, dimension? }.",
    "   - never recommend how to vote.",
    "",
    "8) Eventualities & Decision Trees (Part08, optional but preferred when hints exist):",
    "   - Build `decisionTrees` for each vote-relevant claim with options pro/neutral/contra.",
    "   - Each tree: { rootStatementId, createdAt (ISO string), options: { pro, neutral?, contra } }.",
    "   - Each option is an EventualityNode describing the narrative, consequences[], responsibilities[], and child branches.",
    "   - ConsequenceRecord: { id, scope, statementIndex, text, confidence? }.",
    "     scope ∈ local_short | local_long | national | global | systemic.",
    "   - ResponsibilityRecord: { id, level, actor?, text, relevance? }.",
    "     level ∈ municipality | district | state | federal | eu | ngo | private | unknown.",
    "   - Additional what-if branches outside the triad go into `eventualities` (array of EventualityNodes).",
    "   - Use empty arrays when the source text contains no scenario information.",
    "",
    "9) Strict limits for all lists: claims ≤ 10, notes ≤ 6, questions ≤ 5, missingPerspectives ≤ 8, knots ≤ 5, participationCandidates ≤ 8, consequences/responsibilities ≤ 8 items each.",
    "",
    "10) Return ONLY raw JSON (no markdown fences), all keys present; missing data = null or [].",
    "",
    ...modeNotes,
    "",
      '   }',
      "",
      "11) Do NOT echo the input text. Keep sourceText null unless we explicitly ask you to quote the contribution.",
    "",
    "12) Output must be JSON only – no commentary, no Markdown, no trailing text. Close all objects and arrays.",
    "",
    ...(groundingNotes ? [groundingNotes, ""] : []),
    "CONTRIBUTION:",
    text,
  ].join("\n");
}

/* ---------- Hauptfunktion ---------- */

export type AnalyzeResultWithMeta = AnalyzeResult & {
  _meta?: {
    provider?: string;
    model?: string;
    durationMs?: number;
    tokensInput?: number;
    tokensOutput?: number;
    costEur?: number;
    pipeline?: AiPipelineName;
    contributionId?: string;
    eventualitiesReviewed?: boolean;
    eventualitiesReviewedAt?: string | null;
    providerMatrix?: import("@features/ai/orchestratorE150").ProviderMatrixEntry[];
    journeyProfile?: "analyze" | "media" | "guided" | "sealed_factcheck" | "material_grounding";
    lane?: "standard" | "sealed_factcheck" | "material_grounding";
    roleProviderMapping?: {
      primary: Record<string, readonly ("openai" | "anthropic" | "mistral" | "gemini" | "ari")[]>;
      secondary: Record<string, readonly ("openai" | "anthropic" | "mistral" | "gemini" | "ari")[]>;
      fallback: readonly ("openai" | "anthropic" | "mistral" | "gemini" | "ari")[];
      openAiRoles: readonly ("fallback" | "presentation_pass")[];
    };
    fallbackUsed?: boolean;
    disagreement?: {
      present: boolean;
      insufficientIndependentSuccess?: boolean;
      specialistAgreementScore?: number;
      specialistAgreement?: "high" | "mixed" | "low";
      missingSpecialists?: ("openai" | "anthropic" | "mistral" | "gemini" | "ari")[];
      successfulProviders: ("openai" | "anthropic" | "mistral" | "gemini" | "ari")[];
      failedProviders: ("openai" | "anthropic" | "mistral" | "gemini" | "ari")[];
      fallbackReliance?: "none" | "full";
      fallbackRelianceScore?: number;
      coverage?: {
        requiredPrimary: number;
        successfulPrimary: number;
        missingPrimary: number;
      };
    };
    confidence?: {
      score: number;
      bucket: "low" | "medium" | "high";
      reasons: string[];
    };
    verificationMode?: "none" | "precheck" | "sealed";
    researchUsed?: "none" | "lite" | "gemini" | "search" | "deep_search";
    sealEligible?: boolean;
    sealGranted?: boolean;
    verificationLabel?: "analysiert" | "geprueft" | "verifiziert";
    truthStatus?: TruthStatus;
    sourceSupport?: SourceSupport;
    sourceStatus?: string;
    reviewRecommended?: boolean;
    noTruthPromotion?: true;
    noAutoGraphPromotion?: true;
    graphSync?: {
      attempted: boolean;
      mode: "disabled";
      noAutoPromote: true;
      reason: string;
    };
    tonePassUsed?: boolean;
    presentationPass?: {
      attempted: boolean;
      enabled: boolean;
      applied: boolean;
      provider: "openai" | null;
      reason:
        | "disabled"
        | "provider_not_allowed"
        | "failed"
        | "no_change"
        | "guard_blocked"
        | "applied";
      nonMutativeGuardPassed: boolean;
      changedFields: string[];
      failure: string | null;
      policy?: {
        provider: "openai";
        role: "presentation_pass";
        nonMutative: true;
        rules: readonly string[];
      } | null;
    };
    routeClassification?: {
      routePath: string;
      routeProfile: "e150_canonical" | "sealed_factcheck" | "legacy_exception" | "diagnostic" | "unknown";
      canonical: boolean;
      notCanonical: boolean;
      legacyExceptionPath: boolean;
      directProviderPath: boolean;
      note: string;
    };
    trace?: { providerUsed?: string | null; jsonCoercion?: "none" | "fence" | "braces" | "backticks" | undefined };
  };
};

export async function analyzeContribution(
  input: AnalyzeInput
): Promise<AnalyzeResultWithMeta> {
  const sourceText = input.text?.trim() ?? "";
  if (!sourceText) {
    throw new Error("analyzeContribution: input.text ist leer");
  }

  const language = (input.locale || "de").toLowerCase();
  const maxClaims =
    typeof input.maxClaims === "number" && input.maxClaims > 0
      ? Math.min(input.maxClaims, DEFAULT_MAX_CLAIMS)
      : DEFAULT_MAX_CLAIMS;
  const journeyProfile = resolveJourneyProfile({
    analysisMode: input.analysisMode ?? "analyze",
    audienceRole: input.audienceRole ?? "citizen",
    pipeline: input.pipeline ?? null,
    routePath: input.routePath ?? null,
    journeyHint: input.journeyHint ?? null,
    sealedFactcheck: input.sealedFactcheck === true,
  });
  const routeClassification = resolveAiRouteClassification(
    input.routePath ?? "/api/contributions/analyze",
  );

  let orchestration;
  try {
    orchestration = await callE150Orchestrator({
      systemPrompt: buildSystemPrompt(language),
      userPrompt: buildUserPrompt(
        sourceText,
        language,
        maxClaims,
        input.analysisMode ?? "analyze",
        input.sourceGroundingPromptAddon ?? null,
      ),
      journey: journeyProfile.journey,
      journeyProfile,
      locale: language,
      audienceRole: input.audienceRole ?? "citizen",
      maxClaims,
      validateRaw: (rawText: string) => validateAnalyzeRaw(rawText, sourceText),
      telemetry: {
        pipeline: input.pipeline ?? "contribution_analyze",
        runId: input.runId ?? null,
        userId: input.userId ?? null,
        dossierId: input.dossierId ?? null,
        operationId: input.operationId ?? null,
        operationType: input.operationType ?? null,
        requestId: input.requestId ?? null,
        organizationId: input.organizationId ?? null,
      },
    });
  } catch (err) {
    if (err instanceof OrchestratorNoProviderError || (err as any)?.code === "NO_ANALYZE_PROVIDER") {
      const e: any = new Error(
        "AnalyzeContribution: Kein KI-Provider konfiguriert. Bitte wende dich an das eDebatte-Team.",
      );
      e.code = "NO_ANALYZE_PROVIDER";
e.meta = (err as any)?.meta ?? null;
throw e;
    }
    if (err instanceof OrchestratorAllFailedError || (err as any)?.code === "ANALYZE_PROVIDER_FAILED") {
      const failures = (err as OrchestratorAllFailedError)?.meta?.failedProviders ?? [];
      const allBadJson = failures.length > 0 && failures.every((f) => f.errorKind === "BAD_JSON");
      const code = allBadJson ? "BAD_JSON" : "ANALYZE_PROVIDER_FAILED";
      const e: any = new Error(
        allBadJson
          ? "AnalyzeContribution: KI-Antworten waren nicht valide JSON. Bitte erneut versuchen."
          : "AnalyzeContribution: Alle verfügbaren KI-Provider haben für diese Anfrage fehlgeschlagen.",
      );
      e.code = code;
      e.meta = (err as any)?.meta ?? null;
      throw e;
    }
    throw err;
  }

  const rawText = orchestration.rawText;

  let raw: any = orchestration.best.parsed;
  let jsonCoercion: "none" | "fence" | "braces" | "backticks" | undefined = "none";
  if (!raw) {
    try {
      let cleaned = rawText.trim();

      if (cleaned.startsWith("```")) {
        const firstNewline = cleaned.indexOf("\n");
        if (firstNewline !== -1) {
          cleaned = cleaned.slice(firstNewline + 1);
        }
        const lastFence = cleaned.lastIndexOf("```");
        if (lastFence !== -1) {
          cleaned = cleaned.slice(0, lastFence);
          jsonCoercion = "fence";
        }
        cleaned = cleaned.trim();
      }

      // strict parse first
      raw = safeParseJson(cleaned);
      if (!raw) {
        const loose = parseJsonLoose(rawText, AnalyzeResultSchema);
        if (loose.ok) {
          raw = loose.value;
          if (/```/.test(rawText)) jsonCoercion = "fence";
          else if (/`/.test(rawText)) jsonCoercion = "backticks";
          else jsonCoercion = "braces";
        }
      }
    } catch (err) {
      console.error("[analyzeContribution] JSON-Parse-Fehler:", err, rawText);
      throw new Error(
        "AnalyzeContribution: KI-Antwort war kein gültiges JSON. Bitte später erneut versuchen."
      );
    }
  }

  const rawClaims: unknown[] = Array.isArray(raw?.claims)
    ? raw.claims.slice(0, maxClaims)
    : [];
  const rawNotes: unknown = raw?.notes;
  const rawQuestions: unknown = raw?.questions;
  const rawMissingPerspectives: unknown = (raw as any)?.missingPerspectives ?? (raw as any)?.missingVoices;
  const rawKnots: unknown = raw?.knots;
  const rawEventualities: unknown = raw?.eventualities;
  const rawDecisionTrees: unknown = raw?.decisionTrees;
  const rawParticipationCandidates: unknown = (raw as any)?.participationCandidates;
  const rawConsequenceBundle = raw?.consequences;
  const rawResponsibilityPaths: unknown = raw?.responsibilityPaths;
  const rawImpactAndResponsibility = raw?.impactAndResponsibility;
  const rawReport = raw?.report;

  const normalizedRawClaims: StatementRecord[] = rawClaims
    .map((c: any, idx: number) =>
      normalizeStatementRecord(c, { fallbackId: `claim-${idx + 1}` })
    )
    .filter(
      (c: StatementRecord | null): c is StatementRecord => c !== null
    );

  const normalizedClaimsWithDomains: StatementRecord[] = normalizedRawClaims.map((c) => {
    const { domain, domains } = normalizeDomains((c as any)?.domain, (c as any)?.domains);
    const withDomains = {
      ...c,
      domain,
      domains,
    } as StatementRecord;
    return {
      ...withDomains,
      debateFrame: ensureDebateFrame(withDomains),
    };
  });

  const notes = sanitizeNotes(rawNotes, 6);
  const questions = sanitizeQuestions(rawQuestions, 5);
  const missingPerspectives = sanitizeMissingPerspectives(rawMissingPerspectives, questions);
  const knots = sanitizeKnots(rawKnots, 5);
  const responsibilityPaths = sanitizeResponsibilityPaths(rawResponsibilityPaths, 8);
  const eventualities = sanitizeEventualities(rawEventualities);
  const decisionTrees = sanitizeDecisionTrees(rawDecisionTrees);
  const participationCandidates = sanitizeParticipationCandidates(rawParticipationCandidates, normalizedClaimsWithDomains);

  let parsed = AnalyzeResultSchema.safeParse({
    mode: "E150",
    sourceText,
    language,
    claims: normalizedClaimsWithDomains,
    notes,
    questions,
    missingPerspectives,
    findings: [],
    knots,
    consequences: ensureConsequenceBundle(rawConsequenceBundle),
    responsibilityPaths,
    eventualities,
    decisionTrees,
    impactAndResponsibility: ensureImpactAndResponsibility(rawImpactAndResponsibility),
    participationCandidates,
    report: ensureReport(rawReport),
  } satisfies AnalyzeResult);

  if (!parsed.success) {
    console.error(
      "[analyzeContribution] Zod-Validierung fehlgeschlagen:",
      formatZodIssues(parsed.error.issues),
    );
    // Fallback: try loose JSON extraction once more before failing
    const loose = parseJsonLoose(rawText, AnalyzeResultSchema);
    if (loose.ok) {
      const parsedRetry = AnalyzeResultSchema.safeParse({
        mode: "E150",
        sourceText,
        language,
        claims: normalizedClaimsWithDomains,
        notes,
        questions,
        missingPerspectives,
        findings: [],
        knots,
        consequences: ensureConsequenceBundle(rawConsequenceBundle),
        responsibilityPaths,
        eventualities,
        decisionTrees,
        impactAndResponsibility: ensureImpactAndResponsibility(rawImpactAndResponsibility),
        participationCandidates,
        report: ensureReport(rawReport),
      } satisfies AnalyzeResult);
      if (!parsedRetry.success) {
        console.error(
          "[analyzeContribution] Zod-Validierung fehlgeschlagen (retry):",
          formatZodIssues(parsedRetry.error.issues),
        );
        throw new Error(
          "AnalyzeContribution: KI-Antwort entsprach nicht dem erwarteten Schema."
        );
      } else {
        parsed = parsedRetry;
        if (/```/.test(rawText)) jsonCoercion = "fence";
        else if (/`/.test(rawText)) jsonCoercion = "backticks";
        else jsonCoercion = "braces";
      }
    } else {
      console.error(
        "[analyzeContribution] Zod-Validierung fehlgeschlagen:",
        formatZodIssues(parsed.error.issues),
      );
      throw new Error(
        "AnalyzeContribution: KI-Antwort entsprach nicht dem erwarteten Schema."
      );
    }
  }

  const base: AnalyzeResult = {
    ...parsed.data,
    consequences: ensureConsequenceBundle(parsed.data.consequences),
    responsibilityPaths: Array.isArray(parsed.data.responsibilityPaths)
      ? parsed.data.responsibilityPaths
      : [],
    eventualities: parsed.data.eventualities ?? [],
    decisionTrees: parsed.data.decisionTrees ?? [],
    impactAndResponsibility: parsed.data.impactAndResponsibility ?? {
      impacts: [],
      responsibleActors: [],
    },
    report: parsed.data.report,
  };

  let editorialAudit: AnalyzeResult["editorialAudit"] | undefined;
  let evidenceGraph: AnalyzeResult["evidenceGraph"] | undefined;
  let runReceipt: AnalyzeResult["runReceipt"] | undefined;
  let rawSources: any[] = [];
  try {
    rawSources =
      (Array.isArray((raw as any)?.sources) && (raw as any).sources) ||
      (Array.isArray((raw as any)?.citations) && (raw as any).citations) ||
      (Array.isArray((raw as any)?.research?.sources) && (raw as any).research.sources) ||
      (Array.isArray((raw as any)?.research?.results) && (raw as any).research.results) ||
      [];
    const inputDomains =
      Array.isArray((input as any)?.domains) && (input as any).domains.length
        ? (input as any).domains
        : typeof (input as any)?.domain === "string"
          ? [(input as any).domain]
          : undefined;
    let domains: string[] | undefined = inputDomains;
    if (!domains || !domains.length) {
      const set = new Set<string>();
      for (const c of base.claims ?? []) {
        const { domain, domains: ds } = normalizeDomains((c as any)?.domain, (c as any)?.domains);
        if (domain) set.add(domain);
        (ds ?? []).forEach((d) => set.add(d));
      }
      if (set.size) domains = Array.from(set).slice(0, 8);
    }

    const contextPackIds =
      Array.isArray((input as any)?.contextPackIds) && (input as any).contextPackIds.length
        ? (input as any).contextPackIds
        : Array.isArray((input as any)?.contextPacks) && (input as any).contextPacks.length
          ? (input as any).contextPacks
          : undefined;

    editorialAudit = computeEditorialAudit({
      inputText: sourceText,
      sources: rawSources,
      claims: base.claims,
      language: language.startsWith("en") ? "en" : "de",
      enableInternationalContrast: true,
      domains,
      contextPackIds,
    });
    evidenceGraph = computeEvidenceGraph({
      claims: base.claims,
      claimEvidence: editorialAudit?.burdenOfProof?.claimEvidence,
      sources: rawSources,
    });

    const forHash: AnalyzeResult = {
      ...base,
      ...(editorialAudit ? { editorialAudit } : {}),
      ...(evidenceGraph ? { evidenceGraph } : {}),
    };
    runReceipt = computeRunReceipt({
      inputText: sourceText,
      sources: rawSources,
      outputJson: forHash,
      language,
      provider: orchestration.best?.provider,
      model: orchestration.best?.modelName,
      pipelineVersion: "E150+editorialAudit+drift5",
    });
  } catch {
    // ignore
  }

  const metaBase = {
    provider: orchestration.best?.provider,
    model: orchestration.best?.modelName,
    durationMs: orchestration.best?.durationMs,
    tokensInput: orchestration.best?.tokensIn ?? 0,
    tokensOutput: orchestration.best?.tokensOut ?? 0,
    costEur: orchestration.best?.costEur ?? 0,
    pipeline: input.pipeline ?? "contribution_analyze",
    providerMatrix: orchestration.meta.providerMatrix,
    journeyProfile: orchestration.meta.journeyProfile ?? journeyProfile.journey,
    lane: orchestration.meta.lane ?? journeyProfile.lane,
    roleProviderMapping: orchestration.meta.roleProviderMapping ?? {
      primary: journeyProfile.primaryRoles,
      secondary: journeyProfile.secondaryRoles,
      fallback: journeyProfile.fallbackProviders,
      openAiRoles: journeyProfile.openAiRoles,
    },
    fallbackUsed: orchestration.meta.fallbackUsed ?? false,
    disagreement: orchestration.meta.disagreement ?? {
      present: false,
      successfulProviders: [],
      failedProviders: [],
    },
    confidence: orchestration.meta.confidence ?? {
      score: 0.5,
      bucket: "medium",
      reasons: ["fallback_confidence_default"],
    },
    verificationMode:
      orchestration.meta.verificationMode ?? journeyProfile.verificationDefaults.verificationMode,
    researchUsed:
      orchestration.meta.researchUsed ?? journeyProfile.verificationDefaults.researchUsed,
    sealEligible:
      orchestration.meta.sealEligible ?? journeyProfile.verificationDefaults.sealEligible,
    sealGranted:
      orchestration.meta.sealGranted ?? journeyProfile.verificationDefaults.sealGranted,
    verificationLabel: deriveVerificationLabel({
      verificationMode:
        orchestration.meta.verificationMode ??
        journeyProfile.verificationDefaults.verificationMode,
      sealGranted:
        orchestration.meta.sealGranted ?? journeyProfile.verificationDefaults.sealGranted,
    }),
    ...deriveTruthGuardContract({
      lane: orchestration.meta.lane ?? journeyProfile.lane,
      verificationMode:
        orchestration.meta.verificationMode ??
        journeyProfile.verificationDefaults.verificationMode,
      sealGranted:
        orchestration.meta.sealGranted ?? journeyProfile.verificationDefaults.sealGranted,
      fallbackUsed: orchestration.meta.fallbackUsed ?? false,
      disagreement: orchestration.meta.disagreement,
      confidence: orchestration.meta.confidence,
    }),
    routeClassification,
    trace: { providerUsed: orchestration.best?.provider ?? null, jsonCoercion },
  };

  const finalResult: AnalyzeResult = {
    ...base,
    ...(editorialAudit ? { editorialAudit } : {}),
    ...(evidenceGraph ? { evidenceGraph } : {}),
    ...(runReceipt ? { runReceipt } : {}),
  };

  const presentationPassEnabled = resolvePresentationPassEnabled(input);
  const presentationPassResult = runNonMutativePresentationPass({
    provider: "openai",
    enabled: presentationPassEnabled,
    payload: finalResult,
    snapshot: (payload) =>
      buildPresentationProtectedSnapshot({
        result: payload,
        verificationMode: metaBase.verificationMode,
        researchUsed: metaBase.researchUsed,
        sealEligible: metaBase.sealEligible,
        sealGranted: metaBase.sealGranted,
        trust: {
          confidence: metaBase.confidence,
          disagreement: metaBase.disagreement,
        },
        laneMeta: {
          lane: metaBase.lane,
          journeyProfile: metaBase.journeyProfile,
        },
        providerMeta: {
          provider: metaBase.provider,
          model: metaBase.model,
          roleProviderMapping: metaBase.roleProviderMapping,
        },
      }),
    apply: (payload) => applyPresentationToneToAnalyzeResult(payload),
  });
  const presentedResult = presentationPassResult.payload;

  const meta = {
    ...metaBase,
    tonePassUsed: presentationPassResult.meta.applied,
    presentationPass: presentationPassResult.meta,
  };

  return {
    ...presentedResult,
    claims: presentedResult.claims ?? [],
    notes: presentedResult.notes ?? [],
    questions: presentedResult.questions ?? [],
    knots: presentedResult.knots ?? [],
    eventualities: presentedResult.eventualities ?? [],
    decisionTrees: presentedResult.decisionTrees ?? [],
    _meta: meta,
  };
}

function sanitizeDecisionTrees(trees: unknown): AnalyzeResult["decisionTrees"] {
  if (!Array.isArray(trees)) return [];
  return trees
    .map((tree: any, idx: number) => sanitizeDecisionTree(tree, idx))
    .filter((tree): tree is DecisionTreeT => Boolean(tree));
}

function safeParseJson(payload: string): any {
  const trimmed = payload?.trim?.() ?? "";
  const sliceToBraces = () => {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return trimmed.slice(start, end + 1);
    }
    return trimmed;
  };

  try {
    return JSON.parse(trimmed);
  } catch {
    const sliced = sliceToBraces();
    try {
      return JSON.parse(sliced);
    } catch {
      throw new Error("invalid-json");
    }
  }
}

function resolvePresentationPassEnabled(input: AnalyzeInput): boolean {
  if (typeof input.presentationPassEnabled === "boolean") {
    return input.presentationPassEnabled;
  }
  if (process.env.E150_PRESENTATION_PASS_DEFAULT !== "true") {
    return false;
  }
  return input.analysisMode === "media" || input.analysisMode === "guided";
}

function buildPresentationProtectedSnapshot(params: {
  result: AnalyzeResult;
  verificationMode: "none" | "precheck" | "sealed";
  researchUsed: "none" | "lite" | "search" | "deep_search";
  sealEligible: boolean;
  sealGranted: boolean;
  trust: unknown;
  laneMeta?: unknown;
  providerMeta?: unknown;
}): PresentationPassProtectedSnapshot {
  return {
    claims: params.result.claims ?? [],
    evidence: {
      findings: params.result.findings ?? [],
      editorialAudit: params.result.editorialAudit ?? null,
      evidenceGraph: params.result.evidenceGraph ?? null,
      runReceipt: params.result.runReceipt ?? null,
    },
    trust: params.trust,
    verificationMode: params.verificationMode,
    researchUsed: params.researchUsed,
    sealEligible: params.sealEligible,
    sealGranted: params.sealGranted,
    laneMeta: params.laneMeta ?? null,
    providerMeta: params.providerMeta ?? null,
  };
}

function applyPresentationToneToAnalyzeResult(
  result: AnalyzeResult,
): PresentationPassApplyResult<AnalyzeResult> {
  const changedFields: string[] = [];
  let changed = false;

  const reportSummary = result.report?.summary;
  const normalizedSummary =
    typeof reportSummary === "string" ? normalizePresentationText(reportSummary) : reportSummary;
  if (typeof reportSummary === "string" && normalizedSummary !== reportSummary) {
    changed = true;
    changedFields.push("report.summary");
  }

  const keyConflictsBefore = Array.isArray(result.report?.keyConflicts)
    ? result.report.keyConflicts
    : [];
  const keyConflictsAfter = normalizePresentationTextList(keyConflictsBefore);
  if (JSON.stringify(keyConflictsAfter) !== JSON.stringify(keyConflictsBefore)) {
    changed = true;
    changedFields.push("report.keyConflicts");
  }

  const openQuestionsBefore = Array.isArray(result.report?.openQuestions)
    ? result.report.openQuestions
    : [];
  const openQuestionsAfter = normalizePresentationTextList(openQuestionsBefore);
  if (JSON.stringify(openQuestionsAfter) !== JSON.stringify(openQuestionsBefore)) {
    changed = true;
    changedFields.push("report.openQuestions");
  }

  const takeawaysBefore = Array.isArray(result.report?.takeaways)
    ? result.report.takeaways
    : [];
  const takeawaysAfter = normalizePresentationTextList(takeawaysBefore);
  if (JSON.stringify(takeawaysAfter) !== JSON.stringify(takeawaysBefore)) {
    changed = true;
    changedFields.push("report.takeaways");
  }

  const notesBefore = Array.isArray(result.notes) ? result.notes : [];
  const notesAfter = notesBefore.map((note) => {
    const normalized = normalizePresentationText(note.text);
    if (normalized !== note.text) {
      changed = true;
      if (!changedFields.includes("notes.text")) changedFields.push("notes.text");
    }
    return { ...note, text: normalized };
  });

  const questionsBefore = Array.isArray(result.questions) ? result.questions : [];
  const questionsAfter = questionsBefore.map((question) => {
    const normalized = normalizePresentationText(question.text);
    if (normalized !== question.text) {
      changed = true;
      if (!changedFields.includes("questions.text")) changedFields.push("questions.text");
    }
    return { ...question, text: normalized };
  });

  const nextResult: AnalyzeResult = {
    ...result,
    notes: notesAfter,
    questions: questionsAfter,
    report: {
      ...result.report,
      summary: normalizedSummary ?? null,
      keyConflicts: keyConflictsAfter,
      openQuestions: openQuestionsAfter,
      takeaways: takeawaysAfter,
      facts: {
        ...result.report.facts,
      },
    },
  };

  return {
    payload: nextResult,
    changed,
    changedFields,
  };
}

function sanitizeDecisionTree(tree: any, idx: number): DecisionTreeT | null {
  if (!tree || typeof tree !== "object") return null;

  const rootStatementId = pickString(tree.rootStatementId);
  if (!rootStatementId) return null;

  const createdAt = pickString(tree.createdAt) ?? new Date().toISOString();
  const options = tree.options ?? {};

  const pro = sanitizeEventualityNode(options.pro, `dt-${idx + 1}-pro`, rootStatementId);
  const contra = sanitizeEventualityNode(options.contra, `dt-${idx + 1}-contra`, rootStatementId);
  const neutral = options.neutral
    ? sanitizeEventualityNode(options.neutral, `dt-${idx + 1}-neutral`, rootStatementId)
    : null;

  if (!pro || !contra) return null;

  return {
    ...tree,
    rootStatementId,
    createdAt,
    options: {
      pro,
      contra,
      ...(neutral ? { neutral } : {}),
    },
  } as DecisionTreeT;
}

function sanitizeEventualities(nodes: unknown): AnalyzeResult["eventualities"] {
  if (!Array.isArray(nodes)) return [];
  return nodes
    .map((node, idx) => sanitizeEventualityNode(node as any, `ev-${idx + 1}`))
    .filter((x): x is EventualityT => Boolean(x));
}

function sanitizeEventualityNode(
  node: any,
  fallbackId?: string,
  fallbackStatementId?: string,
): EventualityT | null {
  if (!node || typeof node !== "object") return null;

  const id = pickString(node.id) ?? fallbackId ?? null;
  const statementId = pickString(node.statementId) ?? fallbackStatementId ?? null;
  if (!id || !statementId) return null;

  const label = pickString(node.label, node.title) ?? "Eventualität";
  const narrative = pickString(node.narrative, node.text, node.body, node.content) ?? "";

  const stance =
    node.stance === "pro" || node.stance === "neutral" || node.stance === "contra"
      ? node.stance
      : null;

  const consequences = Array.isArray(node.consequences)
    ? node.consequences.map(sanitizeConsequenceRecord).filter((c): c is ConsequenceT => Boolean(c))
    : [];
  const responsibilities = Array.isArray(node.responsibilities)
    ? node.responsibilities.map(sanitizeResponsibilityRecord).filter((r): r is ResponsibilityT => Boolean(r))
    : [];

  const childrenRaw: unknown[] = Array.isArray(node.children) ? node.children : [];
  const children = childrenRaw
    .map((child: unknown, i: number) =>
      sanitizeEventualityNode(child as any, `${id}-c${i + 1}`, statementId),
    )
    .filter((child: EventualityT | null): child is EventualityT => Boolean(child));

  return {
    ...node,
    id,
    statementId,
    label,
    narrative,
    stance,
    consequences,
    responsibilities,
    children,
  } as EventualityT;
}

function ensureConsequenceBundle(value: unknown): AnalyzeResult["consequences"] {
  const v = value && typeof value === "object" ? (value as any) : {};

  const consequences = Array.isArray(v.consequences)
    ? v.consequences.map(sanitizeConsequenceRecord).filter((c): c is ConsequenceT => Boolean(c))
    : [];
  const responsibilities = Array.isArray(v.responsibilities)
    ? v.responsibilities.map(sanitizeResponsibilityRecord).filter((r): r is ResponsibilityT => Boolean(r))
    : [];

  return {
    consequences: consequences.slice(0, 8),
    responsibilities: responsibilities.slice(0, 8),
  };
}

function ensureImpactAndResponsibility(value: unknown): AnalyzeResult["impactAndResponsibility"] {
  const v = value && typeof value === "object" ? (value as any) : {};

  const impacts = Array.isArray(v.impacts)
    ? v.impacts
        .map((item: any) => {
          if (!item || typeof item !== "object") return null;
          const description = asOptionalString(item.description ?? item.text ?? item.body);
          if (!description) return null;
          const type = asRequiredString(item.type ?? item.kind ?? item.label, "unknown");
          const confidence =
            typeof item.confidence === "number" && item.confidence >= 0 && item.confidence <= 1
              ? item.confidence
              : undefined;
          return {
            type,
            description,
            ...(typeof confidence === "number" ? { confidence } : {}),
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
    : [];

  const responsibleActors = Array.isArray(v.responsibleActors)
    ? v.responsibleActors
        .map((item: any) => {
          if (!item || typeof item !== "object") return null;
          const hint = asOptionalString(item.hint ?? item.text ?? item.description ?? item.displayName);
          if (!hint) return null;
          const level = asRequiredString(item.level, "unknown");
          const confidence =
            typeof item.confidence === "number" && item.confidence >= 0 && item.confidence <= 1
              ? item.confidence
              : undefined;
          return {
            level,
            hint,
            ...(typeof confidence === "number" ? { confidence } : {}),
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
    : [];

  return {
    impacts: impacts.slice(0, 12),
    responsibleActors: responsibleActors.slice(0, 12),
  };
}

function ensureReport(value: unknown): AnalyzeResult["report"] {
  const v = value && typeof value === "object" ? (value as any) : {};
  const facts = v.facts && typeof v.facts === "object" ? (v.facts as any) : {};

  return {
    summary: asOptionalString(v.summary) ?? null,
    keyConflicts: asStringArray(v.keyConflicts).slice(0, 12),
    facts: {
      local: asStringArray(facts.local).slice(0, 12),
      international: asStringArray(facts.international).slice(0, 12),
    },
    openQuestions: asStringArray(v.openQuestions).slice(0, 12),
    takeaways: asStringArray(v.takeaways).slice(0, 12),
  };
}
