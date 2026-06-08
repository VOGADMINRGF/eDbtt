# WORKTREE-COMMIT-START-CREATE-DRAFT-00V

Date: 2026-06-06
Commit: `8ee787d5`
Commit message: `fix(start): preserve draft context across create surfaces`

## Scope committed

Committed as isolated Start/Create/Draft slice:

- `apps/web/src/features/start/*`
- `apps/web/src/app/start/LandingStart.tsx`
- `apps/web/src/app/start/page.tsx`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/app/create/CreateStartDraftHandoff.tsx`
- `apps/web/src/app/create/CreateDraftNextActionGate.tsx`
- `apps/web/src/app/create/createStartDraftRestore.ts`
- `apps/web/src/features/create/SharedCreateComposer.tsx`
- `apps/web/src/app/create/page.tsx`
- `apps/web/src/server/createContributionDrafts.ts`
- `apps/web/src/app/account/AccountResumeWorkbenchSection.tsx`
- `apps/web/src/app/account/CreateContributionLedgerSection.tsx`
- `apps/web/src/app/account/AccountCreateDraftSections.tsx`
- `features/account/createContributionLedgerTypes.ts`
- `features/account/loadAccountCreateContributionLedger.ts`
- Start/Create-Draft hunks in `apps/web/src/app/account/AccountClient.tsx`
- Start/Create-Draft hunks in `features/account/service.ts`
- Start/Create-Draft hunks in `features/account/types.ts`
- StartDraft hunks in `apps/web/src/app/runden/new/AnlassraumSetupForm.tsx`
- StartDraft hunks in `apps/web/src/app/runden/new/AnlassraumStartDraftPanel.tsx`
- `apps/web/src/app/themen/ThemenStartDraftAssistant.tsx`
- `apps/web/src/app/themen/page.tsx`
- Start/Create/Draft tests
- Start/Create/Draft task docs and recovery docs through `00U6`

## Explicitly excluded

Not committed:

- `docs/E150/OpenTasks.md`
- `apps/web/src/app/globals.css`
- `apps/web/src/components/voxy/VoxyGuide.tsx`
- `apps/web/src/features/voxy/voxyCopy.ts`
- Factcheck cluster files
- Graph/Merge cluster files
- Editorial Review cluster files
- Truth-Guard cluster files
- multibranch / place / street-registry follow-up files outside the Start/Create/Draft scope

## CreateClient handling

`CreateClient.tsx` was committed only with the isolated Start/Create/Draft-relevant changes:

- shared StartDraft restore/handoff wiring
- `CreateStartDraftHandoff`
- `CreateDraftNextActionGate`
- Start/Create Voxy copy usage
- minimal entry copy updates

Kept out of this commit:

- multibranch / place-resolution logic
- planner retry and open-label follow-up props
- editorial handoff changes
- non-scope review propagation changes

## Verification

Executed:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/start-draft-context.contract.test.ts tests/start-draft-handoff-targets.contract.test.ts tests/start-create-light-entry.contract.test.tsx tests/start-shared-create-composer.contract.test.tsx tests/global-draft-status-bar.contract.test.tsx tests/branch-workspace-handoff.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/create-branch-ledger-persistence.contract.test.tsx tests/closed-cosmos-ux-audit.contract.test.ts tests/draft-to-review-analyze-gate.contract.test.ts tests/landing-clarity.contract.test.tsx tests/landing-information-architecture.contract.test.tsx tests/mobile-entry-routes.contract.test.tsx tests/themen-surface-staging.contract.test.tsx tests/analyze-workbench-hidden-until-start.test.ts`

Result:

- `typecheck` green
- `lint` green
- `15/15` test files green
- `74/74` tests green
- known non-failing warning remains in `mobile-entry-routes.contract.test.tsx` for `fill` and `priority`

## Remaining worktree drift

Still dirty after the commit:

- `docs/E150/OpenTasks.md`
- create multibranch / place / street-registry follow-up cluster
- Voxy/Public/global style drift
- orchestrator / telemetry drift
- unrelated admin review drift

## Next recommended step

Reconcile docs/backlog drift after the Start/Create/Draft commit:

1. keep this `00V` evidence either uncommitted or docs-only commit later
2. audit `OpenTasks.md` vs committed slices
3. only after that consider any further recovery or QA task

`END-TO-END-CLOSED-PROCESS-QA-19` remains out of scope and must not be started yet.
