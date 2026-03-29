import { describe, expect, it } from "vitest";
import { resolveSocialEscalationPolicy } from "@/lib/social/escalationPolicy";

describe("social escalation policy resolver", () => {
  it("defaults to denied without moderated/curated context", () => {
    const decision = resolveSocialEscalationPolicy({
      context: null,
      optIn: false,
      trustSignal: false,
      verificationSignal: false,
    });

    expect(decision).toMatchObject({
      allowed: false,
      context: null,
      reason: "missing_allowed_context",
    });
  });

  it("requires opt-in even in curated/moderated context", () => {
    const decision = resolveSocialEscalationPolicy({
      context: "curated",
      optIn: false,
      trustSignal: true,
      verificationSignal: false,
    });

    expect(decision).toMatchObject({
      allowed: false,
      context: "curated",
      reason: "missing_opt_in",
    });
  });

  it("requires trust or verification signal in allowed context", () => {
    const denied = resolveSocialEscalationPolicy({
      context: "moderated_space",
      optIn: true,
      trustSignal: false,
      verificationSignal: false,
    });
    expect(denied.reason).toBe("missing_trust_or_verification");
    expect(denied.allowed).toBe(false);

    const allowed = resolveSocialEscalationPolicy({
      context: "moderated_space",
      optIn: true,
      trustSignal: true,
      verificationSignal: false,
    });
    expect(allowed).toMatchObject({
      allowed: true,
      context: "moderated",
      reason: "allowed",
    });
  });
});
