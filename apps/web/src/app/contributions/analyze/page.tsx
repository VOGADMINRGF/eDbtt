/* @ts-nocheck */
"use client";
import React, { useState } from "react";

function ScopeDots({ value, onChange }: { value: number; onChange: (v:number)=>void }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      {[1,2,3,4,5].map((n) => (
        <button key={n}
          onClick={() => onChange(n)}
          aria-label={`Gesellschaftlicher Umfang: ${n}`}
          style={{
            width: 14, height: 14, borderRadius: "50%",
            background: n <= value
              ? "linear-gradient(90deg, #14b8a6 0%, #60a5fa 100%)"
              : "#e5e7eb",
            boxShadow: n <= value ? "0 2px 6px rgba(20,184,166,.35)" : "none",
            border: "none"
          }}
        />
      ))}
    </div>
  );
}

export default function AnalyzeContribution() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const analyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const r = await fetch("/api/contributions/analyze", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      }).then(res => res.json());
      r.claims = (r.claims || []).map((c:any)=>({ ...c, impact: c.impact ?? 3, scope: c.scope ?? 3 }));
      setResult(r);
    } finally { setLoading(false); }
  };

  const update = (i:number, patch:Partial<any>) => {
    setResult((prev:any) => {
      const next = structuredClone(prev);
      next.claims[i] = { ...next.claims[i], ...patch };
      return next;
    });
  };

  return (
    <div style={{maxWidth:1100, margin:"0 auto", padding:20}}>
      <h1 style={{fontSize:34, fontWeight:800, marginBottom:12}}>Beitrag erstellen & analysieren</h1>

      <textarea
        placeholder="Dein Text…"
        value={text} onChange={(e)=>setText(e.target.value)}
        style={{width:"100%", minHeight:180, border:"1px solid #e5e7eb", borderRadius:8, padding:12}}
      />
      <div style={{marginTop:10}}>
        <button disabled={loading} onClick={analyze}
          style={{padding:"8px 14px", background:"#111827", color:"#fff", borderRadius:8, opacity:loading?0.6:1}}>
          {loading ? "Analysiere…" : "Analyse starten"}
        </button>
      </div>

      {result?.claims?.length ? (
        <div style={{marginTop:16}}>
          <div style={{fontWeight:700, marginBottom:8}}>
            Ergebnisse • Sprache: {result.language || "—"} • Hauptthema: {result.mainTopic || "—"}
          </div>

          {result.claims.map((c:any,i:number)=>(
            <div key={i} style={{border:"1px solid #e5e7eb", borderRadius:12, padding:12, marginBottom:12}}>
              <div style={{fontWeight:700, marginBottom:6}}>Aussage {i+1}</div>
              <div style={{marginBottom:6}}>{c.text}</div>
              <div style={{color:"#6b7280", marginBottom:8}}>
                Thema: <b>{c.categoryMain ?? "—"}</b>
                {c.categorySubs?.length ? <> • Sub: {c.categorySubs.join(", ")}</> : null}
              </div>

              <div style={{display:"flex", gap:16, alignItems:"center", flexWrap:"wrap"}}>
                <div>
                  <div style={{fontSize:12, color:"#6b7280"}}>Relevanz</div>
                  {[1,2,3,4,5].map(star => (
                    <button key={star} onClick={()=>update(i, { impact: star })}
                      style={{background:"transparent", border:"none", fontSize:20,
                              color:(c.impact ?? 3) >= star ? "#f59e0b" : "#e5e7eb"}}>★</button>
                  ))}
                </div>
                <div>
                  <div style={{fontSize:12, color:"#6b7280"}}>Gesellschaftlicher Umfang</div>
                  <ScopeDots value={c.scope ?? 3} onChange={(v)=>update(i,{scope:v})} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
