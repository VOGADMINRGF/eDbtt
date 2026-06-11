# LIVE-TRUST-LABELS-03

Datum: 2026-06-08

## Ziel

Den bestehenden Truth-/Review-/Source-Guard so auf den neuen Live-/Campaign-/QR-Einstieg anwenden, dass die Oberfläche ehrliche Statuslabels zeigt, ohne eine neue Wahrheits- oder Factcheck-Engine einzuführen.

## Helper / Komponente

Neue kleine Mapping-Schicht:

- `apps/web/src/features/campaign/liveTrustLabels.ts`

API:

- `getLiveTrustLabels(signal: LiveTrustSignal): LiveTrustLabel[]`

Die Funktion setzt auf bestehenden Begriffen aus `verificationPresentation` und `verificationContract` auf:

- `truthStatus`
- `sourceSupport`
- `verificationLabel`
- `verificationMode`
- `reviewRecommended`

Zusätzlich berücksichtigt sie nur lokale Live-Kontextsignale:

- `publicationStatus`
- `reviewStatus`
- `contributionKind`
- `origin`

## Integrierte Surfaces

Aktuell verdrahtet auf:

- `apps/web/src/app/live/[campaignId]/LiveCampaignEntryClient.tsx`

Sichtbar auf `/live/[campaignId]`:

- `Entwurf`
- `Noch nicht veröffentlicht`
- `Wird eingeordnet`
- `Quellenlage offen`
- `Prüfung empfohlen`
- `Community-Beitrag`

QR-Einstiege profitieren indirekt mit, weil `apps/web/src/app/qr/[qrId]/page.tsx` bereits in denselben `/live/[campaignId]`-Pfad führt.

## Guardrails

Erhalten und sichtbar:

- keine automatische Veröffentlichung
- keine Stimme aus dem Entwurf
- kein Auto-Graph
- kein Auto-Dossier
- kein Auto-Anlassraum
- keine neue Truth-Engine
- kein neuer Factcheck-Prozess
- keine Verifikation ohne `sealed_verified`
- keine Wahrheitsbehauptung bei offener oder nur heuristisch gestützter Quellenlage

Explizit konservativ:

- `Verifiziert` erscheint nur bei `sealed_verified`
- `Quellen geprüft` erscheint nur bei vorhandenem Quellencheck oder belastbarem Quellenstatus
- `Quellenlage offen` bleibt der Fallback für `none` und `open`
- Review-Hinweise werden als `Prüfung empfohlen` oder `Redaktionelle Prüfung ausstehend` formuliert

## Tests

Neu/erweitert:

- `apps/web/tests/live-trust-labels.contract.test.ts`
- `apps/web/tests/live-campaign-entry.contract.test.tsx`

Mitgelaufen:

- `apps/web/tests/truth-guard-surface-propagation.contract.test.tsx`

Checks:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/live-trust-labels.contract.test.ts tests/live-campaign-entry.contract.test.tsx tests/truth-guard-surface-propagation.contract.test.tsx`

## Bewusst nicht gebaut

- kein Host Cockpit
- kein Report-Handoff
- kein Embed-/Media-Kit
- kein Auto-Publish
- kein Vote
- kein Auto-Graph
- kein Auto-Dossier
- kein Auto-Anlassraum
- keine neue persistente Verifikationsmetadaten-Schicht im StartDraftContext

## Nächster empfohlener Task

- `LIVE-HOST-COCKPIT-02`

Begründung:

- `LIVE-CAMPAIGN-QR-ENTRY-01` und `LIVE-TRUST-LABELS-03` bilden jetzt einen konservativen öffentlichen Einstieg
- der nächste sinnvolle `codex_ready`-Slice ist die Host-/Moderatorensicht auf bestehende Review-/Factcheck-/Graph-Statussignale
