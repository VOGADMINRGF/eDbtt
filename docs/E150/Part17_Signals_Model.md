# Part 17 – Signals Model

## 1. Definition

Signals sind interne Relevanzindikatoren.
Sie zeigen, was Menschen, Medien, Verwaltung oder das System selbst als relevant markieren.

Signals sind:
- keine Waehrung
- keine Votes
- keine Wahrheit
- kein direkter Kaufhebel

## 2. Herkunft von Signals

Signals koennen entstehen durch:
- direkte Nutzeraktion
- Event-/QR-Interaktion
- Feed-Cluster
- journalistische Ausloeser
- Hinweise
- Admin-/Review-Einstufungen
- spaeter optional externe Metriken

## 3. Signaltypen

Mindestens:
- `interest_signal`
- `support_signal`
- `concern_signal`
- `priority_signal`

Optional spaeter:
- `research_signal`
- `urgency_signal`

## 4. Grundregeln

- Signals beeinflussen Prioritaet, nicht Wahrheit
- Signals koennen Anlassraeume und Dossiers priorisieren
- Signals koennen Funding Intent triggern
- Signals duerfen Abstimmungen nicht ersetzen

## 5. Aggregationsmodell

Beispielhafte Grundformel:

`SignalScore = (uniqueUsers * 1.0) + (repeatSignals * 0.3) + (verifiedUsers * 1.5) + recencyBoost`

Empfehlungen:
- `uniqueUsers` ist der staerkste Faktor
- wiederholte gleiche Signals derselben Person zaehlen schwach
- verifizierte / institutionelle Signals sind belastbarer
- sehr alte Inaktivitaet fuehrt zu Decay

## 6. Decay

Empfohlene Basis:
- `-10 %` pro Woche ohne Aktivitaet

Ziel:
- alte, tote Themen sinken
- neue Dynamik bleibt sichtbar

## 7. Schwellenwerte

Empfohlene Schwellen:
- `> 50` -> Anlassraum-Vorschlag
- `> 150` -> Anlassraum-Erstellung empfohlen
- `> 500` -> Dossier empfohlen
- `> 1000` -> Prioritaetsfall / Admin Alert

Hinweis:
Diese Werte sind Startwerte und sollen spaeter empirisch justiert werden.

## 8. Konfliktlogik

Wenn:
- hohe `support_signal`
- und gleichzeitig hohe `concern_signal`

dann markiere:
- `controversial_topic`
- `needs_structuring`
- ggf. Review-Hinweis

## 9. Radar

Signals speisen:
- Themenradar
- Anlassraum-Vorschlaege
- Prioritaetslisten
- Event-/Sitzungsvorbereitung
- Admin-Worklists

## 10. Guardrails

- max Signals pro User und Thema
- Rate Limits
- Dedupe / Clustering
- keine direkte Kaufdominanz
- bei gekauften / aktivierten Support-Signalen immer getrennt von Voting

## 11. Interaction mit Funding

Signals -> zeigen Relevanz
Funding -> ermoeglicht Umsetzung

Merksatz:
**Signals zeigen, was Menschen bewegt. Funding ermoeglicht, was umgesetzt wird.**

## 12. Failure Cases

- Signal-Spam -> Rate Limits
- Brigading -> Clustering / Pattern-Detection
- tote Themen -> Decay / Archiv
- institutionelle Uebersteuerung -> nur als Signalquelle, nicht als Wahrheit
