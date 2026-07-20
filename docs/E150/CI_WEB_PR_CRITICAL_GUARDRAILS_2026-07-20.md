# CI_WEB_PR_CRITICAL_GUARDRAILS_2026-07-20

## Ausgangslage

Der Repo-Stand hatte drei konkrete Schwachstellen im Web-/CI-Vertrag:

- `apps/web/.env.example` fuehrte den Mail-Absender nur als `SMTP_FROM`, waehrend Runtime und Workflows bereits `MAIL_FROM` verwendeten.
- Die Web-Runtime konnte in `core/db/prisma.ts` still auf ein fremdes `DATABASE_URL` zurueckfallen.
- `.github/workflows/web-ci.yml` war fuer PRs zu schmal und pruefte weder fokussierte Web-Guardrails noch Build-/Security-Kanten.

## Gewaehlte Loesung

### 1. Kanonische Mail-Absender-Migration

- `MAIL_FROM` ist jetzt der kanonische Absender fuer die Web-Runtime.
- `SMTP_FROM` bleibt waehrend der Migration als Legacy-Alias erlaubt.
- Wenn beide gesetzt sind und voneinander abweichen, schlagen Runtime-Contract und Tests bewusst fehl.
- `apps/web/.env.example` dokumentiert `MAIL_FROM` sichtbar; `SMTP_FROM` bleibt nur kommentiert als Legacy-Hinweis.

### 2. Kanonische Web-Datenbank

- `WEB_DATABASE_URL` ist jetzt der einzige akzeptierte Web-DB-Wert.
- Ein vorhandenes `DATABASE_URL` wird nicht mehr als Web-Fallback verwendet.
- Wenn nur `DATABASE_URL` gesetzt ist oder `WEB_DATABASE_URL` und `DATABASE_URL` voneinander abweichen, schlagen Runtime-Guardrails bewusst fehl.
- `core/db/prisma.ts` re-exportiert jetzt den kanonischen `@db/web/client`, statt einen zweiten Prisma-Pfad mit Fallback zu pflegen.

### 3. Sichere Startup-/Contract-Validierung

- `apps/web/src/lib/server/webRuntimeEnv.ts` sammelt und validiert kritische Web-Runtime-Regeln zentral.
- Bei produktivem Node-Startup ausserhalb der Build-Phase werden mindestens folgende Produktionsvariablen fail-closed geprueft:
  - `JWT_SECRET`
  - `WEB_DATABASE_URL`
  - `MAIL_FROM` oder temporaer `SMTP_FROM`
- Die Validierung laeuft in `apps/web/src/instrumentation.ts` nur fuer echten Production-Startup, nicht fuer `phase-production-build`.

## Required Checks

Fuer PRs auf dem Web-Repo-Stand sollen die folgenden GitHub Checks als Required Checks gesetzt werden:

- `Web contracts`
- `Web quality`
- `Web security`

## GitHub Variables / Secrets

### Fuer normales PR-CI

- keine zusaetzlichen produktiven Secrets erforderlich

### Fuer manuellen Production-Validation-Lauf

#### Variables

- `PRODUCTION_VALIDATION_ENABLED=1`

#### Secrets

- `JWT_SECRET`
- `WEB_DATABASE_URL`
- `MAIL_FROM` bevorzugt
- `SMTP_FROM` nur temporaer als Legacy-Alias, falls `MAIL_FROM` noch nicht migriert ist
- `CORE_DB_NAME`
- `CORE_MONGODB_URI`
- `VOTES_DB_NAME`
- `VOTES_MONGODB_URI`
- `PII_DB_NAME`
- `PII_MONGODB_URI`
- `AI_CORE_READER_DB_NAME`
- `AI_CORE_READER_MONGODB_URI`
- `NEO4J_URI`
- `NEO4J_USER`
- `NEO4J_PASSWORD`
- `ARANGO_URL`
- `ARANGO_DB`
- `ARANGO_USER`
- `ARANGO_ROOT_PASSWORD`
- `MEMGRAPH_URI`
- optional weiter wie bisher: `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_TIMEOUT_MS`, `OPENAI_URL`

## Workflow-Aufteilung

### `.github/workflows/web-ci.yml`

- `Web contracts`
  - `git diff --check`
  - fokussierte Web-Env-/Workflow-/SMTP-Guardrail-Tests
  - bestehende `test:production-guardrails`
  - Repo-Pattern-Check fuer kritische Web-Guardrails
- `Web quality`
  - Root-`lint`
  - Web-`typecheck`
  - Web-`build`
- `Web security`
  - `gitleaks`
  - derselbe fokussierte Pattern-Check fuer gefaehrliche Muster

### `.github/workflows/production-validation.yml`

- bleibt `workflow_dispatch`-only
- prueft den manuellen Runtime-Gate weiter nur bei gesetztem Betreiber-Flag und vorhandenen Secrets
- fuehrt kein Deploy aus

## Nicht Teil dieses Slices

- kein Auto-Deploy
- keine echte Production-Validierung auf PR-Events
- keine neuen Secrets
- keine Vercel-/Browser-E2E-Automation

## Geaenderte Dateien

- `apps/web/.env.example`
- `apps/web/src/lib/server/webRuntimeEnv.ts`
- `apps/web/src/instrumentation.ts`
- `apps/web/src/utils/{email.ts,env.ts,mailer.ts}`
- `apps/web/src/types/env.d.ts`
- `packages/db-web/src/client.ts`
- `core/db/prisma.ts`
- `.github/workflows/{web-ci.yml,production-validation.yml,e150-ci.yml}`
- `scripts/ci/{check-web-critical-guardrails.mjs,validate-web-runtime-env.ts}`
- `apps/web/tests/{web-runtime-env.guardrails.test.ts,web-ci-critical-guardrails.contract.test.ts}`
- `apps/web/package.json`

## Validierung

- `git diff --check`
- fokussierte Web-Guardrail-Tests
- `pnpm -C apps/web run test:production-guardrails`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run build`
- YAML-Parse fuer geaenderte Workflows

## Ergebnis

Der PR-Check ist jetzt deutlich naeher an der realen Web-Produktwahrheit:

- Mail-Absender ist kanonisch und migrationsfaehig
- die Web-DB akzeptiert keinen stillen `DATABASE_URL`-Drift mehr
- produktive Pflichtvariablen koennen fail-closed validiert werden
- PR-CI prueft jetzt nicht nur Lint/Typecheck, sondern auch Build, Production-Guardrails, Diff-Sauberkeit und gezielte Security-Muster
- echte Production-Validierung und Deployments bleiben bewusst manuell
