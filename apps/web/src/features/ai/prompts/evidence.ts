export const EVIDENCE_SYSTEM = `You propose falsifiable evidence hypotheses. No browsing. Output only the search formulation and expected field.`;
export const EVIDENCE_USER = ({claim}:{claim:string})=> `For the claim: ${claim}
Return an array (max 4) of objects: {
  "source_type":"amtlich"|"presse"|"forschung",
  "suchquery": string,
  "erwartete_kennzahl": string,
  "jahr": number|null
}`;
