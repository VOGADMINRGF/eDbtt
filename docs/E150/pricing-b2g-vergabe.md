# Pricing B2G Vergabe (Kommunen)

Stand: 2026-04-30  
Status: umgesetzt als eigener Pricing-Slice `PR-PRICING-B2G-VERGABE-01`

## Zielbild

`/pricing/institutionen` bildet fuer Segment `kommunen` nicht nur Paketpreise ab, sondern klar beschreibbare Beteiligungsleistungen fuer:

- Kommunen / Verwaltungen / Landkreise
- oeffentliche Auftraggeber
- Projektteams mit Pilot-, Betriebs- und Vergabevorbereitung

Kommunale Nutzer sollen die Beschaffungstiefe direkt erkennen:

1. fruehe Vorpruefung (Pilot)
2. konkretes Thema mit Dossier und Beteiligungsrunde
3. wiederkehrender Beteiligungsbetrieb
4. Vergabe-/Rahmenvertragsvorbereitung

## Paketlogik (B2G)

Auf `/pricing/institutionen?segment=kommunen` werden vier vergabefaehige Leistungspakete angezeigt:

1. Beteiligungs-Check
2. Dossier & Beteiligungsrunde
3. Beteiligungsbetrieb Kommune
4. Rahmenvertrag / Vergabepaket

Jede Karte zeigt:

- Zweck
- typische Einsatzfaelle
- enthaltene Leistungen
- Ergebnis/Deliverable
- Bestellbarkeit
- Vergabehinweis
- CTA

CTAs unterscheiden explizit:

- Pilot vormerken (`direct_order`)
- Kostenvoranschlag anfordern (`quote_request`)
- Leistungsbeschreibung anfordern (`quote_request`)
- Gespraech anfragen (`conversation_request`)
- Vergabepaket pruefen (`conversation_request`)

## Vergabe-/Ausschreibungsabgrenzung

B2G-Texte sind als Orientierungs- und Vorbereitungssprache formuliert:

- Leistungsbeschreibung als Entwurfs-/Anforderungspaket
- optionale Losstruktur
- Datenschutz-/Sicherheitsanhang als Entwurf
- Support-, Abnahme- und Dokumentationslogik

Nicht behauptet:

- keine Rechtsberatung
- keine automatische Ausschreibung
- keine Ersetzung formeller gesetzlicher Beteiligungspflichten

Trennung bleibt sichtbar:

- formelle Beteiligungspflichten (rechtlicher Vollzug)
- informelle und vorbereitende Beteiligungsleistung (eDebatte-Produktpfad)

## Guardrails

- Keine juristische Vergabeberatung.
- Vergabehinweise nur als Orientierung.
- Leistungsbeschreibung nur als Entwurfs-/Anforderungspaket.
- Keine automatische Erzeugung einer oeffentlichen Ausschreibung.
- Keine Behauptung, dass eDebatte formelle Beteiligungspflichten ersetzt.
- Mitgliedschaft und Paketfreischaltung bleiben getrennte Prozesse.

## Anschluss an Beteiligungsradar (spaeter)

Dieser Slice fuehrt bewusst keine Feed-/Crawler-/Ausschreibungs-Ingestion ein.

Moeglicher Folge-Slice:

- Anschluss an Beteiligungsradar nur als separates, spaeteres Arbeitspaket
- ohne Rueckbau der aktuellen B2G-Preis-/Vergabelogik
