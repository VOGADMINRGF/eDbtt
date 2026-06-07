# WORKTREE-UNTANGLE-EDITORIAL-ACCOUNT-00R

## Ursprünglicher Blocker

Nach `WORKTREE-DECOUPLE-EDITORIAL-FROM-GRAPH-00Q` war der Editorial-Review-Cluster fachlich von Graph und Factcheck-Labeln entkoppelt, aber im Account-Bereich noch nicht sauber commitbar:

- `apps/web/src/app/account/AccountReviewSupplementSections.tsx` kombinierte Resume, Editorial und Factcheck.
- `apps/web/src/app/account/AccountClient.tsx` mischte Editorial-Render mit Resume/Create-, Factcheck- und Graph-Hunks.
- `features/account/service.ts` lud Editorial noch in einem gemischten Overview-Hunk zusammen mit Create- und Factcheck-Daten.
- `features/account/types.ts` hielt Editorial noch in einem gemeinsamen Overview-Hunk mit Create-/Factcheck-Feldern.

## AccountReviewSupplementSections-Entkopplung

- `AccountReviewSupplementSections.tsx` rendert jetzt nur noch nicht-editoriale Supplements:
  - optional `resumeSection`
  - optional `factcheckSection`
- Der Editorial-Block wurde in die neue kleine Wrapper-Komponente `apps/web/src/app/account/AccountEditorialReviewSupplement.tsx` gezogen.
- Dadurch bleibt `AccountReviewSupplementSections.tsx` aus einem späteren Editorial-Commit herausnehmbar.

## AccountClient-Hunkbarkeit

- `AccountClient.tsx` rendert Editorial jetzt separat über `AccountEditorialReviewSupplement`.
- Resume und Factcheck laufen separat über zwei kleine `AccountReviewSupplementSections`-Aufrufe.
- Die lokale Overview-Typdefinition liest Editorial, Create-Ledger, Factcheck und Graph jetzt als getrennte Slices ein.
- Ergebnis: Der spätere Editorial-Commit braucht in `AccountClient.tsx` nur noch den Editorial-Import, den Editorial-Render und den Editorial-Slice-Read-Hunk.

## service.ts-Hunkbarkeit

- `features/account/service.ts` nutzt jetzt separate Loader-Aufrufe:
  - `loadAccountCreateContributionLedger`
  - `loadAccountEditorialReviewRequests`
  - `loadAccountFactcheckJobs`
- Der Editorial-Aufruf ist dadurch ein eigener, klar isolierter Promise-/Return-Hunk.
- Es müssen keine gemischten Inline-Datenladeblöcke für Create oder Factcheck mehr mitgezogen werden.

## types.ts-Hunkbarkeit

- `features/account/types.ts` nutzt jetzt getrennte Slice-Typen:
  - `AccountCreateContributionLedgerSlice`
  - `AccountEditorialReviewSlice`
  - `AccountFactcheckJobSlice`
  - `AccountGraphMergeCandidateSlice`
- Editorial hängt dadurch als eigener Slice im `AccountOverview` und nicht mehr als impliziter Teil eines gemeinsamen Create-/Factcheck-Hunks.

## Commitbarkeit des Editorial-Clusters

Stand nach diesem Slice: **ja, der Editorial-Review-Cluster ist jetzt isoliert commitbar**.

Zum späteren Editorial-Commit gehören:

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
- `features/account/createContributionLedgerTypes.ts` (nur Slice-Scaffold für hunkbare Account-Typen)
- Editorial-Hunks in `apps/web/src/app/account/AccountClient.tsx`
- `features/account/editorialReviewTypes.ts`
- `features/account/factcheckJobTypes.ts` (nur Slice-Scaffold für hunkbare Account-Typen)
- `features/account/loadAccountCreateContributionLedger.ts` (nur Loader-Scaffold für hunkbare Account-Datenladung)
- `features/account/loadAccountEditorialReviewRequests.ts`
- `features/account/loadAccountFactcheckJobs.ts` (nur Loader-Scaffold für hunkbare Account-Datenladung)
- Editorial-Slice-Hunks in `features/account/types.ts`
- Editorial-Slice-Hunks in `features/account/service.ts`
- Editorial-Hunks in `apps/web/src/app/api/contributions/save/route.ts`
- Tests:
  - `tests/start-editorial-review.route.test.ts`
  - `tests/editorial-review-requests.route.test.ts`
  - `tests/editorial-review-reply.route.test.ts`
  - `tests/admin-editorial-review.route.test.ts`
  - `tests/account-editorial-review.contract.test.tsx`
  - `tests/create-mode.save.route.test.ts`
  - `tests/admin-editorial-review.page.test.tsx`
- Docs:
  - `docs/E150/EDITORIAL-REVIEW-QUEUE-13_2026-06-06.md`
  - `docs/E150/EDITORIAL-REVIEW-QUEUE-AUDIT-13B_2026-06-06.md`
  - `docs/E150/USER-CLARIFICATION-REPLY-FLOW-16_2026-06-06.md`
  - `docs/E150/WORKTREE-ISOLATE-EDITORIAL-REVIEW-00P_2026-06-06.md`
  - `docs/E150/WORKTREE-DECOUPLE-EDITORIAL-FROM-GRAPH-00Q_2026-06-06.md`
  - `docs/E150/WORKTREE-UNTANGLE-EDITORIAL-ACCOUNT-00R_2026-06-06.md`

Außerhalb des Editorial-Commits bleiben:

- `apps/web/src/app/account/AccountReviewSupplementSections.tsx`
- alle Factcheck-, Graph-, Runden-, Truth-Guard- und Start/Create/Draft-Dateien außerhalb der bereits editorial markierten Hunks
- `docs/E150/OpenTasks.md`

## Tests und Ergebnis

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/account-editorial-review.contract.test.tsx tests/editorial-review-reply.route.test.ts tests/editorial-review-requests.route.test.ts tests/admin-editorial-review.route.test.ts tests/admin-editorial-review.page.test.tsx tests/create-mode.save.route.test.ts tests/start-editorial-review.route.test.ts`

Ergebnis:

- Typecheck grün
- Lint grün
- Vitest: `7/7` Testdateien, `34/34` Tests grün

## Verbleibende Risiken

- `AccountClient.tsx`, `features/account/service.ts` und `features/account/types.ts` bleiben als Dateien insgesamt querschnittlich, auch wenn die Editorial-Hunks jetzt klein und gezielt sind.
- Die vier nicht-editorialen Account-Helfer (`createContributionLedgerTypes`, `factcheckJobTypes`, `loadAccountCreateContributionLedger`, `loadAccountFactcheckJobs`) sind reine Entkopplungs-Scaffolds. Sie sollten nicht versehentlich als fachlicher Editorial-Umfang interpretiert werden.
- `END-TO-END-CLOSED-PROCESS-QA-19` bleibt weiterhin gesperrt, bis alle restlichen Cluster isoliert oder committed sind.
