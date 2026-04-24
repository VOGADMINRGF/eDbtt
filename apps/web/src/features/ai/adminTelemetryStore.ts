import type { ProviderDiagnostic, SmokeMode } from "@/features/ai/adminTelemetryDiagnostics";

export type AdminAiRunRecord = {
  runId: string;
  correlationId: string;
  mode: SmokeMode;
  startedAt: number;
  finishedAt: number;
  ok: boolean;
  rows: ProviderDiagnostic[];
  bestProviderId?: string | null;
};

const MAX_RUNS = Number(process.env.ADMIN_AI_TELEMETRY_RUNS_MAX ?? 120);
const runs: AdminAiRunRecord[] = [];

export function recordAdminAiRun(run: AdminAiRunRecord): void {
  runs.push(run);
  if (runs.length > MAX_RUNS) {
    runs.splice(0, runs.length - MAX_RUNS);
  }
}

export function listAdminAiRuns(limit = 30): AdminAiRunRecord[] {
  if (limit <= 0) return [];
  return runs.slice(Math.max(0, runs.length - limit)).reverse();
}

export function clearAdminAiRunsForTests(): void {
  runs.splice(0, runs.length);
}
