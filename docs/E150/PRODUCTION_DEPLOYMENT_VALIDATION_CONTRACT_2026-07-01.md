# Production Deployment Validation Contract

Stand: 2026-07-01

## 1. Zweck

Production Validation ist in diesem Repo ein manueller Release- und Deployment-Gate, nicht normales PR-CI.

- Kanonischer Trigger bleibt `workflow_dispatch` in `.github/workflows/production-validation.yml`.
- Der Workflow validiert produktkritische Runtime-, Public-Route- und Review-Guardrails.
- Der Workflow fuehrt kein Deploy, kein Auto-Publish, keine Auto-Activation, keinen Auto-Graph-Write und keinen Auto-Merge aus.

## 2. Abgrenzung zu Web CI

`web-ci.yml` und `production-validation.yml` haben bewusst unterschiedliche Aufgaben.

### Web CI

`.github/workflows/web-ci.yml` bleibt der normale PR-/`main`-Check und deckt aktuell nur Folgendes ab:

- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm -C apps/web typecheck`

Das ist bewusst schneller PR-Feedback-CI und kein Production-Deployment-Gate.

### Production Validation

`.github/workflows/production-validation.yml` bleibt bewusst manuell und deckt Folgendes ab:

- produktkritische Web-Build-Validierung
- gezielte Public-Route-Smokes
- gezielte Admin-/Review-Guardrails
- gezielte Publish-/Activation-Guardrails
- optional den bestehenden tieferen `release:validate:production`-Lauf, aber nur bei gesetztem Betreiber-Flag und vorhandenen Secrets

Damit bleibt normales PR-CI von Release-/Deployment-Gates getrennt, und der fruehere `No jobs were run`-Fehler auf PR-/`main`-Events wird nicht wieder eingefuehrt.

## 3. Pflichtchecks vor Production

Der manuelle Production-Validation-Contract besteht aus zwei immer laufenden Jobs und einem optional guarded Runtime-Gate.

### Immer Pflicht

- `git diff --check`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web run test:production-public-routes`
- `pnpm -C apps/web run test:production-admin-review`
- `pnpm -C apps/web run test:production-publish-guardrails`

### Optional, aber kanonisch fuer den tieferen Release-Gate-Lauf

- `pnpm run release:validate:production`

Dieser dritte Lauf bleibt nur aktiv, wenn `PRODUCTION_VALIDATION_ENABLED=1` und die benoetigten Repo-Secrets gesetzt sind. Fehlen sie, bleibt der Job bewusst `skipped`; der Workflow als Ganzes hat trotzdem reale gelaufene Jobs und endet nicht als `0s / No jobs were run`.

## 4. Kritische Pfade

Der Contract nennt nur Pfade, die im Repo bereits real existieren.

### Public

- `/beteiligung`
- `/beteiligung/[slug]`
- `/dossier/[id]`
- `/runden`
- `/anlassraum`
- `/api/dossier/[id]`

### Admin / Review

- `/admin/review`
- `/api/admin/dossier-publish/[sourceHandoffId]`
- `/api/admin/anlassraum-activation/[sourceHandoffId]`
- `/api/admin/participation-space-publish/[sourceHandoffId]`

### Public review-first intake

- `/api/community/source-review/submissions`

### Bereits im lokalen Release-Gate enthalten, aber nicht nochmals separat im fokussierten GitHub-Guardrail-Script verdoppelt

- `tests/runden-public-input.route.test.ts`
- weitere Smoke-Matrix aus `scripts/release/validate-production.mjs`

## 5. Guardrail-Invarianten

Diese Invarianten muessen im Workflow sichtbar bleiben und werden ueber die fokussierten Test-Suiten abgesichert:

- no auto publish
- no auto activation
- creation approval != publication approval
- activation approval != publication approval
- publication != fact verification
- source suggestion != verified source
- counter source != disproof
- lived experience != representative evidence
- trust/source quality != verification
- public route strips audit/review/admin/trust/moderation internals
- public submissions do not publish
- public submissions do not verify
- no graph write
- no merge
- no hidden DeepSearch/cost path

## 6. Release Blocker

Ein Production-Deployment darf nicht freigegeben werden, wenn einer der folgenden Punkte rot ist:

- `typecheck`, `lint` oder `build` schlagen fehl
- eine der fokussierten Guardrail-Suiten schlaegt fehl
- eine Public Route zeigt interne Audit-, Review-, Moderations- oder Trust-Daten
- nicht veroeffentlichte oder interne Inhalte werden oeffentlich sichtbar
- Publish-/Activation-Workflows erzeugen unerlaubte Side Effects
- die Public-Submission-API umgeht Review oder bindet an nicht oeffentliche Runtime
- `production-validation.yml` wuerde wieder auf normale PR-/`main`-Events mit `No jobs were run` zurueckfallen
- der tiefe `release:validate:production`-Lauf schlaegt fehl, wenn das guarded Runtime-Gate aktiviert ist

## 7. Manuelle Release-Checkliste

- `main` ist lokal sauber
- `origin/main` ist aktuell
- letzte PR-Checks sind gruen
- `Production Validation` wurde manuell gestartet
- `production-contract` und `guardrail-smoke` sind gruen
- `release-runtime-gate` ist entweder gruen oder bewusst `skipped`, weil das Betreiber-Flag oder Secrets fehlen
- Public Routes zeigen keine internen Daten
- `/admin/review` ist erreichbar und zeigt die Review-Workbench
- der bestehende Rollback-Pfad aus dem Runbook ist bekannt

## Implementierte Workflow-Skripte

Die fokussierten Guardrail-Suiten sind ueber `apps/web/package.json` verdrahtet:

- `test:production-public-routes`
- `test:production-admin-review`
- `test:production-publish-guardrails`
- `test:production-guardrails`

Diese Scripts verwenden nur bestehende Testdateien und fuehren keine neue Produktlogik ein.
