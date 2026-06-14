# WORKTREE-ISOLATE-CREATE-PLACE-STREET-14C

## Geprüfter Commit-Stand

- `0f850f691753b4c4fef16f8da541412fe6e61f92` `fix(create): isolate ledger handoff persistence`

## Geprüfte Dateien

- `apps/web/src/features/create/placeResolution.ts`
- `apps/web/src/features/create/createSurfaceConfig.ts`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/intelligentFollowupContract.ts`
- `apps/web/src/features/create/intelligentFollowup.ts`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/tests/create-place-clarification.contract.test.tsx`
- `apps/web/tests/create-place-registry-jurisdiction.contract.test.tsx`
- `apps/web/tests/create-street-registry-lookup.contract.test.tsx`
- `apps/web/tests/create-place-planner-unavailable-stability.contract.test.tsx`

## Bewertung je Datei / Hunk

### `apps/web/src/features/create/placeResolution.ts`

- Gehört eindeutig zum Place-/Street-Scope.
- Enthält den eigentlichen Resolver und die ehrliche Street-Registry-Abstraktion:
  - `resolvePlaceAndJurisdiction(...)`
  - `lookupStreetCandidate(...)`
  - `PlaceResolutionCandidate`-/`JurisdictionCandidate`-Logik
  - Guardrail-Copy für `not_configured` und `region_directory`
- Guardrail-konform:
  - keine amtliche Straßenbehauptung ohne Register
  - Zuständigkeit nur als prüfpflichtiger Vorschlag
  - keine externen Maps-/Cookie-/Lookup-Versprechen
- Fachlich klar wertvoll.
- Allein noch kein vollständiger Produkt-Scope, weil die Verbraucher in anderen gemischten Dateien hängen.

### `apps/web/src/features/create/createSurfaceConfig.ts`

- Gehört nicht zum Place-/Street-Scope.
- Der Diff enthält allgemeine Create-/Copy-Anpassungen, aber keine belastbaren Place-/Street-spezifischen Hunks.
- Bleibt draußen.

### `apps/web/src/app/create/CreateClient.tsx`

- Enthält echte Place-/Street-Hunks:
  - `lookupStreetCandidate`-Import
  - Straßen-/Ort-Normalisierung
  - `handleCheckBranchStreet`
  - `handleUpdateBranchPlace`
  - `handleConfirmBranchPlaceCandidate`
  - `handleSkipBranchPlaceClarification`
  - branch-scoped Statusfelder wie `placeResolutionStatus`, `streetRegistryStatus`, `confirmedPlaceCandidateId`
- Aber:
  - dieselbe Datei ist weiter mit Retry-, Ledger- und sonstiger Create-Logik gemischt
  - kein kleiner dateisauberer Scope

### `apps/web/src/features/create/intelligentFollowupContract.ts`

- Enthält den Place-/Street-Vertrag:
  - `PlaceResolution*`
  - `StreetRegistry*`
  - `JurisdictionCandidate`
  - branch-scoped Place-Felder
  - `placeResolutionDebug`
- Aber:
  - derselbe Diff bündelt auch breitere ContributionPackage-/Runtime- und Multibranch-Typen
  - aktuell nicht als kleiner Scope commitbar

### `apps/web/src/features/create/intelligentFollowup.ts`

- Enthält den funktionalen Verbraucherpfad:
  - lokale Branch-Erkennung
  - `applyPlaceResolutionBestEffort(...)`
  - best-effort Place-Resolution nach dem Planner
  - branch-scoped Place-/Street-/Jurisdiction-Status
  - `placeResolutionDebug`
- Guardrail-konform:
  - best effort statt Faktenbehauptung
  - Planner bleibt erhalten, auch wenn Place-Resolution fehlschlägt
- Aber:
  - Diff ist mit breiter Multibranch-/Fallback-/Planner-Logik gemischt

### `apps/web/src/features/create/CreateVisualFollowup.tsx`

- Enthält den Place-/Street-UI-Pfad:
  - `Ort/Straße prüfen`
  - `Ort und Straße noch klären`
  - `Straße prüfen`
  - ehrliche Registry-/Jurisdiction-Hinweise
  - `1 Thema braucht noch eine Ortsangabe`
  - branch-scoped Place-Panel
- Guardrail-konform:
  - keine Veröffentlichung, kein Zählen, kein Zusammenführen
  - klare Warnung vor privaten Wohnadressen
  - ehrliche Register-Copy
- Aber:
  - Diff ist mit größerem Multi-Branch-Board-/Handoff-/UI-Mix gekoppelt

## Guardrail-Bewertung

- keine automatische Orts-/Zuständigkeitsbehauptung ohne Kennzeichnung
- keine Google-/Cookie-/externen Lookup-Versprechen
- keine automatische Behördenverifikation
- Place-/Street-Erkennung bleibt Vorschlag / Clarification
- keine automatische Dossier-/Anlassraum-Erstellung
- keine produktive Persistenz ohne Draft-/Review-/User-Gate
- Fallback bleibt verständlich, wenn Straße oder Ort nicht eindeutig auflösbar sind

## Zum Place-/Street-Scope gehörend

- `apps/web/src/features/create/placeResolution.ts`
- Place-/Street-Hunks in:
  - `apps/web/src/features/create/intelligentFollowup.ts`
  - `apps/web/src/features/create/CreateVisualFollowup.tsx`
  - `apps/web/src/app/create/CreateClient.tsx`
  - `apps/web/src/features/create/intelligentFollowupContract.ts`
- direkt zugehörige Tests:
  - `apps/web/tests/create-place-clarification.contract.test.tsx`
  - `apps/web/tests/create-place-registry-jurisdiction.contract.test.tsx`
  - `apps/web/tests/create-street-registry-lookup.contract.test.tsx`
  - `apps/web/tests/create-place-planner-unavailable-stability.contract.test.tsx`

## Draußen bleibend

- `apps/web/src/features/create/createSurfaceConfig.ts`
- `apps/web/src/app/api/contributions/save/route.ts`
- `features/create/createContributionLedger.ts`
- `apps/web/src/features/create/branchHandoffTargets.ts`
- `apps/web/src/features/create/createContributionPackageContract.ts`
- `apps/web/src/app/api/create/intelligent-followup/route.ts`
- `apps/web/src/features/create/createPlanner.ts`
- `apps/web/src/features/create/createProductionAccess.ts`
- `apps/web/src/features/quickActions/taskFirstQuickActions.ts`
- `apps/web/src/features/surfaces/runden/manualAnlassraumSetup.ts`
- `apps/web/src/app/globals.css`
- `apps/web/.env.example`
- `apps/web/src/app/account/AccountReviewSupplementSections.tsx`
- `apps/web/src/app/api/factcheck/status/[jobId]/prepareGraphCandidateAction.ts`
- `apps/web/tests/account-organization-dashboard.page.test.tsx`

## Tests und Ergebnis

- `pnpm -C apps/web run typecheck`
  - grün
- `pnpm -C apps/web run lint`
  - grün
- Ausgeführt wurden die vorhandenen passenden Tests:
  - `tests/create-place-clarification.contract.test.tsx`
  - `tests/create-place-registry-jurisdiction.contract.test.tsx`
  - `tests/create-street-registry-lookup.contract.test.tsx`
  - `tests/create-place-planner-unavailable-stability.contract.test.tsx`
- Ergebnis:
  - `4/4` Dateien grün
  - `12/12` Tests grün

## Abweichung zu den gewünschten Testnamen

Diese im Prompt genannten Namen existieren im aktuellen Repo nicht:

- `tests/create-place-clarification-intake.contract.test.ts`
- `tests/create-place-clarification-branch-scope.contract.test.ts`
- `tests/create-place-registry-jurisdiction-stability.contract.test.ts`
- `tests/create-place-branch-copy-normalization.contract.test.ts`

Die vorhandenen Sammel-/Nachfolgetests decken dieselben Themenbereiche heute über die vier oben ausgeführten Dateien ab.

## Ist ein kleiner Commit-Scope möglich?

Noch nicht als kleiner dateisauberer Commit-Scope.

## Blockierende Hunks

- `apps/web/src/features/create/intelligentFollowup.ts`
  - Place-Resolution hängt in derselben Datei an breiter Multibranch-/Planner-/Fallback-Logik
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
  - Place-UI-Hunks sind mit größerem Multi-Branch-/Handoff-Board gemischt
- `apps/web/src/app/create/CreateClient.tsx`
  - Place-/Street-Aktionen teilen sich den Diff mit Retry-/Ledger-/anderen Create-Hunks
- `apps/web/src/features/create/intelligentFollowupContract.ts`
  - Place-/Street-Vertrag ist mit breiterem ContributionPackage-/Runtime-Vertrag vermischt

## Staging-Probe

- Keine Staging-Probe durchgeführt.
- Grund: es gibt aktuell noch keinen kleinen belastbaren Scope ohne weitere Entmischung.

## Nächster empfohlener Schritt

- `WORKTREE-UNTANGLE-CREATE-PLACE-STREET-14C2`
- Ziel:
  - Place-/Street-Hunks in `intelligentFollowup.ts`, `CreateVisualFollowup.tsx`, `CreateClient.tsx` und ggf. `intelligentFollowupContract.ts` vom restlichen Planner-/Multibranch-/Copy-Mix trennen
  - danach erst `WORKTREE-COMMIT-CREATE-PLACE-STREET-14C`
