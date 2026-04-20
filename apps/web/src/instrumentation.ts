import { startStatusReportScheduler } from "@/features/ops/statusReport";

export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  startStatusReportScheduler();
}
