// features/ai/roles/evidence.ts
// Kombi-BEST-Version: V2 bevorzugt (Single & Multi), V1 als Legacy/Fallback.
// Ausgabe: validierte Schemas (EvidenceHypothesis). Für V1 gibt’s zusätzlich eine Legacy-Map.

import { runLLMJson } from "../providers";
import { runOpenAI } from "@features/ai/providers/openai";
import {
  EVIDENCE_SYSTEM,
  EVIDENCE_USER,
  EVIDENCE_MULTI_V2,
  EVIDENCE_V1,
} from "@features/ai/prompts/evidence";
import {
  EvidenceHypothesisSchema,
  type EvidenceHypothesis,
  type AtomicClaim,
  type LegacyEvidenceSlot,
  upgradeLegacyEvidence,
} from "./shared_types";

// ———————————————————————————————————————————————————————————
// V2: Single-Claim — bevorzugter Pfad
// ———————————————————————————————————————————————————————————

export async function makeEvidenceHypotheses(
  claimText: string,
  opts?: { timeoutMs?: number; model?: string }
): Promise<EvidenceHypothesis[]> {
  const { data } = await runLLMJson({
    system: EVIDENCE_SYSTEM,
    user: EVIDENCE_USER({ claim: claimText }),
    model: opts?.model ?? "gpt-4o-mini-json",
    timeoutMs: opts?.timeoutMs ?? 1800,
  });
  const arr = Array.isArray(data) ? data : [];
  return arr.map((x) => EvidenceHypothesisSchema.parse(x));
}

// ———————————————————————————————————————————————————————————
// V2: Multi-Claim — map by canonical_id
// ———————————————————————————————————————————————————————————

export async function makeEvidenceForClaimsV2(
  claims: AtomicClaim[],
  opts?: { timeoutMs?: number; model?: string }
): Promise<Record<string, EvidenceHypothesis[]>> {
  if (!claims.length) return {};

  const items = claims.map((c) => ({
    claim_canonical_id: c.canonical_id,
    claim: c.text,
  }));

  const prompt = EVIDENCE_MULTI_V2.replace("<<<ITEMS>>>", JSON.stringify(items, null, 2));

  const { data } = await runLLMJson({
    system: EVIDENCE_SYSTEM,
    user: prompt,
    model: opts?.model ?? "gpt-4o-mini-json",
    timeoutMs: opts?.timeoutMs ?? 2200,
  });

  const out: Record<string, EvidenceHypothesis[]> = {};
  const rows = Array.isArray((data as any)?.evidence) ? (data as any).evidence : [];
  for (const row of rows) {
    const cid = String(row?.claim_canonical_id || "").trim();
    if (!cid) continue;

    const hints = Array.isArray(row?.hints) ? row.hints : [];
    const parsed = hints
      .map((h: any) =>
        EvidenceHypothesisSchema.safeParse({
          claim_canonical_id: cid,
          source_type: h?.source_type,
          suchquery: String(h?.suchquery ?? h?.query ?? "").trim(),
          erwartete_kennzahl: String(h?.erwartete_kennzahl ?? "").trim(),
          jahr:
            h?.jahr === null || h?.jahr === undefined || h?.jahr === ""
              ? null
              : Number(h?.jahr) || null,
        })
      )
      .filter((r: any) => r.success)
      .map((r: any) => r.data as EvidenceHypothesis);

    if (parsed.length) out[cid] = parsed;
  }

  return out;
}

// ———————————————————————————————————————————————————————————
// V1: Multi-Claim (Legacy) — map by claim text (ASCII keys: query/jahr:string)
// ———————————————————————————————————————————————————————————

export async function makeEvidenceV1(
  claims: AtomicClaim[],
  timeoutMs = 9000
): Promise<{ hints: Record<string, LegacyEvidenceSlot[]> }> {
  if (!claims.length) return { hints: {} };

  const payload = { claims: claims.map((c) => ({ text: c.text })) };
  const prompt = EVIDENCE_V1.replace("<<<CLAIMS>>>", JSON.stringify(payload, null, 2));

  const r = await runOpenAI(prompt, { json: true, timeoutMs });
  if (!r.ok) return { hints: {} };

  let json: any = null;
  try {
    json = JSON.parse(r.text || "{}");
  } catch {
    return { hints: {} };
  }

  const out: Record<string, LegacyEvidenceSlot[]> = {};
  const arr = Array.isArray(json?.evidence) ? json.evidence : [];
  for (const row of arr) {
    const t = String(row?.claim || "").trim();
    if (!t) continue;
    const hs = Array.isArray(row?.hints) ? row.hints : [];
    out[t] = hs
      .map((h: any) => ({
        source_type: h?.source_type,
        query: String(h?.query || "").slice(0, 240),
        erwartete_kennzahl: h?.erwartete_kennzahl ?? null,
        jahr: h?.jahr ?? null, // string|null (legacy)
      }))
      .filter((h) => h.query);
  }
  return { hints: out };
}

// ———————————————————————————————————————————————————————————
// Unified: Multi-Claim Best-Effort — bevorzugt V2, Fallback V1→V2
// returns map by canonical_id (V2 shape), converts V1 via upgradeLegacyEvidence
// ———————————————————————————————————————————————————————————

export async function makeEvidenceForClaims(
  claims: AtomicClaim[],
  opts?: { timeoutMs?: number; model?: string; prefer?: "v2" | "v1" | "auto" }
): Promise<Record<string, EvidenceHypothesis[]>> {
  const prefer = opts?.prefer ?? "auto";

  if (prefer === "v2") {
    return makeEvidenceForClaimsV2(claims, opts);
  }

  if (prefer === "v1") {
    const legacy = await makeEvidenceV1(claims, opts?.timeoutMs ?? 9000);
    const map: Record<string, EvidenceHypothesis[]> = {};
    for (const c of claims) {
      const legacyHints = legacy.hints[c.text] ?? [];
      map[c.canonical_id] = legacyHints
        .map((h) => upgradeLegacyEvidence(h, c.canonical_id))
        .filter(Boolean);
    }
    return map;
  }

  // auto: erst V2, wenn leer → V1 und konvertieren
  const v2 = await makeEvidenceForClaimsV2(claims, opts);
  const hasAny = Object.values(v2).some((arr) => (arr?.length ?? 0) > 0);
  if (hasAny) return v2;

  const legacy = await makeEvidenceV1(claims, opts?.timeoutMs ?? 9000);
  const map: Record<string, EvidenceHypothesis[]> = {};
  for (const c of claims) {
    const legacyHints = legacy.hints[c.text] ?? [];
    map[c.canonical_id] = legacyHints
      .map((h) => upgradeLegacyEvidence(h, c.canonical_id))
      .filter(Boolean);
  }
  return map;
}
