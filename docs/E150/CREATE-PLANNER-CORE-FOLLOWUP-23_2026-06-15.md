# CREATE-PLANNER-CORE-FOLLOWUP-23

## Problem
Nach der Erkennung von 3-5 Themen endete der Create Planner in einem generischen Next-Step-Panel. Es fehlten sichtbare und ausführbare Mehrthemen-CTAs für All-Topics-Vertiefung, per-Thema-Vertiefung sowie review-first Handoffs in Dossier, Anlassraum, Factcheck/Quellenprüfung, QR-/Live-Kontext und Account-Fortsetzung.

## Zielbild
- Nach bestätigter Mehrthemen-Erkennung erscheint ein eigener Mehrthemen-Aktionsbereich.
- Nutzer können alle erkannten Themen gemeinsam weiterführen oder einzelne Themen gezielt vertiefen.
- Dossier, Anlassraum, Factcheck/Quellenprüfung und QR-/Live-Kontext bleiben vorbereitende, user-led Handoffs.
- `Später im Account weiterarbeiten` legt einen lokalen Resume-Draft an und führt direkt in den Account-Arbeitsstand.

## Geänderte Dateien
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/tests/create-chat-first-mobile-dialog-experience.contract.test.tsx`
- `apps/web/tests/create-curated-dialog-workspace.contract.test.tsx`
- `apps/web/tests/live-click-hardening.contract.test.ts`
- `docs/E150/OpenTasks.md`

## Neue / angepasste Contracts
- `CreateVisualFollowup` rendert im bestätigten Mehrthemen-Fall einen `data-create-multitheme-actions`-Block mit:
  - `Alle Themen vertiefen`
  - pro erkanntem Thema `… vertiefen`
  - `Dossier vorbereiten`
  - `Anlassraum vorbereiten`
  - `QR-/Live-Kontext vorbereiten`
  - `Factcheck / Quellenprüfung vorbereiten`
  - `Später im Account weiterarbeiten`
- `CreateClient` speichert dafür lokale Resume-Drafts über `StartDraftContext`, damit All-Topics- und per-Topic-Vertiefung nicht im UI hängen bleiben.
- Der Factcheck-CTA nutzt jetzt direkt den vorhandenen review-first Handoff nach `/factcheck`; Recherche oder Deep Search starten weiterhin nicht automatisch.

## Guardrails
- Kein Auto-Publish
- Kein Auto-Dossier
- Kein Auto-Anlassraum
- Kein Auto-Graph
- Keine automatische externe Recherche
- Keine automatische Faktenbehauptung
- `heuristic_fallback` bleibt gültig
- Retry bleibt explizit und user-led

## Testergebnisse
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-planner-routing.contract.test.ts tests/create-planner-no-domain-heuristic-expansion.contract.test.ts tests/create-degraded-followup-actions.contract.test.tsx tests/create-branch-handoff-workbench.contract.test.tsx tests/create-multibranch-actions.contract.test.tsx tests/create-existing-match-counting.contract.test.tsx tests/create-qr-swipes-drafts.contract.test.tsx tests/create-curated-dialog-workspace.contract.test.tsx tests/create-chat-first-mobile-dialog-experience.contract.test.tsx tests/create-entry-hierarchy.contract.test.tsx`
- `pnpm -C apps/web run build`

## Bewusst nicht erledigt
- Place/Street
- I18N
- Self-Service
- externe Quellenadapter
- Material Extraction Runtime
