// features/contribution/utils/promptRegistry.ts
export const PROMPT_MAP = {
  gpt_analysis: "gpt_analysis.md",
  ari_audit: "ari_audit.md",
  claude_analysis: "claude_analysis.md",
  llama_analysis: "llama_analysis.md",
  mistral_analysis: "mistral_analysis.md",
  gemini_analysis: "gemini_analysis.md",

  impact_only: "impact_only.md",
  // Alias-Fix: "alternative_only" -> "alternatives_only"
  alternatives_only: "alternatives_only.md",
  alternative_only: "alternatives_only.md",

  factcheck_only: "factcheck_only.md",
  factcheck_only_de: "factcheck_only.de.md",

  consensus_ranking: "consensus_ranking.md",
  _shared_constraints: "_shared_constraints.md",
} as const;

export function resolvePromptName(name: string): string {
  const key = String(name).trim() as keyof typeof PROMPT_MAP;
  if (!(key in PROMPT_MAP)) {
    throw new Error(`Unknown prompt key: ${name}`);
  }
  return PROMPT_MAP[key];
}
