# WORKTREE-RECOVERY-ISOLATION-00

Datum: 2026-06-06
Repo: `edebatte-org`
Scope: reiner Recovery-/Isolations-Snapshot, keine Produktarbeit

## Zweck

Dieser Bericht dokumentiert den aktuellen Worktree-Drift, damit die offenen Änderungen anschließend in wieder sichere, kleine Commit-/PR-Slices zerlegt werden können.

Nicht Teil dieses Slices:
- keine fachlichen Codeänderungen
- keine Testanpassungen
- keine Statusänderungen in `docs/E150/OpenTasks.md`
- keine neuen Evidence-Dateien außer diesem Bericht
- keine Reverts
- keine Commits

## Git-Snapshot

- `git status --short`: `modified=102`, `untracked=100`
- `git diff --stat`: `102 files changed, 10876 insertions(+), 1790 deletions(-)`
- letzter Commit: `efde1b1e fix(create): restore non-blocking first-step planner fallback`
- Tests: nicht ausgeführt

## OpenTasks-Abgleich

Befund:
- `END-TO-END-CLOSED-PROCESS-QA-19` fehlt in `docs/E150/OpenTasks.md`
- mehrere Task-Cluster stehen in `OpenTasks.md` auf `done`, obwohl zugehörige Änderungen noch offen im Worktree liegen
- `OpenTasks.md` wurde in diesem Recovery-Slice nicht verändert

Done-Tasks mit noch offenen Änderungen:
- A: `UX-RUNDEN-GUIDE-ENTRY-02`
- B: `START-CREATE-LIGHT-ENTRY-01`, `START-CREATE-LIGHT-HERO-POLISH-02`, `START-CREATE-LIGHT-SUBMIT-AND-RELEVANCE-GATE-03`, `START-MOBILE-SCROLL-STABILITY-04`, `START-DRAFT-CONTEXT-HANDOFF-05`, `GLOBAL-DRAFT-STATUS-BAR-06`, `ACCOUNT-RESUME-WORKBENCH-07`, `BRANCH-WORKSPACE-HANDOFF-08`, `CLOSED-COSMOS-UX-AUDIT-09`, `DRAFT-TO-REVIEW-ANALYZE-GATE-10`
- C: `AI-ORCHESTRATOR-TRUTH-GUARD-11`, `AI-TRUTH-GUARD-FOLLOWUP-11B`, `TRUTH-GUARD-SURFACE-PROPAGATION-12`
- D: `EDITORIAL-REVIEW-QUEUE-13`, `EDITORIAL-REVIEW-QUEUE-AUDIT-13B`, `USER-CLARIFICATION-REPLY-FLOW-16`
- E: `FACTCHECK-ENTITLEMENT-GATE-14`, `FACTCHECK-JOB-RUNNER-PRODUCTION-PATH-17`, `REVIEW-QUEUE-READMODEL-DRIFT-AUDIT-17B`
- F: `REVIEWED-GRAPH-MERGE-15`, `GRAPH-CANDIDATE-STAGING-AUDIT-15B`, `PRODUCTIVE-GRAPH-MERGE-GATE-18`

## Cluster A: UX-RUNDEN-GUIDE-ENTRY-02

Status: teilweise
Isolierbar: ja, aber nur nach Abspaltung gemischter Start-/Draft-Handoff-Änderungen
Eigener Commit/PR sinnvoll: ja

Dateien:
```text
apps/web/src/app/runden/RundenPublicInputPanel.tsx
apps/web/src/app/runden/RundenPublicSharingGuide.tsx
apps/web/src/app/runden/new/AnlassraumOptionEditor.tsx
apps/web/src/app/runden/new/AnlassraumPrePublishCheck.tsx
apps/web/src/app/runden/new/AnlassraumSetupForm.tsx
apps/web/src/app/runden/new/AnlassraumSupportSettings.tsx
apps/web/src/app/runden/new/AnlassraumVisibilitySettings.tsx
apps/web/src/app/runden/page.tsx
apps/web/src/components/voxy/VoxyGuide.tsx
apps/web/src/features/surfaces/runden/manualAnlassraumSetup.ts
apps/web/src/features/voxy/voxyCopy.ts
apps/web/tests/runden-manual-create.page.contract.test.tsx
apps/web/tests/runden-page.acceptance.test.ts
apps/web/tests/runden-working-surface-copy.contract.test.ts
apps/web/tests/voxy-copy.contract.test.ts
docs/E150/UX-RUNDEN-GUIDE-ENTRY-02_2026-06-06.md
```

Passende Tests:
```text
apps/web/tests/runden-manual-create.page.contract.test.tsx
apps/web/tests/runden-page.acceptance.test.ts
apps/web/tests/runden-working-surface-copy.contract.test.ts
apps/web/tests/voxy-copy.contract.test.ts
```

Risiko:
- `apps/web/src/app/runden/new/AnlassraumSetupForm.tsx` enthält bereits Start-/Draft-Handoff-Logik und ist deshalb nicht rein UX-Runden
- `apps/web/src/components/voxy/VoxyGuide.tsx` ist shared UI und berührt potenziell weitere Cluster

## Cluster B: START/CREATE/DRAFT-KOSMOS 01-10

Status: teilweise bis riskant
Isolierbar: ja, aber nur in mehreren Sub-Slices
Eigener Commit/PR sinnvoll: ja, aber nicht als ein einzelner großer Review-PR

Dateien:
```text
apps/web/src/app/api/chat/route.ts
apps/web/src/app/api/create/intelligent-followup/route.ts
apps/web/src/app/create/CreateClient.tsx
apps/web/src/app/create/page.tsx
apps/web/src/app/start/LandingStart.tsx
apps/web/src/app/start/page.tsx
apps/web/src/app/themen/ThemenStartDraftAssistant.tsx
apps/web/src/app/themen/page.tsx
apps/web/src/components/analyze/AnalyzeWorkspace.tsx
apps/web/src/features/create/CreateVisualFollowup.tsx
apps/web/src/features/create/SharedCreateComposer.tsx
apps/web/src/features/create/analyzeContract.ts
apps/web/src/features/create/analyzeEnvelope.ts
apps/web/src/features/create/branchHandoffTargets.ts
apps/web/src/features/create/createPlanner.ts
apps/web/src/features/create/createProductionAccess.ts
apps/web/src/features/create/createSurfaceConfig.ts
apps/web/src/features/create/intelligentFollowup.ts
apps/web/src/features/create/intelligentFollowupContract.ts
apps/web/src/features/start/GlobalDraftStatusBar.tsx
apps/web/src/features/start/LandingCreateLightEntry.tsx
apps/web/src/features/start/StartDraftResumeBanner.tsx
apps/web/src/features/start/StartDraftWorkspaceChooser.tsx
apps/web/src/features/start/draftNextActionGate.ts
apps/web/src/features/start/landingCreateLight.ts
apps/web/src/features/start/startDraftContext.ts
apps/web/src/features/start/startExperience.ts
apps/web/src/server/createContributionDrafts.ts
features/create/createContributionLedger.ts
apps/web/tests/analyze-workbench-hidden-until-start.test.ts
apps/web/tests/branch-workspace-handoff.contract.test.ts
apps/web/tests/chat-route.contract.test.ts
apps/web/tests/closed-cosmos-ux-audit.contract.test.ts
apps/web/tests/create-branch-handoff-workbench.contract.test.tsx
apps/web/tests/create-branch-ledger-persistence.contract.test.tsx
apps/web/tests/create-degraded-followup-actions.contract.test.tsx
apps/web/tests/create-existing-match-counting.contract.test.tsx
apps/web/tests/create-mode-selector.contract.test.ts
apps/web/tests/create-mode.page.test.ts
apps/web/tests/create-mode.save.route.test.ts
apps/web/tests/create-multibranch-actions.contract.test.tsx
apps/web/tests/create-place-clarification.contract.test.tsx
apps/web/tests/create-place-planner-unavailable-stability.contract.test.tsx
apps/web/tests/create-place-registry-jurisdiction.contract.test.tsx
apps/web/tests/create-planner-complex-civic-input.contract.test.ts
apps/web/tests/create-planner-degraded-ui.contract.test.tsx
apps/web/tests/create-planner-openai-happy-path.contract.test.ts
apps/web/tests/create-planner-routing.contract.test.ts
apps/web/tests/create-planner-timeout.contract.test.ts
apps/web/tests/create-qr-swipes-drafts.contract.test.tsx
apps/web/tests/create-street-registry-lookup.contract.test.tsx
apps/web/tests/draft-to-review-analyze-gate.contract.test.ts
apps/web/tests/global-draft-status-bar.contract.test.tsx
apps/web/tests/landing-clarity.contract.test.tsx
apps/web/tests/landing-information-architecture.contract.test.tsx
apps/web/tests/mobile-entry-routes.contract.test.tsx
apps/web/tests/start-create-light-entry.contract.test.tsx
apps/web/tests/start-draft-context.contract.test.ts
apps/web/tests/start-draft-handoff-targets.contract.test.ts
apps/web/tests/start-shared-create-composer.contract.test.tsx
apps/web/tests/themen-surface-staging.contract.test.tsx
docs/E150/ACCOUNT-RESUME-WORKBENCH-07_2026-06-05.md
docs/E150/BRANCH-WORKSPACE-HANDOFF-08_2026-06-05.md
docs/E150/CLOSED-COSMOS-UX-AUDIT-09_2026-06-05.md
docs/E150/CREATE-BRANCH-HANDOFF-WORKBENCH-12_2026-06-04.md
docs/E150/CREATE-BRANCH-LEDGER-PERSISTENCE-05_2026-06-03.md
docs/E150/CREATE-EXISTING-MATCH-COUNTING-06_2026-06-04.md
docs/E150/CREATE-MULTIBRANCH-ACTION-BOARD-01_2026-06-03.md
docs/E150/CREATE-MULTIBRANCH-COMPLETION-COPY-07_2026-06-04.md
docs/E150/CREATE-MULTIBRANCH-FRONTEND-PILOT_GREEN_2026-06-03.md
docs/E150/CREATE-MULTIBRANCH-MICROCOPY-04_2026-06-03.md
docs/E150/CREATE-MULTIBRANCH-PILOT-FREEZE-08_2026-06-04.md
docs/E150/CREATE-MULTIBRANCH-PRODUCTION-POLISH-02_2026-06-03.md
docs/E150/CREATE-MULTIBRANCH-STABILITY-FIX-06_2026-06-04.md
docs/E150/CREATE-MULTIBRANCH-UX-POLISH-03_2026-06-03.md
docs/E150/CREATE-PLACE-BRANCH-COPY-NORMALIZATION-11_2026-06-04.md
docs/E150/CREATE-PLACE-CLARIFICATION-BRANCH-SCOPE-10_2026-06-04.md
docs/E150/CREATE-PLACE-CLARIFICATION-INTAKE-09_2026-06-04.md
docs/E150/CREATE-PLACE-PLANNER-UNAVAILABLE-STABILITY-11_2026-06-04.md
docs/E150/CREATE-PLACE-REGISTRY-JURISDICTION-08_2026-06-04.md
docs/E150/CREATE-PLACE-REGISTRY-JURISDICTION-STABILITY-10_2026-06-04.md
docs/E150/CREATE-QR-SWIPES-PUBLISH-PREP-07_2026-06-04.md
docs/E150/CREATE-STREET-REGISTRY-LOOKUP-12_2026-06-04.md
docs/E150/DRAFT-TO-REVIEW-ANALYZE-GATE-10_2026-06-06.md
docs/E150/GLOBAL-DRAFT-STATUS-BAR-06_2026-06-05.md
docs/E150/START-CREATE-LIGHT-ENTRY-01_2026-06-05.md
docs/E150/START-CREATE-LIGHT-HERO-POLISH-02_2026-06-05.md
docs/E150/START-CREATE-LIGHT-SUBMIT-AND-RELEVANCE-GATE-03_2026-06-05.md
docs/E150/START-DRAFT-CONTEXT-HANDOFF-05_2026-06-05.md
docs/E150/START-MOBILE-SCROLL-STABILITY-04_2026-06-05.md
```

Passende Tests:
- alle oben gelisteten `start-`, `create-`, `landing-`, `themen-`, `draft-` und `branch-` Contracts

Risiko:
- `apps/web/src/app/create/CreateClient.tsx` ist sehr groß und mischt Draft-Handoff, Planner, Entitlement-Hinweise und weitere Folgepfade
- `apps/web/src/components/analyze/AnalyzeWorkspace.tsx` hängt teils auch an Cluster C
- der Cluster enthält mehrere ältere Create-/Branch-/Place-Unterstränge und ist für einen Einzelcommit zu breit

## Cluster C: TRUTH-GUARD 11/11B/12

Status: teilweise
Isolierbar: ja
Eigener Commit/PR sinnvoll: ja

Dateien:
```text
apps/web/src/app/admin/telemetry/ai/orchestrator/page.tsx
apps/web/src/app/api/admin/ai/orchestrator-smoke/route.ts
apps/web/src/app/api/contributions/analyze/route.ts
apps/web/src/components/ai/RouteBoundCompanionPanel.tsx
apps/web/src/components/ai/VerificationStatusPanel.tsx
apps/web/src/components/analyze/AnalyzeWorkspace.tsx
apps/web/src/components/share/SocialOutputPreviewPanel.tsx
apps/web/src/features/ai/adminTelemetryDiagnostics.ts
apps/web/src/features/ai/providerSmokeDirectRunner.ts
apps/web/src/features/create/analyzeEnvelope.ts
features/ai/e150/disagreementConfidence.ts
features/ai/e150/routeBoundCompanion.ts
features/ai/e150/verificationContract.ts
features/ai/e150/verificationPresentation.ts
features/ai/orchestratorE150.ts
features/analyze/analyzeContribution.ts
features/share/socialOutputContract.ts
apps/web/tests/admin-ai-orchestrator-smoke.route.test.ts
apps/web/tests/ai-provider-smoke-cli.test.ts
apps/web/tests/create-analyze-envelope.verification.test.ts
apps/web/tests/create-analyze.route.test.ts
apps/web/tests/e150-disagreement-confidence.contract.test.ts
apps/web/tests/e150-truth-guard.contract.test.ts
apps/web/tests/e150-verification-presentation.contract.test.ts
apps/web/tests/route-bound-companion.contract.test.ts
apps/web/tests/social-output-contract.test.ts
apps/web/tests/truth-guard-surface-propagation.contract.test.tsx
docs/E150/AI-ORCHESTRATOR-TRUTH-GUARD-11_2026-06-06.md
docs/E150/AI-TRUTH-GUARD-FOLLOWUP-11B_2026-06-06.md
docs/E150/TRUTH-GUARD-SURFACE-PROPAGATION-12_2026-06-06.md
```

Passende Tests:
```text
apps/web/tests/admin-ai-orchestrator-smoke.route.test.ts
apps/web/tests/ai-provider-smoke-cli.test.ts
apps/web/tests/create-analyze-envelope.verification.test.ts
apps/web/tests/create-analyze.route.test.ts
apps/web/tests/e150-disagreement-confidence.contract.test.ts
apps/web/tests/e150-truth-guard.contract.test.ts
apps/web/tests/e150-verification-presentation.contract.test.ts
apps/web/tests/route-bound-companion.contract.test.ts
apps/web/tests/social-output-contract.test.ts
apps/web/tests/truth-guard-surface-propagation.contract.test.tsx
```

Risiko:
- `apps/web/src/app/api/contributions/analyze/route.ts` und `apps/web/src/components/analyze/AnalyzeWorkspace.tsx` liegen an der Grenze zu Cluster B

## Cluster D: EDITORIAL REVIEW 13/13B/16

Status: teilweise
Isolierbar: ja, aber wegen geteilter Surfaces mit E/F erst nach Entflechtung
Eigener Commit/PR sinnvoll: ja

Dateien:
```text
apps/web/src/app/account/AccountEditorialReviewReplyForm.tsx
apps/web/src/app/account/AccountEditorialReviewSection.tsx
apps/web/src/app/admin/review/EditorialReviewRequestActions.tsx
apps/web/src/app/api/admin/editorial-review-requests/[requestId]/route.ts
apps/web/src/app/api/contributions/save/route.ts
apps/web/src/app/api/editorial/review-requests/[requestId]/reply/route.ts
apps/web/src/app/api/editorial/review-requests/route.ts
apps/web/src/app/api/start/editorial-review/route.ts
features/editorialReviewQueue.ts
apps/web/tests/account-editorial-review.contract.test.tsx
apps/web/tests/admin-editorial-review.route.test.ts
apps/web/tests/editorial-review-reply.route.test.ts
apps/web/tests/editorial-review-requests.route.test.ts
apps/web/tests/start-editorial-review.route.test.ts
docs/E150/EDITORIAL-REVIEW-QUEUE-13_2026-06-06.md
docs/E150/EDITORIAL-REVIEW-QUEUE-AUDIT-13B_2026-06-06.md
docs/E150/USER-CLARIFICATION-REPLY-FLOW-16_2026-06-06.md
```

Passende Tests:
```text
apps/web/tests/account-editorial-review.contract.test.tsx
apps/web/tests/admin-editorial-review.route.test.ts
apps/web/tests/editorial-review-reply.route.test.ts
apps/web/tests/editorial-review-requests.route.test.ts
apps/web/tests/start-editorial-review.route.test.ts
```

Risiko:
- `apps/web/src/app/api/contributions/save/route.ts` hängt auch am allgemeinen Create-Speicherpfad

## Cluster E: FACTCHECK 14/17/17B

Status: teilweise
Isolierbar: ja
Eigener Commit/PR sinnvoll: ja

Dateien:
```text
apps/web/src/app/account/AccountFactcheckJobSection.tsx
apps/web/src/app/api/factcheck/enqueue/route.ts
apps/web/src/app/api/factcheck/result/[contributionId]/route.ts
apps/web/src/app/api/factcheck/status/[jobId]/route.ts
apps/web/src/app/api/factcheck/status/[jobId]/seal/route.ts
apps/web/src/app/demo/factcheck/page.tsx
apps/web/src/app/factcheck/page.tsx
apps/web/src/features/surfaces/factcheck/FactcheckHandoffShell.tsx
apps/web/src/features/surfaces/factcheck/FactcheckSurface.tsx
apps/web/src/hooks/useFactcheckJob.ts
features/ai/e150/factcheckStatus.ts
features/factcheck/db.ts
features/factcheck/entitlementGate.ts
features/factcheck/jobRunner.ts
features/factcheck/workflow.ts
features/reviewQueue.ts
apps/web/tests/account-factcheck-jobs.contract.test.tsx
apps/web/tests/factcheck-enqueue.auth.route.test.ts
apps/web/tests/factcheck-entitlement-gate.contract.test.ts
apps/web/tests/factcheck-job-runner.contract.test.ts
apps/web/tests/factcheck-status-seal.route.test.ts
apps/web/tests/factcheck-status.detail.contract.test.ts
apps/web/tests/review-queue.readmodel.test.ts
docs/E150/FACTCHECK-ENTITLEMENT-GATE-14_2026-06-06.md
docs/E150/FACTCHECK-JOB-RUNNER-PRODUCTION-PATH-17_2026-06-06.md
docs/E150/REVIEW-QUEUE-READMODEL-DRIFT-AUDIT-17B_2026-06-06.md
```

Passende Tests:
```text
apps/web/tests/account-factcheck-jobs.contract.test.tsx
apps/web/tests/factcheck-enqueue.auth.route.test.ts
apps/web/tests/factcheck-entitlement-gate.contract.test.ts
apps/web/tests/factcheck-job-runner.contract.test.ts
apps/web/tests/factcheck-status-seal.route.test.ts
apps/web/tests/factcheck-status.detail.contract.test.ts
apps/web/tests/review-queue.readmodel.test.ts
```

Risiko:
- `features/reviewQueue.ts` hat zugleich Berührung mit D und F

## Cluster F: GRAPH CANDIDATE / MERGE 15/15B/18

Status: teilweise
Isolierbar: ja
Eigener Commit/PR sinnvoll: ja

Dateien:
```text
apps/web/src/app/account/AccountGraphMergeCandidateSection.tsx
apps/web/src/app/admin/review/GraphMergeCandidateActions.tsx
apps/web/src/app/api/admin/graph-merge-candidates/[candidateId]/route.ts
features/graphMergeCandidates.ts
apps/web/tests/account-graph-candidate.contract.test.tsx
apps/web/tests/admin-graph-merge-candidate.route.test.ts
apps/web/tests/graph-merge-candidates.contract.test.ts
docs/E150/GRAPH-CANDIDATE-STAGING-AUDIT-15B_2026-06-06.md
docs/E150/PRODUCTIVE-GRAPH-MERGE-GATE-18_2026-06-06.md
docs/E150/REVIEWED-GRAPH-MERGE-15_2026-06-06.md
```

Passende Tests:
```text
apps/web/tests/account-graph-candidate.contract.test.tsx
apps/web/tests/admin-graph-merge-candidate.route.test.ts
apps/web/tests/graph-merge-candidates.contract.test.ts
```

Risiko:
- die produktive Admin-/Audit-Semantik hängt an gemeinsamen Review-/Account-Surfaces

## Cluster G: DOCS / EVIDENCE / OpenTasks

Status: riskant
Isolierbar: ja, aber erst nachdem die Code-Cluster fest zugeordnet sind
Eigener Commit/PR sinnvoll: ja, als letzter Dokumentations-Commit

Dateien:
```text
docs/E150/OpenTasks.md
docs/E150/ACCOUNT-RESUME-WORKBENCH-07_2026-06-05.md
docs/E150/AI-ORCHESTRATOR-TRUTH-GUARD-11_2026-06-06.md
docs/E150/AI-TRUTH-GUARD-FOLLOWUP-11B_2026-06-06.md
docs/E150/BRANCH-WORKSPACE-HANDOFF-08_2026-06-05.md
docs/E150/CLOSED-COSMOS-UX-AUDIT-09_2026-06-05.md
docs/E150/CREATE-BRANCH-HANDOFF-WORKBENCH-12_2026-06-04.md
docs/E150/CREATE-BRANCH-LEDGER-PERSISTENCE-05_2026-06-03.md
docs/E150/CREATE-EXISTING-MATCH-COUNTING-06_2026-06-04.md
docs/E150/CREATE-MULTIBRANCH-ACTION-BOARD-01_2026-06-03.md
docs/E150/CREATE-MULTIBRANCH-COMPLETION-COPY-07_2026-06-04.md
docs/E150/CREATE-MULTIBRANCH-FRONTEND-PILOT_GREEN_2026-06-03.md
docs/E150/CREATE-MULTIBRANCH-MICROCOPY-04_2026-06-03.md
docs/E150/CREATE-MULTIBRANCH-PILOT-FREEZE-08_2026-06-04.md
docs/E150/CREATE-MULTIBRANCH-PRODUCTION-POLISH-02_2026-06-03.md
docs/E150/CREATE-MULTIBRANCH-STABILITY-FIX-06_2026-06-04.md
docs/E150/CREATE-MULTIBRANCH-UX-POLISH-03_2026-06-03.md
docs/E150/CREATE-PLACE-BRANCH-COPY-NORMALIZATION-11_2026-06-04.md
docs/E150/CREATE-PLACE-CLARIFICATION-BRANCH-SCOPE-10_2026-06-04.md
docs/E150/CREATE-PLACE-CLARIFICATION-INTAKE-09_2026-06-04.md
docs/E150/CREATE-PLACE-PLANNER-UNAVAILABLE-STABILITY-11_2026-06-04.md
docs/E150/CREATE-PLACE-REGISTRY-JURISDICTION-08_2026-06-04.md
docs/E150/CREATE-PLACE-REGISTRY-JURISDICTION-STABILITY-10_2026-06-04.md
docs/E150/CREATE-QR-SWIPES-PUBLISH-PREP-07_2026-06-04.md
docs/E150/CREATE-STREET-REGISTRY-LOOKUP-12_2026-06-04.md
docs/E150/DRAFT-TO-REVIEW-ANALYZE-GATE-10_2026-06-06.md
docs/E150/EDITORIAL-REVIEW-QUEUE-13_2026-06-06.md
docs/E150/EDITORIAL-REVIEW-QUEUE-AUDIT-13B_2026-06-06.md
docs/E150/FACTCHECK-ENTITLEMENT-GATE-14_2026-06-06.md
docs/E150/FACTCHECK-JOB-RUNNER-PRODUCTION-PATH-17_2026-06-06.md
docs/E150/GLOBAL-DRAFT-STATUS-BAR-06_2026-06-05.md
docs/E150/GRAPH-CANDIDATE-STAGING-AUDIT-15B_2026-06-06.md
docs/E150/PRODUCTIVE-GRAPH-MERGE-GATE-18_2026-06-06.md
docs/E150/REVIEW-QUEUE-READMODEL-DRIFT-AUDIT-17B_2026-06-06.md
docs/E150/REVIEWED-GRAPH-MERGE-15_2026-06-06.md
docs/E150/START-CREATE-LIGHT-ENTRY-01_2026-06-05.md
docs/E150/START-CREATE-LIGHT-HERO-POLISH-02_2026-06-05.md
docs/E150/START-CREATE-LIGHT-SUBMIT-AND-RELEVANCE-GATE-03_2026-06-05.md
docs/E150/START-DRAFT-CONTEXT-HANDOFF-05_2026-06-05.md
docs/E150/START-MOBILE-SCROLL-STABILITY-04_2026-06-05.md
docs/E150/TRUTH-GUARD-SURFACE-PROPAGATION-12_2026-06-06.md
docs/E150/USER-CLARIFICATION-REPLY-FLOW-16_2026-06-06.md
docs/E150/UX-RUNDEN-GUIDE-ENTRY-02_2026-06-06.md
```

Risiko:
- `OpenTasks.md` markiert mehrere Cluster als `done`, obwohl die Code-/Test-/Evidence-Dateien noch offen im Worktree liegen
- die Evidence-Dateien sind erst belastbar, wenn die zugehörigen Code-Slices tatsächlich isoliert sind

## Cluster H: UNKLAR / RISIKO

Status: unklar
Isolierbar: noch nicht sicher
Eigener Commit/PR sinnvoll: nein, erst nach Entmischung

Dateien:
```text
apps/web/.env.example
apps/web/src/app/account/AccountClient.tsx
apps/web/src/app/admin/review/page.tsx
apps/web/src/app/globals.css
apps/web/src/features/quickActions/taskFirstQuickActions.ts
features/account/service.ts
features/account/types.ts
```

Begründung:
- `apps/web/src/app/account/AccountClient.tsx` bündelt Resume-, Editorial-, Factcheck- und Graph-Sektionen
- `apps/web/src/app/admin/review/page.tsx` bündelt Editorial-, Factcheck- und Graph-Adminflächen
- `apps/web/src/app/globals.css` enthält shared Visual-System-Drift über mehrere UX-Surfaces
- `features/account/service.ts` und `features/account/types.ts` aggregieren Daten aus mehreren Clustern
- `apps/web/.env.example` ist kein klarer Bestandteil eines der Recovery-Zielcluster

## Nicht angefasst

In diesem Recovery-Slice bewusst nicht angefasst:
- alle Source-Dateien unter `apps/web/src/**` und `features/**`
- alle Tests
- `docs/E150/OpenTasks.md`
- bestehende Evidence-Dateien
- Git-Historie, Staging, Reverts, Commits

Einzige neue Datei in diesem Slice:
- `docs/E150/WORKTREE-RECOVERY-ISOLATION-00_2026-06-06.md`

## Drei mögliche Aufräumstrategien

### Strategie A

Ein großer WIP-Sicherungscommit aller offenen Änderungen.

Einschätzung:
- gut als reines Backup
- schlecht als Review-/Freigabebasis
- erhöht nicht die thematische Klarheit

### Strategie B

Schrittweise Isolation in thematische Commits:
1. Runden UX
2. Draft/Start/Create
3. Truth-Guard
4. ReviewQueue
5. Factcheck
6. Graph/Merge
7. Docs/OpenTasks

Einschätzung:
- beste Balance aus Sicherheit, Reviewbarkeit und späterer Reproduzierbarkeit
- verlangt zuerst die Entmischung der Querschnittsdateien aus Cluster H
- bevorzugte Strategie

### Strategie C

Revert/Reset auf letzten sauberen Commit und gezieltes Wiederanwenden einzelner Slices.

Einschätzung:
- nur sinnvoll, wenn die Entmischung der offenen Änderungen scheitert
- derzeit nicht erste Empfehlung, weil mehrere Cluster bereits sichtbar strukturiert sind
- riskant ohne vorherige Sicherung, da lokale Arbeit verloren oder falsch neu zusammengesetzt werden könnte

## Empfehlung

Empfohlen wird Strategie B.

Kleinster sicherer nächster Schritt:
- zuerst Cluster H entmischen, insbesondere `AccountClient.tsx`, `admin/review/page.tsx`, `globals.css`, `features/account/service.ts`, `features/account/types.ts`
- danach Cluster A separat isolieren
- erst danach die übrigen Cluster B-F in eigenen thematischen Commits schneiden

## Recovery-Fazit

- der Worktree ist dokumentiert, aber noch nicht bereinigt
- `UX-RUNDEN-GUIDE-ENTRY-02` ist fachlich weitgehend umgesetzt, jedoch noch nicht sauber isoliert
- `END-TO-END-CLOSED-PROCESS-QA-19` ist weder in `OpenTasks.md` noch als Evidence vorhanden und darf vor der Bereinigung nicht gestartet werden
