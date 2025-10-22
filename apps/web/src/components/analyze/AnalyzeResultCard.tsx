"use client";
import React from "react";
import CTAButtons from "./CTAButtons";

export default function AnalyzeResultCard({ claim, onUse }:{
  claim: { text:string; categoryMain?:string|null; categorySubs?:string[]; region?:string|null; authority?:string|null };
  onUse:(text:string)=>void;
}){
  const subs = (claim.categorySubs||[]).join(", ");
  return (
    <div className="rounded-2xl border p-4 space-y-2">
      <div className="font-medium">{claim.text}</div>
      <div className="text-sm opacity-70">
        {claim.categoryMain ? <>Thema: <b>{claim.categoryMain}</b>{subs?<> · Sub: {subs}</>:null}</> : "—"}
        {claim.region ? <> · Region: {claim.region}</> : null}
      </div>
      <CTAButtons
        onUse={()=>onUse(claim.text)}
        onAlternatives={()=>window.dispatchEvent(new CustomEvent("vog:alt", { detail: claim }))}
        onResearch={()=>window.dispatchEvent(new CustomEvent("vog:research", { detail: claim }))}
        onFactcheck={()=>window.dispatchEvent(new CustomEvent("vog:factcheck", { detail: claim }))}
      />
    </div>
  );
}
