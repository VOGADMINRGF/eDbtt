# LIVE-CAMPAIGN-QR-ENTRY-01

Datum: 2026-06-08

## Ziel

Ein erster kampagnenfähiger QR-/Link-Einstieg für eDebatte Live, der nur als Draft-Handoff arbeitet und auf dem bereits verifizierten geschlossenen Start/Create/Themen/Runden/Account-Kosmos aufsetzt.

## Route / Oberfläche

Neue Route:

- `apps/web/src/app/live/[campaignId]/page.tsx`

Client-Einstiegsfläche:

- `apps/web/src/app/live/[campaignId]/LiveCampaignEntryClient.tsx`

Verhalten:

- zeigt Kampagnentitel, kurze Erklärung und optional Kontext-/Region-/Träger-/Herkunftslabels
- klare CTA-Hierarchie:
  - `Beitrag einbringen`
  - `Frage stellen`
  - `Bestehende Themen ansehen`
- sichtbare Statussprache:
  - `Entwurf`
  - `Noch nicht veröffentlicht`
  - `Wird eingeordnet`
- hilfreicher Missing-State statt Crash bei unbekannter `campaignId`
- Campaign-QR-Landing (`apps/web/src/app/qr/[qrId]/page.tsx`) zeigt jetzt auf denselben `/live/[campaignId]`-Draft-Einstieg

## Campaign-Modell

Neue minimale Readmodel-Hilfe:

- `apps/web/src/features/campaign/liveCampaignEntry.ts`

Enthält:

- Fixture-Fallback für Demo-/Test-IDs
- Mapping vorhandener Campaign-Daten aus `features/campaign/db.ts`
- kleine öffentliche Live-Entry-Sicht mit:
  - `campaignId`
  - `title`
  - `description`
  - `contextLabel`
  - `regionLabel`
  - `organizerLabel`
  - `sourceLabel`
  - `defaultPrompt`
  - `status`
  - `statusLabel`
  - `statusNote`

Kein Bestandteil dieses Slices:

- keine neue Migration
- keine Mandanten-/Payment-/CRM-Logik
- kein neues Host-/Session-/Moderationssystem

## Draft-Handoff

Minimal erweitert:

- `apps/web/src/features/start/startDraftContext.ts`

Neue optionale Draft-Metadaten:

- `campaign.campaignId`
- `campaign.title`
- optionale Kontext-/Region-/Träger-/Herkunftslabels

Neue Origins:

- `live_campaign`
- `campaign_qr`

Handoff:

- `Beitrag einbringen` speichert einen Draft mit `targetHint=create`
- `Frage stellen` speichert einen Draft mit `targetHint=themes`
- QR-Einstiege markieren den Draft mit `origin=campaign_qr`
- bestehende Flows für `/create`, `/themen`, `/runden/new` und `/account` bleiben erhalten
- `AccountResumeWorkbenchSection.tsx` zeigt für lokale StartDrafts jetzt optional den Kampagnentitel an

## Guardrails

Sichtbar und testbar:

- keine automatische Veröffentlichung
- keine Stimme aus dem Entwurf
- kein Auto-Graph
- kein Auto-Dossier
- kein Auto-Anlassraum
- keine Quellenprüfung ohne bestehenden Gate-Pfad
- keine Wahrheits- oder Verifikationsbehauptung
- Campaign Entry ist nur Einstieg und Draft-Handoff

Zusätzlich:

- `apps/web/src/features/wrapper/mobileAppShellContract.ts` behandelt `/live/[campaignId]` als mobilen Kernpfad

## Tests

Gelaufen:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/live-campaign-entry.contract.test.tsx tests/start-draft-context.contract.test.ts tests/mobile-entry-routes.contract.test.tsx`

Ergebnis:

- `typecheck` grün
- `lint` grün
- `3/3` Testdateien grün
- `15/15` Tests grün

Bekannte Warnung:

- `mobile-entry-routes.contract.test.tsx` zeigt weiterhin die bereits bekannte React-DOM-Warnung zu `fill` und `priority`, ohne Testfehler

## Offene Nicht-Ziele

- kein Host Cockpit
- kein Report-Handoff
- keine Embeds
- keine Social-/YouTube-/Newsletter-Connectoren
- keine neuen AI-/Factcheck-/Graph-Prozesse
- keine produktive Vote-/Publish-/Graph-/Dossier-/Anlassraum-Automation

## Nächster empfohlener Task

`LIVE-TRUST-LABELS-03`

Begründung:

- der neue Campaign Entry benutzt bereits konservative Statussprache
- der nächste sinnvolle Slice ist die konsistente Propagation derselben Trust-/Source-/Review-Labels in Live-, Campaign-, Embed- und Report-nahe Flächen
