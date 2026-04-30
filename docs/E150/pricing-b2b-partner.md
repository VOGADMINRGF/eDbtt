# Pricing B2B Partner (Beteiligungsbüros)

Stand: 2026-04-30  
Status: umgesetzt als eigener Pricing-Slice `PR-PRICING-B2B-PARTNER-01`

## Zielbild

`/pricing/institutionen?segment=organisationen` ist der kanonische B2B-Partnerpfad fuer Beteiligungsprofis.

Die Positionierung ist explizit:

- eDebatte ersetzt keine Beteiligungsbueros und keine Moderation.
- eDebatte ist Werkzeug-, Dossier-, Studio- und Beteiligungsinfrastruktur.
- B2B ist klar von B2G-Vergabepaketen getrennt.

## Zielgruppen

B2B richtet sich primaer an:

- Beteiligungsbueros
- Moderationsbueros
- Stadtentwicklungs- und Planungsbueros
- Kommunikationsagenturen
- Dialog- und Prozessberatungen
- Public-Affairs-/Stakeholderdialog-Beratungen
- Stiftungs- und Demokratieprogramme
- Medien-/Community-Partner

## Paketlogik (B2B)

Auf `segment=organisationen` sind vier Partnerpakete sichtbar:

1. Beteiligungsbuero Starter
2. Projektpartner Beteiligung
3. Agentur-/Buero-Betrieb
4. Partner-/Rahmenmodell

Jede Karte zeigt:

- Preisrahmen (monatlich/projektbezogen)
- Fuer wen
- typischen Einsatz
- enthaltene Leistungen
- Ergebnis
- Bestellbarkeit
- Hinweis/Guardrail
- CTA

## CTA-Logik

B2B-CTAs laufen ueber `/order` mit `segment=organisationen` und passendem Completion-Kontext:

- Pilot vormerken (`direct_order`)
- Demo anfragen (`conversation_request`)
- Projektpaket anfragen (`quote_request`)
- Partnergespraech vereinbaren (`conversation_request`)
- Kostenvoranschlag anfordern (`quote_request`)

## Guardrails

- Keine Behauptung, dass eDebatte Beteiligungsbueros ersetzt.
- Keine Fake-White-Label-Zusage.
- Keine Fake-Live-Veroeffentlichung in externe Kanaele.
- Keine Rechtsberatung.

## Abgrenzung zu B2G

- B2G (`segment=kommunen`): vergabefaehige Beteiligungsleistungen fuer oeffentliche Auftraggeber.
- B2B (`segment=organisationen`): Produktions- und Betriebsinfrastruktur fuer Beteiligungsprofis.

## Anschluss

Der B2B-Slice ist kompatibel mit dem Studio-Produktpfad (`/dossier/[id]/studio`), bleibt aber fachlich getrennt von:

- Beteiligungsradar
- Ausschreibungs-/Signal-Ingestion
- automatischer externer Veroeffentlichung
