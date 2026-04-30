# PR-AI-CREATE-01G/H - Shared Composer + Mode Follow-up Hardening (2026-04-30)

## Kontext

Normalisierung und Umsetzung nach GitHub Issue #73:

- `PR-AI-CREATE-01G`
- `PR-AI-CREATE-01H`

Ziel:

- ein kanonisches Eingabesystem ueber `/`, `/create`, `/demo/create`
- klar differenzierte Folgepfade fuer `Beitragen`, `Pruefen`, `Entwerfen`

## Umsetzung

### 1) Shared Composer auf Startoberflaeche (`/` und `/start`)

Dateien:

- `apps/web/src/app/start/LandingStart.tsx`
- `apps/web/src/app/start/page.tsx`

Änderung:

- Die Startoberflaeche rendert jetzt `SharedCreateComposer` als primaeres Eingabesystem.
- Moduswechsel `Beitragen` / `Pruefen` / `Entwerfen` ist identisch zu `/create` und `/demo/create`.
- Attachment-/Voice-Actions sind dadurch komponentenseitig paritaetisch.
- CTA fuehrt mode-konsistent nach `/create` mit `entryIntent`/`entryMode` und `prefill`.

Guardrail:

- keine neue Parallel-Composer-Implementierung
- kein Legacy-Doppel-Einstieg fuer das zentrale Input-System

### 2) Modusspezifische Folgeflaechen als expliziter Contract

Datei:

- `apps/web/src/app/create/CreateClient.tsx`

Änderung:

- `resolveFollowupSurfaceOnStart(...)` ist als expliziter (und testbarer) Export verankert:
  - `analyze` (`Beitragen`) -> `lightweight`
  - `media` (`Pruefen`) -> `analysis`
  - `guided` (`Entwerfen`) -> `none` (bis Guided-Bridge)

Wirkung:

- `Beitragen` kippt nicht in den schweren Analyze-Workbench als generischen Default.
- `Pruefen` bleibt der klar gerahmte Analysepfad.
- `Entwerfen` bleibt Guided-/Bridge-first.

## Tests

Neu:

- `apps/web/tests/start-shared-create-composer.contract.test.tsx`

Aktualisiert:

- `apps/web/tests/analyze-workbench-hidden-until-start.test.ts`

Bestehende relevante Contracts, die weiterhin passen:

- `apps/web/tests/create-mode.page.test.ts`
- `apps/web/tests/demo-create.page.contract.test.ts`
- `apps/web/tests/create-entry-hierarchy.contract.test.tsx`

## E150-/Produktleitplanken

- keine Auto-Aktivierung schwerer Folgeflaechen durch LocalStorage-Restore
- keine neue oeffentliche Parallel-Surface
- keine Routing-/Finalize-Regressionsaenderung
- kein Auto-Publish/kein Tracking-bezogener Seiteneffekt in diesem Slice

