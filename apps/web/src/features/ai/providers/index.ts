export type RunJsonArgs = { system?: string; user: string; model?: string; timeoutMs?: number };

export async function runLLMJson(args: RunJsonArgs): Promise<{ data: any; raw: any }>{
  const provider = (process.env.VOG_AI_PROVIDER || "openai").toLowerCase();
  const model = args.model || process.env.VOG_DEFAULT_MODEL || "gpt-4o-mini";
  const payload = { system: args.system, user: args.user, model, mode: "json", timeoutMs: args.timeoutMs ?? 2500 };

  try{
    if (provider === "openai"){
      const { callOpenAI } = await import("./openai");
      const res: any = await callOpenAI(payload as any);
      const data = res?.json ?? res?.data ?? res;
      return { data, raw: res };
    }
    if (provider === "anthropic"){
      const { callAnthropic } = await import("./anthropic");
      const res: any = await callAnthropic(payload as any);
      const data = res?.json ?? res?.data ?? res;
      return { data, raw: res };
    }
    if (provider === "mistral"){
      const { callMistral } = await import("./mistral");
      const res: any = await callMistral(payload as any);
      const data = res?.json ?? res?.data ?? res;
      return { data, raw: res };
    }
    if (provider === "gemini"){
      const { callGemini } = await import("./gemini");
      const res: any = await callGemini(payload as any);
      const data = res?.json ?? res?.data ?? res;
      return { data, raw: res };
    }
  }catch(e:any){
    throw new Error("runLLMJson providererr: "+(e?.message||String(e)));
  }
  throw new Error("runLLMJson: Unknown provider "+provider);
}
