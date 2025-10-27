import { runLLMJson } from "../providers";
import { RATER_SYSTEM, RATER_USER } from "../prompts/editor_rater";
import { ScoreSchema, type ScoreSet } from "./shared_types";

export async function rateDraft(claimText: string, opts?:{timeoutMs?:number, model?:string}): Promise<ScoreSet>{
  const { data } = await runLLMJson({
    system: RATER_SYSTEM,
    user: RATER_USER({ claim: claimText }),
    model: opts?.model ?? "gpt-4o-mini",
    timeoutMs: opts?.timeoutMs ?? 1600,
  });
  return ScoreSchema.parse(data);
}
