// features/ai/roles/shared_types.ts
// V1 ⇄ V2 merged model types & schemas (prefer V2; keep V1-compat helpers)
// Last updated: 2025-10-27

import { z } from "zod";

/**
 * VERSION TAG — helpful in logs & meta
 */
export const SHARED_TYPES_VERSION = "v2-merge-2025-10-27" as const;

// ———————————————————————————————————————————————————————————
// Jurisdiction & Source enums
// ———————————————————————————————————————————————————————————

export const JurisdictionLevelSchema = z.enum(["EU", "Bund", "Land", "Kommune"]);
export type JurisdictionLevel = z.infer<typeof JurisdictionLevelSchema>;

export const SourceTypeSchema = z.enum(["amtlich", "presse", "forschung"]);
export type SourceType = z.infer<typeof SourceTypeSchema>;

// ———————————————————————————————————————————————————————————
// Utility: canonicalIdFrom
// ———————————————————————————————————————————————————————————
/**
 * Create a lightweight, stable canonical id for a text.
 */
export function canonicalIdFrom(text: string) {
  const norm = text.normalize("NFKC").toLowerCase().replace(/\p{Diacritic}/gu, "");
  // 32-bit FNV-1a-ish
  let h = 2166136261 >>> 0;
  for (let i = 0; i < norm.length; i++) {
    h ^= norm.charCodeAt(i);
    // h *= 16777619 (via shifts without bigint)
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    h >>>= 0;
  }
  return (h >>> 0).toString(16);
}

// ———————————————————————————————————————————————————————————
// V2 Canonical Schemas (preferred)
// ———————————————————————————————————————————————————————————

// Optional: Zuständigkeit (from V1; kept as optional enrich)
export const ZustaendigkeitSchema = z
  .object({
    ebene: JurisdictionLevelSchema,
    organ: z.string().min(2).max(120),
    begruendung: z.string().min(4).max(400),
  })
  .optional()
  .nullable();
export type Zustaendigkeit = z.infer<typeof ZustaendigkeitSchema>;

// Atomic Claim
export const AtomicClaimSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(4),
  sachverhalt: z.string().min(2).max(4000).nullable().optional(),
  zeitraum: z.string().min(2).max(160).nullable().optional(),
  ort: z.string().min(2).max(160).nullable().optional(),
  ebene: JurisdictionLevelSchema.nullable().optional(),

  // V2 fields
  betroffene: z.array(z.string().min(2).max(80)).max(6).default([]),
  /** Measurement unit or scale, e.g. "%", "Mio. EUR", "Anzahl" */
  messgröße: z.string().min(1).max(80),
  unsicherheiten: z.array(z.string().min(2).max(160)).max(4).default([]),
  language: z.string().min(2).max(5).default("de"),
  readability: z.enum(["A2", "B1", "B2"]).default("B1"),
  canonical_id: z.string().min(8).max(64),

  // Optional enrich (from V1)
  zustandigkeit: ZustaendigkeitSchema, // spelling preserved from V1 field name
});
export type AtomicClaim = z.infer<typeof AtomicClaimSchema>;

// Evidence hypotheses (#3)
export const EvidenceHypothesisSchema = z.object({
  claim_canonical_id: z.string().min(8),
  source_type: SourceTypeSchema,
  suchquery: z.string().min(4),
  erwartete_kennzahl: z.string().min(2).max(120),
  jahr: z.number().int().min(1900).max(2100).nullable(),
});
export type EvidenceHypothesis = z.infer<typeof EvidenceHypothesisSchema>;

// Perspectives (#4)
export const PerspectivesSchema = z.object({
  pro: z.array(z.string().min(6).max(160)).max(3),
  kontra: z.array(z.string().min(6).max(160)).max(3),
  alternative: z.string().min(10).max(220),
});
export type Perspectives = z.infer<typeof PerspectivesSchema>;

// Redaktions-Score (#7)
export const ScoreSchema = z.object({
  präzision: z.number().min(0).max(1),
  prüfbarkeit: z.number().min(0).max(1),
  relevanz: z.number().min(0).max(1),
  lesbarkeit: z.number().min(0).max(1),
  ausgewogenheit: z.number().min(0).max(1),
  begründung: z.object({
    präzision: z.string().min(4).max(140),
    prüfbarkeit: z.string().min(4).max(140),
    relevanz: z.string().min(4).max(140),
    lesbarkeit: z.string().min(4).max(140),
    ausgewogenheit: z.string().min(4).max(140),
  }),
});
export type ScoreSet = z.infer<typeof ScoreSchema>;

// Pipeline meta (#11)
export const PipelineMetaSchema = z.object({
  prompt_version: z.string(),
  model: z.string(),
  orchestrator_commit: z.string(),
  claim_hash: z.string(),
});
export type PipelineMeta = z.infer<typeof PipelineMetaSchema>;

// Quality Gates (#5)
export const QualityGateSchema = z.object({
  json_valid: z.boolean(),
  atomization_complete: z.boolean(),
  readability_b1_b2: z.boolean(),
  jurisdiction_present: z.boolean(),
  evidence_present: z.boolean(),
});
export type QualityGate = z.infer<typeof QualityGateSchema>;

// V2 Orchestration result (single-claim focus)
export const OrchestrationResultSchema = z.object({
  claim: AtomicClaimSchema,
  evidence: z.array(EvidenceHypothesisSchema),
  perspectives: PerspectivesSchema,
  score: ScoreSchema,
  quality: QualityGateSchema,
  meta: PipelineMetaSchema.extend({ version: z.literal(SHARED_TYPES_VERSION) }).optional(),
});
export type OrchestrationResult = z.infer<typeof OrchestrationResultSchema>;

// ———————————————————————————————————————————————————————————
// V1 Compatibility Types (kept for downstreams still on V1 shapes)
// ———————————————————————————————————————————————————————————

export type LegacyEditorialScore = {
  praezision: number; // typically 0..1 or 0..100 in legacy usage
  pruefbarkeit: number;
  relevanz: number;
  lesbarkeit: number;
  ausgewogenheit: number;
  gruende: string[];
  total: number; // often sum or weighted, not strictly defined
};

export type LegacyEvidenceSlot = {
  source_type: "amtlich" | "presse" | "forschung";
  query: string;
  erwartete_kennzahl?: string | null;
  jahr?: string | null; // legacy used string; V2 is number|null
};

export type LegacyPerspectives = { pro: string[]; contra: string[]; alternative: string[] };

export type LegacyAtomicClaim = {
  id: string;
  text: string;
  sachverhalt?: string | null;
  zeitraum?: string | null;
  ort?: string | null;
  ebene?: JurisdictionLevel | null;
  betroffene?: string[];
  messgroesse?: string | null; // legacy ASCII key
  unsicherheiten?: string[];
};

export type LegacyEnrichedClaim = LegacyAtomicClaim & {
  zustandigkeit?: { ebene: JurisdictionLevel; organ: string; begruendung: string } | null;
  evidence: LegacyEvidenceSlot[];
  perspectives: LegacyPerspectives;
  editorial: LegacyEditorialScore;
};

export type LegacyOrchestratorResult = {
  claims: LegacyEnrichedClaim[];
  _meta: {
    ok: boolean;
    tookMs: number;
    model?: string | null;
    prompt_version?: string;
    orchestrator_commit?: string | null;
    fallbackUsed?: boolean;
    steps?: { name: string; ms: number; ok: boolean; note?: string }[];
  };
};

// ———————————————————————————————————————————————————————————
// Upgraders & Mappers (V1 → V2, and V2 → V1 envelope)
// ———————————————————————————————————————————————————————————

/**
 * Upgrade a legacy claim (V1 shape) to V2 AtomicClaim.
 * - Renames messgroesse → messgröße
 * - Fills defaults for readability (B1), language (de)
 * - Derives canonical_id from text if not provided
 * - Coerces jahr to number|null when mapping evidence
 */
export function upgradeLegacyClaim(
  c: LegacyAtomicClaim,
  opts?: { fallbackMessgroesse?: string }
): AtomicClaim {
  const mess = c.messgroesse ?? opts?.fallbackMessgroesse ?? "Anzahl";
  const canonical_id = canonicalIdFrom(c.text || "");
  const enriched: AtomicClaim = {
    id: c.id,
    text: c.text,
    sachverhalt: c.sachverhalt ?? null,
    zeitraum: c.zeitraum ?? null,
    ort: c.ort ?? null,
    ebene: c.ebene ?? null,
    betroffene: c.betroffene ?? [],
    messgröße: mess,
    unsicherheiten: c.unsicherheiten ?? [],
    language: "de",
    readability: "B1",
    canonical_id,
    zustandigkeit: null,
  };
  return AtomicClaimSchema.parse(enriched);
}

export function upgradeLegacyEvidence(e: LegacyEvidenceSlot, claimCanonicalId: string): EvidenceHypothesis {
  return EvidenceHypothesisSchema.parse({
    claim_canonical_id: claimCanonicalId,
    source_type: e.source_type,
    suchquery: e.query,
    erwartete_kennzahl: e.erwartete_kennzahl ?? "",
    jahr: e.jahr == null ? null : (Number(e.jahr) || null),
  });
}

export function upgradeLegacyPerspectives(p: LegacyPerspectives): Perspectives {
  const alternative = p.alternative?.[0] ?? "";
  return PerspectivesSchema.parse({
    pro: (p.pro || []).slice(0, 3),
    kontra: (p.contra || []).slice(0, 3),
    alternative: alternative.length < 10 ? (alternative + (alternative ? "." : "Vorschlag offen.")).padEnd(10, ".") : alternative,
  });
}

export function upgradeLegacyScore(s: LegacyEditorialScore): ScoreSet {
  // Try to normalize into 0..1 range if legacy used 0..100
  const norm = (v: number) => (v > 1 ? Math.max(0, Math.min(1, v / 100)) : Math.max(0, Math.min(1, v)));
  const reasons = (s.gruende ?? []).join("; ");
  return ScoreSchema.parse({
    präzision: norm(s.praezision),
    prüfbarkeit: norm(s.pruefbarkeit),
    relevanz: norm(s.relevanz),
    lesbarkeit: norm(s.lesbarkeit),
    ausgewogenheit: norm(s.ausgewogenheit),
    begründung: {
      präzision: reasons || "Begründung zur Präzision fehlt.",
      prüfbarkeit: reasons || "Begründung zur Prüfbarkeit fehlt.",
      relevanz: reasons || "Begründung zur Relevanz fehlt.",
      lesbarkeit: reasons || "Begründung zur Lesbarkeit fehlt.",
      ausgewogenheit: reasons || "Begründung zur Ausgewogenheit fehlt.",
    },
  });
}

/**
 * Wrap a V2 OrchestrationResult into a V1-like envelope for legacy callers
 * expecting an array of enriched claims + _meta.
 */
export function toLegacyOrchestratorResult(
  r: OrchestrationResult,
  meta?: LegacyOrchestratorResult["_meta"]
): LegacyOrchestratorResult {
  const claim = r.claim;
  const editorial: LegacyEditorialScore = {
    praezision: Math.round(r.score.präzision * 100) / 100,
    pruefbarkeit: Math.round(r.score.prüfbarkeit * 100) / 100,
    relevanz: Math.round(r.score.relevanz * 100) / 100,
    lesbarkeit: Math.round(r.score.lesbarkeit * 100) / 100,
    ausgewogenheit: Math.round(r.score.ausgewogenheit * 100) / 100,
    gruende: Object.values(r.score.begründung),
    total: Math.round(
      (r.score.präzision + r.score.prüfbarkeit + r.score.relevanz + r.score.lesbarkeit + r.score.ausgewogenheit) * 100
    ) / 100,
  };

  const legacyEvidence: LegacyEvidenceSlot[] = r.evidence.map((e) => ({
    source_type: e.source_type,
    query: e.suchquery,
    erwartete_kennzahl: e.erwartete_kennzahl,
    jahr: e.jahr == null ? null : String(e.jahr),
  }));

  const legacyPersp: LegacyPerspectives = {
    pro: r.perspectives.pro,
    contra: r.perspectives.kontra,
    alternative: r.perspectives.alternative ? [r.perspectives.alternative] : [],
  };

  const enriched: LegacyEnrichedClaim = {
    id: claim.id,
    text: claim.text,
    sachverhalt: claim.sachverhalt ?? null,
    zeitraum: claim.zeitraum ?? null,
    ort: claim.ort ?? null,
    ebene: claim.ebene ?? null,
    betroffene: claim.betroffene,
    messgroesse: claim.messgröße,
    unsicherheiten: claim.unsicherheiten,
    zustandigkeit: claim.zustandigkeit ?? null,
    evidence: legacyEvidence,
    perspectives: legacyPersp,
    editorial,
  };

  const _meta: LegacyOrchestratorResult["_meta"] = meta ?? {
    ok: true,
    tookMs: 0,
    model: r.meta?.model ?? undefined,
    prompt_version: r.meta?.prompt_version ?? undefined,
    orchestrator_commit: r.meta?.orchestrator_commit ?? undefined,
    fallbackUsed: false,
    steps: [],
  };

  return { claims: [enriched], _meta };
}

// ———————————————————————————————————————————————————————————
// Builders & Safe Constructors
// ———————————————————————————————————————————————————————————

export function buildAtomicClaim(input: Partial<AtomicClaim> & Pick<AtomicClaim, "id" | "text" | "messgröße">): AtomicClaim {
  const canonical_id = input.canonical_id ?? canonicalIdFrom(input.text);
  return AtomicClaimSchema.parse({
    betroffene: [],
    unsicherheiten: [],
    language: "de",
    readability: "B1",
    ebene: null,
    sachverhalt: null,
    zeitraum: null,
    ort: null,
    zustandigkeit: null,
    ...input,
    canonical_id,
  });
}

// Helpers to type-guard raw data
export function isAtomicClaim(x: unknown): x is AtomicClaim {
  return AtomicClaimSchema.safeParse(x).success;
}
export function isOrchestrationResult(x: unknown): x is OrchestrationResult {
  return OrchestrationResultSchema.safeParse(x).success;
}
