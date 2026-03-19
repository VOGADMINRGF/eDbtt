# E150 Master Spec – Part 14: Implementation Roadmap

> Status-Hinweis (2026-03-19): Dieser Part beschreibt die empfohlene Reihenfolge der Umsetzung. Der verbindliche Aufgabenstand liegt in `docs/E150/OpenTasks.md`.

## 1. Ziel dieses Parts

Nicht nach Zielgruppe zuerst bauen, sondern nach Architektur-Abhaengigkeit.

Empfohlene Reihenfolge:

1. Governance Core
2. Anlassraum / Event / Feed Review
3. Kommune / Verwaltung
4. Pricing / Billing / Funding / Signals
5. Journalismus
6. Organisationen / Verbaende / Civic

## 2. Warum diese Reihenfolge?

### 2.1 Governance vor Verticals
Wenn Journalismus, Kommune und Organisationen zuerst separat gebaut werden, entstehen drei Modelle.
Deshalb zuerst:
- gemeinsames Lifecycle-Modell
- Trust / Rollen / Raumtypen
- Anlassraum / Dossier Trennung

### 2.2 Anlassraum vor Automatik
Bevor Automatik aus Feed oder KI irgendetwas erzeugt, muss der Anlassraum als Kernobjekt stehen.

### 2.3 Kommune vor Journalismus
Kommunen / Verwaltung sind der staerkste direkte Pilot- und Umsatzpfad.
Journalismus baut danach auf denselben Kern auf.

## 3. Welle 1 — Governance Foundation

### Ziele
- GOV-01
- GOV-02
- DOCS-GOV-01

### Deliverables
- Entity-Modell
- Anlassraum-Grundmodell
- Dossier-Abgrenzung
- Trust-Level
- Publish Gates
- OpenTasks + Parts synchron

## 4. Welle 2 — Anlassraum / Event / Feed Review

### Ziele
- GOV-ANLASS-01 bis 04
- GOV-EVENT-01 und 02

### Deliverables
- Anlassraum anlegen / reviewen / publizieren
- Feed-Review Queue
- Event-/QR-/Protokoll-Fluss
- Anlassraum -> Dossier Anbindung

## 5. Welle 3 — Kommune / Verwaltung

### Ziele
- GOV-MUNI-01 / 02 / 03 / 05 / 06

### Deliverables
- Buergermeister-Dashboard
- Verwaltungsmodus
- Dezernatslogik
- Prozessstatus
- organisatorische Rollenzuordnung

## 6. Welle 4 — Pricing / Funding / Signals

### Ziele
- GOV-PRICING-01 / 02
- GOV-FUNDING-01 / 02 / 03
- GOV-SIGNAL-01

### Deliverables
- Hybrid-Pricing
- Admin Pricing Control
- Rabatt-Engine
- Signals / Thresholds / Trigger
- Funding Intent / Readiness / Matching / Impact

## 7. Welle 5 — Journalismus

### Ziele
- GOV-JOURNALISM-01 bis 04

### Deliverables
- source_anchor
- Truth Guardrails
- journalistische Anlassraeume
- Embed / QR Companion
- Redaktionsprofil

## 8. Welle 6 — Organisationen / Verbaende / Civic

### Ziele
- GOV-ORG-01 / 02
- GOV-CIVIC-01 / 02 / 03

### Deliverables
- dossierbasierte Organisationsidentitaet
- offizieller Organisationsmodus
- Initiative-Lifecycle
- Impact-/Unterstuetzungslogiken

## 9. Pilotdefinition

Ein Pilot ist erfolgreich, wenn:

- eine Entity angelegt werden kann,
- mindestens ein Anlassraum sauber reviewt und publiziert wird,
- Signals gesammelt werden,
- ein Funding Intent oder ein Event-/Beteiligungsfluss stattfindet,
- ein Dossier oder eine Nachbereitung entsteht.

## 10. Was explizit nicht zuerst gebaut wird

- keine 11.000 fertigen Seiten
- keine Vollautomatik ohne Review
- kein rein feed-getriebenes System
- kein Coin-/Gamification-first Modell
- keine komplexen Outcome-Abrechnungen vor stabilem Kern

## 11. Definition of Done fuer die erste echte Umsetzungswelle

- 1 Gemeinde oder Organisation sauber manuell anlegen
- 1 Anlassraum sauber anlegen
- Feed-Items reviewen und zuordnen
- Review / Approval / Publish
- Signals sammeln
- Funding Intent sammeln
- optional Funding starten
- Admin kann Pricing / Rabatte steuern
