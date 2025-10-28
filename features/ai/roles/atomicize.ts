export async function atomicize(input:any,{timeoutMs=1500}={}){
  const text = String(input?.text ?? "").trim();
  const claim = { id: input?.id || Math.random().toString(36).slice(2), text,
    sachverhalt: text.slice(0,140), zeitraum: input?.zeitraum ?? null, ort: input?.ort ?? null, ebene: input?.ebene ?? null,
    betroffene: Array.isArray(input?.betroffene)? input.betroffene.slice(0,5) : [], messgröße: input?.messgröße ?? "—",
    unsicherheiten: Array.isArray(input?.unsicherheiten)? input.unsicherheiten.slice(0,3) : [] };
  const missing:string[]=[]; if(!claim.ort) missing.push("ort"); if(!claim.zeitraum) missing.push("zeitraum"); if(!claim.ebene) missing.push("ebene");
  return { claim, missing, meta:{ took: Math.min(timeoutMs,700) } };
}