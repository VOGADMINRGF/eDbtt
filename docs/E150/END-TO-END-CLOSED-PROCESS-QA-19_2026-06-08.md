# END-TO-END-CLOSED-PROCESS-QA-19

Datum: 2026-06-08

## Geprüfter Commit-Stand

- `304e2c32` `docs(e150): reconcile opentasks after worktree isolation`
- `8cb37bb6` `docs(e150): document start create draft worktree isolation`
- `8ee787d5` `fix(start): preserve draft context across create surfaces`
- `9470dd8e` `docs(e150): document editorial review worktree isolation`
- `eb14ef4d` `fix(review): add guarded editorial review workflow`
- `093a3b04` `docs(e150): document graph merge worktree isolation`
- `6ae14d43` `fix(graph): gate reviewed graph merge candidates`
- `93963265` `docs(e150): document factcheck worktree isolation`
- `4a7e7cc7` `fix(factcheck): gate and run confirmed source checks`
- `21b7a51f` `fix(ai): enforce truth guard across analyze surfaces`
- `b91ac694` `docs(e150): document runden worktree isolation`
- `be9d2702` `fix(runden): restore guided manual round entry`

## Restdrift-Gruppierung

### Create-/Planner-/Followup

- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/app/api/create/intelligent-followup/route.ts`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/features/create/createPlanner.ts`
- `apps/web/src/features/create/createProductionAccess.ts`
- `apps/web/src/features/create/createSurfaceConfig.ts`
- `apps/web/src/features/create/intelligentFollowup.ts`
- `apps/web/src/features/create/intelligentFollowupContract.ts`
- zugehörige `create-*` Tests

### Telemetry-/Orchestrator

- `apps/web/src/app/admin/telemetry/ai/orchestrator/page.tsx`
- `apps/web/src/app/api/admin/ai/orchestrator-smoke/route.ts`
- `apps/web/src/features/ai/adminTelemetryDiagnostics.ts`
- `apps/web/src/features/ai/providerSmokeDirectRunner.ts`
- `apps/web/tests/admin-ai-orchestrator-smoke.route.test.ts`
- `apps/web/tests/ai-provider-smoke-cli.test.ts`

### Voxy/Public-Style

- `apps/web/src/app/globals.css`
- `apps/web/src/components/voxy/VoxyGuide.tsx`
- `apps/web/src/features/voxy/voxyCopy.ts`
- `apps/web/tests/voxy-copy.contract.test.ts`

### Multibranch-/Place-/Street-Registry

- untracked `apps/web/src/features/create/{branchHandoffTargets.ts,placeResolution.ts}`
- untracked `features/create/`
- untracked `apps/web/tests/create-*` für Multibranch-/Place-/Street-Registry
- untracked `docs/E150/CREATE-*` Evidence-Dateien aus diesem Cluster

### OpenTasks/Evidence

- `docs/E150/OpenTasks.md`
- doppelte ID `PR-AI-CREATE-01I` bleibt als Backlog-Hygiene-Thema sichtbar
- zusätzliche untracked Recovery-/Evidence-Dateien außerhalb der abgeschlossenen Cluster

### Sonstiges

- `apps/web/.env.example`
- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/api/contributions/save/route.ts`
- `apps/web/src/features/quickActions/taskFirstQuickActions.ts`
- `apps/web/src/features/surfaces/runden/manualAnlassraumSetup.ts`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/account-organization-dashboard.page.test.tsx`

## Geprüfte End-to-End-Pfade

### Start / Create

- Start-Draft-Kontext wird übernommen (`start-draft-context`, `start-draft-handoff-targets`)
- `/create` übernimmt den Draft sichtbar und ohne doppelte Eingabe
- `CreateStartDraftHandoff` und `StartDraftWorkspaceChooser` halten Text und Zielkontext
- `GlobalDraftStatusBar` bleibt konservativ und draft-first

### Themen

- `/themen` übernimmt den Start-Draft
- bestehendes Thema vs. neues Thema bleibt klar
- kein Graph-Write aus Draft

### Runden

- `/runden/new` übernimmt Start-Drafts nur als Entwurf
- Optionen bleiben editierbar
- keine Stimmen im Draft
- keine automatische Runde

### Account

- Arbeitsstände für lokale Drafts, Create-Ledger, Editorial Review, Factcheck Jobs und Graph Candidates sind abgedeckt
- Weiterarbeiten-CTAs halten den Kontext
- Statussprache bleibt review-first

### Editorial Review

- Review-Requests entstehen review-first
- Spam/abusive/zu kurz wird geblockt
- Rückfrage/Antwort bleibt im bestehenden Request
- keine Veröffentlichung

### Factcheck

- Login-/Entitlement-/Bestätigungs-Gates bleiben aktiv
- kein Deep-Research ohne explizite Freigabe
- Job-Pfad bleibt `queued -> running -> completed|needs_manual_review`
- Ergebnisse bleiben review-first
- `sealed_verified` bleibt an `sealGranted=true` gebunden

### Graph / Merge

- kein GraphCandidate aus normalem Analyze-Automatismus
- Graph-Kandidaten bleiben staging-/audit-first
- `sourceSupport none/open` blockiert produktives Merge-Gate
- produktive Bestätigung bleibt auditpflichtig

### Admin Review

- Editorial, Factcheck und Graph sind über getrennte Tests und Surfaces abgesichert
- keine Vermischung der Statussprache in den geprüften Pfaden
- Aktionen bleiben begründet und guardrailed

## Guardrail-Ergebnis

Bestanden:

- kein Kontextverlust in den geprüften Handoff-Pfaden
- keine doppelte Eingabe im geschlossenen Draft-/Resume-Pfad
- keine automatische Veröffentlichung
- kein produktiver Vote aus Draft
- kein Auto-Graph
- kein Auto-Dossier
- kein Auto-Anlassraum
- keine Wahrheit durch eine einzelne KI
- keine Quellenprüfung ohne Login/Entitlement/Bestätigung
- lokale Drafts bleiben als lokale Drafts erkennbar
- Review/Factcheck/Graph bleiben review-first

## Testliste und Ergebnis

### Basis

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`

### Breite QA-Suite

- `pnpm -C apps/web exec vitest run tests/start-draft-context.contract.test.ts tests/start-draft-handoff-targets.contract.test.ts tests/start-create-light-entry.contract.test.tsx tests/start-shared-create-composer.contract.test.tsx tests/global-draft-status-bar.contract.test.tsx tests/branch-workspace-handoff.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/create-branch-ledger-persistence.contract.test.tsx tests/closed-cosmos-ux-audit.contract.test.ts tests/draft-to-review-analyze-gate.contract.test.ts tests/themen-surface-staging.contract.test.tsx tests/runden-manual-create.page.contract.test.tsx tests/start-editorial-review.route.test.ts tests/editorial-review-requests.route.test.ts tests/editorial-review-reply.route.test.ts tests/admin-editorial-review.route.test.ts tests/account-editorial-review.contract.test.tsx tests/admin-editorial-review.page.test.tsx tests/factcheck-entitlement-gate.contract.test.ts tests/factcheck-enqueue.auth.route.test.ts tests/create-analyze-entitlement-gate.route.test.ts tests/factcheck-job-runner.contract.test.ts tests/account-factcheck-jobs.contract.test.tsx tests/factcheck-status.detail.contract.test.ts tests/factcheck-status-seal.route.test.ts tests/admin-factcheck-jobs.page.test.tsx tests/graph-merge-candidates.contract.test.ts tests/admin-graph-merge-candidate.route.test.ts tests/account-graph-candidate.contract.test.tsx tests/admin-graph-merge-candidates.page.test.tsx tests/e150-truth-guard.contract.test.ts tests/e150-disagreement-confidence.contract.test.ts tests/create-analyze-envelope.verification.test.ts tests/create-analyze.route.test.ts tests/create-analyze.safety-gate.test.ts tests/e150-verification-presentation.contract.test.ts tests/truth-guard-surface-propagation.contract.test.tsx`

Ergebnis:

- `37/37` Testdateien grün
- `163/163` Tests grün

Hinweis:

- `tests/create-analyze.route.test.ts` loggt erwartete Fehlerpfade (`ANALYZE_TIMEOUT`, `ANALYZE_PROVIDER_FAILED`) als Teil der degradationssicheren Vertragsprüfung; das ist kein QA-Blocker.

## Kleine Fixes in diesem Slice

- `apps/web/tests/runden-manual-create.page.contract.test.tsx`

Anpassung:

- Strukturdrift auf den bereits isolierten `AnlassraumStartDraftPanel`-Pfad korrigiert
- keine Produktlogik geändert

## Offene Nicht-Blocker

- `PR-AI-CREATE-01I` bleibt doppelt in `OpenTasks.md`
- breiter Restdrift in Create-/Planner-/Telemetry-/Voxy-/Multibranch-Clustern bleibt vorhanden, ist aber für den geschlossenen QA-Pfad nicht blockierend
- `EDEBATTE-LIVE-EXCELLENCE-TRIAGE-01` ist noch nicht ausgeführt und bewusst nur als Triage-Folgetask vorgesehen

## Ergebnis

- Der geschlossene Prozess ist QA-bestanden.
- `EDEBATTE-LIVE-EXCELLENCE-TRIAGE-01` darf danach als nächster Triage-Slice starten.
