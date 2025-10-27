"use client";
import { PropsWithChildren, useEffect } from "react";
import { setStep, setAnalyzing, reset } from "@/store/pipeline";

const WATCH = [
  { id:"stance",  match:/\/api\/stance\/expand/ , label:"VOG-AI 1 · Lager/Varianten"},
  { id:"civic",   match:/\/api\/search\/civic/  , label:"VOG-AI 2 · Recherche"     },
  { id:"analyze", match:/\/api\/contributions\/analyze/, label:"VOG-AI 3 · Claims" }
];

export default function FetchInstrument({children}:PropsWithChildren){
  useEffect(()=>{
    if (typeof window === "undefined") return;
    const orig = window.fetch;
    let inFlight = 0;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : String((input as any)?.url || "");
      const hit = WATCH.find(w=>w.match.test(url));
      if (hit){
        if (inFlight===0){ reset(); setAnalyzing(true); document.body.dataset.analyzing="1"; }
        inFlight++;
        const t0 = performance.now();
        setStep({ id:hit.id, label:hit.label, status:"run" });
        try{
          const res = await orig(input, init);
          const ms = Math.round(performance.now()-t0);
          setStep({ id:hit.id, label:hit.label, status: res.ok?"ok":"err", ms });
          return res;
        }catch(e){
          const ms = Math.round(performance.now()-t0);
          setStep({ id:hit.id, label:hit.label, status:"err", ms });
          throw e;
        }finally{
          inFlight--;
          if (inFlight<=0){ setAnalyzing(false); document.body.dataset.analyzing="0"; document.body.dataset.analysisReady="1"; }
        }
      }
      return orig(input, init);
    };

    return ()=>{ window.fetch = orig; };
  },[]);
  return children as any;
}
