"use client";
import { useState } from "react";

type MissingKey = "zeitraum"|"zuständigkeit"|"ort";
export function InlineClarify({ missing, onResolve }:{ missing:MissingKey|null, onResolve:(k:MissingKey,val:any)=>void }){
  const [val, setVal] = useState("");
  if(!missing) return null;
  const label = missing === "zeitraum" ? "Zeitraum wählen (z. B. 2020–2024)" : missing === "zuständigkeit" ? "Ebene wählen" : "Ort";
  return (
    <div className="rounded-xl border p-3 text-sm">
      <div className="mb-2 font-medium">Uns fehlt: {label}</div>
      {missing==="zuständigkeit" ? (
        <div className="flex gap-2">
          {(["EU","Bund","Land","Kommune","Unsicher"] as const).map(l=>(
            <button key={l} className="rounded-lg border px-2 py-1" onClick={()=>onResolve("zuständigkeit", l)}>{l}</button>
          ))}
        </div>
      ) : (
        <input className="w-full rounded-lg border px-2 py-1" placeholder={label} value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") onResolve(missing, val); }} />
      )}
      <button className="mt-2 text-xs underline" onClick={()=>onResolve(missing, "Sonstiges")}>Sonstiges</button>
    </div>
  );
}
