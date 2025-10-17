export const sleep = (ms:number)=> new Promise(r=>setTimeout(r,ms));
const safeNum = (n:any)=> Number.isFinite(n)? n : 0;
export function pipeResult(send:(e:string,d:any)=>void, r:any){
  const topics = (r.topics||[]).map((t:any)=>({ topic:t.topic, score: safeNum(t.score) }));
  const theses = (r.theses||[]).map((t:any)=>({ text:t.text, relevance: safeNum(t.relevance), domain: t.domain||"Allgemein" }));
  const statements = (r.statements||[]).map((s:any)=>({ text:s.text }));
  const summary = { topics: topics.length, theses: theses.length,
    avgRelevance: Math.round((theses.reduce((a:number,b:any)=>a + safeNum(b.relevance)*100,0)/Math.max(1,theses.length))) };
  send("summary", summary); send("topics", topics); send("theses", theses); send("statements", statements);
}
