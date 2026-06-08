# WORKTREE-ISOLATE-START-CREATE-DRAFT-00T

Date: 2026-06-06
Status: inspection only, not staged, not committed

## Scope

Target cluster:

- START-CREATE-LIGHT-ENTRY-01
- START-CREATE-LIGHT-HERO-POLISH-02
- START-CREATE-LIGHT-SUBMIT-AND-RELEVANCE-GATE-03
- START-MOBILE-SCROLL-STABILITY-04
- START-DRAFT-CONTEXT-HANDOFF-05
- GLOBAL-DRAFT-STATUS-BAR-06
- ACCOUNT-RESUME-WORKBENCH-07
- BRANCH-WORKSPACE-HANDOFF-08
- CLOSED-COSMOS-UX-AUDIT-09
- DRAFT-TO-REVIEW-ANALYZE-GATE-10

Explicitly excluded from this slice:

- Factcheck cluster
- Graph / Merge cluster
- Editorial Review cluster
- Runden cluster
- Truth-Guard cluster
- `docs/E150/OpenTasks.md`

## Clear in-cluster files

The following files are clearly part of the Start / Create / Draft cluster and can stay in the cluster from a product perspective:

- `apps/web/src/app/start/LandingStart.tsx`
- `apps/web/src/app/themen/page.tsx`
- `apps/web/src/app/themen/ThemenStartDraftAssistant.tsx`
- `apps/web/src/app/account/AccountResumeWorkbenchSection.tsx`
- `apps/web/src/features/start/LandingCreateLightEntry.tsx`
- `apps/web/src/features/start/GlobalDraftStatusBar.tsx`
- `apps/web/src/features/start/StartDraftResumeBanner.tsx`
- `apps/web/src/features/start/StartDraftWorkspaceChooser.tsx`
- `apps/web/src/features/start/draftNextActionGate.ts`
- `apps/web/src/features/start/landingCreateLight.ts`
- `apps/web/src/features/start/startDraftContext.ts`
- `apps/web/src/features/create/SharedCreateComposer.tsx`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/features/create/createPlanner.ts`
- `apps/web/src/features/create/createProductionAccess.ts`
- `apps/web/src/features/create/createSurfaceConfig.ts`
- `apps/web/src/features/create/intelligentFollowup.ts`
- `apps/web/src/features/create/intelligentFollowupContract.ts`
- `apps/web/src/features/create/branchHandoffTargets.ts`
- `apps/web/src/features/create/placeResolution.ts`
- `features/account/createContributionLedgerTypes.ts`
- `features/account/loadAccountCreateContributionLedger.ts`
- tests:
  - `tests/start-draft-context.contract.test.ts`
  - `tests/start-draft-handoff-targets.contract.test.ts`
  - `tests/start-create-light-entry.contract.test.tsx`
  - `tests/start-shared-create-composer.contract.test.tsx`
  - `tests/global-draft-status-bar.contract.test.tsx`
  - `tests/branch-workspace-handoff.contract.test.ts`
  - `tests/account-resume-workbench.contract.test.tsx`
  - `tests/create-branch-ledger-persistence.contract.test.tsx`
  - `tests/closed-cosmos-ux-audit.contract.test.ts`
  - `tests/draft-to-review-analyze-gate.contract.test.ts`
  - `tests/landing-clarity.contract.test.tsx`
  - `tests/landing-information-architecture.contract.test.tsx`
  - `tests/mobile-entry-routes.contract.test.tsx`
  - `tests/themen-surface-staging.contract.test.tsx`
- docs:
  - `docs/E150/START-CREATE-LIGHT-ENTRY-01_2026-06-06.md`
  - `docs/E150/START-CREATE-LIGHT-HERO-POLISH-02_2026-06-06.md`
  - `docs/E150/START-DRAFT-CONTEXT-HANDOFF-05_2026-06-06.md`
  - `docs/E150/GLOBAL-DRAFT-STATUS-BAR-06_2026-06-06.md`
  - `docs/E150/ACCOUNT-RESUME-WORKBENCH-07_2026-06-06.md`
  - `docs/E150/BRANCH-WORKSPACE-HANDOFF-08_2026-06-06.md`
  - `docs/E150/CLOSED-COSMOS-UX-AUDIT-09_2026-06-06.md`
  - `docs/E150/DRAFT-TO-REVIEW-ANALYZE-GATE-10_2026-06-06.md`

## Crosscutting blockers

The cluster is not currently committable because several shared files still mix Start / Create / Draft with other already-isolated clusters.

### `apps/web/src/app/account/AccountClient.tsx`

Hunk assignment:

- Start / Create / Draft:
  - create contribution ledger imports
  - branch handoff helper imports
  - resume workbench rendering
  - large `CreateContributionLedgerSection` block
- Editorial:
  - `AccountEditorialReviewSupplement`
  - `readAccountEditorialReviewSlice`
- Factcheck:
  - `readAccountFactcheckJobSlice`
  - factcheck section render

Assessment:

- better than before, but still mixed
- not safe for a Start-only commit as-is

### `features/account/service.ts`

Hunk assignment:

- Start / Create / Draft:
  - `loadAccountCreateContributionLedger`
  - `createContributionLedgerPromise`
  - `createContributionLedger` in aggregation and return shape
- Factcheck:
  - `loadAccountFactcheckJobs`
  - `factcheckJobsPromise`
  - `factcheckJobs` in aggregation and return shape

Assessment:

- Start and Factcheck live in the same changed block
- not hunk-clean for a Start-only commit

### `features/account/types.ts`

Hunk assignment:

- Start / Create / Draft:
  - `AccountCreateContributionLedgerSlice`
- Factcheck:
  - `AccountFactcheckJobSlice`

Assessment:

- mixed type composition block
- not hunk-clean for a Start-only commit

### `apps/web/src/app/create/CreateClient.tsx`

Hunk assignment:

- Start / Create / Draft:
  - create mode composition
  - planner / draft surface flow
  - start/create handoff UI
- Factcheck:
  - entitlement gate usage
  - factcheck next actions and confirmation state
  - `/factcheck` routing and related copy
- Editorial:
  - editorial review route links and action strings
- Graph:
  - planner metadata references tied to graph-related follow-up paths

Assessment:

- heavily crosscutting
- not committable for Start / Create / Draft without further untangling

### `apps/web/src/app/globals.css`

Hunk assignment:

- Start / Create / Draft:
  - `landing-*`
  - `public-start-*`
- Voxy general / public shared:
  - generic `public-*` shell and stage rules
  - shared hero, panel and avatar adjustments
- Unclear:
  - broad mobile/public visual changes that affect more than one surface

Assessment:

- not safe to include wholesale
- needs hunk-level extraction or a later dedicated visual-system pass

### `apps/web/src/components/voxy/VoxyGuide.tsx`

Hunk assignment:

- Voxy general:
  - avatar sizing
  - marker and stage layout
  - shared presentation adjustments
- Start / Create / Draft:
  - none isolated cleanly in the current diff

Assessment:

- not Start-specific
- keep out of a Start / Create / Draft commit

### `apps/web/src/features/voxy/voxyCopy.ts`

Hunk assignment:

- Start / Create / Draft:
  - `start`
  - `create`
- Runden:
  - `anlassraum`
  - `rundenEntry`
  - `rundenHero`
  - `manualFrame`
  - `manualSupport`

Assessment:

- mixed with the already committed Runden cluster
- should stay out of a Start / Create / Draft commit in current form

## Commitability assessment

Current verdict: **not isolated committable**

Reasons:

- account slice files still mix Start with Factcheck and prior account supplement work
- `CreateClient.tsx` still mixes Start/Create with Factcheck, Editorial and Graph-related follow-up paths
- `globals.css`, `VoxyGuide.tsx` and `voxyCopy.ts` are not Start-only
- the focused Start/Create/Draft test suite is not fully green

## Test run

Executed:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/start-draft-context.contract.test.ts tests/start-draft-handoff-targets.contract.test.ts tests/start-create-light-entry.contract.test.tsx tests/start-shared-create-composer.contract.test.tsx tests/global-draft-status-bar.contract.test.tsx tests/branch-workspace-handoff.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/create-branch-ledger-persistence.contract.test.tsx tests/closed-cosmos-ux-audit.contract.test.ts tests/draft-to-review-analyze-gate.contract.test.ts tests/landing-clarity.contract.test.tsx tests/landing-information-architecture.contract.test.tsx tests/mobile-entry-routes.contract.test.tsx tests/themen-surface-staging.contract.test.tsx`

Result:

- `typecheck`: passed
- `lint`: passed
- `vitest`: failed
  - `4 failed`
  - `10 passed`
  - `6 failed tests`
  - `51 passed tests`

Observed failing areas:

- `tests/start-draft-context.contract.test.ts`
  - expected status label `Entwurf`
  - received `Analyse-Entwurf`
- `tests/start-draft-handoff-targets.contract.test.ts`
  - expected `Wir suchen Themen, an die dein Beitrag anknüpfen könnte.`
  - expected `StartDraftWorkspaceChooser`
- `tests/closed-cosmos-ux-audit.contract.test.ts`
  - expected `Wir suchen Themen, an die dein Beitrag anknüpfen könnte.`
  - expected `StartDraftWorkspaceChooser`
- `tests/branch-workspace-handoff.contract.test.ts`
  - expected `StartDraftWorkspaceChooser`
  - expected `Runde vorbereiten`

Non-blocking note:

- `tests/mobile-entry-routes.contract.test.tsx` emitted React attribute warnings for `fill` and `priority` in the test renderer, but the file passed

## Files that should stay out

Do not include in a Start / Create / Draft isolation commit in the current state:

- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/app/account/AccountClient.tsx`
- `features/account/service.ts`
- `features/account/types.ts`
- `apps/web/src/app/globals.css`
- `apps/web/src/components/voxy/VoxyGuide.tsx`
- `apps/web/src/features/voxy/voxyCopy.ts`
- all Factcheck files
- all Graph / Merge files
- all Editorial Review files
- all Runden files
- all Truth-Guard files
- `docs/E150/OpenTasks.md`

## Remaining drift

- broad Start / Create / Draft implementation remains open in worktree
- account aggregation still crosses Start and Factcheck
- create surface still crosses Start, Editorial, Factcheck and Graph-related follow-up paths
- the Start-focused contract suite is not green

## Recommended next safe step

Do not commit this cluster yet.

Smallest safe follow-up:

1. untangle `features/account/service.ts` and `features/account/types.ts` so Start slices are independent from Factcheck slices
2. split `apps/web/src/app/account/AccountClient.tsx` so resume / create-ledger rendering is isolated from factcheck/editorial supplements
3. separate Start/Create-only behavior from Factcheck/Editorial follow-up logic in `apps/web/src/app/create/CreateClient.tsx`
4. rerun the Start/Create/Draft suite and only reassess commitability after the current contract failures are resolved

## What was not changed

- no source behavior was changed in this audit
- no staging
- no commit
- `docs/E150/OpenTasks.md` was not modified
