# WORKTREE-UNTANGLE-CREATE-PLACE-STREET-14C3

## Geprüfter Commit-Stand

- `08f469d1b8011f7838889de65270325c4583442a` `docs(e150): document place street untangle constraints`

## Geprüfte Dateien

- `apps/web/src/features/create/placeResolution.ts`
- `apps/web/src/features/create/intelligentFollowup.ts`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/intelligentFollowupContract.ts`
- `apps/web/tests/create-multibranch-actions.contract.test.tsx`
- `apps/web/tests/create-place-clarification.contract.test.tsx`
- `apps/web/tests/create-place-registry-jurisdiction.contract.test.tsx`
- `apps/web/tests/create-street-registry-lookup.contract.test.tsx`
- `apps/web/tests/create-place-planner-unavailable-stability.contract.test.tsx`

## Blocker-Analyse Place/Street ↔ Multibranch

### A) Unabhängig fachlich klare Place-/Street-Hunks

- `apps/web/src/features/create/placeResolution.ts`
  - `resolvePlaceAndJurisdiction(...)`
  - `lookupStreetCandidate(...)`
  - Street-/Place-Kandidaten
  - Jurisdiction-Hinweise
  - ehrliche `not_configured`-/`region_directory`-Antworten

### B) Place-/Street-Hunks mit technischer Multibranch-Abhängigkeit

#### `apps/web/src/features/create/intelligentFollowupContract.ts`

- Die Place-/Street-Typen sind fachlich klar:
  - `PlaceResolution*`
  - `StreetRegistry*`
  - `JurisdictionCandidate`
- Sie hängen aber direkt in `TopicBranchDecision`, das zugleich Folgendes mitträgt:
  - `ClaimCandidate`
  - `selectedAction`
  - `ExistingMatch[]`
  - branchweiter `status`
- `ContributionPackage` baut vollständig auf diesen Branch-Typen auf.

#### `apps/web/src/features/create/intelligentFollowup.ts`

- Die Place-/Street-Resolution läuft nicht isoliert, sondern gegen `ContributionPackage["branches"]`.
- `branchNeedsPlaceResolution(...)`, `resolveBranchPlaceBestEffort(...)` und `applyPlaceResolutionBestEffort(...)` mutieren vollständige Branch-Objekte.
- Der Producer baut zuerst das gesamte Multibranch-Package und hängt danach Place-Resolution daran an.
- Ein separater Place-/Street-Commit müsste daher entweder:
  - `ContributionPackage`/`TopicBranchDecision` mitnehmen oder
  - den Producer strukturell umbauen.

#### `apps/web/src/features/create/CreateVisualFollowup.tsx`

- Das Place-/Street-Panel lebt innerhalb von `MultiBranchActionBoard`.
- Dasselbe Board trägt zugleich:
  - Branch-Actions
  - Claim-Stance-Entscheidungen
  - Existing-Match-Entscheidungen
  - Completion-Modal
  - Handoff-Workbench
- Ein isolierter Place-/Street-UI-Commit würde hier ohne weitere Extraktion zwangsläufig größere Multibranch-UI-Hunks mitziehen.

#### `apps/web/src/app/create/CreateClient.tsx`

- Die Place-/Street-Handler sind rein lokal sinnvoll:
  - `handleCheckBranchStreet(...)`
  - `handleUpdateBranchPlace(...)`
  - `handleConfirmBranchPlaceCandidate(...)`
  - `handleSkipBranchPlaceClarification(...)`
- Sie schreiben aber direkt in den gesamten `contributionPackage`-State.
- Derselbe State wird im selben Diff auch für:
  - Branch-Actions
  - Existing-Match-Entscheidungen
  - Claim-Stance-Entscheidungen
  - Persistenz nach `/api/create/save`
  - LocalStorage-Snapshots
  verwendet.

### C) Minimaler Multibranch-Foundation-Scope

Ein minimaler technischer Foundation-Scope ist plausibel und vermutlich nötig, bevor Place-/Street klein commitbar wird.

Er würde voraussichtlich enthalten:

- branchbezogene Contract-Typen, die nicht nur Place, sondern den gemeinsamen Branch-Unterbau bilden:
  - `TopicBranchDecision`
  - `ContributionPackage`
  - minimale branchbezogene Status-/Decision-Typen
- rein technische Hilfen für die Multibranch-Arbeitsfläche:
  - z. B. `resolveStableActiveBranchId(...)`
  - ggf. weitere kleine branchbezogene UI-/State-Helfer
- falls extrahierbar: eine kleinere Abspaltung des Place-/Street-Panels aus `MultiBranchActionBoard`

Nicht Teil dieses minimalen Foundation-Scope sollten sein:

- Handoff-Workbench
- vollständige Branch-Action-UX
- Existing-Match-Entscheidungs-UI
- Claim-Stance-Entscheidungs-UI
- Persistenzpfade nach `/api/create/save`
- Planner-Core

### D) Stop-Entscheidung

Kein kleiner sauberer Place-/Street-Source-Scope ist derzeit belastbar möglich.

Begründung:

- Die fachlich isolierbare Logik (`placeResolution.ts`) reicht allein nicht aus.
- Die produktive Nutzung hängt aktuell an gemeinsamen Multibranch-Contracts, Branch-State und Multibranch-UI.
- Eine weitere erzwungene Entmischung innerhalb von 14C3 würde voraussichtlich genau den breiten Multibranch-Scope unkontrolliert mitziehen, der hier gerade vermieden werden soll.

## Ist ein kleiner Source-Scope möglich?

Nein, nicht ohne vorgelagerten kleinen Multibranch-Foundation-Slice.

## Exakter commitbarer Scope

Aktuell keiner für Place-/Street allein.

## Guardrails

- keine automatische Orts-/Zuständigkeitsbehauptung ohne Kennzeichnung
- keine Google-/Cookie-/externen Lookup-Versprechen
- keine automatische Behördenverifikation
- Place-/Street-Erkennung bleibt Vorschlag und Klärung
- keine automatische Dossier-/Anlassraum-Erstellung
- keine produktive Persistenz ohne Draft-/Review-/User-Gate
- keine erzwungene Entmischung, die breiten Multibranch- oder Planner-Core-Drift still mitzieht

## Tests und Ergebnis

- `pnpm -C apps/web run typecheck`
  - grün
- `pnpm -C apps/web run lint`
  - grün
- `pnpm -C apps/web exec vitest run tests/create-place-clarification.contract.test.tsx tests/create-place-registry-jurisdiction.contract.test.tsx tests/create-street-registry-lookup.contract.test.tsx tests/create-place-planner-unavailable-stability.contract.test.tsx tests/create-multibranch-actions.contract.test.tsx`
  - grün
  - `5/5` Dateien
  - `25/25` Tests

## Staging-Probe

- Nicht durchgeführt.
- Grund: Kein kleiner sauberer Source-Scope ohne vorgelagerten Foundation-Slice.

## Nächster empfohlener Task

- `WORKTREE-ISOLATE-CREATE-MULTIBRANCH-FOUNDATION-14D`

Begründung:

- Der aktuelle Blocker ist strukturell, nicht fachlich.
- Ein weiterer Place-/Street-Slice ohne Foundation würde denselben Blocker nur erneut dokumentieren.
- Ein allgemeiner `RESTDRIFT-PR-READINESS-AUDIT-15` ist erst sinnvoll, wenn entschieden ist, ob der verbleibende Create-Kern noch weiter operativ isoliert oder die Phase bewusst beendet wird.
