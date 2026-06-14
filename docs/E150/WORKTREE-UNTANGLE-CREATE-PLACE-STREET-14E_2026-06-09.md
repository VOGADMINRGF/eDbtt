# WORKTREE-UNTANGLE-CREATE-PLACE-STREET-14E

## Geprüfter Commit-Stand

- `8f4770bfc5e308084988c3569fda570ea9dc9b67` `fix(create): isolate multibranch foundation helpers`

## Warum Place/Street nach 14D2 erneut versucht wurde

- Der minimale Multibranch-Foundation-Kern ist jetzt separat committed.
- Dadurch sind die reinen Branch-Basistypen und Selection-Helfer nicht mehr selbst Teil des Place-/Street-Problems.
- Ziel von 14E war deshalb ein erneuter Versuch, den verbleibenden Place-/Street-Pfad als kleinen Source-Slice abzuspalten.

## Geprüfte Dateien und Hunks

- `apps/web/src/features/create/placeResolution.ts`
- `apps/web/src/features/create/intelligentFollowupContract.ts`
  - nur Place-/Street-Typen und angrenzende Branch-Erweiterungen bewertet
- `apps/web/src/features/create/intelligentFollowup.ts`
  - nur Local-Place-Branch-Seeding, Place-Clarification und Place-Resolution-Pfad bewertet
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
  - nur Place-/Street-Hinweise, `PlaceClarificationPanel` und Registry-/Jurisdiction-Copy bewertet
- `apps/web/src/app/create/CreateClient.tsx`
  - nur die Place-/Street-Handler für Eingabe, Registry-Check, Candidate-Übernahme und Skip bewertet
- Tests:
  - `apps/web/tests/create-place-clarification.contract.test.tsx`
  - `apps/web/tests/create-place-registry-jurisdiction.contract.test.tsx`
  - `apps/web/tests/create-street-registry-lookup.contract.test.tsx`
  - `apps/web/tests/create-place-planner-unavailable-stability.contract.test.tsx`
  - `apps/web/tests/create-multibranch-actions.contract.test.tsx`

## Was jetzt fachlich zum Place-/Street-Scope gehört

- `placeResolution.ts` als isolierter Resolver für:
  - Street-Like-Erkennung
  - Kandidatenbildung
  - vorsichtige Jurisdiction-Hinweise
  - Registry-/Directory-Status ohne amtliche Behauptung
- Place-/Street-Typen in `intelligentFollowupContract.ts`
- Local-Place-Branch-Seeding und Best-Effort-Resolution in `intelligentFollowup.ts`
- ehrliche Place-/Street-UI-Hinweise in `CreateVisualFollowup.tsx`
- die vier Place-/Street-Tests

## Was draußen bleibt

- `apps/web/src/features/create/createMultibranchFoundation.ts`
- `apps/web/tests/create-multibranch-actions.contract.test.tsx`
  - nur als Regressionswächter mitgeprüft, nicht als neuer Scope
- Planner-Core in `createPlanner.ts`
- Ledger-/Handoff-Dateien
- `CreateClient.tsx` als ganze Datei
- `MultiBranchActionBoard`-Produktlogik
- Existing-Match-/Claim-Stance-UI
- Handoff-Workbench
- `createSurfaceConfig.ts`
- `apps/web/src/app/globals.css`
- `apps/web/.env.example`
- QuickActions, `manualAnlassraumSetup.ts`, Account-/Factcheck-Scratch-Dateien

## Guardrail-Bewertung

Die Guardrails bleiben im aktuellen Stand fachlich eingehalten:

- keine automatische Orts-/Zuständigkeitsbehauptung ohne Kennzeichnung
- keine automatische Behördenverifikation
- kein Google-/Cookie-/externes Lookup-Versprechen
- Place-/Street-Erkennung bleibt Vorschlag oder Clarification
- keine automatische Dossier-/Anlassraum-Erstellung
- keine produktive Persistenz ohne Draft-/Review-/User-Gate
- keine stillen KI-/DeepSearch-/Kostenpfade

## Tests und Ergebnis

- `pnpm -C apps/web run typecheck`
  - grün
- `pnpm -C apps/web run lint`
  - grün
- `pnpm -C apps/web exec vitest run tests/create-place-clarification.contract.test.tsx tests/create-place-registry-jurisdiction.contract.test.tsx tests/create-street-registry-lookup.contract.test.tsx tests/create-place-planner-unavailable-stability.contract.test.tsx tests/create-multibranch-actions.contract.test.tsx`
  - grün
  - `5/5` Dateien
  - `17/17` Tests

## Ist ein kleiner Commit-Scope möglich?

Nein, nicht belastbar.

## Warum kein commitbarer Scope entsteht

### `placeResolution.ts`

- Fachlich sauber und isoliert.
- Allein nicht ausreichend für den Produktpfad.

### `intelligentFollowupContract.ts`

- Place-/Street-Typen sind noch mit breiteren Branch-/Contribution-Package-/Existing-Match- und Debug-/Meta-Erweiterungen vermischt.
- Ein hunkgenauer Commit würde hier weiterhin Nicht-Place-/Street-Strukturen mitziehen.

### `intelligentFollowup.ts`

- Local-Place-Branch-Seeding und Place-Resolution hängen direkt an:
  - allgemeinem Branch-Aufbau
  - `ContributionPackage`
  - Planner-/Fallback-Pfaden
  - allgemeiner Followup-Erzeugung
- Kein kleiner, klarer Dateiscope ohne Producer-/Planner-Mix.

### `CreateVisualFollowup.tsx`

- Die Place-/Street-UI lebt im breiten `MultiBranchActionBoard`.
- Damit hängen die relevanten Hunks weiter an:
  - Branch-Actions
  - Existing-Match-/Claim-Stance-UI
  - Handoff-Workbench
  - breiter Multibranch-Produkt-UX

### `CreateClient.tsx`

- Die Place-/Street-Handler sind fachlich klar, aber technisch an den gesamten Contribution-Package-State gekoppelt.
- Ein kleiner, isolierter Client-Hunk ohne Restdrift ist hier nicht belastbar genug.

## Exakter commitbarer Scope oder Stop-Entscheidung

- Stop-Entscheidung.
- Kein kleiner Place-/Street-Source-Commit ohne erneute künstliche Misch- oder Hunk-Komplexität.
- Keine Staging-Probe durchgeführt.

## Nächster empfohlener Task

- `RESTDRIFT-PR-READINESS-AUDIT-15`

Begründung:

- Der Place-/Street-Pfad ist fachlich ausreichend klar und testseitig stabil.
- Das verbleibende Problem ist nicht mehr primär fachlich, sondern Worktree-/PR-Struktur.
- Vor weiteren kleinen Create-Slices ist eine neue PR-Readiness-/Restdrift-Entscheidung belastbarer als ein erzwungenes `14E2`.
