export const ATOMICIZER_SYSTEM = `You are a rigorous editor. Task: rewrite ONE-sentence claim in B1/B2 German and fill ALL required slots. If a slot is impossible to infer, return a needs-info note (e.g., "needs-info: zeitraum"). Output strict JSON only.`;

export const ATOMICIZER_USER = ({input}:{input:string})=> `INPUT:
${input}

Return JSON exactly of shape:
{
  "text": string,
  "sachverhalt": string,
  "zeitraum": {"from": string, "to": string} | null,
  "ort": string,
  "zuständigkeit": "EU"|"Bund"|"Land"|"Kommune"|"Unklar",
  "zuständigkeitsorgan": string|null,
  "betroffene": string[],
  "messgröße": string,
  "unsicherheiten": string[]
}
If any required value is missing, set a single string field "needs_info" with the missing key name.`;
