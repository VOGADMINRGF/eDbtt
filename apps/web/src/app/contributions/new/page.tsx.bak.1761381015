"use client";
import React from "react";
import StanceSpectrum from "@/components/analyze/StanceSpectrum";
import ObjectionCollector from "@/components/analyze/ObjectionCollector";
import CounterSynth from "@/components/analyze/CounterSynth";
import NewsFeedPanel from "@/components/analyze/NewsFeedPanel";

export default function ContributionQuick(){
  const [text,setText]=React.useState<string>(typeof window!=="undefined" ? (new URLSearchParams(window.location.search).get("text")||"") : "");
  async function analyzeAndMove(){
    const url="/api/contributions/analyze?mode=multi&clarify=1";
    const r=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text, maxClaims:4})});
    const j=await r.json(); const claim=(j?.claims?.[0]?.text||text||"").slice(0,500);
    const u=new URL("/statements/new", window.location.origin); if(claim) u.searchParams.set("text", claim); window.location.href=u.toString();
  }
  return (
    <div className="container-vog">
      <h1 className="vog-head mb-4">Beitrag erstellen &amp; analysieren</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="vog-card p-4 space-y-3">
            <textarea className="w-full min-h-[200px] rounded-2xl border p-3" placeholder="Schreibe deinen Beitrag/These…" value={text} onChange={e=>setText(e.target.value)}/>
            <div className="flex gap-2">
              <button className="vog-btn-pri" onClick={analyzeAndMove} disabled={!text}>Analyse starten</button>
              <div className="vog-chip">Schnell-Flow</div>
            </div>
          </div>
          {text && (
            <>
              <StanceSpectrum claimText={text}/>
              <ObjectionCollector/>
              <CounterSynth text={text}/>
            </>
          )}
        </div>
        <div className="space-y-3">
          <NewsFeedPanel topic={"Allgemein"} region={null} keywords={text? [text] : []}/>
          <div className="vog-card p-4 text-sm">
            <div className="font-semibold mb-1">Hinweis</div>
            Du kannst jederzeit abbrechen – <b>eDebatte</b> übernimmt auf Wunsch Redaktion &amp; Belege.
          </div>
        </div>
      </div>
    </div>
  );
}
