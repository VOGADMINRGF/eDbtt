import { describe, expect, it } from "vitest";
import {
  CriticalProductionWebRuntimeEnvError,
  assertCriticalProductionWebRuntimeEnv,
  resolveCanonicalMailFrom,
  resolveCanonicalWebDatabaseUrl,
  resolveMailFromForRuntime,
  shouldValidateProductionStartupEnv,
} from "@/lib/server/webRuntimeEnv";

describe("web runtime env guardrails", () => {
  it("uses MAIL_FROM as canonical sender and allows SMTP_FROM only as a legacy alias", () => {
    expect(
      resolveCanonicalMailFrom({
        MAIL_FROM: "canonical@example.org",
        SMTP_FROM: "legacy@example.org",
      }),
    ).toMatchObject({
      value: "canonical@example.org",
      source: "MAIL_FROM",
      usesLegacyAlias: false,
    });

    expect(
      resolveCanonicalMailFrom({
        SMTP_FROM: "legacy@example.org",
      }),
    ).toMatchObject({
      value: "legacy@example.org",
      source: "SMTP_FROM",
      usesLegacyAlias: true,
    });
  });

  it("flags conflicting mail sender values", () => {
    const result = resolveCanonicalMailFrom({
      MAIL_FROM: "one@example.org",
      SMTP_FROM: "two@example.org",
    });

    expect(result.issues.map((issue) => issue.code)).toContain("mail_from_conflict");
  });

  it("accepts only WEB_DATABASE_URL as canonical web database source", () => {
    expect(
      resolveCanonicalWebDatabaseUrl({
        WEB_DATABASE_URL: "postgresql://web",
      }),
    ).toMatchObject({
      value: "postgresql://web",
      issues: [],
    });

    expect(
      resolveCanonicalWebDatabaseUrl({
        DATABASE_URL: "postgresql://foreign",
      }).issues.map((issue) => issue.code),
    ).toEqual(["database_url_without_web_database_url"]);
  });

  it("flags conflicting WEB_DATABASE_URL and DATABASE_URL values", () => {
    const result = resolveCanonicalWebDatabaseUrl({
      WEB_DATABASE_URL: "postgresql://web",
      DATABASE_URL: "postgresql://foreign",
    });

    expect(result.issues.map((issue) => issue.code)).toContain("web_database_url_conflict");
  });

  it("asserts critical production env requirements without exposing secrets", () => {
    expect(() =>
      assertCriticalProductionWebRuntimeEnv({
        NODE_ENV: "production",
        JWT_SECRET: "secret",
        WEB_DATABASE_URL: "postgresql://web",
        MAIL_FROM: "ops@example.org",
      }),
    ).not.toThrow();

    expect(() =>
      assertCriticalProductionWebRuntimeEnv({
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://foreign",
        SMTP_FROM: "legacy@example.org",
      }),
    ).toThrow(CriticalProductionWebRuntimeEnvError);
  });

  it("skips startup enforcement during the production build phase but not at runtime", () => {
    expect(
      shouldValidateProductionStartupEnv({
        NODE_ENV: "production",
        NEXT_PHASE: "phase-production-build",
      }),
    ).toBe(false);
    expect(
      shouldValidateProductionStartupEnv({
        NODE_ENV: "production",
        NEXT_PHASE: "phase-production-server",
      }),
    ).toBe(true);
  });

  it("falls back to a local sender only outside the validated production contract", () => {
    expect(resolveMailFromForRuntime({})).toBe("no-reply@localhost");
  });
});
