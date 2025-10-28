// features/ai/roles/perspectives.ts
// Kombi-BEST-Version: V2 bevorzugt (Single & Multi), V1 als Legacy/Fallback.
// Einheitliche Rückgabe bei Multi: Record<canonical_id, Perspectives>

import { runLLMJson } from "../providers";
import { runOpenAI } from "@features/ai/providers/openai";
import {
  PERSPECTIVES_SYSTEM,
  PERSPECTIVES_USER,
  PERSPECTIVES_MULTI_V2,
  PERSPECTIVES_V1,
} from "@features/ai/prompts/perspectives";
import {
  PerspectivesSchema,
  type Perspectives,
  type AtomicClaim,
  upgradeLegacyPerspectives,
} from "./shared_types";

// ———————————————————————————————————————————————————————————
// V2: Single-Claim – bevorzugter Pfad
// ———————————————————————————————————————————————————————————

export async function buildPerspectives(
  claimText: string,
  opts?: { timeoutMs?: number; model?: string }
): Promise<Perspectives> {
  const { data } = await runLLMJson({
    system: PERSPECTIVES_SYSTEM,
    user: PERSPECTIVES_USER({ claim: claimText }),
    model: opts?.model ?? "gpt-4o-mini-json",
    timeoutMs: opts?.timeoutMs ?? 1800,
  });
  return PerspectivesSchema.parse(data);
}

// ———————————————————————————————————————————————————————————
// V2: Multi-Claim – map by canonical_id
// ———————————————————————————————————————————————————————————

export async function buildPerspectivesForClaimsV2(
  claims: AtomicClaim[],
  opts?: { timeoutMs?: number; model?: string }
): Promise<Record<string, Perspectives>> {
  if (!claims.length) return {};

  const items = claims.map((c) => ({
    claim_canonical_id: c.canonical_id,
    claim: c.text,
  }));

  const prompt = PERSPECTIVES_MULTI_V2.replace("<<<ITEMS>>>", JSON.stringify(items, null, 2));

  const { data } = await runLLMJson({
    system: PERSPECTIVES_SYSTEM,
    user: prompt,
    model: opts?.model ?? "gpt-4o-mini-json",
    timeoutMs: opts?.timeoutMs ?? 2200,
  });

  const out: Record<string, Perspectives> = {};
  const rows = Array.isArray((data as any)?.perspectives) ? (data as any).perspectives : [];
  for (const row of rows) {
    const cid = String(row?.claim_canonical_id || "").trim();
    if (!cid) continue;

    const parsed = PerspectivesSchema.safeParse({
      pro: Array.isArray(row?.pro) ? row.pro.slice(0, 3) : [],
      kontra: Array.isArray(row?.kontra) ? row.kontra.slice(0, 3) : [],
      alternative: typeof row?.alternative === "string" ? row.alternative : "",
    });
    if (parsed.success) out[cid] = parsed.data;
  }

  return out;
}

// ———————————————————————————————————————————————————————————
// V1: Multi-Claim (Legacy) – map by claim text (contra, alternative:string[])
// ———————————————————————————————————————————————————————————

export async function makePerspectivesV1(
  claims: AtomicClaim[],
  timeoutMs = 9000
): Promise<{ views: Record<string, Perspectives> }> {
  if (!claims.length) return { views: {} };

  const payload = { claims: claims.map((c) => ({ text: c.text })) };
  const prompt = PERSPECTIVES_V1.replace("<<<CLAIMS>>>", JSON.stringify(payload, null, 2));

  const r = await runOpenAI(prompt, { json: true, timeoutMs });
  if (!r.ok) return { views: {} };

  let json: any = null;
  try {
    json = JSON.parse(r.text || "{}");
  } catch {
    return { views: {} };
  }

  const out: Record<string, Perspectives> = {};
  const arr = Array.isArray(json?.views) ? json.views : [];

  for (const row of arr) {
    const t = String(row?.claim || "").trim();
    if (!t) continue;
    // Legacy → V2: { pro[], contra[], alternative[] } → { pro[], kontra[], alternative:string }
    const legacy = {
      pro: Array.isArray(row?.pro) ? row.pro.slice(0, 3) : [],
      contra: Array.isArray(row?.contra) ? row.contra.slice(0, 3) : [],
      alternative: Array.isArray(row?.alternative) ? row.alternative.slice(0, 3) : [],
    };
    const v2 = upgradeLegacyPerspectives(legacy);
    out[t] = v2;
  }

  return { views: out };
}

// ———————————————————————————————————————————————————————————
// Unified: Multi-Claim Best-Effort – bevorzugt V2; Fallback V1→V2
// Rückgabe: Record<canonical_id, Perspectives>
// ———————————————————————————————————————————————————————————

export async function buildPerspectivesForClaims(
  claims: AtomicClaim[],
  opts?: { timeoutMs?: number; model?: string; prefer?: "v2" | "v1" | "auto" }
): Promise<Record<string, Perspectives>> {
  const prefer = opts?.prefer ?? "auto";

  if (prefer === "v2") {
    return buildPerspectivesForClaimsV2(claims, opts);
  }

  if (prefer === "v1") {
    const legacy = await makePerspectivesV1(claims, opts?.timeoutMs ?? 9000);
    const map: Record<string, Perspectives> = {};
    for (const c of claims) {
      const v = legacy.views[c.text];
      if (v) map[c.canonical_id] = PerspectivesSchema.parse(v);
    }
    return map;
  }

  // auto
  const v2 = await buildPerspectivesForClaimsV2(claims, opts);
  const hasAny = Object.keys(v2).length > 0;
  if (hasAny) return v2;

  const legacy = await makePerspectivesV1(claims, opts?.timeoutMs ?? 9000);
  const map: Record<string, Perspectives> = {};
  for (const c of claims) {
    const v = legacy.views[c.text];
    if (v) map[c.canonical_id] = PerspectivesSchema.parse(v);
  }
  return map;
}
