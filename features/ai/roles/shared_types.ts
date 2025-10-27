export type JurisdictionLevel = "EU" | "Bund" | "Land" | "Kommune";
export type SourceType = "amtlich" | "presse" | "forschung";

export type AtomicClaim = {
  id: string; text: string;
  sachverhalt?: string|null; zeitraum?: string|null; ort?: string|null;
  ebene?: JurisdictionLevel|null; betroffene?: string[]; messgroesse?: string|null; unsicherheiten?: string[];
};

export type EvidenceSlot = { source_type: SourceType; query: string; erwartete_kennzahl?: string|null; jahr?: string|null; };
export type Perspectives = { pro: string[]; contra: string[]; alternative: string[]; };
export type EditorialScore = {
  praezision:number; pruefbarkeit:number; relevanz:number; lesbarkeit:number; ausgewogenheit:number; gruende:string[]; total:number;
};

export type EnrichedClaim = AtomicClaim & {
  zustandigkeit?: { ebene: JurisdictionLevel, organ: string, begruendung: string } | null;
  evidence: EvidenceSlot[]; perspectives: Perspectives; editorial: EditorialScore;
};

export type OrchestratorResult = {
  claims: EnrichedClaim[];
  _meta: { ok:boolean; tookMs:number; model?:string|null; prompt_version?:string; orchestrator_commit?:string|null; fallbackUsed?:boolean;
           steps?: { name:string; ms:number; ok:boolean; note?:string }[]; }
};
