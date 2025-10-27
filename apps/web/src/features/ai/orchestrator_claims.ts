import { atomicize } from "./roles/atomicizer";
import { assignJurisdiction } from "./roles/assigner";
import { makeEvidenceHypotheses } from "./roles/evidence";
import { buildPerspectives } from "./roles/perspectives";
import { rateDraft } from "./roles/editor_rater";
import { OrchestrationResultSchema, type OrchestrationResult } from "./roles/shared_types";

async function withTimeout<T>(p:Promise<T>, ms:number, label:string): Promise<T>{
  return await Promise.race([
    p,
    new Promise<T>((_,rej)=>setTimeout(()=>rej(new Error(`timeout:${label}`)), ms))
  ]);
}

export async function orchestrateClaim(input: string, budget={ extractor:1500, normalizer:2500, assigner:2000, editor:3000, evidence:1800, rater:1600 }): Promise<OrchestrationResult>{
  const { claim, missing } = await withTimeout(atomicize(input,{timeoutMs:budget.normalizer}), budget.normalizer, "atomicizer");

  const needs = missing || (claim.zuständigkeit === "Unklar" ? "zuständigkeit" : null) || (!claim.zeitraum ? "zeitraum" : null);

  const [assign, perspectives, evidence] = await Promise.all([
    withTimeout(assignJurisdiction(claim.text,{timeoutMs:budget.assigner}), budget.assigner, "assigner").catch(()=>null),
    withTimeout(buildPerspectives(claim.text,{timeoutMs:budget.editor}), budget.editor, "perspectives").catch(()=>null),
    withTimeout(makeEvidenceHypotheses(claim.text,{timeoutMs:budget.evidence}), budget.evidence, "evidence").catch(()=>[]),
  ]);

  if (assign){
    (claim as any).zuständigkeit = assign.zuständigkeit;
    (claim as any).zuständigkeitsorgan = assign.zuständigkeitsorgan;
    (claim as any).thema_key = assign.thema_key;
  }

  const score = await withTimeout(rateDraft(claim.text,{timeoutMs:budget.rater}), budget.rater, "rater").catch(()=>({
    präzision:0.5, prüfbarkeit:0.5, relevanz:0.5, lesbarkeit:0.5, ausgewogenheit:0.5,
    begründung:{präzision:"timeout",prüfbarkeit:"timeout",relevanz:"timeout",lesbarkeit:"timeout",ausgewogenheit:"timeout"}
  } as any));

  const quality = {
    json_valid: true,
    atomization_complete: !needs,
    readability_b1_b2: claim.readability === "B1" || claim.readability === "B2",
    jurisdiction_present: claim.zuständigkeit !== "Unklar",
    evidence_present: (evidence?.length ?? 0) > 0,
  };

  const result = { claim, evidence: evidence||[], perspectives: perspectives||{pro:[],kontra:[],alternative:""}, score, quality };
  return OrchestrationResultSchema.parse(result);
}
