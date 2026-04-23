import { registerStatusReportSchedulerFromInstrumentation } from "@/features/ops/statusReport/instrumentation";

export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  registerStatusReportSchedulerFromInstrumentation();
}
