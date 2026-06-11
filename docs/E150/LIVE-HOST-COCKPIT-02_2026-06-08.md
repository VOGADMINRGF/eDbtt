# LIVE-HOST-COCKPIT-02

Datum: 2026-06-08

## Ziel

Eine schlanke Host-/Moderationssicht für Live-Kampagnen bereitstellen, die den bestehenden Campaign-, Draft- und Trust-Label-Kosmos wiederverwendet und keine neue Live-Plattform oder neue Review-/Factcheck-/Graph-Prozesse einführt.

## Route

Neue Route:

- `apps/web/src/app/live/[campaignId]/host/page.tsx`

Präsentationskomponente:

- `apps/web/src/app/live/[campaignId]/host/LiveHostCockpitClient.tsx`

Die Route bleibt im bestehenden `/live/`-Pfad und baut keine parallele Admin- oder Host-Welt auf.

## Readmodel / Helper

Neue Helper-Datei:

- `apps/web/src/features/campaign/liveHostCockpit.ts`

API:

- `readLiveHostCockpit(campaignId: string): Promise<LiveHostCockpit | null>`

Merkmale:

- nutzt `readLiveCampaignEntry()` für Kampagnenkontext
- nutzt `getLiveTrustLabels()` für konservative Status-/Trust-Labels
- arbeitet fixture-/readmodel-first, ohne Migration und ohne Schreibaktionen
- generische Kampagnen können mit leerer Signal-Liste dargestellt werden
- Demo-/Fixture-Kontexte bleiben als `Preview-Readmodel` markiert

## UI-Bereiche

Die Host-Sicht zeigt:

- Kampagnenkopf
- Moderationszusammenfassung
- Eingang / neue Beiträge
- Offene Fragen
- Prüfhinweise
- Nächste Schritte
- Guardrails

Konservative Next Actions:

- `Prüfen`
- `Bündeln`
- `Rückfrage vorbereiten`
- `Für Bericht vormerken`
- `Beobachten`

Es gibt bewusst keinen aktiven Publish-, Vote-, Graph-, Dossier- oder Anlassraum-CTA.

## Trust-Label-Integration

Wiederverwendet aus `LIVE-TRUST-LABELS-03`:

- `Entwurf`
- `Noch nicht veröffentlicht`
- `Wird eingeordnet`
- `Quellenlage offen`
- `Teilweise belegt`
- `Prüfung empfohlen`
- `Redaktionelle Prüfung ausstehend`
- `Community-Beitrag`
- `Offene Frage`
- `Quellen geprüft`

Wichtig:

- `Verifiziert` bleibt exklusiv an `sealed_verified` gebunden
- vorhandener Quellenbezug oder `factcheck_passed` wird nicht als neue Wahrheitsschicht dargestellt

## Guardrails

Sichtbar und testbar:

- keine automatische Veröffentlichung
- keine Stimme aus dem Cockpit
- kein Graph-Write
- kein Dossier-Write
- kein Anlassraum-Write
- keine Factcheck-Ausführung aus der Oberfläche
- keine Verifikation ohne `sealed_verified`
- keine neue AI-Orchestrierung
- keine automatische Report-Erstellung

## Tests

Neu/erweitert:

- `apps/web/tests/live-host-cockpit.contract.test.tsx`
- `apps/web/tests/mobile-entry-routes.contract.test.tsx`

Mitgelaufen:

- `apps/web/tests/live-trust-labels.contract.test.ts`
- `apps/web/tests/live-campaign-entry.contract.test.tsx`

Checks:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/live-host-cockpit.contract.test.tsx tests/live-trust-labels.contract.test.ts tests/live-campaign-entry.contract.test.tsx`

## Nicht-Ziele

- kein Report-Handoff
- kein Embed-/Media-Kit
- keine Social-/YouTube-/Newsletter-Connectoren
- kein neuer Factcheck-Prozess
- kein neuer Graph-Prozess
- keine neue AI-Orchestrierung
- kein Auto-Publish
- kein Vote
- kein Auto-Graph
- kein Auto-Dossier
- kein Auto-Anlassraum

## Nächster empfohlener Task

- `LIVE-REPORT-HANDOFF-04`

Begründung:

- Campaign Entry, Trust-Labels und Host-Cockpit bilden jetzt einen konsistenten review-first Live-Kern
- der nächste dokumentierte `codex_ready`-Slice ist der konservative Report-Entwurf auf denselben Campaign-/Review-/Trust-Signalen
