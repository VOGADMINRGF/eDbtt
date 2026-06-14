# WORKTREE-UNTANGLE-CREATE-PLACE-STREET-14C2

## Geprüfter Commit-Stand

- `bbead7623ef7de9df1842609d33c5abd9985b829` `docs(e150): audit create place street drift`

## Geprüfte Dateien

- `apps/web/src/features/create/placeResolution.ts`
- `apps/web/src/features/create/intelligentFollowup.ts`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/intelligentFollowupContract.ts`
- `apps/web/tests/create-place-clarification.contract.test.tsx`
- `apps/web/tests/create-place-registry-jurisdiction.contract.test.tsx`
- `apps/web/tests/create-street-registry-lookup.contract.test.tsx`
- `apps/web/tests/create-place-planner-unavailable-stability.contract.test.tsx`

## Eindeutig zum Place-/Street-Scope gehörende Hunks

### `apps/web/src/features/create/placeResolution.ts`

- vollständiger Place-/Street-Kern
- `resolvePlaceAndJurisdiction(...)`
- `lookupStreetCandidate(...)`
- Kandidaten-, Jurisdiction- und Registerhinweise
- ehrliche `not_configured`-/`region_directory`-Antworten ohne amtliche Behauptung

### `apps/web/src/features/create/intelligentFollowup.ts`

- Import und Aufruf von `resolvePlaceAndJurisdiction`
- lokale Branch-Erkennung für Place-/Street-Clarification
- `branchNeedsPlaceResolution(...)`
- `resolvePlaceResolutionSource(...)`
- `resolvePlaceResolutionCandidateLabel(...)`
- `applyPlaceResolutionBestEffort(...)`
- branch-spezifische Felder wie `placeResolutionStatus`, `placeConfirmationStatus`, `streetRegistryStatus`, `streetRegistryMatches`, `selectedStreetMatch`
- `placeResolutionDebug`

### `apps/web/src/features/create/CreateVisualFollowup.tsx`

- Place-/Street-Hilfsfunktionen:
  - `resolvePlaceCandidateLabel(...)`
  - `resolveDisplayedStreetName(...)`
  - `resolveJurisdictionHint(...)`
  - `resolveStreetRegistryMessage(...)`
- Place-Clarification-Panel mit:
  - `Ort und Straße noch klären`
  - `Straße prüfen`
  - Registry-/Jurisdiction-Hinweisen
  - privater Wohnadress-Warnung
- Branch-Status-Copy für fehlende Ortsangabe

### `apps/web/src/app/create/CreateClient.tsx`

- `lookupStreetCandidate`-Import
- Orts-/Straßen-Normalisierung
- `handleCheckBranchStreet(...)`
- `handleUpdateBranchPlace(...)`
- `handleConfirmBranchPlaceCandidate(...)`
- `handleSkipBranchPlaceClarification(...)`
- minimaler Branch-State für Place-/Street-Clarification und Registry-Ergebnis

### `apps/web/src/features/create/intelligentFollowupContract.ts`

- Place-/Street-Typen:
  - `PlaceResolution*`
  - `JurisdictionCandidate`
  - `StreetRegistry*`
- branch-spezifische Place-Felder in `TopicBranchDecision`
- `placeResolutionDebug`

## Hunks, die draußen bleiben müssen

### `apps/web/src/features/create/intelligentFollowup.ts`

- breiter Planner-/Fallback-/Branch-Aufbau
- allgemeine Claim-/Match-/Contribution-Package-Produktion
- nicht rein placebezogene Multibranch-Logik

### `apps/web/src/features/create/CreateVisualFollowup.tsx`

- Branch-Action-Auswahl
- Existing-Match-Entscheidungen
- Claim-Stance-Entscheidungen
- Handoff-Workbench
- allgemeiner Multibranch-Arbeitsraum und Completion-Modal

### `apps/web/src/app/create/CreateClient.tsx`

- allgemeiner Contribution-Package-State
- Branch-Action-, Existing-Match- und Claim-Stance-Handler
- Handoff-/Persistenzpfade
- übrige Create-/Retry-/Entry-Drift

### `apps/web/src/features/create/intelligentFollowupContract.ts`

- `BranchActionIntent`
- `ClaimCandidate`
- `ExistingMatch*`
- `ContributionPackage`
- übrige branch- und matchbezogene Runtime-Typen

## Guardrail-Bewertung

- Orts-/Straßenerkennung bleibt Vorschlag und Klärung, nicht Fakt.
- Es gibt keine Google-, Cookie- oder sonstigen externen Lookup-Versprechen.
- Jurisdiction-Hinweise bleiben als prüfpflichtige Zuordnung formuliert.
- Es wird keine automatische Behördenverifikation behauptet.
- Keine automatische Dossier-, Anlassraum-, Vote- oder Graph-Erzeugung.
- Kein produktiver Persistenzpfad ohne Draft-/Review-/User-Gate.
- Der Fallback bleibt verständlich, wenn Ort oder Straße unklar bleiben.

## Tests und Ergebnis

- `pnpm -C apps/web run typecheck`
  - grün
- `pnpm -C apps/web run lint`
  - grün
- `pnpm -C apps/web exec vitest run tests/create-place-clarification.contract.test.tsx tests/create-place-registry-jurisdiction.contract.test.tsx tests/create-street-registry-lookup.contract.test.tsx tests/create-place-planner-unavailable-stability.contract.test.tsx`
  - grün
  - `4/4` Dateien
  - `12/12` Tests

## Ist ein kleiner Commit-Scope möglich?

Noch nicht belastbar.

## Blockierende Hunks

- `apps/web/src/features/create/intelligentFollowup.ts`
  - Place-Resolution hängt am allgemeinen Branch-/Planner-Aufbau.
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
  - Place-/Street-UI hängt am Multibranch-Arbeitsraum, den Branch-Actions und der Handoff-Workbench.
- `apps/web/src/app/create/CreateClient.tsx`
  - Place-/Street-Handler hängen am gesamten Contribution-Package-State.
- `apps/web/src/features/create/intelligentFollowupContract.ts`
  - Place-/Street-Typen hängen an den übrigen Branch-/Existing-Match-/Contribution-Package-Typen.

## Exakter commitbarer Scope oder Blockade

- Sicher commitbar bleibt derzeit nur `apps/web/src/features/create/placeResolution.ts` plus die fokussierten Tests nicht, weil die produktive Nutzung in den gemischten Verbraucherdateien ohne die verbleibenden Strukturhunks unvollständig wäre.
- Der blocker ist damit nicht fachlich, sondern strukturell: Place-/Street ist aktuell technisch in den Multibranch-Arbeitsraum eingebettet.

## Staging-Probe

- Keine Staging-Probe durchgeführt.
- Grund: Noch kein kleiner, belastbarer Scope ohne Fremddrift.

## Nächster empfohlener Schritt

- `WORKTREE-UNTANGLE-CREATE-PLACE-STREET-14C3`
- Ziel:
  - den verbleibenden Place-/Street-Verbraucherpfad vom Multibranch-Unterbau weiter lösen
  - erst danach einen kleinen Commit-Task vorbereiten
