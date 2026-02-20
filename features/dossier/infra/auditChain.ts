import crypto from "crypto";
import { canonicalize } from "./canonicalize";
import type { AuditEvent } from "./types";

export function createAuditEvent(input: Omit<AuditEvent, "eventHash">): AuditEvent {
  const base = canonicalize(input);
  const eventHash = crypto.createHash("sha256").update(base).digest("hex");

  return {
    ...input,
    eventHash,
  };
}
