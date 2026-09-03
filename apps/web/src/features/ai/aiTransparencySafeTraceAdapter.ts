import type { AgentSafeTraceStep } from "@/features/agenticRuntime/agentRunArtifactSafeTraceContract";
import {
  buildHonestMetadataCapabilities,
  type AiMachineReadableProvenance,
} from "@features/ai/aiTransparencyContract";

export function buildAiProvenanceFromSafeTrace(
  trace: AgentSafeTraceStep,
): AiMachineReadableProvenance {
  const safeTraceRef = `safe-trace:${trace.surface}:${trace.stepId}`;
  const hasHumanInput = trace.inputArtifacts.some(
    (artifact) => artifact.type === "human_input",
  );
  const hasAiDerivedOutput = trace.outputArtifacts.some(
    (artifact) => artifact.type !== "human_input" && artifact.type !== "server_draft",
  );

  return {
    traceRefs: Array.from(new Set([safeTraceRef, ...trace.evidenceRefs])),
    inputOrigin:
      hasHumanInput && hasAiDerivedOutput
        ? "mixed"
        : hasAiDerivedOutput
          ? "ai_derivation"
          : hasHumanInput
            ? "human_input"
            : "unknown",
    providerMetadataPresent: false,
    capabilities: buildHonestMetadataCapabilities({
      safeTraceVerificationRef: safeTraceRef,
    }),
  };
}
