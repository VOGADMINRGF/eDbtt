"use client";
import React from "react";
import { Button } from "@vog/ui";

export default function CTAButtons({ onUse, onAlternatives, onResearch, onFactcheck }:{
  onUse: ()=>void; onAlternatives: ()=>void; onResearch: ()=>void; onFactcheck: ()=>void;
}){
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={onUse}>Statement übernehmen</Button>
      <Button variant="secondary" onClick={onAlternatives}>Alternativen</Button>
      <Button variant="secondary" onClick={onResearch}>Recherche</Button>
      <Button variant="secondary" onClick={onFactcheck}>Faktencheck</Button>
    </div>
  );
}
