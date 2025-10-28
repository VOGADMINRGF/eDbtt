
/// <reference types="react" />
declare module "he" { const x: any; export default x; }
declare module "@/lib/analysis" { export type Analysis = any; const def: any; export default def; export function sha256(a:any):string; export function heuristicAnalyze(a:any):any; export function extractUrls(a:any):string[]; export function guessLang(a:any):string; }
declare module "@/core/gpt" { export const analyzeContribution: any; }
