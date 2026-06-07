# WORKTREE-COMMIT-GRAPH-MERGE-00O

Date: 2026-06-06
Task: `WORKTREE-COMMIT-GRAPH-MERGE-00O`

## Commit

- Commit SHA: `6ae14d43`
- Commit message: `fix(graph): gate reviewed graph merge candidates`

## Included In Commit

Fully included:

- `features/graphMergeCandidates.ts`
- `apps/web/src/app/api/admin/graph-merge-candidates/[candidateId]/route.ts`
- `apps/web/src/app/admin/review/GraphMergeCandidateActions.tsx`
- `apps/web/src/app/admin/review/AdminGraphMergeCandidatesSection.tsx`
- `apps/web/src/app/admin/review/loadAdminGraphMergeData.ts`
- `apps/web/src/app/admin/review/loadAdminGraphMergeSectionProps.ts`
- `apps/web/src/app/account/AccountGraphMergeCandidateSection.tsx`
- `features/account/graphCandidateTypes.ts`
- `features/account/loadAccountGraphMergeCandidates.ts`
- `apps/web/tests/graph-merge-candidates.contract.test.ts`
- `apps/web/tests/admin-graph-merge-candidate.route.test.ts`
- `apps/web/tests/account-graph-candidate.contract.test.tsx`
- `apps/web/tests/admin-graph-merge-candidates.page.test.tsx`
- `docs/E150/REVIEWED-GRAPH-MERGE-15_2026-06-06.md`
- `docs/E150/GRAPH-CANDIDATE-STAGING-AUDIT-15B_2026-06-06.md`
- `docs/E150/PRODUCTIVE-GRAPH-MERGE-GATE-18_2026-06-06.md`
- `docs/E150/WORKTREE-ISOLATE-GRAPH-MERGE-00M_2026-06-06.md`
- `docs/E150/WORKTREE-UNTANGLE-GRAPH-ACCOUNT-ADMIN-00N_2026-06-06.md`

Hunk-only included:

- `apps/web/src/app/account/AccountClient.tsx`
  - only `AccountGraphMergeCandidateSection` import/render
  - only `readAccountGraphMergeCandidateSlice` import/use
  - only `AccountGraphMergeCandidateSlice` type extension
- `features/account/service.ts`
  - only `graphMergeCandidatesPromise`
  - only `graphMergeCandidates` load/return
- `features/account/types.ts`
  - only `AccountGraphMergeCandidateSlice` import
  - only `AccountOverview & AccountGraphMergeCandidateSlice`
- `apps/web/src/app/admin/review/page.tsx`
  - only `AdminGraphMergeCandidatesSection` import/render
  - only `loadAdminGraphMergeSectionProps` import/call

## Explicitly Excluded

- `apps/web/src/app/api/factcheck/status/[jobId]/prepareGraphCandidateAction.ts`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/src/app/admin/review/AdminEditorialReviewSection.tsx`
- `apps/web/src/app/admin/review/loadAdminEditorialReviewRequests.ts`
- `apps/web/src/app/account/AccountReviewSupplementSections.tsx`
- all factcheck files already committed in `4a7e7cc7`
- all truth-guard files already committed in `21b7a51f`
- all runden files already committed in `be9d2702`
- `docs/E150/OpenTasks.md`

## Checks

Executed:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/graph-merge-candidates.contract.test.ts tests/admin-graph-merge-candidate.route.test.ts tests/account-graph-candidate.contract.test.tsx tests/admin-graph-merge-candidates.page.test.tsx`

Result:

- `typecheck` green
- `lint` green
- `4/4` test files green
- `20/20` tests green

## Remaining Drift

The worktree remains broadly dirty outside the committed Graph/Merge slice, especially:

- Start/Create/Draft cluster
- Editorial Review cluster
- Landing/Create drift
- `docs/E150/OpenTasks.md`
- `apps/web/src/app/admin/review/page.tsx`, `apps/web/src/app/account/AccountClient.tsx`, `features/account/service.ts`, `features/account/types.ts` still have additional non-graph unstaged changes in the worktree by design

## Next Recommended Cluster

- `Editorial Review 13 / 13B / 16`

## Notes

- This evidence file was created after the Graph/Merge commit and is intentionally left uncommitted.
- `END-TO-END-CLOSED-PROCESS-QA-19` remains blocked until the remaining clusters are isolated.
