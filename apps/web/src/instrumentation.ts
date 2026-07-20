import { registerStatusReportSchedulerFromInstrumentation } from "@/features/ops/statusReport/instrumentation";
import { validateProductionStartupEnv } from "@/lib/server/webRuntimeEnv";

export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  validateProductionStartupEnv();
  registerStatusReportSchedulerFromInstrumentation();
}
