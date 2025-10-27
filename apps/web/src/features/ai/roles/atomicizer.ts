import { z } from "zod";
import { ATOMICIZER_SYSTEM, ATOMICIZER_USER } from "../prompts/atomicizer";
import { AtomicClaimSchema, canonicalIdFrom, type AtomicClaim } from "./shared_types";
import { runLLMJson } from "../providers";

export async function atomicize(input: string, opts?:{timeoutMs?:number, model?:string}): Promise<{claim: AtomicClaim, missing?:string|null}> {
  const { data } = await runLLMJson({
    system: ATOMICIZER_SYSTEM,
    user: ATOMICIZER_USER({ input }),
    model: opts?.model ?? "gpt-4o-mini",
    timeoutMs: opts?.timeoutMs ?? 2500,
  });

  const parsed = AtomicClaimSchema.merge(z.object({ needs_info: z.string().optional() })).safeParse({
    ...data,
    text: data?.text,
    canonical_id: canonicalIdFrom(data?.text||input),
  });
  if (!parsed.success) throw new Error("atomicizer:invalid_json:"+JSON.stringify(parsed.error.issues));
  const { needs_info, ...payload } = parsed.data as any;
  return { claim: payload as AtomicClaim, missing: needs_info ?? null };
}
