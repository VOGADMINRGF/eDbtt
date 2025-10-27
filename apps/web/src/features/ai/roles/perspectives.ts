import { runLLMJson } from "../providers";
import { PERSPECTIVES_SYSTEM, PERSPECTIVES_USER } from "../prompts/perspectives";
import { PerspectivesSchema, type Perspectives } from "./shared_types";

export async function buildPerspectives(claimText: string, opts?:{timeoutMs?:number, model?:string}): Promise<Perspectives>{
  const { data } = await runLLMJson({
    system: PERSPECTIVES_SYSTEM,
    user: PERSPECTIVES_USER({ claim: claimText }),
    model: opts?.model ?? "gpt-4o-mini",
    timeoutMs: opts?.timeoutMs ?? 1800,
  });
  return PerspectivesSchema.parse(data);
}
