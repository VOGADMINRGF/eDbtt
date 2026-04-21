import { startStatusReportScheduler } from "@/features/ops/statusReport/scheduler";

export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  startStatusReportScheduler();
}
