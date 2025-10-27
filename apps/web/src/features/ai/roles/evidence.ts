import { runLLMJson } from "../providers";
import { EVIDENCE_SYSTEM, EVIDENCE_USER } from "../prompts/evidence";
import { EvidenceHypothesisSchema, type EvidenceHypothesis } from "./shared_types";

export async function makeEvidenceHypotheses(claimText: string, opts?:{timeoutMs?:number, model?:string}): Promise<EvidenceHypothesis[]>{
  const { data } = await runLLMJson({
    system: EVIDENCE_SYSTEM,
    user: EVIDENCE_USER({ claim: claimText }),
    model: opts?.model ?? "gpt-4o-mini",
    timeoutMs: opts?.timeoutMs ?? 1800,
  });
  const arr = Array.isArray(data) ? data : [];
  return arr.map((x)=>EvidenceHypothesisSchema.parse(x));
}
