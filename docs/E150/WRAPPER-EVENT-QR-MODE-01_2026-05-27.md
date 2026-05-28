# WRAPPER-EVENT-QR-MODE-01

Stand: 2026-05-28
Status: done

## Ziel

`/stream` und der öffentliche Anlassraum-/Dossier-Anschluss sollen als QR-first Eventmodus für Bürgerbeteiligung nutzbar sein, ohne Videoplattform- oder Live-Chat-Claim, ohne neues Backend und ohne zweite Eventwelt.

## Scope

- `apps/web/src/app/stream/[slug]/page.tsx`
- `apps/web/src/app/stream/StreamPublicInputPanel.tsx`
- `features/stream/publicRuntime.ts`
- bestehende Routen `/stream`, `/runden`, `/anlassraum`, `/dossier`, `/swipes`

## Umsetzung

- Die bestehende öffentliche Stream-Detailseite wurde als QR-first Eventmodus geschärft:
  - klarer Mobile-/QR-Einstiegsblock
  - Schnellpfade für `Frage stellen`, `Quelle/Hinweis geben` und `Option vorschlagen`
  - direkter Dossier-Link
  - expliziter Link für `Ergebnis später sehen`
- Die Eingabefläche bleibt dieselbe bestehende Stream-Route und übernimmt den gewünschten Beitragsmodus über Query-Parameter statt über neue Routen oder APIs.
- Link- und QR-Sprache wurde auf denselben mobilen Beteiligungspfad geschärft:
  - kein Live-Chat
  - keine automatische Veröffentlichung
  - kein ungeprüfter Ergebnis- oder Wahrheitsclaim
- Nachbereitung bleibt sichtbar an bestehende Folgeflächen gebunden:
  - Dossier-Update-Hinweise
  - Anlassraum als öffentliche Folgefläche
  - Social Queue höchstens als reviewpflichtiger Entwurfspfad

## Moderationsmodus

- alle Event-Eingaben bleiben reviewpflichtig
- `option` bleibt bewusst intern review-only statt sofort öffentlich sichtbar
- keine automatische Veröffentlichung
- keine automatische Dossier- oder Anlassraum-Fortschreibung
- keine unmoderierte Live-Chat-Fläche

## Guardrails

- kein Streaming-Encoding
- kein WebRTC
- kein neuer Backend-Scope
- keine neue Event- oder Moderationswelt
- QR/Share nur als Zugang auf bestehende Public-Routen

## Tests

- `tests/event-qr-entry.contract.test.tsx`
- `tests/event-input-review-first.contract.test.ts`
- `tests/event-dossier-recap.contract.test.ts`
- `tests/event-no-live-chat-autopublish.contract.test.ts`

## Ergebnis

Streams und Events sind jetzt klar als QR-first Beteiligungsmodus lesbar: Bürger gelangen per Link oder QR in denselben mobilen Eventpfad, reichen Fragen, Quellen oder Optionen reviewpflichtig ein und finden spätere Ergebnisse über Anlassraum und Dossier wieder. Es entsteht keine neue Produktparallelwelt und kein Live-Chat- oder Auto-Publish-Versprechen.
