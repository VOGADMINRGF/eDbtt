import type { OrchestratorResult, EnrichedClaim, AtomicClaim } from "./roles/shared_types";
import { atomicize } from "./roles/atomicizer";
import { assignZustaendigkeit } from "./roles/assigner";
import { makeEvidence } from "./roles/evidence";
import { makePerspectives } from "./roles/perspectives";
import { rateEditorial } from "./roles/editor_rater";

function timeout<T>(p:Promise<T>, ms:number, name:string): Promise<{ok:boolean; val?:T; ms:number; note?:string}> {
  const t0=Date.now();
  return new Promise((resolve)=>{
    const to=setTimeout(()=>resolve({ok:false,ms:Date.now()-t0,note:name+" timeout"}), ms);
    p.then(v=>{clearTimeout(to); resolve({ok:true,val:v,ms:Date.now()-t0});})
     .catch(()=>{clearTimeout(to); resolve({ok:false,ms:Date.now()-t0,note:name+" error"});});
  });
}

export async function orchestrateClaims(text:string, maxClaims=6): Promise<OrchestratorResult> {
  const t0=Date.now(); const steps:OrchestratorResult["_meta"]["steps"]=[];
  const a = await timeout(atomicize(text,maxClaims,15000),16000,"atomicizer");
  steps.push({name:"atomicizer",ms:a.ms,ok:a.ok,note:a.note});
  const claims:AtomicClaim[] = a.ok ? (a.val?.claims??[]) : [];
  if (!claims.length) return { claims:[], _meta:{ ok:false, tookMs:Date.now()-t0, fallbackUsed:true, steps } };

  const [asg,ev,pv,rt] = await Promise.all([
    timeout(assignZustaendigkeit(claims,12000),13000,"assigner"),
    timeout(makeEvidence(claims,9000),10000,"evidence"),
    timeout(makePerspectives(claims,9000),10000,"perspectives"),
    timeout(rateEditorial(claims,8000),9000,"editor_rater"),
  ]);
  steps.push({name:"assigner",ms:asg.ms,ok:asg.ok,note:asg.note},
             {name:"evidence",ms:ev.ms,ok:ev.ok,note:ev.note},
             {name:"perspectives",ms:pv.ms,ok:pv.ok,note:pv.note},
             {name:"editor_rater",ms:rt.ms,ok:rt.ok,note:rt.note});

  const map = asg.ok ? (asg.val?.map??{}) : {};
  const hints = ev.ok ? (ev.val?.hints??{}) : {};
  const views = pv.ok ? (pv.val?.views??{}) : {};
  const ratings = rt.ok ? (rt.val?.ratings??{}) : {};

  const enriched:EnrichedClaim[] = claims.map(c=>{
    const z=map[c.text]??null;
    return {
      ...c,
      zustandigkeit: z? { ebene:z.ebene, organ:z.organ, begruendung:z.begruendung }: null,
      evidence: hints[c.text]??[],
      perspectives: views[c.text]??{ pro:[], contra:[], alternative:[] },
      editorial: ratings[c.text]??{ praezision:0, pruefbarkeit:0, relevanz:0, lesbarkeit:0, ausgewogenheit:0, gruende:[], total:0 }
    };
  });

  return { claims: enriched, _meta:{ ok:true, tookMs:Date.now()-t0, prompt_version:"v1", orchestrator_commit:null, steps } };
}
