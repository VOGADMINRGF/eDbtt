import OpenAI from "openai";
const model = process.env.OPENAI_MODEL || "gpt-5.0";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeWithGptJSON(text:string){
  const SYSTEM = `Du bist ein präziser Politik/News-Analyst. Antworte NUR mit JSON:
{"topics":[{"topic":string,"score":number}],"theses":[{"text":string,"relevance":number,"domain":string}],
"statements":[{"text":string}],"summary":{"topics":number,"theses":number,"avgRelevance":number}}`;
  const USER = `Text:\n---\n${text}\n---`;
  const r = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [{role:"system",content:SYSTEM},{role:"user",content:USER}]
  });
  return JSON.parse(r.choices?.[0]?.message?.content || "{}");
}
