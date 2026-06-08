# WORKTREE-DECOUPLE-CREATECLIENT-00U6

## Ausgangslage

`WORKTREE-COMMIT-START-CREATE-DRAFT-00V` wurde erneut abgebrochen, weil `apps/web/src/app/create/CreateClient.tsx` Start/Create/Draft-Hunks noch mit fachfremden Blöcken vermischt hat:

- Factcheck-Gate / Bestätigungs-CTA
- redaktioneller Next-Step-Link
- Branch-/Planner-Callbacks
- Place-/Street-Resolution
- weitere Follow-up- und Review-Hunks

Die fokussierte Start/Create/Draft-Suite war davor bereits grün, aber `CreateClient.tsx` ließ sich nicht belastbar hunkgenau stagen.

## Entkopplung in 00U6

### Neue Start/Create/Draft-Abspaltungen

- `apps/web/src/app/create/createStartDraftRestore.ts`
  - kapselt Restore-/Übernahme-Logik für `StartDraftContext`
  - enthält jetzt `getStartDraftForTarget("create")`
  - enthält jetzt `bumpStartDraftHandoff("create")`

- `apps/web/src/app/create/CreateDraftNextActionGate.tsx`
  - kapselt den `create-draft-next-action-gate`
  - enthält jetzt `parseCreateDraftNextActionParam(...)`
  - enthält jetzt `resolveDraftNextActionsForStartDraft(...)`
  - hält die UI für:
    - `Leichte Einordnung starten`
    - `Vertiefte Prüfung benötigt Bestätigung`
    - `Pakete ansehen`
    - `Zur redaktionellen Prüfung geben`

### CreateClient nach der Entkopplung

`apps/web/src/app/create/CreateClient.tsx` enthält jetzt für den Start/Create/Draft-Slice nur noch kleine, klar trennbare Integrationshunks:

- Import von `CreateDraftNextActionGate`
- Import von `CreateStartDraftHandoff`
- Import von `useCreateStartDraftRestore`
- Hook-Aufruf `useCreateStartDraftRestore(...)`
- Render von `CreateStartDraftHandoff`
- Render von `CreateDraftNextActionGate`

Die gemischten StartDraft-/Gate-Strings sitzen nicht mehr inline zwischen Branch-/Place-/Planner-Logik.

## Hunkbarkeit / Machbarkeit

### CreateClient.tsx

Status: **jetzt stagebar**

Begründung:

- `getStartDraftForTarget("create")` liegt nicht mehr in `CreateClient.tsx`, sondern in `createStartDraftRestore.ts`
- `data-testid="create-draft-next-action-gate"` liegt nicht mehr inline in `CreateClient.tsx`, sondern in `CreateDraftNextActionGate.tsx`
- die verbleibenden `CreateClient.tsx`-Hunks für Start/Create/Draft sind jetzt auf Import-/Hook-/Render-Ebene getrennt

### Index-Probe

- kein finales Staging vorgenommen
- `git diff --cached --name-status` am Ende: leer

## Tests

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/start-draft-context.contract.test.ts tests/start-draft-handoff-targets.contract.test.ts tests/start-create-light-entry.contract.test.tsx tests/start-shared-create-composer.contract.test.tsx tests/global-draft-status-bar.contract.test.tsx tests/branch-workspace-handoff.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/create-branch-ledger-persistence.contract.test.tsx tests/closed-cosmos-ux-audit.contract.test.ts tests/draft-to-review-analyze-gate.contract.test.ts tests/landing-clarity.contract.test.tsx tests/landing-information-architecture.contract.test.tsx tests/mobile-entry-routes.contract.test.tsx tests/themen-surface-staging.contract.test.tsx`

Ergebnis:

- `typecheck`: grün
- `lint`: grün
- Vitest: `14/14` Testdateien, `57/57` Tests grün

Bekannte Restwarnung:

- `mobile-entry-routes.contract.test.tsx` meldet weiter React-Warnungen zu `fill` und `priority`, ohne Fehlschlag

## Finaler Scope für 00V

### Rein

- Start-/Themen-/Draft-Dateien aus `00T`, `00U`, `00U2`, `00U3`, `00U4`, `00U5`
- `apps/web/src/app/create/CreateStartDraftHandoff.tsx`
- `apps/web/src/app/create/CreateDraftNextActionGate.tsx`
- `apps/web/src/app/create/createStartDraftRestore.ts`
- Start/Create-Draft-Hunks in `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/start/startCreateVoxyCopy.ts`
- `apps/web/src/features/start/startExperience.ts`
- `apps/web/src/features/create/SharedCreateComposer.tsx`
- `apps/web/src/app/start/LandingStart.tsx`
- `apps/web/src/app/start/page.tsx`
- `apps/web/src/app/create/page.tsx`
- `apps/web/src/server/createContributionDrafts.ts`
- `apps/web/src/app/themen/ThemenStartDraftAssistant.tsx`
- `apps/web/src/app/themen/page.tsx`
- `apps/web/src/app/account/AccountResumeWorkbenchSection.tsx`
- `apps/web/src/app/account/CreateContributionLedgerSection.tsx`
- `apps/web/src/app/account/AccountCreateDraftSections.tsx`
- `features/account/createContributionLedgerTypes.ts`
- `features/account/loadAccountCreateContributionLedger.ts`
- die Start/Create-Draft-Hunks in:
  - `apps/web/src/app/account/AccountClient.tsx`
  - `features/account/service.ts`
  - `features/account/types.ts`
  - `apps/web/src/app/runden/new/AnlassraumSetupForm.tsx`
  - `apps/web/src/app/runden/new/AnlassraumStartDraftPanel.tsx`
- die zugehörigen Tests
- Evidence:
  - `00T`
  - `00U`
  - `00U2`
  - `00U3`
  - `00U4`
  - `00U5`
  - `00U6`

### Draußen

- `apps/web/src/app/globals.css`
- `apps/web/src/components/voxy/VoxyGuide.tsx`
- `apps/web/src/features/voxy/voxyCopy.ts`
- Factcheck-, Graph-, Editorial-, Truth-Guard-Dateien außerhalb des klaren Start/Create/Draft-Scopes
- `docs/E150/OpenTasks.md`

## Ergebnis

`WORKTREE-COMMIT-START-CREATE-DRAFT-00V` kann jetzt erneut ausgeführt werden.
