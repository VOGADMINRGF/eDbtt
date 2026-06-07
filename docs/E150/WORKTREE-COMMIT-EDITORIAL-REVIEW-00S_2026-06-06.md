# WORKTREE-COMMIT-EDITORIAL-REVIEW-00S

## Commit

- Commit-SHA: `eb14ef4d`
- Commit: `fix(review): add guarded editorial review workflow`

## Staged und committed

- `features/editorialReviewQueue.ts`
- `apps/web/src/app/api/start/editorial-review/route.ts`
- `apps/web/src/app/api/editorial/review-requests/route.ts`
- `apps/web/src/app/api/editorial/review-requests/[requestId]/reply/route.ts`
- `apps/web/src/app/api/admin/editorial-review-requests/[requestId]/route.ts`
- `apps/web/src/app/admin/review/EditorialReviewRequestActions.tsx`
- `apps/web/src/app/admin/review/AdminEditorialReviewSection.tsx`
- `apps/web/src/app/admin/review/loadAdminEditorialReviewRequests.ts`
- `apps/web/src/app/account/AccountEditorialReviewSection.tsx`
- `apps/web/src/app/account/AccountEditorialReviewReplyForm.tsx`
- `apps/web/src/app/account/AccountEditorialReviewSupplement.tsx`
- `features/account/editorialReviewTypes.ts`
- `features/account/loadAccountEditorialReviewRequests.ts`
- `apps/web/tests/start-editorial-review.route.test.ts`
- `apps/web/tests/editorial-review-requests.route.test.ts`
- `apps/web/tests/editorial-review-reply.route.test.ts`
- `apps/web/tests/admin-editorial-review.route.test.ts`
- `apps/web/tests/account-editorial-review.contract.test.tsx`
- `apps/web/tests/create-mode.save.route.test.ts`
- `apps/web/tests/admin-editorial-review.page.test.tsx`
- `docs/E150/EDITORIAL-REVIEW-QUEUE-13_2026-06-06.md`
- `docs/E150/EDITORIAL-REVIEW-QUEUE-AUDIT-13B_2026-06-06.md`
- `docs/E150/USER-CLARIFICATION-REPLY-FLOW-16_2026-06-06.md`
- `docs/E150/WORKTREE-ISOLATE-EDITORIAL-REVIEW-00P_2026-06-06.md`
- `docs/E150/WORKTREE-DECOUPLE-EDITORIAL-FROM-GRAPH-00Q_2026-06-06.md`
- `docs/E150/WORKTREE-UNTANGLE-EDITORIAL-ACCOUNT-00R_2026-06-06.md`
- Editorial-only Hunks in:
  - `apps/web/src/app/account/AccountClient.tsx`
  - `features/account/service.ts`
  - `features/account/types.ts`
  - `apps/web/src/app/admin/review/page.tsx`
  - `apps/web/src/app/api/contributions/save/route.ts`

## Ausgeschlossen

- `docs/E150/OpenTasks.md`
- alle Graph-Dateien
- alle Factcheck-Dateien außerhalb bereits bestehender Referenzen in gemischten Shells
- alle Runden-Dateien
- alle Truth-Guard-Dateien
- alle Start/Create/Draft-Dateien außerhalb des kleinen Editorial-Hunks in `api/contributions/save/route.ts`
- `apps/web/src/app/account/AccountReviewSupplementSections.tsx`
- `apps/web/src/app/account/AccountResumeWorkbenchSection.tsx`
- `features/account/createContributionLedgerTypes.ts`
- `features/account/factcheckJobTypes.ts`
- `features/account/loadAccountCreateContributionLedger.ts`
- `features/account/loadAccountFactcheckJobs.ts`
- `apps/web/tests/admin-review.page.test.tsx`

## Hunk-Behandlung

- `AccountClient.tsx`
  - committed nur: `AccountEditorialReviewSupplement` Import/Render, `AccountEditorialReviewSlice`, `readAccountEditorialReviewSlice`
  - nicht committed: Resume-/Factcheck-/Create-/Graph-nahe Zusatzhunks
- `features/account/service.ts`
  - committed nur: `loadAccountEditorialReviewRequests`, eigener Editorial-Promise, `editorialReviewRequests` im Return
  - nicht committed: Create-/Factcheck-Loader-Hunks
- `features/account/types.ts`
  - committed nur: `AccountEditorialReviewSlice`
  - nicht committed: Create-/Factcheck-Slice-Typen
- `apps/web/src/app/api/contributions/save/route.ts`
  - committed nur: `manualReviewRequested`, Editorial-Request-Helfer, Rückgabe von `reviewRequest`
  - nicht committed: Create-Ledger-/Package-Hunks

## Tests

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/start-editorial-review.route.test.ts tests/editorial-review-requests.route.test.ts tests/editorial-review-reply.route.test.ts tests/admin-editorial-review.route.test.ts tests/account-editorial-review.contract.test.tsx tests/create-mode.save.route.test.ts tests/admin-editorial-review.page.test.tsx`

Ergebnis:

- Typecheck grün
- Lint grün
- Vitest: `7/7` Testdateien, `34/34` Tests grün

## Verbleibender Worktree-Drift

Nach dem Commit bleibt der Worktree breit dirty, vor allem in:

- Start/Create/Draft
- Landing/Create
- Orchestrator-/Telemetry-Slice
- Account-Resume-/Factcheck-Resthunks
- `docs/E150/OpenTasks.md`

## Nächster empfohlener Cluster

- `Start/Create/Draft`
