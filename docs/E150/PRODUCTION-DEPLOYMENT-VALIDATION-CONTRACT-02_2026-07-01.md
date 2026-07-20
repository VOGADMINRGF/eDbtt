# PRODUCTION-DEPLOYMENT-VALIDATION-CONTRACT-02

## Ausgangslage nach #273

Nach `#273` sind die zentralen Produktpfade fuer Dossier, Anlassraum und Beteiligungsraum weitgehend geschlossen. Gleichzeitig war `production-validation.yml` bereits auf `workflow_dispatch` begrenzt worden, damit normale PR-/`main`-Runs nicht wieder als rote `0s`-Laeufe mit `No jobs were run` enden.

## Gepruefter Bestand

Vor dem Slice waren drei relevante Workflow-Klassen im Repo sichtbar:

- `.github/workflows/web-ci.yml`
  - normaler PR-/`main`-Check
  - deckt `install`, Root-`lint` und Web-`typecheck` ab
- `.github/workflows/production-validation.yml`
  - manueller Workflow
  - hatte bereits echte Jobs, aber noch keinen expliziten Production-Contract fuer Build plus fokussierte Guardrails
- `.github/workflows/e150-ci.yml`
  - manueller Legacy-/Ops-Workflow
  - nicht der kanonische PR- oder Production-Validation-Check

Ausserdem war bereits ein lokaler tiefer Release-Gate vorhanden:

- `pnpm run release:validate:production`
- `scripts/release/validate-production.mjs`

Dieser Lauf deckt eine breitere Smoke-Matrix und den frischen `.next`-Build ab, bleibt aber im GitHub-Workflow bewusst guarded.

## Was Web CI abdeckt

`.github/workflows/web-ci.yml` bleibt der schnelle PR-/`main`-Check, ist aber nicht mehr auf nur drei Basisbefehle begrenzt. Der Workflow deckt jetzt ab:

- `pnpm install --frozen-lockfile`
- `git diff --check`
- `pnpm -C apps/web run test:web-pr-critical-guardrails`
- `pnpm -C apps/web run test:production-guardrails`
- `node scripts/ci/check-web-critical-guardrails.mjs`
- `pnpm lint`
- `pnpm -C apps/web run typecheck`
- `cp apps/web/.env.example apps/web/.env.local`
- `pnpm -C apps/web run build`
- einen gezielten Secret- und Pattern-Scan ueber `gitleaks`

Web CI bleibt damit bewusst schneller PR-Feedback-CI und kein Release-Gate, enthaelt aber jetzt die kritischen Web- und Workflow-Guardrails als feste Vertragschecks.

## Was Production Validation jetzt abdeckt

`.github/workflows/production-validation.yml` ist jetzt als manueller Contract in drei Ebenen verdrahtet:

1. `production-contract`
   - `git diff --check`
   - Web `typecheck`
   - Web `lint`
   - Web `build`

2. `guardrail-smoke`
   - `pnpm -C apps/web run test:production-guardrails`
   - nutzt nur bestehende fokussierte Testdateien

3. `release-runtime-gate`
   - bleibt an `PRODUCTION_VALIDATION_ENABLED=1` plus Repo-Secrets gebunden
   - validiert zunaechst den produktionsnahen Web-Runtime-Contract
   - startet erst danach den bestehenden tieferen `pnpm run release:validate:production`-Lauf

## Kritische Web-Runtime-Variablen

Der Slice fuehrt einen expliziten fail-closed Contract fuer die Web-Runtime ein:

- `WEB_DATABASE_URL` ist der einzige kanonische Datenbankwert fuer Web-Runtime und Web-PR-Validierung.
- `DATABASE_URL` darf nicht stillschweigend als Web-Fallback wirken.
- `MAIL_FROM` ist kanonisch; `SMTP_FROM` bleibt nur als rueckwaertskompatibler Alias.
- bei gesetzten `MAIL_FROM` und `SMTP_FROM` ist Wertgleichheit Pflicht.
- `JWT_SECRET`, `WEB_DATABASE_URL` und ein gueltiger Mail-Absender werden in produktionsnahen Serverstarts explizit validiert.

## Warum `workflow_dispatch` korrekt bleibt

Production Validation ist weiterhin kein normaler PR-/`main`-Check.

- Die Jobs sind release-nah und bewusst schwerer als `web-ci.yml`.
- Das tiefe Runtime-Gate braucht Betreiberkonfiguration.
- Die Trennung verhindert, dass normale PR-/`main`-Events erneut rote `No jobs were run`-Runs erzeugen.
- Gleichzeitig laufen jetzt im manuellen Workflow immer echte Jobs, auch wenn das secret-gebundene Runtime-Gate bewusst `skipped` bleibt.

## Enthaltene Guardrail-Suiten

### Public route smoke

- `tests/participation-space-public-route-runtime.test.tsx`
- `tests/dossier-public-route-runtime.test.tsx`
- `tests/anlassraum-public-route-runtime.test.ts`

### Admin / Review guardrails

- `tests/admin-review.page.test.tsx`
- `tests/community-source-review-workbench-ui.test.tsx`
- `tests/community-source-review-public-submission-api.test.ts`

### Publish / Activation guardrails

- `tests/participation-space-publish-workflow.test.ts`
- `tests/participation-space-publish-admin.test.tsx`
- `tests/dossier-publish-workflow.test.ts`
- `tests/dossier-publish-admin.test.tsx`
- `tests/anlassraum-activation-workflow.test.ts`
- `tests/anlassraum-activation-admin.test.tsx`

## Definierte Release-Blocker

- `typecheck`, `lint` oder `build` rot
- fokussierte Guardrail-Suite rot
- Public-Route-Leak von Audit-/Review-/Moderations-/Trust-Daten
- oeffentliche Sichtbarkeit nicht veroeffentlichter Inhalte
- Publish-/Activation-Sideeffects ausserhalb des review-first Contracts
- Public-Submission-API umgeht Review
- Rueckfall auf `No jobs were run` durch falschen Trigger-Scope

## Bewusst offen

Der Slice fuehrt bewusst nicht ein:

- keinen Deploy-Schritt
- keine externe Browser-/Vercel-E2E-Abhaengigkeit
- kein Monitoring/Alerting
- keine Rollback-Automation
- keine erweiterte Public-Moderation-Operationswelt

Diese Folgepfade bleiben offen:

- `PUBLIC-MODERATION-OPERATIONS-07`
- externe E2E-/Browser-Smokes
- Monitoring/Alerting
- Rollback-Automation

## Geaenderte Dateien

- `.github/workflows/web-ci.yml`
- `.github/workflows/production-validation.yml`
- `.github/workflows/e150-ci.yml`
- `apps/web/.env.example`
- `apps/web/package.json`
- `apps/web/src/lib/server/webRuntimeEnv.ts`
- `apps/web/src/instrumentation.ts`
- `apps/web/src/utils/email.ts`
- `apps/web/src/utils/env.ts`
- `apps/web/src/utils/mailer.ts`
- `apps/web/src/types/env.d.ts`
- `packages/db-web/src/client.ts`
- `core/db/prisma.ts`
- `scripts/ci/check-web-critical-guardrails.mjs`
- `scripts/ci/validate-web-runtime-env.ts`
- `apps/web/tests/web-runtime-env.guardrails.test.ts`
- `apps/web/tests/web-ci-critical-guardrails.contract.test.ts`
- `docs/E150/PRODUCTION_DEPLOYMENT_VALIDATION_CONTRACT_2026-07-01.md`
- `docs/E150/PRODUCTION-DEPLOYMENT-VALIDATION-CONTRACT-02_2026-07-01.md`
- `docs/E150/CI_WEB_PR_CRITICAL_GUARDRAILS_2026-07-20.md`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`

## Lokale Validierung

Geplant fuer diesen Slice:

- `ruby -e "require 'yaml'; YAML.load_file('.github/workflows/production-validation.yml'); puts 'yaml ok'"`
- `git diff --check`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web run test:production-guardrails`

## Ergebnis

Der Repo-Stand hat jetzt einen dokumentierten und technisch verdrahteten Production-Deployment-Validation-Contract:

- manuell statt PR-/`main`-triggered
- mit echten Jobs statt `0s / No jobs were run`
- ohne Deploy
- mit expliziten Public-Route-, Admin-/Review- und Publish-/Activation-Guardrails
- mit klarer Trennung zwischen Web CI, manuellem Deployment-Gate und dem tieferen guarded Runtime-Gate
