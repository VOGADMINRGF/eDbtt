# RESTDRIFT-PR-READINESS-AUDIT-15

## Geprüfter Commit-Stand

- `f4a6c763c3937528716d814ed508a314c56ded10` `docs(e150): stop place street isolation after foundation`

## Dirty-Dateien nach Kategorien

### A) Sicher revert/parkbar

- `apps/web/src/app/account/AccountReviewSupplementSections.tsx`
  - untracked Scratch außerhalb des committed Review-/Account-Scope
- `apps/web/src/app/api/factcheck/status/[jobId]/prepareGraphCandidateAction.ts`
  - untracked Scratch außerhalb des committed Graph-/Factcheck-Scope
- `docs/E150/WORKTREE-ISOLATE-CREATE-MULTIBRANCH-FOUNDATION-14D_2026-06-09.md`
  - durch 14D2 überholte, nie committe Evidence zum abgebrochenen ersten Foundation-Versuch
- `apps/web/tests/account-organization-dashboard.page.test.tsx`
  - isolierte Testdrift ohne aktiven committed Folgeslice; für den aktuellen PR nicht nötig

### B) Echter späterer eigener Task / Follow-up

- Place-/Street-Block
  - `apps/web/src/features/create/placeResolution.ts`
  - `apps/web/src/features/create/intelligentFollowupContract.ts`
  - `apps/web/src/features/create/intelligentFollowup.ts`
  - `apps/web/src/features/create/CreateVisualFollowup.tsx`
  - `apps/web/src/app/create/CreateClient.tsx`
  - `apps/web/tests/create-place-clarification.contract.test.tsx`
  - `apps/web/tests/create-place-registry-jurisdiction.contract.test.tsx`
  - `apps/web/tests/create-street-registry-lookup.contract.test.tsx`
  - `apps/web/tests/create-place-planner-unavailable-stability.contract.test.tsx`
- Planner-Core-/Producer-Block
  - `apps/web/src/app/api/create/intelligent-followup/route.ts`
  - `apps/web/src/features/create/createPlanner.ts`
  - `apps/web/src/features/create/intelligentFollowup.ts`
  - `apps/web/tests/create-planner-routing.contract.test.ts`
  - `apps/web/tests/create-planner-openai-happy-path.contract.test.ts`
  - `apps/web/tests/create-planner-timeout.contract.test.ts`
  - `apps/web/tests/create-planner-complex-civic-input.contract.test.ts`
- CreateClient-/UI-/Followup-Mix
  - `apps/web/src/app/create/CreateClient.tsx`
  - `apps/web/src/features/create/CreateVisualFollowup.tsx`
  - `apps/web/src/features/create/createSurfaceConfig.ts`
  - `apps/web/tests/create-mode-selector.contract.test.ts`
- QuickActions-/Runden-Helfer
  - `apps/web/src/features/quickActions/taskFirstQuickActions.ts`
  - `apps/web/src/features/surfaces/runden/manualAnlassraumSetup.ts`
- Globals-/Style-Rest
  - `apps/web/src/app/globals.css`
- Env-/Access-Rest
  - `apps/web/.env.example`
  - `apps/web/src/features/create/createProductionAccess.ts`

### C) Potenziell vor PR noch nötig

- Kein weiterer fachlicher Mikro-Slice.
- Vor PR nötig ist nur ein Cleanup-/Parking-Schritt, damit der Branch ohne uncommitted Restdrift vorliegt.

### D) Kritische Blocker

- Keine harten Build-/Lint-/Contract-Blocker im geprüften committed Themenstand gefunden.
- Der eigentliche PR-Blocker ist Branch-Hygiene:
  - breiter uncommitted Restdrift
  - dadurch kein sauberer PR-/Review-Stand auf Arbeitskopieebene

## PR-Readiness-Bewertung

### 1. Was ist bereits committed und PR-/mergefähig?

- Live/Public-Surfaces
- Voxy/Public Style
- kleine `globals.css`-Voxy-Hunks
- Evidence Backfill
- Factcheck/Account/Review
- Create Planner Fallback 14A
- Create Ledger/Handoff 14B2
- I18N/Bilingualität als offener Produktblock
- Multibranch Foundation 14D2
- Place/Street Stop-Entscheidung 14E

### 2. Ist der committed Stand prinzipiell PR-fähig?

Ja, prinzipiell.

Der bereits committed Stand ergibt inhaltlich einen sinnvollen PR-Strang:

- Public-/Live-/Voxy-/Style-Slices sind sauber committed.
- Review-/Factcheck-/Account-Änderungen sind committed.
- Die kleinen Create-Slices `14A`, `14B2` und `14D2` sind committed.
- Place/Street wurde explizit nicht halb committed, sondern sauber gestoppt und dokumentiert.
- I18N wurde nur als offener Produktblock registriert.

### 3. Ist der aktuelle Branch schon PR-ready?

Noch nicht vollständig.

Nicht wegen eines fachlichen Fehlers im committed Stand, sondern weil der Branch noch breite uncommitted Restdrift trägt. Vor PR ist deshalb ein Cleanup-/Parking-Schritt nötig.

### 4. Würde ein PR auf Basis der committed Slices Sinn ergeben?

Ja.

Der committed Stand bildet einen plausiblen Verlauf:

- user-facing Live-/Public-Polish
- Voxy-/Style-Bereinigung
- Review-/Factcheck-/Account-Hardening
- kleinere Create-Hardening-Slices
- dokumentierte Stop-Entscheidungen statt unsauberer Misch-Commits

## Guardrail-Bewertung

Nach dem geprüften Stand keine Verletzung erkennbar:

- kein Auto-Publish: bestätigt
- kein Auto-Dossier: bestätigt
- kein Auto-Anlassraum: bestätigt
- kein Auto-Vote: bestätigt
- kein Auto-Graph: bestätigt
- kein stiller DeepSearch-/Kostenpfad: bestätigt
- Factcheck bleibt gate-/review-first: bestätigt
- Graph bleibt review-first: bestätigt
- Place/Street bleibt offen und wird nicht als Fakt behauptet: bestätigt
- Bilingualität ist nur registriert, nicht halb implementiert: bestätigt

## Testergebnis

- `pnpm -C apps/web run typecheck`
  - grün
- `pnpm -C apps/web run lint`
  - grün
- `pnpm -C apps/web exec vitest run tests/create-planner-routing.contract.test.ts tests/create-planner-no-domain-heuristic-expansion.contract.test.ts tests/create-chat-first-mobile-dialog-experience.contract.test.tsx tests/create-curated-dialog-workspace.contract.test.tsx tests/create-entry-hierarchy.contract.test.tsx tests/create-degraded-followup-actions.contract.test.tsx tests/create-branch-handoff-workbench.contract.test.tsx tests/create-existing-match-counting.contract.test.tsx tests/create-qr-swipes-drafts.contract.test.tsx tests/create-multibranch-actions.contract.test.tsx tests/admin-review.page.test.tsx tests/account-factcheck-jobs.contract.test.tsx tests/live-campaign-entry.contract.test.tsx tests/live-media-kit.contract.test.tsx tests/voxy-guide.render.test.tsx`
  - grün
  - `15/15` Dateien
  - `52/52` Tests

## Was gehört in den aktuellen PR?

- ausschließlich die bereits committed Slices
- keine der aktuell dirty/untracked Dateien

## Was bleibt als Follow-up offen?

- `CREATE-PLACE-STREET-FOLLOWUP`
- `CREATE-PLANNER-CORE-FOLLOWUP`
- `CREATE-CLIENT-CLEANUP`
- `GLOBALS-CSS-REST-CLEANUP`
- `I18N-BILINGUAL-PRODUCT-SHELL-01`

## Was sollte revert/parked werden?

Sicher park-/revertbar:

- `apps/web/src/app/account/AccountReviewSupplementSections.tsx`
- `apps/web/src/app/api/factcheck/status/[jobId]/prepareGraphCandidateAction.ts`
- `docs/E150/WORKTREE-ISOLATE-CREATE-MULTIBRANCH-FOUNDATION-14D_2026-06-09.md`
- voraussichtlich auch `apps/web/tests/account-organization-dashboard.page.test.tsx`, sofern kein eigener Account-Folgeblock geplant ist

Für spätere Aufgaben parken statt still committen:

- Place-/Street-Dateien
- Planner-Core-/Producer-Dateien
- CreateClient-/VisualFollowup-/SurfaceConfig-Reste
- QuickActions-/Runden-Helfer
- `globals.css`-Rest
- `.env.example` und `createProductionAccess.ts`

## Finale Empfehlung

### Ergebnis

- **B) Noch ein Cleanup-Slice nötig**

### Begründung

- Der committed Stand ist fachlich und testseitig tragfähig.
- Der Branch ist aber wegen breiter uncommitted Restdrift noch nicht sauber PR-ready.
- Vor PR sollte ein Cleanup-/Parking-Schritt den Worktree auf den committed Stand zurückführen oder die offenen Reste bewusst separat parken.

### Kurzfazit

- committed Stand: PR-fähig
- aktueller Worktree: nicht sauber PR-ready
- nächster sinnvoller Schritt: Cleanup/Parking des Restdrifts, nicht weiterer Source-Rettungsversuch
