import { describe, expect, it } from "vitest";
import {
  isBerlinDigestHour,
  OPERATOR_RECIPIENTS,
} from "@/features/operator/operatorNotifications";

describe("operator notification routing contract", () => {
  it("pins operational recipients to the requested inboxes", () => {
    expect(OPERATOR_RECIPIENTS).toEqual({
      createSubmission: "social@edebatte.org",
      supportTicket: "qa-auth@edebatte.org",
      memberRegistration: "members@edebatte.org",
      dailyDigest: "rgf@voiceopengov.org",
    });
  });

  it("recognizes 18:00 Europe/Berlin in summer and winter", () => {
    expect(isBerlinDigestHour(new Date("2026-09-05T16:00:00.000Z"))).toBe(true);
    expect(isBerlinDigestHour(new Date("2026-01-05T17:00:00.000Z"))).toBe(true);
  });

  it("rejects the neighboring UTC cron slot after Berlin 18:00 already passed", () => {
    expect(isBerlinDigestHour(new Date("2026-09-05T17:00:00.000Z"))).toBe(false);
    expect(isBerlinDigestHour(new Date("2026-01-05T16:00:00.000Z"))).toBe(false);
  });
});
