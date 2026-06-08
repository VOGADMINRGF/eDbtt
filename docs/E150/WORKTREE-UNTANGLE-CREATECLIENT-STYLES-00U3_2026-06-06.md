# WORKTREE-UNTANGLE-CREATECLIENT-STYLES-00U3

## Scope

- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/app/globals.css`
- begleitend nur bereits fuer Start/Create isolierte Copy-Nutzung

## Ausgangsblocker aus 00U2

Der Start/Create/Draft-Cluster war trotz gruener fokussierter Suite noch nicht separat commitbar, weil:

1. `CreateClient.tsx` Start/Draft-Handoffs, Factcheck-Gates, Editorial-Handoffs und Branch-/Planner-Logik im selben Dateidiff mischte.
2. `globals.css` Start-/Landing-Hunks mit generischen Public-/Voxy-/Runden-Hunks vermischte.
3. `VoxyGuide.tsx` und `voxyCopy.ts` weiterhin generischen Querschnittsdrift enthielten.

## Hunk-Zuordnung `CreateClient.tsx`

### Eindeutig Start/Create/Draft

- Importwechsel von `getVoxyCopy` auf `getStartCreateVoxyCopy`
- `resolveCreateClientVoxyThemeVariant(...)`
- `initialNextActionParam`
- StartDraft-Hydration und lokale Uebernahme:
  - `startDraftContext`
  - `pendingStartDraftImport`
  - `applyStartDraftToCreate(...)`
  - `getStartDraftForTarget("create")`
  - `bumpStartDraftHandoff("create")`
- StartDraft-Oberflaeche im oberen Meta-Bereich:
  - `GlobalDraftStatusBar`
  - `StartDraftWorkspaceChooser`
  - guarded next-action gate fuer leichten Start vs. bewusste Vertiefung
- Copy-/Hero-Anpassungen fuer die Create-Einstiegsoberflaeche

### Nicht Start/Create-only und daher weiter gemischt

- Factcheck-Gate-Importe und -Zustaende:
  - `resolveFactcheckEntitlementGate`
  - `getFactcheckEntitlementGateMessage`
  - `factcheckConfirmationVisible`
  - `confirmFactcheckServiceStart`
  - `handleStartFactcheckService`
- Editorial-Handoff:
  - `handleRequestEditorialReview`
- Branch-/Planner-/Place-Logik:
  - `lookupStreetCandidate`
  - `ContributionPackage`
  - `ExistingMatchDecisionDraft`
  - Branch-/Claim-/Place-Handler
- Followup-/Planner-Retry-/Material-Hunks

## Vorgenommene Entkopplung

### Start/Create-Voxy-Copy

Start/Create nutzt jetzt die separat isolierte Datei:

- `apps/web/src/features/start/startCreateVoxyCopy.ts`

Dadurch ist `voxyCopy.ts` fuer einen spaeteren Start/Create-Commit nicht mehr erforderlich.

### Create-/Account-Querschnitt

Zur Hunkbarkeit des Start/Create-Clusters wurden in den direkt angrenzenden Account-Dateien bereits separat gekapselt:

- `apps/web/src/app/account/CreateContributionLedgerSection.tsx`
- `features/account/loadAccountCreateContributionLedger.ts`
- hunkbare Create-Slices in:
  - `apps/web/src/app/account/AccountClient.tsx`
  - `features/account/service.ts`
  - `features/account/types.ts`

Das reduziert den Start/Create-Querschnitt deutlich, loest aber `CreateClient.tsx` selbst noch nicht vollstaendig.

## Hunk-Zuordnung `globals.css`

### Klar Start/Landing-bezogen

- `landing-*`
- `public-start-*`
- `landing-hero-*`
- `landing-header .public-voxy-*` soweit nur im Start-Hero verwendet

### Generischer Public-/Querschnittsdrift

- `public-shell`
- `public-reader-grid`
- `public-hero-title`
- `public-section-title`
- `public-gradient-text`
- `public-action-row`
- `public-color-rail`
- `public-voxy-*`

### Anderer Cluster

- `runden-*`
- `anlassraum-*`

## Bewertung `globals.css`

`globals.css` ist fuer den Start/Create-Commit weiterhin **nicht** sauber genug. Die Datei enthaelt gleichzeitig:

- Start-/Landing-Hunks
- generische Public-Design-Hunks
- Voxy-Querschnitt
- Runden-/Anlassraum-Hunks

Empfehlung: `globals.css` fuer den spaeteren Start/Create-Commit weiterhin ausschliessen, bis die Public-/Landing-Styles separat entmischt sind.

## Ausgeschlossen in diesem Slice

- `apps/web/src/components/voxy/VoxyGuide.tsx`
- `apps/web/src/features/voxy/voxyCopy.ts`
- `docs/E150/OpenTasks.md`

## Commitbarkeit des Start/Create/Draft-Clusters

Noch **nicht** isoliert commitbar.

### Verbleibende Hauptblocker

1. `apps/web/src/app/create/CreateClient.tsx`
   - Start/Draft-Hunks sind besser abgrenzbar, aber weiter im selben Dateidiff mit Factcheck-, Editorial- und Branch-/Planner-Hunks gemischt.
2. `apps/web/src/app/globals.css`
   - Start-/Landing-Hunks sind nicht sauber von generischen Public-/Voxy-Hunks getrennt.

## Tests

Ausgefuehrt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/start-draft-context.contract.test.ts tests/start-draft-handoff-targets.contract.test.ts tests/start-create-light-entry.contract.test.tsx tests/start-shared-create-composer.contract.test.tsx tests/global-draft-status-bar.contract.test.tsx tests/branch-workspace-handoff.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/create-branch-ledger-persistence.contract.test.tsx tests/closed-cosmos-ux-audit.contract.test.ts tests/draft-to-review-analyze-gate.contract.test.ts tests/landing-clarity.contract.test.tsx tests/landing-information-architecture.contract.test.tsx tests/mobile-entry-routes.contract.test.tsx tests/themen-surface-staging.contract.test.tsx`

Ergebnis:

- `typecheck` gruen
- `lint` gruen
- `14/14` Testdateien gruen
- `57/57` Tests gruen

Bekannte Restwarnung:

- `mobile-entry-routes.contract.test.tsx` meldet weiterhin React-DOM-Warnungen zu `fill` und `priority`, ohne Testfehlschlag

## Verbleibende Risiken

- `CreateClient.tsx` bleibt der groesste Restmischer im Start/Create/Draft-Cluster.
- `globals.css` bleibt ein generischer Public-/Landing-/Voxy-Sammeldiff und sollte aktuell nicht in einen Start/Create-Commit.
- `VoxyGuide.tsx` und `voxyCopy.ts` duerfen weiter nicht in den Start/Create-Commit gezogen werden.

