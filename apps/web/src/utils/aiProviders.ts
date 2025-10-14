// Finale Version 04.August 2025
// apps/web/src/utils/aiProviders.ts

import {
  saveProvenance,
  saveAuditLog,
  saveAnalysisResult,
  saveMetaLayerLog,
} from "@/lib/audit"; // siehe DB-Architektur
import { callGPTAPI, callARIAPI, callMetaLLM } from "@lib/llm"; // Proxies auf echte GPT/ARI/Meta-Endpunkte
import { getPolicyRules, getImpactScoring } from "@lib/policy"; // Policy- und Impact-Engine
import { findCrossRefs, runFactCheck } from "@lib/factcheck"; // Search/GraphDB-Module
import { v4 as uuidv4 } from "uuid";

// 1. Metadaten- und Provenance-Schicht
export async function extractMetadata(input: any, userContext: any) {
  const id = uuidv4();
  const meta = {
    id,
    timestamp: new Date(),
    user: userContext?.id || null,
    input,
    step: "metadata",
    source: input?.url || null,
    ip: userContext?.ip || null,
    device: userContext?.device || null,
  };
  await saveProvenance(meta);
  return meta;
}

// 2. GPT-Analyse (Claims, Themen, Struktur, etc.)
export async function runGPTAnalysis({ text, context }: any) {
  const gptResult = await callGPTAPI({ text, context });
  await saveAuditLog({
    step: "gpt-analysis",
    gptResult,
    timestamp: new Date(),
  });
  return gptResult;
}

// 3. ARI-Analyse (Orchestrator, Impact, Policy, Alternatives)
export async function runARIAnalysis({ text, gptData, meta, context }: any) {
  const ariResult = await callARIAPI({ text, gptData, meta, context });
  await saveAuditLog({
    step: "ari-analysis",
    ariResult,
    timestamp: new Date(),
  });
  return ariResult;
}

// 4. Kontextualisierung, Themenmatching, Policy/Impact, Cluster
export async function runContextualization({ gptData, ariData, meta }: any) {
  const policy = await getPolicyRules(gptData, ariData);
  const impact = await getImpactScoring(gptData, ariData);
  // Optionale Cluster- und Diskursebenen
  return { policy, impact };
}

// 5. Fakten-/Quellen-/Bias-/Ethik-Check (Meta-Layer)
export async function runMetaLayer({ gptData, ariData, meta }: any) {
  const crossRefs = await findCrossRefs(gptData?.statements || []);
  const factCheck = await runFactCheck(gptData?.statements || []);
  const explain = await callMetaLLM({
    input: { gptData, ariData, meta, crossRefs, factCheck },
    instruction:
      "Erkläre KI-Entscheidungen für Laien, checke auf Bias, Ethik, Policy.",
  });
  await saveMetaLayerLog({
    step: "meta-layer",
    crossRefs,
    factCheck,
    explain,
    timestamp: new Date(),
  });
  return { crossRefs, factCheck, explain };
}

// 6. Audit, Chain-of-Trust, Human-in-the-Loop (optional)
export async function finalizeAuditTrail(
  meta: any,
  gptData: any,
  ariData: any,
  metaResult: any,
  context: any,
) {
  // Speichere alle Schritte zentral in AuditDB, GraphDB etc.
  const audit = {
    meta,
    gptData,
    ariData,
    metaResult,
    timestamp: new Date(),
    user: context?.user || null,
  };
  await saveAnalysisResult(audit);
  return audit;
}

// 7. Main Orchestrator – alle Schritte als Pipeline
export async function analyzeContributionE120(input: any, userContext: any) {
  // 1. Metadata
  const meta = await extractMetadata(input as any, userContext as any);

  // 2. GPT-Analysis (Claims, Topics, Structure)
  const gptData = await runGPTAnalysis({
    text: input.text,
    context: userContext,
  });

  // 3. ARI-Analysis (Orchestrator, Impact, Policy)
  const ariData = await runARIAnalysis({
    text: input.text,
    gptData,
    meta,
    context: userContext,
  });

  // 4. Contextualization/Matching
  const contextResult = await runContextualization({ gptData, ariData, meta } as any);

  // 5. Meta-Layer (Bias, Ethics, Factcheck, Layman Explanation)
  const metaResult = await runMetaLayer({ gptData, ariData, meta } as any);

  // 6. Chain-of-Trust/Audit
  const audit = await finalizeAuditTrail(
    meta,
    gptData,
    ariData,
    metaResult,
    userContext,
  );

  // 7. Compose Final Result (maximal transparent, modular)
  return {
    ...audit,
    statements: gptData.statements?.slice(0, 10) || [],
    topics: gptData.topics || [],
    level: gptData.level || null,
    context: contextResult || null,
    suggestions: gptData.suggestions || [],
    translations: gptData.translations || {},
    policy: contextResult.policy || null,
    impact: contextResult.impact || null,
    crossRefs: metaResult.crossRefs || [],
    factCheck: metaResult.factCheck || [],
    laymanExplanation: metaResult.explain?.layman || "",
    biasCheck: metaResult.explain?.bias || "",
    auditTrail: audit,
    provenance: meta,
    ariRaw: ariData.ariRaw || null,
    gptRaw: gptData.gptRaw || null,
    metaLayerRaw: metaResult.explain?.raw || null,
  };
}
