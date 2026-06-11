# LIVE-REPORT-HANDOFF-04

Datum: 2026-06-08

## Ziel

Einen review-first Report-Handoff aus dem bestehenden Live Campaign Entry und Host Cockpit bereitstellen, ohne eine neue Reporting-Plattform, Auto-Publish oder produktive Schreibpfade einzuführen.

## Route

Neue Route:

- `apps/web/src/app/live/[campaignId]/report/page.tsx`

Präsentationskomponente:

- `apps/web/src/app/live/[campaignId]/report/LiveReportHandoffClient.tsx`

Optional minimal verbunden über:

- Link `Report-Entwurf ansehen` in `apps/web/src/app/live/[campaignId]/host/LiveHostCockpitClient.tsx`

## Readmodel / Helper

Neue Helper-Datei:

- `apps/web/src/features/campaign/liveReportHandoff.ts`

API:

- `readLiveReportHandoff(campaignId: string): Promise<LiveReportHandoff | null>`

Merkmale:

- setzt auf `readLiveHostCockpit()` auf
- nutzt bestehende Campaign-, Host- und Trust-Label-Readmodels
- leitet konservative Report-Sections aus vorhandenen Signalen ab
- enthält nur guarded Next Actions
- arbeitet fixture-/readmodel-first, ohne Migration und ohne Schreibaktionen

## UI-Bereiche

Die Report-Sicht zeigt:

- Kampagnenkopf
- Reportstatus
- Zusammenfassung
- Offene Fragen
- Quellenlage
- Gegenpositionen / Konfliktlinien
- Empfohlene nächste Schritte
- Guardrails

Statussprache:

- `Entwurf`
- `Review nötig`
- `Nicht veröffentlicht`

## Trust-Label-Integration

Wiederverwendet aus `LIVE-TRUST-LABELS-03`:

- `Entwurf`
- `Noch nicht veröffentlicht`
- `Wird eingeordnet`
- `Quellenlage offen`
- `Teilweise belegt`
- `Prüfung empfohlen`
- `Redaktionelle Prüfung ausstehend`
- `Quellen geprüft`
- `Offene Frage`
- `Option`

Wichtig:

- `Verifiziert` bleibt exklusiv an `sealed_verified` gebunden
- `factcheck_passed` oder vorhandener Quellenbezug erzeugen keine neue Wahrheitsschicht

## Guardrails

Sichtbar und testbar:

- Report ist nur Entwurf
- kein Publish
- kein Vote
- kein Graph-Write
- kein Dossier-Create
- kein Anlassraum-Create
- keine Factcheck-Ausführung
- keine Verifikation ohne `sealed_verified`
- recommendedNextActions bleiben `guarded: true`

## Tests

Neu/erweitert:

- `apps/web/tests/live-report-handoff.contract.test.tsx`
- `apps/web/tests/live-host-cockpit.contract.test.tsx`
- `apps/web/tests/mobile-entry-routes.contract.test.tsx`

Mitgelaufen:

- `apps/web/tests/live-trust-labels.contract.test.ts`

Checks:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/live-report-handoff.contract.test.tsx tests/live-host-cockpit.contract.test.tsx tests/live-trust-labels.contract.test.ts`

## Nicht-Ziele

- keine neue Reporting-Plattform
- kein Auto-Report-Publish
- kein Auto-Dossier
- kein Auto-Anlassraum
- kein Auto-Graph
- kein Vote
- kein neuer Factcheck-Prozess
- kein neuer AI-Orchestrator
- kein Embed-/Media-Kit
- keine Social-/YouTube-/Newsletter-Connectoren

## Nächster empfohlener Task

- `LIVE-EMBED-MEDIA-KIT-05`

Begründung:

- Campaign Entry, Trust-Labels, Host-Cockpit und Report-Handoff bilden jetzt einen konsistenten review-first Live-Kern
- der nächste kleine operative Slice kann die vorhandenen QR-/Share-/Campaign-Bausteine als konservativen Media-/Embed-Starter bündeln
