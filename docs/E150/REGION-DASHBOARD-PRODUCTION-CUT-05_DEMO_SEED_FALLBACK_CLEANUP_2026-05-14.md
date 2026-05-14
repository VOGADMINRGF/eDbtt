# REGION-DASHBOARD-PRODUCTION-CUT-05

Datum: 2026-05-14  
Branch: `refactor/create-mobile-shell-cleanup`

## Ziel

Produktnahe Behördenpfade dürfen Demo-/Seed-/Fixture-/LocalStorage-Zustände nicht mehr still als Runtime ausgeben. Der Reinickendorf-Pilot bleibt damit ehrlich:

- echte Runtime-Daten, wenn vorhanden
- Pilot-/Fixture-Daten nur explizit markiert
- kein stiller Demo-Fallback in Region-/Draft-Pfaden
- kein Seed-Fallback in Region-/Admin-/Review-/fromDraft-Kontexten
- `localStorage` bleibt nur lokaler Studio-Arbeitsstand

## Vorprüfung Push-/Branch-Stand

Vor Beginn wurde der Branch-Head geprüft und gepusht:

- `2eef101` `docs: add production readiness reality audit`
- `fe9fd72` `REGION-DASHBOARD-PRODUCTION-CUT-01` Nachhärtung
- `2ad749b` `REGION-DASHBOARD-PRODUCTION-CUT-02` Dashboard Review Surface
- `41ef5a8` `REGION-DASHBOARD-PRODUCTION-CUT-03` Signal to Draft Foundation

Bestätigt: `origin/refactor/create-mobile-shell-cleanup` stand vor CUT-05 auf `41ef5a8`.

## Inventar Demo-/Seed-/Fixture-/Local-State

### allowed_demo_only

- `apps/web/src/app/dossier/demo/*`
- `apps/web/src/app/api/demo/*`
- `features/dossier/data/demoDossier.ts`
- `features/outputEngine/demoDossier.ts`

Diese Pfade bleiben zulässig, aber nur in explizitem Demo-Kontext.

### allowed_fixture_marked

- `features/region/regionFeedSignals.ts`
- `features/region/store.ts`
- `/admin/region`
- `/api/admin/region/cockpit/[regionId]`

Pilot-/Fixture-Signale bleiben für Reinickendorf erlaubt, aber sichtbar markiert:

- `pilot fixture`
- `notRealNews=true`
- `notProductionData=true`
- `reviewRequired`

### allowed_local_draft_only

- `apps/web/src/components/outputEngine/SocialDistributionPanel.tsx`
- `apps/web/src/components/outputEngine/MasterPostActions.tsx`

`localStorage` bleibt als lokaler Arbeitsstand erlaubt, aber nicht als produktive Behördenpersistenz.

### blocked_in_region_admin

- Seed-Fallback in `apps/web/src/features/swipes/service.ts` für:
  - `fromDraft`
  - `regionId`
  - `adminContext`
  - `reviewContext`

### blocked_in_draft_flow

- `/dossier/[id]` zeigt für Draft-only-/Region-Draft-Pfade keinen stillen Demo-Ersatz mehr
- `/dossier/[id]/studio` nutzt für Region-Drafts Runtime-Daten oder einen ehrlichen Review-/Empty-State
- `/api/dossier/[id]` gibt für Draft-only-Dossiers `dossier_review_only` statt Demo-Inhalt zurück

### must_be_explicitly_marked

- Studio-Hinweise für lokale Browser-Arbeitsstände
- Region-Cockpit-Hinweise für Pilot-/Fixture-Daten
- Demo-Studio-Badges für explizite Demo-Dossiers

## Gebaute Härtungen

### 1. Gemeinsame Guardrails

Neue Utility:

- `apps/web/src/features/runtimeDataGuardrails.ts`

Sie bündelt:

- `isRegionDraftDossierId(...)`
- `isExplicitDemoDossierId(...)`
- `shouldAllowDemoDossierFallback(...)`
- `shouldAllowSwipeSeedFallback(...)`
- `buildRuntimeDataGuardrail(...)`

Damit greifen Viewer, Studio und Swipes dieselbe Trennlinie.

### 2. Dossier-Viewer ohne stillen Demo-Fallback

Geändert:

- `apps/web/src/app/api/dossier/[id]/route.ts`
- `apps/web/src/app/dossier/[id]/ui.tsx`

Verhalten:

- explizite Demo-IDs bleiben erlaubt
- Draft-only-Dossiers liefern `dossier_review_only`
- Region-Draft-/Draft-only-Pfade zeigen Review-/Empty-/Error-State
- kein generisches Demo-Dossier mehr als Ersatz in produktnahen Pfaden

### 3. Studio ohne stillen Demo-Fallback für Region-Drafts

Geändert:

- `apps/web/src/app/dossier/[id]/studio/page.tsx`

Verhalten:

- explizite Demo-IDs bleiben Demo
- Runtime-Dossiers werden aus bestehenden Dossier-Collections geladen
- fehlende produktnahe Dossiers zeigen einen ehrlichen Empty-/Review-State
- `demoDossierForOutputEngine` erscheint nicht mehr still als Ersatz für Region-Drafts

### 4. Studio-LocalStorage klar als lokal markiert

Geändert:

- `apps/web/src/components/outputEngine/SocialDistributionPanel.tsx`
- `apps/web/src/components/outputEngine/MasterPostActions.tsx`

Verhalten:

- lokale Speicherstände bleiben erlaubt
- UI nennt sie explizit browserlokal
- keine Behauptung produktiver Behördenpersistenz

### 5. Swipes Seed-Fallback nach Kontext begrenzt

Geändert:

- `apps/web/src/features/swipes/types.ts`
- `apps/web/src/features/swipes/service.ts`

Verhalten:

- öffentlicher Discovery-Fall darf Seed-Fallback behalten
- `fromDraft`, Region-, Admin- und Review-Kontexte fallen bei No-Match/Fehler auf `[]` zurück
- kein Seed-Deck als angebliche Region-/Review-Themenlage

## Warum Demo weiterhin teilweise erlaubt bleibt

CUT-05 entfernt nicht pauschal jede Demo-Struktur aus dem Repo. Er trennt:

- explizite Demo-/Preview-Pfade
- produktnahe Behörden-/Draft-Pfade

Diese Trennung ist für den Reinickendorf-Pilot ausreichend und vermeidet einen unnötig breiten Refactor außerhalb des aktiven Produktionspfads.

## Was bewusst offen bleibt

- serverseitige Studio-Persistenz für Draft-/Review-/Plan-Zustände
- vollständige Runtime-Viewer-Fassung für reine Dossier-Collections ohne `dossier_store`
- Paid Entitlement / Behördenfreischaltung (`CUT-04`)
- persistente Membership-/OrganizationClaim-Runtime (`CUT-06`)
- Public Participation Signals (`CUT-07`)

Als Folgepfad wurde aufgenommen:

- `REGION-DASHBOARD-PRODUCTION-CUT-08`
  - Output Studio Persistence für reviewpflichtige Dossier-/Behördenpfade

## Ausgeführte Tests

- `pnpm -C apps/web exec vitest run tests/swipes-feed.arrival.test.ts`
- `pnpm -C apps/web exec vitest run tests/dossier-output-studio.page.contract.test.ts`
- `pnpm -C apps/web exec vitest run tests/studio-distribution-panel.contract.test.tsx`
- `pnpm -C apps/web exec vitest run tests/dossier-route.runtime-guard.test.ts`
- `pnpm -C apps/web exec vitest run tests/runtime-data-guardrails.test.ts`
- `pnpm -C apps/web exec vitest run tests/admin-region-page.render.test.tsx`
- `pnpm -C apps/web exec vitest run tests/region-signal-drafts.contract.test.ts`

Zusätzlich folgt die Gesamtvalidierung für Typecheck, Lint und die geforderte Region-Suite im Slice-Abschluss.
