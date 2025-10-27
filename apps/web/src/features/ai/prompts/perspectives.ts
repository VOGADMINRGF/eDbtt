export const PERSPECTIVES_SYSTEM = `Write neutral, source-agnostic pros/cons and one constructive alternative. No Ad-hominem.`;
export const PERSPECTIVES_USER = ({claim}:{claim:string})=> `For the claim: ${claim}
Give JSON: {
  "pro": string[<=3],
  "kontra": string[<=3],
  "alternative": string
}`;
