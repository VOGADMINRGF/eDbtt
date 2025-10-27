import { runLLMJson } from "../providers";
import { z } from "zod";

const AssignOut = z.object({
  zuständigkeit: z.enum(["EU","Bund","Land","Kommune","Unklar"]),
  zuständigkeitsorgan: z.string().nullable(),
  thema_key: z.string().min(2).max(60),
});
export type AssignOut = z.infer<typeof AssignOut>;

export async function assignJurisdiction(text: string, opts?:{timeoutMs?:number, model?:string}): Promise<AssignOut>{
  const { data } = await runLLMJson({
    system: "Classify the political level (EU/Bund/Land/Kommune/Unklar), the concrete organ (short), and map to a topic key from a 15-topic taxonomy. JSON only.",
    user: `Text: ${text}\nReturn {"zuständigkeit":"EU|Bund|Land|Kommune|Unklar","zuständigkeitsorgan":string|null,"thema_key":string}`,
    model: opts?.model ?? "gpt-4o-mini",
    timeoutMs: opts?.timeoutMs ?? 2000,
  });
  return AssignOut.parse(data);
}
