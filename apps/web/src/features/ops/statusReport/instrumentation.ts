import { startStatusReportScheduler } from "./scheduler";

export function registerStatusReportSchedulerFromInstrumentation(): void {
  startStatusReportScheduler();
}
