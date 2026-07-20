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

    expect(source).toContain('MAIL_FROM="eDebatte <no-reply@edebatte.org>"');
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
  });

  it("keeps the manual production validation gate on WEB_DATABASE_URL and backward-compatible mail secrets", () => {
    const workflow = readRoot(".github/workflows/production-validation.yml");

    expect(workflow).toContain("secrets.WEB_DATABASE_URL != ''");
    expect(workflow).toContain("(secrets.MAIL_FROM != '' || secrets.SMTP_FROM != '')");
    expect(workflow).toContain("WEB_DATABASE_URL: ${{ secrets.WEB_DATABASE_URL }}");
    expect(workflow).toContain("SMTP_FROM: ${{ secrets.SMTP_FROM }}");
    expect(workflow).toContain("pnpm exec tsx scripts/ci/validate-web-runtime-env.ts");
  });
});
