# PR-CREATE-STARTS-CHAT-AFTER-INPUT-01

Stand: 2026-05-09

## Scope

Issue #114 verschlankt den `/create`-Startzustand und macht den ersten Submit unmittelbar als Chat-Fortsetzung sichtbar.

## Umsetzung

- `apps/web/src/features/create/SharedCreateComposer.tsx`
  - Dominante Start-Accordions fuer Arbeitsweg, Kontext und Hilfebereich entfernt.
  - Moduswahl als ruhige Chip-Leiste direkt am Composer verdichtet.
  - Kontext- und Hilfelinks als kleine sekundäre Aktionen unter dem Composer gefuehrt.
- `apps/web/src/app/create/CreateClient.tsx`
  - Sofortige Chat-Eröffnung nach Submit ergaenzt (`create-start-chat-preview`).
  - Der Ladezustand erscheint als `eDebatte`-Antwort statt als separates Status-Panel.
  - Link-only-Starts behalten dieselbe Chat-Spine und zeigen zuerst `Du`, dann die Rueckfrage von `eDebatte`.
- `apps/web/src/features/create/CreateLinkIntakeClarification.tsx`
  - Quellen-/Link-Klaerung in eine echte `eDebatte`-Bubble ueberfuehrt.

## Ergebnis

- `/create` startet ruhiger und composer-first.
- Nach Absenden beginnt der sichtbare Verlauf direkt unter dem Eingabefeld.
- Vorab-Konfiguration bleibt verfuegbar, ist aber klar sekundär.
- Bestehende Save-/Factcheck-/Guardrail-Pfade bleiben unveraendert.

## Validierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web exec vitest run tests/create-curated-dialog-workspace.contract.test.tsx tests/analyze-workbench-hidden-until-start.test.ts tests/create-chat-first-mobile-dialog-experience.contract.test.tsx tests/create-entry-hierarchy.contract.test.tsx`
