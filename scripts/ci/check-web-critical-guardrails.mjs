#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const checks = [
  {
    file: "apps/web/.env.example",
    description: "canonical MAIL_FROM in env example",
    validate(source) {
      return /^MAIL_FROM=/m.test(source) && !/^SMTP_FROM=/m.test(source);
    },
  },
  {
    file: "apps/web/.env.example",
    description: "canonical WEB_DATABASE_URL in env example",
    validate(source) {
      return /^WEB_DATABASE_URL=/m.test(source) && !/^DATABASE_URL=/m.test(source);
    },
  },
  {
    file: "core/db/prisma.ts",
    description: "no DATABASE_URL fallback in core web prisma bridge",
    validate(source) {
      return !source.includes("process.env.WEB_DATABASE_URL || process.env.DATABASE_URL");
    },
  },
  {
    file: "apps/web/src/utils/mailer.ts",
    description: "mailer uses centralized mail-from resolver",
    validate(source) {
      return source.includes("resolveMailFromForRuntime");
    },
  },
  {
    file: ".github/workflows/web-ci.yml",
    description: "web ci includes git diff --check",
    validate(source) {
      return source.includes("git diff --check");
    },
  },
  {
    file: ".github/workflows/web-ci.yml",
    description: "web ci includes build check",
    validate(source) {
      return source.includes("pnpm -C apps/web run build");
    },
  },
  {
    file: ".github/workflows/web-ci.yml",
    description: "web ci bootstraps build env from apps/web/.env.example",
    validate(source) {
      return source.includes("cp apps/web/.env.example apps/web/.env.local");
    },
  },
  {
    file: ".github/workflows/web-ci.yml",
    description: "web ci includes production guardrails",
    validate(source) {
      return source.includes("pnpm -C apps/web run test:production-guardrails");
    },
  },
  {
    file: ".github/workflows/web-ci.yml",
    description: "web ci includes focused security scan",
    validate(source) {
      return source.includes("gitleaks/gitleaks-action");
    },
  },
  {
    file: ".github/workflows/production-validation.yml",
    description:
      "manual production validation checks WEB_DATABASE_URL inside the runtime gate",
    validate(source) {
      return (
        source.includes(
          "if: ${{ vars.PRODUCTION_VALIDATION_ENABLED == '1' }}",
        ) &&
        source.includes(
          "WEB_DATABASE_URL: ${{ secrets.WEB_DATABASE_URL }}",
        ) &&
        /required=\([\s\S]*\bWEB_DATABASE_URL\b[\s\S]*\)/.test(
          source,
        ) &&
        source.includes(
          'if [[ -z "${MAIL_FROM}" && -z "${SMTP_FROM}" ]]; then',
        ) &&
        !source.includes("secrets.WEB_DATABASE_URL != ''")
      );
    },
  },
];

const errors = [];

for (const check of checks) {
  const filePath = path.join(ROOT, check.file);
  const source = fs.readFileSync(filePath, "utf8");
  if (!check.validate(source)) {
    errors.push(`${check.file}: ${check.description}`);
  }
}

const forbiddenPatterns = [
  {
    file: "apps/web/.env.example",
    pattern: /^DATABASE_URL=/m,
    description: "plain DATABASE_URL entry in apps/web/.env.example",
  },
  {
    file: "apps/web/src/utils/mailer.ts",
    pattern: /process\.env\.MAIL_FROM\s*\|\|/,
    description: "direct MAIL_FROM fallback in mailer",
  },
  {
    file: "apps/web/src/utils/email.ts",
    pattern: /EMAIL_DEFAULT_FROM/,
    description: "legacy EMAIL_DEFAULT_FROM usage in email utility",
  },
  {
    file: "core/db/prisma.ts",
    pattern: /DATABASE_URL/,
    description: "DATABASE_URL reference in core db web prisma bridge",
  },
];

for (const entry of forbiddenPatterns) {
  const filePath = path.join(ROOT, entry.file);
  const source = fs.readFileSync(filePath, "utf8");
  if (entry.pattern.test(source)) {
    errors.push(`${entry.file}: forbidden pattern detected (${entry.description})`);
  }
}

if (errors.length > 0) {
  console.error("[web-critical-guardrails] FAIL");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("[web-critical-guardrails] PASS");
