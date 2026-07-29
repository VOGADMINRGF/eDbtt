import { after } from "next/server";
import {
  logAuthEventBestEffort,
  type AuthEventName,
  type AuthEventPayload,
} from "@core/telemetry/authEvents";

export function scheduleAuthEvent(
  event: AuthEventName,
  payload?: AuthEventPayload,
) {
  try {
    after(async () => {
      try {
        await logAuthEventBestEffort(event, payload);
      } catch {
        // Auth telemetry must never change the response outcome.
      }
    });
  } catch {
    // Scheduling is best-effort when no request lifetime is available.
  }
}
