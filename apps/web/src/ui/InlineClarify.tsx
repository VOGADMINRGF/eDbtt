"use client";
import { useState } from "react";

type MissingKey = "zeitraum"|"zuständigkeit"|"ort";
type Props = {
  missing: MissingKey | null;
  onResolve?: (k: MissingKey, val: any) => void;
  onSubmit?: (k: MissingKey, val: any) => void; // alias für Alt-Code
};

function InlineClarifyImpl({ missing, onResolve, onSubmit }: Props){
  const cb = onResolve ?? onSubmit ?? (()=>{});
  const [val, setVal] = useState("");
  if(!missing) return null;
  const label = missing === "zeitraum" ? "Zeitraum wählen (z. B. 2020–2024)" : missing === "zuständigkeit" ? "Ebene wählen" : "Ort";
  return (
    <div className="rounded-xl border p-3 text-sm">
      <div className="mb-2 font-medium">Uns fehlt: {label}</div>
      {missing==="zuständigkeit" ? (
        <div className="flex gap-2">
          {(["EU","Bund","Land","Kommune","Unsicher"] as const).map(l=>(
            <button key={l} className="rounded-lg border px-2 py-1" onClick={()=>cb("zuständigkeit", l)}>{l}</button>
          ))}
        </div>
      ) : (
        <input
          className="w-full rounded-lg border px-2 py-1"
          placeholder={label}
          value={val}
          onChange={e=>setVal(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter") cb(missing, val); }}
        />
      )}
      <button className="mt-2 text-xs underline" onClick={()=>cb(missing, "Sonstiges")}>Sonstiges</button>
    </div>
  );
}

const InlineClarify = InlineClarifyImpl;
export { InlineClarify };     // named export
export default InlineClarify; // default export
