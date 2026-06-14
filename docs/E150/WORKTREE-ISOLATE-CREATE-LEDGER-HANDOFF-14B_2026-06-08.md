# WORKTREE-ISOLATE-CREATE-LEDGER-HANDOFF-14B

## Geprüfter Commit-Stand

- `46f03d0b3842c63a41efa2288cf1987ea4e47ca9` `fix(create): isolate planner fallback copy`
- `e9d7b628c25ecfd9dcbe054560b1377d66f8003a` `docs(e150): register bilingual product shell`

## Geprüfte Dateien

- `apps/web/src/app/api/contributions/save/route.ts`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/createProductionAccess.ts`
- `apps/web/src/features/create/createSurfaceConfig.ts`
- `apps/web/src/features/create/intelligentFollowupContract.ts`
- `apps/web/src/features/create/branchHandoffTargets.ts`
- `features/create/createContributionLedger.ts`
- `apps/web/tests/create-branch-ledger-persistence.contract.test.tsx`
- `apps/web/tests/create-branch-handoff-workbench.contract.test.tsx`
- `apps/web/tests/create-existing-match-counting.contract.test.tsx`
- `apps/web/tests/create-qr-swipes-drafts.contract.test.tsx`
- `apps/web/tests/create-handoff.persistence.route.test.ts`
- `apps/web/tests/create-handoff-draft.contract.test.ts`

## Bewertung je Datei / Hunk

### `apps/web/src/app/api/contributions/save/route.ts`

- Gehört eindeutig zum Ledger-Scope.
- Wertvoll: ergänzt `packageId`, baut `createContributionLedger` aus `analysis.intelligentFollowup.contributionPackage` und verhindert Duplikate über `packageId`.
- Guardrail-konform: bleibt Draft-/Review-orientiert; keine Veröffentlichung, kein Vote, kein Merge, kein Dossier-Autostart.
- Commitbar als Datei.
- Relevante Tests:
  - `tests/create-branch-ledger-persistence.contract.test.tsx`

### `features/create/createContributionLedger.ts`

- Gehört eindeutig zum Ledger-Scope.
- Wertvoll: kanonisches Read-/Persistenzmodell für Package-, Branch-, QR-, Swipe- und Match-Entwürfe.
- Guardrail-konform: Draft-only, `publishedAt`/`countedAt`/`mergedAt` bleiben `null`, Auto-Pfade sind explizit blockiert.
- Commitbar als Datei.
- Mischpunkt: persistiert auch Branch-Metadaten für Place-/Street-Klärung, aber nur als Snapshot innerhalb des Ledger-Eintrags, nicht als neuer produktiver Place-/Street-Pfad.
- Relevante Tests:
  - `tests/create-branch-ledger-persistence.contract.test.tsx`
  - `tests/create-existing-match-counting.contract.test.tsx`
  - `tests/create-qr-swipes-drafts.contract.test.tsx`

### `apps/web/src/features/create/branchHandoffTargets.ts`

- Gehört eindeutig zum Handoff-Scope.
- Wertvoll: mappt Branch-Aktionen auf review-first Zielräume und Similarity-Signaturen.
- Guardrail-konform: nur vorbereitete Ziele; keine Veröffentlichung, kein Merge, kein Auto-Start.
- Commitbar als Datei.
- Mischpunkt: `place_clarification` bleibt als vorbereiteter Handoff-Typ enthalten, aber ohne produktive Place-Erzeugung.
- Relevante Tests:
  - `tests/create-branch-handoff-workbench.contract.test.tsx`

### `apps/web/src/app/create/CreateClient.tsx`

- Teilweise Ledger-/Handoff-relevant, aber nicht sauber isoliert.
- Echte 14B-Hunks:
  - `CreateContributionPackageSnapshot`
  - `buildCreateContributionPackageStorageKey`
  - `parseCreateContributionPackageSnapshot`
  - `contributionPackageStorageKey`
  - `contributionPackagePersistRef`
  - `persistContributionPackageDraft`
  - debouncter Persistenz-`useEffect`
  - Branch-Entscheidungs-Handler für Action-, Match- und Stance-Drafts
- Blockierende Vermischung:
  - Place-/Street-Klärung inklusive `lookupStreetCandidate`
  - Retry-/Planner-UI
  - Profilkontext-Einspeisung
  - breite Multibranch- und Followup-UI-Verdrahtung
- Ergebnis: nicht als Datei commitbar; braucht hunkgenaue Entmischung in einem Folgeslice.

### `apps/web/src/features/create/intelligentFollowupContract.ts`

- Teilweise Ledger-/Handoff-relevant, aber stark gemischt.
- Echte 14B-Typen:
  - `BranchActionIntent`
  - `Claim*`- und `ExistingMatch*`-Typen
  - `ContributionPackage`
- Blockierende Vermischung:
  - umfangreiche Place-/Street-/Jurisdiktions-Typen
  - zusätzliche Planner-/Runtime-Debug-Strukturen
  - breiter Multibranch-Vertrag statt minimaler Ledger-Schnittstelle
- Ergebnis: nicht als Datei commitbar; braucht Entmischung oder einen kleineren extrahierten Contract.

### `apps/web/src/features/create/createProductionAccess.ts`

- Nicht 14B-Kern.
- Enthält nur Copy-Drift zum Organisationsschritt.
- Bleibt draußen.

### `apps/web/src/features/create/createSurfaceConfig.ts`

- Nicht 14B-Kern.
- Enthält breite Create-Copy-Änderungen.
- Bleibt draußen.

## Guardrail-Bewertung

- Kein Auto-Publish beobachtet.
- Kein Auto-Dossier beobachtet.
- Kein Auto-Anlassraum beobachtet.
- Kein Auto-Vote beobachtet.
- Kein Auto-Graph beobachtet.
- Contribution-Save bleibt draft-/ledger-orientiert.
- Handoffs bereiten nur Zielräume vor.
- Kein stiller KI-/DeepSearch-/Kostenpfad im geprüften Ledger-Kern.

## Zum Ledger-/Handoff-Scope gehörend

- `apps/web/src/app/api/contributions/save/route.ts`
- `features/create/createContributionLedger.ts`
- `apps/web/src/features/create/branchHandoffTargets.ts`
- `apps/web/tests/create-branch-ledger-persistence.contract.test.tsx`
- `apps/web/tests/create-branch-handoff-workbench.contract.test.tsx`
- `apps/web/tests/create-existing-match-counting.contract.test.tsx`
- `apps/web/tests/create-qr-swipes-drafts.contract.test.tsx`
- optional als bestehende Regression: `apps/web/tests/create-handoff.persistence.route.test.ts`

## Draußen bleibend

- `apps/web/src/app/create/CreateClient.tsx`
  - Grund: Ledger-Hunks sind mit Place-/Street-/Retry-/UI-Hunks vermischt.
- `apps/web/src/features/create/intelligentFollowupContract.ts`
  - Grund: Ledger-Typen sind mit Place-/Street-/Jurisdiktions- und Debug-Typen vermischt.
- `apps/web/src/features/create/createProductionAccess.ts`
- `apps/web/src/features/create/createSurfaceConfig.ts`
- `apps/web/src/app/api/create/intelligent-followup/route.ts`
- `apps/web/src/features/create/createPlanner.ts`
- `apps/web/src/features/create/intelligentFollowup.ts`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/features/quickActions/taskFirstQuickActions.ts`
- `apps/web/src/features/surfaces/runden/manualAnlassraumSetup.ts`
- `apps/web/src/app/globals.css`
- `apps/web/.env.example`
- `apps/web/src/app/account/AccountReviewSupplementSections.tsx`
- `apps/web/src/app/api/factcheck/status/[jobId]/prepareGraphCandidateAction.ts`

## Tests und Ergebnis

- `pnpm -C apps/web run typecheck`
  - grün
- `pnpm -C apps/web run lint`
  - grün
- `pnpm -C apps/web exec vitest run tests/create-branch-ledger-persistence.contract.test.tsx tests/create-branch-handoff-workbench.contract.test.tsx tests/create-existing-match-counting.contract.test.tsx tests/create-qr-swipes-drafts.contract.test.tsx tests/create-handoff.persistence.route.test.ts tests/create-handoff-draft.contract.test.ts`
  - grün:
    - `tests/create-branch-ledger-persistence.contract.test.tsx`
    - `tests/create-branch-handoff-workbench.contract.test.tsx`
    - `tests/create-existing-match-counting.contract.test.tsx`
    - `tests/create-qr-swipes-drafts.contract.test.tsx`
    - `tests/create-handoff.persistence.route.test.ts`
  - rot:
    - `tests/create-handoff-draft.contract.test.ts`
    - Befund: alte Planner-Topic-Erwartung (`"Tierschutz, Tierhaltung und Agrarstandards"`) passt nicht mehr zum aktuellen Fallback-Output (`"GPT-Einordnung nicht abgeschlossen"`); kein neuer Fehler im Ledger-Persistenzpfad.

## Ist ein kleiner Commit-Scope möglich?

- Ein kleiner belastbarer Server-/Helper-Scope ist möglich.
- Ein vollständiger Ledger-/Handoff-Commit inklusive `CreateClient.tsx` und Vertrags-Typen ist noch nicht sauber stagebar.

## Exakter derzeit belastbarer Kern

- `apps/web/src/app/api/contributions/save/route.ts`
- `features/create/createContributionLedger.ts`
- `apps/web/src/features/create/branchHandoffTargets.ts`
- `apps/web/tests/create-branch-ledger-persistence.contract.test.tsx`
- `apps/web/tests/create-branch-handoff-workbench.contract.test.tsx`
- `apps/web/tests/create-existing-match-counting.contract.test.tsx`
- `apps/web/tests/create-qr-swipes-drafts.contract.test.tsx`

## Blockierende Hunks für einen vollständigen Folgescope

- `apps/web/src/app/create/CreateClient.tsx`
  - Persistenz-Hunks liegen im selben großen Diff wie Place-/Street-Klärung, Retry-UI und breite Followup-Verdrahtung.
- `apps/web/src/features/create/intelligentFollowupContract.ts`
  - Ledger-relevante Typen sind nicht sauber von Place-/Street-/Jurisdiktions-Typen getrennt.

## Nächster empfohlener Schritt

- `WORKTREE-UNTANGLE-CREATE-LEDGER-HANDOFF-14B2`
- Ziel: die Ledger-/Handoff-Hunks in `CreateClient.tsx` und die minimal nötigen Contract-Typen in `intelligentFollowupContract.ts` vom Place-/Street-/Retry-Mix trennen, damit anschließend ein fokussierter Commit-Scope stagebar ist.
