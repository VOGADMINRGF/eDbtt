# WORKTREE-DECOUPLE-EDITORIAL-FROM-GRAPH-00Q

Date: 2026-06-06
Task: `WORKTREE-DECOUPLE-EDITORIAL-FROM-GRAPH-00Q`

## Original Blockers

- `features/editorialReviewQueue.ts` created GraphCandidates on `accepted_for_workup`
- `apps/web/src/app/api/admin/editorial-review-requests/[requestId]/route.ts` returned `graphMergeCandidate`
- editorial UI components depended on `getEditorialReviewFactcheckStatusLabel`
- account crosscutting mixed editorial with create/factcheck/graph
- `apps/web/src/app/api/contributions/save/route.ts` duplicated editorial request creation inside create-ledger/save logic
- `apps/web/tests/admin-review.page.test.tsx` still contained editorial assertions inside the mixed admin shell test

## Graph Decoupling

Changed:

- `features/editorialReviewQueue.ts`
- `apps/web/src/app/api/admin/editorial-review-requests/[requestId]/route.ts`
- `apps/web/tests/admin-editorial-review.route.test.ts`
- `apps/web/tests/editorial-review-reply.route.test.ts`

Result:

- `accepted_for_workup` now only changes editorial state to `accepted_for_workup`
- no GraphCandidate is prepared inside EditorialReviewQueue
- admin editorial route no longer returns `graphMergeCandidate`
- editorial reply/admin route tests no longer depend on graph repositories

Verification:

- `rg` found no remaining `prepareGraphMergeCandidateFromReviewRequest`
- `rg` found no remaining `graphMergeCandidate` return path in the editorial queue or admin editorial route

## Factcheck Label Decoupling

Changed:

- `apps/web/src/app/admin/review/AdminEditorialReviewSection.tsx`
- `apps/web/src/app/account/AccountEditorialReviewSection.tsx`

Result:

- both components now use `getEditorialReviewStatusLabel()`
- no `getEditorialReviewFactcheckStatusLabel` import remains
- explicit factcheck-only status hint branches were removed from editorial UI

Verification:

- `rg` found no remaining `getEditorialReviewFactcheckStatusLabel` in those components

## Account Decoupling

Changed:

- `features/account/editorialReviewTypes.ts`
- `features/account/loadAccountEditorialReviewRequests.ts`
- `features/account/service.ts`
- `features/account/types.ts`
- `apps/web/src/app/account/AccountClient.tsx`
- `apps/web/src/app/account/AccountReviewSupplementSections.tsx`

What changed:

- editorial types are now isolated via `AccountEditorialReviewSlice`
- editorial loading is isolated via `loadAccountEditorialReviewRequests()`
- `AccountReviewSupplementSections` now receives separated `resumeSection`, `editorialSection`, `factcheckSection` props
- `AccountClient` reads editorial data via `readAccountEditorialReviewSlice()`

Assessment:

- this improves isolation materially
- but `AccountClient.tsx`, `features/account/service.ts`, and `features/account/types.ts` are still not clean editorial-only files because their open worktree diff still also contains Create/Resume and Factcheck additions

## Save Route Decoupling

Changed:

- `apps/web/src/app/api/contributions/save/route.ts`

What changed:

- extracted `resolveManualReviewReason()`
- extracted `createEditorialReviewRequestFromContributionSave()`
- replaced three duplicated inline editorial request creation blocks with the helper

Assessment:

- editorial request creation is now structurally isolated inside a helper
- this makes the editorial hunk easier to stage separately later
- create-ledger logic is still in the same file, but the editorial branch is clearer and more local

## Test Separation

Changed:

- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/admin-editorial-review.page.test.tsx`

Result:

- central admin shell assertions remain in `admin-review.page.test.tsx`
- editorial-specific rendering assertions now live in `admin-editorial-review.page.test.tsx`

## Commitability Assessment

Editorial cluster is **closer**, but still **not fully isolated commitable**.

### Resolved

- Graph side effect removed from editorial queue
- Graph payload removed from admin editorial route
- Factcheck label helper removed from editorial UI
- editorial page coverage separated from the mixed admin shell test
- editorial save-route logic is more hunkable

### Remaining Risks

1. `apps/web/src/app/account/AccountClient.tsx`
   - still a large mixed file with Create ledger, Editorial, Factcheck, Graph and local ledger UI additions

2. `features/account/service.ts`
   - still mixes `contributionDrafts`, `editorialReviewRequests`, `factcheckJobs`

3. `features/account/types.ts`
   - still carries Create and Factcheck slice fields in the same open diff

4. `apps/web/src/app/account/AccountReviewSupplementSections.tsx`
   - cleaner than before, but still one shared container for Resume, Editorial and Factcheck

Because of these account crosscutting files, the cluster is not yet fully safe for an isolated commit without careful hunk selection.

## Tests

Executed:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/start-editorial-review.route.test.ts tests/editorial-review-requests.route.test.ts tests/editorial-review-reply.route.test.ts tests/admin-editorial-review.route.test.ts tests/account-editorial-review.contract.test.tsx tests/create-mode.save.route.test.ts tests/admin-review.page.test.tsx tests/admin-editorial-review.page.test.tsx`

Results:

- `typecheck` green
- `lint` green
- `8/8` test files green
- `35/35` tests green

## Suggested Editorial Commit Scope Once Final Crosscutting Drift Is Resolved

Likely editorial files:

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
- `features/account/editorialReviewTypes.ts`
- `features/account/loadAccountEditorialReviewRequests.ts`
- editorial-only hunks in:
  - `apps/web/src/app/account/AccountClient.tsx`
  - `apps/web/src/app/account/AccountReviewSupplementSections.tsx`
  - `features/account/service.ts`
  - `features/account/types.ts`
  - `apps/web/src/app/api/contributions/save/route.ts`
  - `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/admin-editorial-review.page.test.tsx`
- `apps/web/tests/admin-editorial-review.route.test.ts`
- `apps/web/tests/editorial-review-reply.route.test.ts`
- `apps/web/tests/editorial-review-requests.route.test.ts`
- `apps/web/tests/start-editorial-review.route.test.ts`
- `apps/web/tests/account-editorial-review.contract.test.tsx`
- editorial docs `13`, `13B`, `16`

## Remaining Drift

Worktree remains broadly dirty outside this slice, especially:

- Start/Create/Draft
- account resume/create ledger crosscutting
- `docs/E150/OpenTasks.md`

## Next Recommended Step

- one more small untangle slice focused only on account crosscutting:
  - `apps/web/src/app/account/AccountClient.tsx`
  - `apps/web/src/app/account/AccountReviewSupplementSections.tsx`
  - `features/account/service.ts`
  - `features/account/types.ts`

Only after that should the editorial cluster be staged for commit.
