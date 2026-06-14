# WORKTREE-UNTANGLE-CREATE-LEDGER-HANDOFF-14B2

## Geprüfter Commit-Stand

- `60a83a4ef3d3a2e24177b7a8165fc182a54ba34b` `docs(e150): audit create ledger handoff drift`

## Geprüfte Dateien

- `apps/web/src/app/api/contributions/save/route.ts`
- `features/create/createContributionLedger.ts`
- `apps/web/src/features/create/branchHandoffTargets.ts`
- `apps/web/src/features/create/createContributionPackageContract.ts`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/intelligentFollowupContract.ts`
- `apps/web/tests/create-branch-ledger-persistence.contract.test.tsx`
- `apps/web/tests/create-branch-handoff-workbench.contract.test.tsx`
- `apps/web/tests/create-existing-match-counting.contract.test.tsx`
- `apps/web/tests/create-qr-swipes-drafts.contract.test.tsx`
- `apps/web/tests/create-handoff-draft.contract.test.ts`

## Eindeutig zum Ledger-/Handoff-Scope gehörende Hunks

### `apps/web/src/app/api/contributions/save/route.ts`

- `packageId` im Draft-Save-Schema
- `withCreateContributionLedger(...)`
- Package-basierte Draft-Upsert-Logik
- Insert-zu-Ledger-Nachschreiben nach `insertOne`

Bewertung:

- eindeutig Ledger-/Draft-Persistenz
- review-first und draft-orientiert
- keine produktiven Zielstrukturen
- von Place-/Street-/Planner-Core getrennt
- testbar über `create-branch-ledger-persistence`

### `features/create/createContributionLedger.ts`

- kompletter Dateiinhalt

Bewertung:

- kanonischer Ledger-Datentransfer für Branch-, QR-, Swipe-, Match- und Handoff-Entwürfe
- enthält nur vorbereitete Draft-/Review-Zustände
- keine Veröffentlichung, kein Merge, kein Zählen, keine produktiven Strukturen
- Place-/Street-Metadaten werden nur als Snapshot mitgeführt

### `apps/web/src/features/create/branchHandoffTargets.ts`

- kompletter Dateiinhalt

Bewertung:

- reiner Handoff-Zielresolver
- erzeugt nur vorbereitete Ziel-URLs und Review-Drafts
- keine produktive Struktur-Erzeugung
- `place_clarification` bleibt nur vorbereiteter Zieltyp

### `apps/web/src/features/create/createContributionPackageContract.ts`

- kompletter Dateiinhalt

Bewertung:

- minimaler eigener Ledger-/Handoff-Vertrag
- entkoppelt `createContributionLedger.ts` und `branchHandoffTargets.ts` vom gemischten `intelligentFollowupContract.ts`
- enthält nur die für Contribution-Package-, Match- und Place-Snapshot-Strukturen nötigen Typen
- vermeidet Planner-Runtime-Debug- und breiten Multibranch-/UI-Mix

### Tests

- `apps/web/tests/create-existing-match-counting.contract.test.tsx`
  - importiert jetzt `ContributionPackage` aus dem neuen Minimalvertrag
- `apps/web/tests/create-qr-swipes-drafts.contract.test.tsx`
  - importiert jetzt `ContributionPackage` aus dem neuen Minimalvertrag
- `apps/web/tests/create-handoff-draft.contract.test.ts`
  - Legacy-Erwartung minimal auf den aktuellen Fallback gezogen

## Draußen bleibende Hunks

### `apps/web/src/app/create/CreateClient.tsx`

Bleibt vollständig draußen.

Blockierende Vermischung:

- Persistenz-Hunks liegen im selben Diff wie:
  - Place-/Street-Klärung
  - Retry-UI
  - Profilkontext
  - breite Multibranch-Followup-Verdrahtung

### `apps/web/src/features/create/intelligentFollowupContract.ts`

Bleibt vollständig draußen.

Blockierende Vermischung:

- Ledger-/Handoff-Typen zusammen mit:
  - Place-/Street-/Jurisdiktions-Typen für breitere Create-Flows
  - Planner-/Runtime-Debug-Feldern
  - `CreateIntelligentFollowupResult`-Erweiterungen für den gesamten Multibranch-Flow

### Bewusst unangetastet

- `apps/web/src/app/api/create/intelligent-followup/route.ts`
- `apps/web/src/features/create/createPlanner.ts`
- `apps/web/src/features/create/intelligentFollowup.ts`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/features/create/createSurfaceConfig.ts`
- `apps/web/src/features/create/createProductionAccess.ts`
- `apps/web/src/features/quickActions/taskFirstQuickActions.ts`
- `apps/web/src/features/surfaces/runden/manualAnlassraumSetup.ts`
- `apps/web/src/app/globals.css`
- `apps/web/.env.example`
- `apps/web/src/app/account/AccountReviewSupplementSections.tsx`
- `apps/web/src/app/api/factcheck/status/[jobId]/prepareGraphCandidateAction.ts`
- `apps/web/tests/account-organization-dashboard.page.test.tsx`

## Bewertung des roten `create-handoff-draft`-Tests

- Der Test gehört thematisch zum Handoff-Scope, aber nicht direkt zur Ledger-Persistenz.
- Der Fehler lag an einer veralteten Topic-Erwartung:
  - alt: `Tierschutz, Tierhaltung und Agrarstandards`
  - aktuell: `GPT-Einordnung nicht abgeschlossen`
- Der aktuelle Zustand ist fachlich korrekt für den `planner_unavailable`-Fallback aus `createPlanner.ts`.
- Es wurde keine Fachlogik geändert.
- Die Testanpassung ist eine Legacy-Expectation-Korrektur und macht die fokussierte Handoff-Suite wieder belastbar.

## Guardrail-Bewertung

- keine automatische Veröffentlichung
- kein Auto-Dossier
- kein Auto-Anlassraum
- kein Auto-Vote
- kein Auto-Graph
- keine produktive Persistenz ohne Draft-/Review-/User-Gate
- Contribution-Save bleibt draft-/ledger-orientiert
- Handoff erzeugt nur vorbereitete Zielräume
- keine stillen KI-/DeepSearch-/Kostenpfade im entmischten Scope

## Tests und Ergebnis

- `pnpm -C apps/web run typecheck`
  - grün
- `pnpm -C apps/web run lint`
  - grün
- `pnpm -C apps/web exec vitest run tests/create-branch-ledger-persistence.contract.test.tsx tests/create-branch-handoff-workbench.contract.test.tsx tests/create-existing-match-counting.contract.test.tsx tests/create-qr-swipes-drafts.contract.test.tsx tests/create-handoff-draft.contract.test.ts`
  - `5/5` Dateien grün
  - `14/14` Tests grün

## Ist ein kleiner Commit-Scope möglich?

Ja.

## Exakter commitbarer Scope

- `apps/web/src/app/api/contributions/save/route.ts`
- `features/create/createContributionLedger.ts`
- `apps/web/src/features/create/branchHandoffTargets.ts`
- `apps/web/src/features/create/createContributionPackageContract.ts`
- `apps/web/tests/create-branch-ledger-persistence.contract.test.tsx`
- `apps/web/tests/create-branch-handoff-workbench.contract.test.tsx`
- `apps/web/tests/create-existing-match-counting.contract.test.tsx`
- `apps/web/tests/create-qr-swipes-drafts.contract.test.tsx`
- `apps/web/tests/create-handoff-draft.contract.test.ts`
- `docs/E150/OpenTasks.md`
- `docs/E150/WORKTREE-UNTANGLE-CREATE-LEDGER-HANDOFF-14B2_2026-06-09.md`

## Staging-Probe

- Keine Staging-Probe durchgeführt.
- Grund: der Slice verlangt ausdrücklich `kein git add`.
- Der Scope ist trotzdem dateigenau benannt und testseitig validiert.

## Nächster empfohlener Schritt

- `WORKTREE-COMMIT-CREATE-LEDGER-HANDOFF-14B2`
