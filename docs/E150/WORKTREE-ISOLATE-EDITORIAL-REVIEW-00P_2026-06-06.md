# WORKTREE-ISOLATE-EDITORIAL-REVIEW-00P

Date: 2026-06-06
Task: `WORKTREE-ISOLATE-EDITORIAL-REVIEW-00P`

## Scope Checked

Reviewed against the current worktree:

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
- `apps/web/src/app/account/AccountReviewSupplementSections.tsx`
- `apps/web/src/app/account/AccountClient.tsx`
- `features/account/service.ts`
- `features/account/types.ts`
- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/api/contributions/save/route.ts`
- `apps/web/tests/start-editorial-review.route.test.ts`
- `apps/web/tests/editorial-review-requests.route.test.ts`
- `apps/web/tests/editorial-review-reply.route.test.ts`
- `apps/web/tests/admin-editorial-review.route.test.ts`
- `apps/web/tests/account-editorial-review.contract.test.tsx`
- `apps/web/tests/create-mode.save.route.test.ts`
- `apps/web/tests/admin-review.page.test.tsx`
- `docs/E150/EDITORIAL-REVIEW-QUEUE-13_2026-06-06.md`
- `docs/E150/EDITORIAL-REVIEW-QUEUE-AUDIT-13B_2026-06-06.md`
- `docs/E150/USER-CLARIFICATION-REPLY-FLOW-16_2026-06-06.md`

## Clearly Editorial

These files are editorial-first and fit cluster `13 / 13B / 16`:

- `apps/web/src/app/api/start/editorial-review/route.ts`
- `apps/web/src/app/api/editorial/review-requests/route.ts`
- `apps/web/src/app/api/editorial/review-requests/[requestId]/reply/route.ts`
- `apps/web/src/app/admin/review/EditorialReviewRequestActions.tsx`
- `apps/web/src/app/admin/review/loadAdminEditorialReviewRequests.ts`
- `apps/web/src/app/account/AccountEditorialReviewReplyForm.tsx`
- `apps/web/tests/start-editorial-review.route.test.ts`
- `apps/web/tests/editorial-review-requests.route.test.ts`
- `apps/web/tests/editorial-review-reply.route.test.ts`
- `apps/web/tests/account-editorial-review.contract.test.tsx`
- `docs/E150/EDITORIAL-REVIEW-QUEUE-13_2026-06-06.md`
- `docs/E150/EDITORIAL-REVIEW-QUEUE-AUDIT-13B_2026-06-06.md`
- `docs/E150/USER-CLARIFICATION-REPLY-FLOW-16_2026-06-06.md`

## Mixed Files And Hunk Classification

### `features/editorialReviewQueue.ts`

Status: `not commit-safe`

Editorial hunks:

- request model and statuses
- dedupe/rate-limit logic
- request creation
- user reply flow
- filter labels
- next-step labels

Mixed / blocking hunks:

- imports `prepareGraphMergeCandidateFromReviewRequest` and `GraphMergeCandidate`
- `applyEditorialReviewRequestAction()` returns `graphMergeCandidate`
- `accept_for_workup` currently triggers GraphCandidate preparation

Conclusion:

- not cleanly editorial-only in current shape
- main blocker for an isolated editorial commit

### `apps/web/src/app/api/admin/editorial-review-requests/[requestId]/route.ts`

Status: `not commit-safe`

Editorial hunks:

- admin action endpoint
- note/transition validation
- request state response

Mixed / blocking hunks:

- response includes `graphMergeCandidate`
- therefore coupled to Graph behavior already committed separately

Conclusion:

- cannot be committed as pure editorial without first removing or extracting the graph return path

### `apps/web/src/app/account/AccountClient.tsx`

Status: `not hunk-clean for editorial`

Editorial hunks:

- import `AccountReviewSupplementSections`
- import `EditorialReviewRequest`
- `editorialReviewRequests` field in `AccountOverview`
- pass `editorialReviewRequests` into `AccountReviewSupplementSections`
- read `editorialReviewRequests` in `normalizeOverview`

Mixed / blocking hunks:

- same patch also introduces create ledger imports and `CreateContributionLedgerSection`
- same patch introduces `FactcheckJobDoc`, `factcheckJobs`, and factcheck wiring
- same patch keeps already committed graph section nearby

Conclusion:

- editorial hunk exists, but is bundled with Start/Create and Factcheck additions
- not safely committable as-is

### `features/account/service.ts`

Status: `not hunk-clean for editorial`

Editorial hunks:

- import `listEditorialReviewRequests`
- load `editorialReviewRequests`
- return `editorialReviewRequests`

Mixed / blocking hunks:

- same diff introduces draft ledger loading from `contribution_drafts`
- same diff introduces `getFactcheckWorkflowRepo` and `factcheckJobs`
- same diff depends on already committed graph promise path in the same function body

Conclusion:

- editorial work is entangled with Start/Create ledger and Factcheck

### `features/account/types.ts`

Status: `not hunk-clean for editorial`

Editorial hunks:

- import `EditorialReviewRequest`
- `editorialReviewRequests?: EditorialReviewRequest[]`

Mixed / blocking hunks:

- same hunk also adds `CreateContributionLedgerEntry`
- same hunk also adds `FactcheckJobDoc`

Conclusion:

- too small to split safely without also deciding on adjacent create/factcheck fields

### `apps/web/src/app/admin/review/page.tsx`

Status: `partly hunkable, but not editorial-only`

Editorial hunks:

- import `AdminEditorialReviewSection`
- import `getEditorialReviewFilterLabel`
- import `loadAdminEditorialReviewRequests`
- `editorial` query param
- editorial loader in `Promise.all`
- editorial filter UI
- `Redaktion: {editorialRequests.length}`
- render `AdminEditorialReviewSection`

Mixed / blocking hunks:

- same file also contains committed Factcheck section
- same file also contains committed Graph section
- the new chip row explicitly includes `Factchecks`

Conclusion:

- editorial additions are understandable and hunkable
- but commit safety depends on mixed admin shell ownership

### `apps/web/tests/admin-review.page.test.tsx`

Status: `not editorial-only`

Editorial hunks:

- editorial mocks
- editorial request fixtures
- editorial assertions in final render test

Mixed / blocking hunks:

- same file still mocks graph loader
- same file still mocks factcheck list
- same test continues to verify central admin review shell

Conclusion:

- not a clean editorial-only test file
- should be split before an isolated editorial commit

### `apps/web/src/app/api/contributions/save/route.ts`

Status: `not commit-safe for editorial-only`

Editorial hunks:

- `manualReviewRequested`
- `createEditorialReviewRequest(...)`
- `readManualReviewTruthMeta(...)`
- response `reviewRequest`

Mixed / blocking hunks:

- same diff introduces `packageId`
- same diff introduces create ledger persistence
- same diff mutates draft save/update flow for Start/Create package handling

Conclusion:

- strong coupling to Start/Create/Draft cluster

### `apps/web/src/app/account/AccountReviewSupplementSections.tsx`

Status: `not editorial-only`

Editorial hunks:

- renders `AccountEditorialReviewSection`

Mixed / blocking hunks:

- also renders `AccountResumeWorkbenchSection`
- also renders `AccountFactcheckJobSection`
- imports create ledger types and factcheck types

Conclusion:

- shared account supplement component, not safe for editorial isolation

### `apps/web/src/app/account/AccountEditorialReviewSection.tsx`

Status: `mixed with factcheck presentation`

Editorial hunks:

- review-only account presentation
- reply form entry point
- manual-review guardrails

Mixed / blocking hunks:

- imports `getEditorialReviewFactcheckStatusLabel` from factcheck entitlement code
- contains special `factcheck_request` UI copy

Conclusion:

- close to editorial-only, but still coupled to factcheck presentation helpers

### `apps/web/src/app/admin/review/AdminEditorialReviewSection.tsx`

Status: `mixed with factcheck presentation`

Editorial hunks:

- admin editorial list and actions
- user reply display
- clarification display

Mixed / blocking hunks:

- imports `getEditorialReviewFactcheckStatusLabel` from factcheck entitlement code
- contains `factcheck_request` branch copy

Conclusion:

- same coupling problem as the account section

## Excluded From This Cluster

- all already committed Factcheck files
- all already committed Graph/Merge files
- all Truth-Guard files
- all Runden files
- `docs/E150/OpenTasks.md`
- `apps/web/src/app/globals.css`
- StartDraft helpers and landing/start files

## Commitability

Editorial Review cluster is **not** isolated commitable yet.

### Main Blockers

1. `features/editorialReviewQueue.ts`
   - still creates/returns GraphCandidate side effects for `accept_for_workup`

2. `apps/web/src/app/api/admin/editorial-review-requests/[requestId]/route.ts`
   - still returns `graphMergeCandidate`

3. `apps/web/src/app/api/contributions/save/route.ts`
   - editorial request creation is bundled with Start/Create ledger persistence

4. `apps/web/src/app/account/AccountClient.tsx`
   - editorial hunk is mixed with create-ledger and factcheck additions

5. `features/account/service.ts` and `features/account/types.ts`
   - editorial fields are mixed with Start/Create and Factcheck fields

6. `apps/web/tests/admin-review.page.test.tsx`
   - editorial assertions still live in a mixed graph/factcheck/admin shell test

## Checks

Executed:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/start-editorial-review.route.test.ts tests/editorial-review-requests.route.test.ts tests/editorial-review-reply.route.test.ts tests/admin-editorial-review.route.test.ts tests/account-editorial-review.contract.test.tsx tests/create-mode.save.route.test.ts tests/admin-review.page.test.tsx`

Results:

- `typecheck` green
- `lint` green
- `7/7` test files green
- `34/34` tests green

## Remaining Drift

Worktree remains broadly dirty outside this cluster, especially:

- Start/Create/Draft
- admin review shell follow-up drift
- account overview drift
- `OpenTasks.md`

## Next Recommended Slice

Smallest safe next step:

- decouple Editorial from Graph in `features/editorialReviewQueue.ts` and `apps/web/src/app/api/admin/editorial-review-requests/[requestId]/route.ts`

After that:

- separate Editorial from Start/Create in `apps/web/src/app/api/contributions/save/route.ts`
- split editorial assertions out of `apps/web/tests/admin-review.page.test.tsx`
