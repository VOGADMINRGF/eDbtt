# WORKTREE-UNTANGLE-CREATE-MULTIBRANCH-FOUNDATION-14D2

## Geprüfter Commit-Stand

- `4439e57cf4f5284d325bec862636258e441caefc` `docs(e150): require multibranch foundation before place street`

## Warum 14D nicht committed wurde

- Der erste 14D-Scope war fachlich richtig, aber beim dateibasierten Staging nicht sauber isolierbar.
- `apps/web/src/features/create/CreateVisualFollowup.tsx` hätte weiterhin große Teile von:
  - MultiBranchActionBoard
  - Place-/Street-Panel
  - Existing-Match-/Claim-Stance-UI
  - Handoff-Workbench
  - breiter Followup-UX
  mitgezogen.
- `apps/web/src/features/create/intelligentFollowupContract.ts` hätte neben Foundation-Helfern weiterhin:
  - Place-/Street-Typen
  - `placeResolutionDebug`
  - breite Meta-Erweiterungen
  mitgezogen.

## Jetzt isolierte Foundation-Teile

- `apps/web/src/features/create/createMultibranchFoundation.ts`
  - `BranchActionIntent`
  - `BranchDecisionStatus`
  - `MultibranchFoundationBranch`
  - `ContributionPackageFoundation<TBranch>`
  - `resolveStableActiveBranchId(...)`
  - `hasCompletedContributionPackageSelection(...)`
- `apps/web/tests/create-multibranch-actions.contract.test.tsx`
  - prüft nur noch den stabilen Foundation-Kern
  - keine UI
  - keine Producer
  - keine Produktboards

## Umgang mit den Mischdateien

### `intelligentFollowupContract.ts`

- Bleibt bewusst außerhalb des späteren Commit-Scope.
- Wurde nur lokal kompatibilisiert:
  - Claim-/Existing-Match-Produktformen leben wieder direkt in dieser Datei
  - Foundation importiert nur noch generische Branch-Basis
- Dadurch muss der spätere Commit diese Mischdatei nicht mehr cachen.

### `CreateVisualFollowup.tsx`

- Bleibt bewusst außerhalb des späteren Commit-Scope.
- Nutzt weiterhin die generischen Helper aus der Foundation-Datei.
- Die große Multibranch-UI, Place-/Street-Panels, Existing-Match-/Claim-Stance-UI und Handoff-Workbench bleiben vollständig draußen.

## Bewusst draußen

- `apps/web/src/features/create/intelligentFollowup.ts`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/placeResolution.ts`
- `apps/web/src/features/create/createPlanner.ts`
- `apps/web/src/features/create/createSurfaceConfig.ts`
- `apps/web/src/features/create/createProductionAccess.ts`
- `apps/web/src/features/quickActions/taskFirstQuickActions.ts`
- `apps/web/src/features/surfaces/runden/manualAnlassraumSetup.ts`
- `apps/web/src/app/globals.css`
- `apps/web/.env.example`
- alle Place-/Street-, Ledger-/Handoff- und Factcheck-/Account-Reste

## Tests und Ergebnis

- `pnpm -C apps/web run typecheck`
  - grün
- `pnpm -C apps/web run lint`
  - grün
- `pnpm -C apps/web exec vitest run tests/create-multibranch-actions.contract.test.tsx tests/create-place-clarification.contract.test.tsx tests/create-place-registry-jurisdiction.contract.test.tsx tests/create-street-registry-lookup.contract.test.tsx tests/create-place-planner-unavailable-stability.contract.test.tsx`
  - grün
  - `5/5` Dateien
  - `17/17` Tests

## Exakter commitbarer Scope

- `apps/web/src/features/create/createMultibranchFoundation.ts`
- `apps/web/tests/create-multibranch-actions.contract.test.tsx`
- `docs/E150/OpenTasks.md`
- `docs/E150/WORKTREE-UNTANGLE-CREATE-MULTIBRANCH-FOUNDATION-14D2_2026-06-09.md`

## Weitere Entmischung nötig?

- Nicht für den Foundation-Minimalkern.
- Ja, weiterhin für Place-/Street, Producer- und Client-State-Pfade.

## Nächster empfohlener Task

- `WORKTREE-COMMIT-CREATE-MULTIBRANCH-FOUNDATION-14D2`

Danach kann Place-/Street erneut als kleinerer Source-Slice geprüft werden.
