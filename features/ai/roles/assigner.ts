// features/ai/roles/assigner.ts
// Kombi-BEST-Version: V2 (Single-Text) bevorzugt; V1 (Multi-Claims) als Legacy/Fallback.

import { z } from "zod";
import { runLLMJson } from "../providers";              // provider-agnostischer JSON-Caller
import { runOpenAI } from "@features/ai/providers/openai";        // Legacy-V1-Aufruf
import { ASSIGNER_V1 } from "@features/ai/prompts/assigner";      // Legacy-Prompt
import type { AtomicClaim, JurisdictionLevel } from "./shared_types";

// ———————————————————————————————————————————————————————————
// V2: Single-Text-Klassifikation (bevorzugt)
// ———————————————————————————————————————————————————————————

export const AssignOut = z.object({
  zuständigkeit: z.enum(["EU", "Bund", "Land", "Kommune", "Unklar"]),
  zuständigkeitsorgan: z.string().nullable(),
  thema_key: z.string().min(2).max(60), // 15-Themen-Matrix
});
export type AssignOut = z.infer<typeof AssignOut>;

/**
 * V2 Single-Text-Klassifikation.
 * - Ermittelt Ebene (EU/Bund/Land/Kommune/Unklar)
 * - Benennt zuständiges Organ (kurz) oder null
 * - Mappt auf einen Key deiner 15-Themen-Matrix
 */
export async function assignJurisdiction(
  text: string,
  opts?: { timeoutMs?: number; model?: string }
): Promise<AssignOut> {
  const { data } = await runLLMJson({
    system:
      "Classify the political level (EU/Bund/Land/Kommune/Unklar), the concrete organ (short), and map to a topic key from a 15-topic taxonomy. JSON only.",
    user: `Text: ${text}
Return {"zuständigkeit":"EU|Bund|Land|Kommune|Unklar","zuständigkeitsorgan":string|null,"thema_key":string}`,
    model: opts?.model ?? "gpt-4o-mini-json",
    timeoutMs: opts?.timeoutMs ?? 2000,
  });
  return AssignOut.parse(data);
}

// ———————————————————————————————————————————————————————————
// V1: Multi-Claim-Zuordnung (Legacy); Map nach Claim-Text
// ———————————————————————————————————————————————————————————

export type LegacyAssignMapEntry = {
  ebene: JurisdictionLevel;
  organ: string;
  begruendung: string;
};

export async function assignZustaendigkeit(
  claims: AtomicClaim[],
  timeoutMs = 12000
): Promise<{ map: Record<string, LegacyAssignMapEntry> }> {
  if (!claims.length) return { map: {} };

  const payload = { claims: claims.map((c) => ({ text: c.text })) };
  const prompt = ASSIGNER_V1.replace("<<<CLAIMS>>>", JSON.stringify(payload, null, 2));

  const r = await runOpenAI(prompt, { json: true, timeoutMs });
  if (!r.ok) return { map: {} };

  let json: any = null;
  try {
    json = JSON.parse(r.text || "{}");
  } catch {
    return { map: {} };
  }

  const out: Record<string, LegacyAssignMapEntry> = {};
  const rows = Array.isArray(json?.map) ? json.map : [];

  for (const row of rows) {
    const t = String(row?.claim || "").trim();
    if (!t) continue;

    // Legacy-Payload nutzt ASCII-Keys: zustandigkeit.{ebene,organ,begruendung}
    const ebene = (row?.zustandigkeit?.ebene as JurisdictionLevel) || "Bund";
    const organ = String(row?.zustandigkeit?.organ || "").slice(0, 120);
    const begruendung = String(row?.zustandigkeit?.begruendung || "").slice(0, 300);

    out[t] = { ebene, organ, begruendung };
  }

  return { map: out };
}
