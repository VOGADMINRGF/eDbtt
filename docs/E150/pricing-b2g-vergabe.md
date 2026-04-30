# Pricing B2G Vergabe (Kommunen)

Stand: 2026-04-30  
Status: umgesetzt als eigener Pricing-Slice `PR-PRICING-B2G-VERGABE-01`

## Zielbild

Die B2G-Preislogik ist kanonisch in drei Ebenen getrennt:

1. `/pricing` = allgemeiner Einstieg fuer Privat, Journalismus, Organisationen und Kommunen.
2. `/pricing?segment=kommunen` = B2G-Bridge, kein zweiter Voll-Konfigurator.
3. `/pricing/institutionen?segment=kommunen` = kanonischer B2G-Konfigurator.

`/pricing/institutionen?segment=kommunen` bildet fuer Segment `kommunen` nicht nur Paketpreise ab, sondern klar beschreibbare Beteiligungsleistungen fuer:

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

## Entry-Dedup / kanonischer Flow

- Auf `/pricing?segment=kommunen` wird **keine zweite vollstaendige Kommunen-Paketlogik** gerendert.
- Die Seite zeigt stattdessen eine kompakte Bruecke:
  - "Kommunen & oeffentliche Auftraggeber"
  - Kurzvorschau der vier B2G-Stufen
  - klarer CTA "Zum B2G-Konfigurator"
- Die eigentliche kommunale Auswahl (Bedarf, Rahmen, Leistungslogik) bleibt auf:
  - `/pricing/institutionen?segment=kommunen#guided-selection`

## UI-Hierarchie im B2G-Konfigurator

Auf `/pricing/institutionen?segment=kommunen` ist die Reihenfolge kanonisch:

1. Hero / institutionelle Konditionen
2. Segment-Unterscheidung B2G vs B2B
3. Guided Selection
4. Kommunale Einordnung
5. Vergabe- & Ausschreibungspakete (fachlich primär)
6. Empfohlener Betriebs- und Preisrahmen (sekundär)
7. Add-ons / Kontakt / Hinweise

Wichtig:

- Die vier B2G-Stufen sind die **fachliche Hauptentscheidung**.
- Der Betriebs-/Preisrahmen ergänzt diese Entscheidung und ersetzt sie nicht.

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

## Kommunale Einordnung vor Paketwahl

Im kommunalen Konfigurator ist vor der Paketauswahl ein fachlicher Einordnungsblock sichtbar:

- regionaler Anlass / Gebiet
- kommunaler Sachstand
- Zustaendigkeit / Fachbereich
- formelle oder informelle Beteiligung
- Quellenlage und offene Fragen
- gewuenschtes Ergebnis (Check, Dossier, Runde, Betrieb oder Vergabepaket)

Klarstellung:

- eDebatte unterstuetzt Strukturierung, Vorbereitung, Durchfuehrung und Ergebnisdokumentation.
- eDebatte ersetzt keine Rechtspruefung und keine formelle gesetzliche Beteiligungspflicht.

## Abgrenzung zu B2B

- Kommunen (B2G): kaufen Beteiligungsleistungen, Pilotpakete oder vergabefaehige Leistungsbausteine.
- Organisationen/Beteiligungsbueros (B2B): nutzen eDebatte als Werkzeug-, Dossier-, Studio- und Beteiligungsinfrastruktur fuer eigene Projekte.

## Anschluss an Beteiligungsradar (spaeter)

Dieser Slice fuehrt bewusst keine Feed-/Crawler-/Ausschreibungs-Ingestion ein.

Moeglicher Folge-Slice:

- Anschluss an Beteiligungsradar nur als separates, spaeteres Arbeitspaket
- ohne Rueckbau der aktuellen B2G-Preis-/Vergabelogik
