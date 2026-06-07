# WORKTREE-COMMIT-FACTCHECK-00L

Datum: 2026-06-06
Commit: `4a7e7cc7 fix(factcheck): gate and run confirmed source checks`

## Ziel

Den isolierten Factcheck-/Entitlement-/Runner-Cluster aus

- `FACTCHECK-ENTITLEMENT-GATE-14`
- `FACTCHECK-JOB-RUNNER-PRODUCTION-PATH-17`
- `REVIEW-QUEUE-READMODEL-DRIFT-AUDIT-17B`

sauber committen, ohne Graph-, Editorial-, Start-/Draft-, Runden- oder Truth-Guard-Drift mitzuziehen.

## Commit-Inhalt

Committed wurden:

- `apps/web/src/app/account/AccountFactcheckJobSection.tsx`
- `apps/web/src/app/admin/review/AdminFactcheckJobsSection.tsx`
- `apps/web/src/app/admin/review/FactcheckJobActions.tsx`
- `apps/web/src/app/admin/review/loadAdminFactcheckJobs.ts`
- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/api/contributions/analyze/researchEntitlementGate.ts`
- `apps/web/src/app/api/contributions/analyze/route.ts`
- `apps/web/src/app/api/factcheck/enqueue/route.ts`
- `apps/web/src/app/api/factcheck/result/[contributionId]/route.ts`
- `apps/web/src/app/api/factcheck/status/[jobId]/route.ts`
- `apps/web/src/app/api/factcheck/status/[jobId]/seal/route.ts`
- `apps/web/src/app/demo/factcheck/page.tsx`
- `apps/web/src/app/factcheck/page.tsx`
- `apps/web/src/features/surfaces/factcheck/FactcheckHandoffShell.tsx`
- `apps/web/src/features/surfaces/factcheck/FactcheckSurface.tsx`
- `apps/web/src/hooks/useFactcheckJob.ts`
- `apps/web/tests/account-factcheck-jobs.contract.test.tsx`
- `apps/web/tests/admin-factcheck-jobs.page.test.tsx`
- `apps/web/tests/create-analyze-entitlement-gate.route.test.ts`
- `apps/web/tests/factcheck-enqueue.auth.route.test.ts`
- `apps/web/tests/factcheck-entitlement-gate.contract.test.ts`
- `apps/web/tests/factcheck-job-runner.contract.test.ts`
- `apps/web/tests/factcheck-status-seal.route.test.ts`
- `apps/web/tests/factcheck-status.detail.contract.test.ts`
- `apps/web/tests/review-queue.readmodel.test.ts`
- `docs/E150/FACTCHECK-ENTITLEMENT-GATE-14_2026-06-06.md`
- `docs/E150/FACTCHECK-JOB-RUNNER-PRODUCTION-PATH-17_2026-06-06.md`
- `docs/E150/REVIEW-QUEUE-READMODEL-DRIFT-AUDIT-17B_2026-06-06.md`
- `docs/E150/WORKTREE-DECOUPLE-FACTCHECK-FROM-GRAPH-00L2_2026-06-06.md`
- `docs/E150/WORKTREE-ISOLATE-FACTCHECK-00J_2026-06-06.md`
- `docs/E150/WORKTREE-UNTANGLE-FACTCHECK-ADMIN-GRAPH-00K_2026-06-06.md`
- `features/ai/e150/factcheckStatus.ts`
- `features/factcheck/db.ts`
- `features/factcheck/entitlementGate.ts`
- `features/factcheck/jobRunner.ts`
- `features/factcheck/workflow.ts`
- `features/reviewQueue.ts`

## Ausdrücklich ausgeschlossen

Nicht committed wurden:

- `apps/web/src/app/api/factcheck/status/[jobId]/prepareGraphCandidateAction.ts`
- `apps/web/src/app/admin/review/loadAdminEditorialReviewRequests.ts`
- `apps/web/src/app/admin/review/loadAdminGraphMergeData.ts`
- `apps/web/src/app/admin/review/AdminEditorialReviewSection.tsx`
- `apps/web/src/app/admin/review/AdminGraphMergeCandidatesSection.tsx`
- `apps/web/tests/admin-review.page.test.tsx`
- alle GraphMergeCandidate-Dateien
- alle Editorial-Review-Dateien außerhalb der factcheckbezogenen Readmodel-/Anzeige-Hunks
- alle Start-/Create-/Draft-Dateien
- alle Runden-Dateien
- alle bereits separat committed Truth-Guard-Dateien
- `docs/E150/OpenTasks.md`
- `apps/web/src/app/globals.css`

## Hunk-Behandlung

`apps/web/src/app/api/contributions/analyze/route.ts`

- committed wurde nur der Entitlement-/Research-Gate-Hunk
- Truth-Guard-Hunks blieben außen vor, da bereits separat committed

`apps/web/src/app/api/factcheck/status/[jobId]/route.ts`

- committed wurde die vollständige Factcheck-Statusroute
- der frühere Graph-Handoff war bereits vor diesem Commit entfernt
- im Commit gibt es keinen `prepare_graph_candidate`-Branch und keinen GraphCandidate-Import

`apps/web/src/app/admin/review/page.tsx`

- committed wurde nicht der volle Worktree-Stand
- im Index wurde bewusst nur eine minimale Factcheck-Only-Version staged:
  - Import `AdminFactcheckJobsSection`
  - Import `loadAdminFactcheckJobs`
  - Factcheck-Datenladung
  - Render von `AdminFactcheckJobsSection`
- Editorial-/Graph-Loader und Sections blieben außerhalb dieses Commits

`features/reviewQueue.ts` und `apps/web/tests/review-queue.readmodel.test.ts`

- committed wurden die konservativen Factcheck-/Readmodel-Erweiterungen aus `17B`
- keine Editorial-Statusmaschine und keine Graph-Merge-Logik wurde in diesen Commit aufgenommen

## Tests

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/factcheck-entitlement-gate.contract.test.ts tests/factcheck-enqueue.auth.route.test.ts tests/create-analyze-entitlement-gate.route.test.ts tests/factcheck-job-runner.contract.test.ts tests/account-factcheck-jobs.contract.test.tsx tests/factcheck-status.detail.contract.test.ts tests/factcheck-status-seal.route.test.ts tests/review-queue.readmodel.test.ts tests/admin-factcheck-jobs.page.test.tsx`

Ergebnis:

- `typecheck` grün
- `lint` grün
- `9/9` Testdateien grün
- `29/29` Tests grün

## Verbleibender Worktree-Drift

Nach dem Commit bleibt der Worktree weiterhin breit dirty, u. a. in:

- Start-/Create-/Draft-Kosmos
- Editorial Review
- Graph/Merge Candidate
- Account-Querschnitt
- Landing/Create/Planner
- `docs/E150/OpenTasks.md`

Die neue Evidence-Datei `WORKTREE-COMMIT-FACTCHECK-00L_2026-06-06.md` ist bewusst uncommitted geblieben.

## Nächster empfohlener Cluster

Nächste Isolation:

- Editorial Review `13/13B/16`
  oder
- Graph Candidate / Merge `15/15B/18`

Empfehlung:

- zuerst `Editorial Review`, weil `admin/review/page.tsx` und die zugehörigen Loader/Sections dort bereits als offener Rest-Cluster liegen

## Nicht erfolgt

- keine Änderung an `OpenTasks.md`
- kein Start von `END-TO-END-CLOSED-PROCESS-QA-19`
- kein Graph-Merge-Commit
- kein weiterer Produkt-Slice außerhalb des Factcheck-Clusters
