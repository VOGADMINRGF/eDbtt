// core/telemetry/aiUsageTypes.ts

export type AiProviderName =
  | "openai"
  | "anthropic"
  | "mistral"
  | "gemini"
  | "ari"
  | "youcom";

export type AiPipelineName =
  | "contribution_analyze"
  | "feeds_analyze"
  | "feeds_to_statementCandidate"
  | "factcheck"
  | "news_factcheck"
  | "report_summarize"
  | "content_translate"
  | "content_summarize_news"
  | "admin_orchestrate"
  | "orchestrator_smoke"
  | "provider_probe"
  | "other";

export type AiErrorKind =
  | "MODEL_NOT_FOUND"
  | "INVALID_API_KEY"
  | "UNAUTHORIZED"
  | "BAD_JSON"
  | "TIMEOUT"
  | "RATE_LIMIT"
  | "INTERNAL"
  | "CANCELLED"
  | "UNKNOWN";

export interface AiUsageEvent {
  _id?: string;
  createdAt: Date;

  provider: AiProviderName;
  model: string;
  pipeline: AiPipelineName;

  userId?: string | null;
  tenantId?: string | null;
  region?: string | null;
  locale?: string | null;

  tokensInput: number;
  tokensOutput: number;
  costEur: number;

  durationMs: number;
  success: boolean;
  errorKind?: AiErrorKind | null;
  strictJson?: boolean;
  promptSnippet?: string | null;
  responseSnippet?: string | null;
  rawError?: string | null;
}

export interface AiUsageDailyRow {
  date: string; // YYYY-MM-DD
  provider: AiProviderName;
  pipeline: AiPipelineName;
  region?: string | null;

  tokensTotal: number;
  costTotalEur: number;
  callsTotal: number;
  callsError: number;
}
