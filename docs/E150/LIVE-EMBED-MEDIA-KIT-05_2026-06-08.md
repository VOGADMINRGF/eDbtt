# LIVE-EMBED-MEDIA-KIT-05

Datum: 2026-06-11

## Ziel

Ein kleines partner-, medien- und verwaltungstaugliches Media-Kit für Live-Kampagnen bereitstellen, das den bestehenden review-first Live-Kern sichtbar bündelt, ohne neue Connectoren, Postingpfade oder Drittanbieter-Abhängigkeiten einzuführen.

## Route

Neue Route:

- `apps/web/src/app/live/[campaignId]/media-kit/page.tsx`

Präsentationskomponente:

- `apps/web/src/app/live/[campaignId]/media-kit/LiveMediaKitClient.tsx`

Optionale Minimalverlinkung:

- `apps/web/src/app/live/[campaignId]/host/LiveHostCockpitClient.tsx`
- `apps/web/src/app/live/[campaignId]/report/LiveReportHandoffClient.tsx`

## Readmodel / Helper

Neue Helper-Datei:

- `apps/web/src/features/campaign/liveMediaKit.ts`

API:

- `readLiveMediaKit(campaignId: string): Promise<LiveMediaKit | null>`

Merkmale:

- setzt auf `readLiveCampaignEntry()` auf
- nutzt `readLiveReportHandoff()` für konservative Signal-/Quellenzusammenfassung
- nutzt `getLiveTrustLabels()` für denselben ehrlichen Trust-/Review-/Source-Stand
- bündelt nur relative Vorschaupfade für Campaign Entry, QR-Ziel, Host und Report
- führt keine neue Persistenz, QR-Generierung oder Connector-Integration ein

## UI-Bereiche

Die Media-Kit-Sicht zeigt:

- Kampagnenkopf mit Status- und Trust-Labels
- Link- und QR-Bereich
- Artikel-Embed-Preview
- Newsletter-Link-Text
- Social-Karten-Text
- Print-/Poster-Hinweis
- Links zu Live Entry, Host-Cockpit und Report-Entwurf
- Guardrails

## Trust-Label-Integration

Wiederverwendet aus `LIVE-TRUST-LABELS-03`:

- `Entwurf`
- `Noch nicht veröffentlicht`
- `Wird eingeordnet`
- `Quellenlage offen`
- `Teilweise belegt`
- `Prüfung empfohlen`
- `Option`

Wichtig:

- `Verifiziert` bleibt exklusiv an `sealed_verified` gebunden
- `factcheck_passed` oder vorhandener Quellenbezug erzeugen keine neue Wahrheitsschicht
- QR-/Host-/Report-Hinweise nutzen denselben konservativen Live-Kontext statt paralleler Copy

## Guardrails

Sichtbar und testbar:

- Entwurf / Live Entry / Review-first
- keine automatische Veröffentlichung
- keine Stimme aus Drafts
- keine Drittanbieter-Tracker oder externen Embed-Skripte
- kein Newsletter-Versand, kein Posting und kein externer Connector
- kein Graph-Write
- kein Dossier
- kein Anlassraum
- keine Factcheck-Ausführung
- keine Verifikation ohne `sealed_verified`

## Tests

Neu/erweitert:

- `apps/web/tests/live-media-kit.contract.test.tsx`
- `apps/web/tests/live-host-cockpit.contract.test.tsx`
- `apps/web/tests/live-report-handoff.contract.test.tsx`
- `apps/web/tests/mobile-entry-routes.contract.test.tsx`

Mitgelaufen:

- `apps/web/tests/live-trust-labels.contract.test.ts`

Checks:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/live-media-kit.contract.test.tsx tests/live-report-handoff.contract.test.tsx tests/live-host-cockpit.contract.test.tsx tests/live-trust-labels.contract.test.ts tests/mobile-entry-routes.contract.test.tsx`

## Nicht-Ziele

- kein echter Social-/YouTube-/Newsletter-Connector
- kein automatisches Posting
- kein Tracking-/Cookie-Zwang
- kein externes Embed-Skript mit Drittanbieter-Abhängigkeit
- kein Auto-Publish
- kein Vote
- kein Auto-Graph
- kein Auto-Dossier
- kein Auto-Anlassraum
- kein neuer Factcheck-Prozess
- kein neuer AI-Orchestrator

## Nächster empfohlener Task

- `PUBLIC-LIVE-SURFACE-QA-06`

Begründung:

- Campaign Entry, Host-Cockpit, Report-Handoff, Media-Kit und QR teilen jetzt denselben review-first Live-Kern
- der nächste sinnvolle Slice ist eine fokussierte QA-/UX-Harmonisierung über diese öffentlichen Routen hinweg, ohne neue Produktlogik oder Connectoren zu starten
