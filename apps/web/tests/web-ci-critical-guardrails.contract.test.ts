import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "../..");

function readRoot(relPath: string) {
  return readFileSync(path.join(ROOT, relPath), "utf8");
}

describe("web ci critical guardrails contract", () => {
  it("keeps the web env example on canonical MAIL_FROM and WEB_DATABASE_URL", () => {
    const source = readRoot("apps/web/.env.example");

    expect(source).toContain('MAIL_FROM="eDebatte <members@edebatte.org>"');
    expect(source).toContain(
      'MAIL_REPLY_TO="eDebatte Team <members@edebatte.org>"',
    );
    expect(source).not.toMatch(/no-?reply/i);
    expect(source).toContain("WEB_DATABASE_URL=postgresql://dev:devpassword@localhost:5433/vog?schema=public");
    expect(source).not.toMatch(/^SMTP_FROM=/m);
    expect(source).not.toMatch(/^DATABASE_URL=/m);
  });

  it("keeps the web ci workflow on contracts, production guardrails, build and security checks", () => {
    const workflow = readRoot(".github/workflows/web-ci.yml");

    expect(workflow).toContain("name: Web contracts");
    expect(workflow).toContain("git diff --check");
    expect(workflow).toContain("pnpm -C apps/web run test:web-pr-critical-guardrails");
    expect(workflow).toContain("pnpm -C apps/web run test:production-guardrails");
    expect(workflow).toContain("cp apps/web/.env.example apps/web/.env.local");
    expect(workflow).toContain("pnpm -C apps/web run build");
    expect(workflow).toContain("gitleaks/gitleaks-action@v2");
    expect(workflow).toMatch(/web-security:[\s\S]*actions\/checkout@v4[\s\S]*fetch-depth: 0[\s\S]*gitleaks\/gitleaks-action@v2/);
  });

  it("builds workspace packages before the web production build", () => {
    const packageJson = JSON.parse(readRoot("apps/web/package.json")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.prebuild).toBe(
      "pnpm --filter @vog/ui build && pnpm --filter @vog/tri-mongo build",
    );
  });

  it("keeps the production validation workflow on contract, guardrail smoke and no-secret live smoke", () => {
    const workflow = readRoot(".github/workflows/production-validation.yml");
    const liveSmokeScript = readRoot("scripts/ci/check-production-public-runtime.mjs");

    expect(workflow).toMatch(
      /production-contract:[\s\S]*cp apps\/web\/\.env\.example apps\/web\/\.env\.local[\s\S]*pnpm -C apps\/web run build/,
    );
    expect(workflow).toContain("name: Guardrail smoke");
    expect(workflow).toContain("name: Release live smoke");
    expect(workflow).toContain("node scripts/ci/check-production-public-runtime.mjs");
    expect(workflow).not.toContain("secrets.");
    expect(workflow).not.toContain("PRODUCTION_VALIDATION_ENABLED");
    expect(workflow).not.toContain("validate-web-runtime-env.ts");
    expect(workflow).not.toContain("release:validate:production");
    expect(workflow).not.toContain("WEB_DATABASE_URL:");
    expect(workflow).not.toContain("OPENAI_API_KEY");
    expect(workflow).not.toContain("MAIL_FROM");
    expect(workflow).not.toContain("SMTP_FROM");
    expect(liveSmokeScript).toContain('const BASE_URL = "https://www.edebatte.org";');
    expect(liveSmokeScript).toContain('"/"');
    expect(liveSmokeScript).toContain('"/themen"');
    expect(liveSmokeScript).toContain('"/dossier"');
    expect(liveSmokeScript).toContain('"/create"');
    expect(liveSmokeScript).toContain('"/pricing/institutionen"');
    expect(liveSmokeScript).toContain('"/order"');
    expect(liveSmokeScript).toContain('"CriticalProductionWebRuntimeEnvError"');
    expect(liveSmokeScript).toContain('"web_database_url_missing"');
    expect(liveSmokeScript).toContain("MAX_RETRIES = 3");
    expect(liveSmokeScript).toContain("CONNECT_TIMEOUT_MS = 5_000");
    expect(liveSmokeScript).toContain("TOTAL_TIMEOUT_MS = 15_000");
  });
});
