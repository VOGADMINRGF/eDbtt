# eDebatte / VoiceOpenGov – Membership, Pricing, Funding und Packaging

## 1. Zweck dieses Dokuments

Dieses Dokument harmonisiert:
- Mitgliedschaft / Bewegung
- institutionelles Pricing
- Anlassraum-/Governance-Pakete
- Rabatte
- Funding-/Mission-Logiken
- Signals als Relevanzsystem

Es ersetzt nicht `OpenTasks.md`, sondern konkretisiert die Preis- und Paketlogik.

## 2. Grundsatz

Menschen und Institutionen zahlen **nicht fuer Wahrheit**, sondern fuer:
- Infrastruktur
- Moderation / Review
- Strukturierung
- Anlassraeume
- Dossiers
- Reporting
- Umsetzung / Begleitung

## 2.1 Frontend-Finalstand (2026-04-18)

Kanonischer Produktstand fuer die user-facing Paketwelt auf `/pricing` und `/order`:

- Privat / Civic (sichtbare Hauptlogik):
  - `eDebatte Interessiert`: `0 € fuer VoiceOpenGov-Mitglieder`, `3,99 € regulaer`
  - `eDebatte Aktiv`: `9,90 €`
  - `eDebatte Mitgestaltend`: `29,90 €`
- Paketlogik ist direkt an `/create` gekoppelt:
  - Anliegen einbringen
  - Beitrag/Agenda pruefen
  - Thema gemeinsam erarbeiten
- Mitgliedschaft und Paketfreischaltung sind getrennt:
  - Mitgliedschaft kann im `/order`-Bestellformular optional per Checkbox mitbeantragt werden
  - formale Bestätigung erfolgt separat
  - Paketstart/Freischaltung folgt eigenständig im Nutzungskontext
- `/pricing` bleibt kurz und entscheidungsorientiert (Hero + 2 CTAs + 3 Privatpakete).
- Freie Journalist:innen, Organisationen und Kommunen sind als vorbereitete Sonderzugaenge sichtbar, aber nicht Teil der primaeren 3er-B2C-Hauptlogik.
- B2B/B2G-Konditionen laufen ueber `/pricing/institutionen` in einen direkten Shop-/Bestellpfad; Kontakt bleibt fuer Sonderkonditionen optional verfuegbar.
- Unabhängigkeitsprinzip:
  - keine Vermarktung einzelner Stimmen
  - keine Weitergabe personenbezogener Beteiligungsdaten
  - keine politische Bevorzugung gegen Geld
  - Finanzierung über faire Beiträge, professionelle Nutzungspakete und anonymisierte Auswertungen

## 3. Trennung der Ebenen

### 3.1 Membership / VoiceOpenGov
Die Bewegungsebene:
- Unterstuetzung der Sache
- Mission-Funding
- allgemeine Foerderung
- kein harter Projektzwang

### 3.2 Produkt / eDebatte
Die Produkt-/Systemebene:
- Radar
- Anlassraeume
- Dossiers
- Runden
- Verwaltungs-/Org-Features
- Reporting
- Event-Integration

### 3.3 Signals
Signals sind:
- keine Waehrung
- keine Votes
- keine Wahrheit
- keine Preislogik

Sie dienen nur als:
- Relevanzindikator
- Priorisierung
- Trigger fuer Radar / Anlassraum / Dossier

### 3.4 Funding
Funding dient:
- Mission
- Projektumsetzung
- Ressourcen
- Priorisierung / Bearbeitung
- gesellschaftlicher Mitfinanzierung

Funding darf nie:
- Wahrheit kaufen
- Faktenstatus kaufen
- Stimmen kaufen

### 3.5 Seitenrollen fuer Paketstart
- `/pricing`: kanonische Seite fuer Pakete, Preise und Segmentlogik.
- `/pricing/institutionen`: kanonische Detailseite fuer vollstaendige B2B-/B2G-Preise (Organisationen + Kommunen).
- `/order`: kanonischer Folgepfad fuer Paketstart/Bestellung (privat + institutionell, segmentgefuehrt).
- `/vormerken`: Legacy-Alias auf denselben Order-Flow (fuer bestehende Deep-Links/Wrappers).
- `/mitglied-antrag`: nur Mitgliedschafts-Antrag, keine Paketlogik.
- Segmentfokus fuer Sonderzugaenge bleibt auf `/pricing/institutionen` ueber Query moeglich (`?segment=organisationen|kommunen`) und verdraengt nicht die 3er-B2C-Hauptlogik.

Paketabschluss und Freischaltung bleiben getrennt:
- zuerst Paketstart/Paketbeauftragung
- danach Aktivierung/Freischaltung je Einsatzkontext

### 3.6 Bestell-/Prueffluss (minimal, billing-ready)

Oeffentlich:
- Privat, Journalismus, Organisationen und Kommunen sind direkt bestellbar.
- `/pricing/institutionen` fuehrt als Shop-Einstieg in segmentgefuehrte Paketbeauftragung auf `/order`.
- Kostenvoranschlag (inkl. Leistungsuebersicht) ist im Bestellpfad per Knopfdruck erzeugbar.
- Optionales Gespraech ueber `sales@edebatte.org` bleibt fuer Sonderkonditionen verfuegbar.

Intern:
- institutionelle Bestellungen koennen vor Aktivierung geprueft/angepasst werden
- kein verpflichtender Sales-Call als Gate in der Public Journey

Kanonische Status:
- `submitted`
- `under_review`
- `approved`
- `adjusted`
- `rejected`
- `active`
- `paused`
- `cancelled`

Diese Status sind als leichtgewichtiger Admin-/Billing-Anschluss gedacht, ohne in diesem Slice eine vollstaendige Finance-Suite zu bauen.

Qualitaets-/Rollenpfad-Hinweis (2026-04-12):
- Rollen-Zielbilder, Redirect-Contracts, Dashboard-Erwartungspfade und Add-on-Reifestand sind in
  `docs/E150/PR-QUALITY-HARM-01_ROLE_ROUTING_DASHBOARD_CONTRACT_2026-04-12.md`
  als operativer Quality-Slice dokumentiert.
- Der E2E-/Manual-QA-Hardening-Slice ist als **essentieller Pflichtblock** dokumentiert in
  `docs/E150/PR-QUALITY-HARM-02_E2E_MANUAL_QA_HARDENING_2026-04-12.md`.
- Die manuelle Abnahme fuer kritische Kernreisen erfolgt nach
  `docs/E150/QA_MANUAL_CHECKLIST_CRITICAL_JOURNEYS_2026-04-12.md`.

### 3.7 Bilingual Pricing-/Order-Contract (DE/EN)

- Die kanonischen Pricing-Surfaces laufen bilingual (DE/EN), ohne fachliche Parallelwelt:
  - `/pricing`
  - `/order`
  - `/pricing/institutionen`
- Reifestandsbegriffe sind sprachlich lokalisiert, fachlich identisch (oeffentlicher Kern):
  - DE: `Direkt bestellbar`, `Bestellbar, intern geprueft`, `Bestellbar, mit Folgeabstimmung`
  - EN: `Directly orderable`, `Orderable, internally reviewed`, `Orderable, with follow-up coordination`
- `in_rollout` / `Rolling out gradually` bleibt intern reserviert und ist fuer den aktuellen oeffentlichen Kernbestand nicht aktiv.
- Segment-/Add-on-Querylogik (`segment`, `addon`, `addons`) bleibt sprachunabhaengig stabil; Sprache beeinflusst nur Darstellung.
- Englisch darf keine staerkere Produktreife behaupten als Deutsch (kein Over-Promise ueber Review-/Follow-up-Pfade).

### 3.8 Endzustandsregel (Final Closure)

Fuer oeffentliche Produktflaechen gilt verbindlich:

1. fertig und abgesichert
2. intern vorhanden, aber oeffentlich nicht versprochen
3. aus UX, CTA und oeffentlicher Doku entfernt

Keine Zwischenversprechen im Kernprodukt.

### 3.9 Trust-/Legitimations-Loop (DE/EN)

Pricing-, Membership-, Registry- und Order-Followup-Kommunikation ist um einen
einheitlichen Trust-Loop ergaenzt:

- VoiceOpenGov ist bewusst keine Partei.
- VoiceOpenGov ist eine unabhaengige Initiative fuer strukturierte gesellschaftliche Beteiligung und das Mehrheitsprinzip.
- Hohe Legitimation bleibt Pflicht (Missbrauchsschutz, Nachvollziehbarkeit, Verlaesslichkeit).
- Hohe Legitimation bedeutet nicht papierhafte Trägheit; Ziel ist starke digitale Verifikation mit moeglichst wenig unnoetiger Reibung.

Kanonische Textstufen (DE/EN, semantisch deckungsgleich):

- Leitsatz
- Kurzform
- Mittelform
- Langform (inkl. FAQ-Kontexte)

Kanonische source of truth:

- `features/pricing/domain/trustLoop.de.ts`

Die produktnahe Nutzung umfasst:

- `/pricing`
- `/order`
- `/pricing/institutionen`
- registry-/payment-nahe Hinweise
- order-/activation-followup-Texte

## 4. Institutionelles Hybrid-Pricing (`/pricing/institutionen`)

### 4.1 Formel

**Total = Base + Anlassraeume + optionale aktive Teilnehmende + Add-ons + optionale Outcome-/Report-Komponente - Discount**

### 4.2 Segment: Organisationen / Verbaende / Vereine

Preisstruktur (Orientierungswerte):
- Grundaktivierung: **ab 1.500 EUR / Monat**
- Laufender Betrieb (Betrieb Plus): **ab 2.900 EUR / Monat**
- Raeume/Themenraeume/Anlassraeume: **Small 300 EUR · Medium 600–1.000 EUR · Large 1.000–1.500 EUR je aktivem Raum**
- Optionale aktive Beteiligung: **ab 0,75 EUR je aktivem Teilnehmenden und Zeitraum**
- Reports/Auswertung: **ab 390 EUR / Monat**
- Moderation/Governance: **ab 450 EUR / Monat**

### 4.3 Segment: Kommunen / Verwaltung / Landkreise

Preisstruktur (Orientierungswerte):
- Grundaktivierung: **ab 2.500 EUR / Monat**
- Laufender Betrieb (Betrieb Plus): **ab 4.500 EUR / Monat**
- Raeume/Themenraeume/Anlassraeume: **Small 300 EUR · Medium 600–1.000 EUR · Large 1.000–1.500 EUR je aktivem Raum**
- Optionale aktive Beteiligung: **ab 0,75 EUR je aktivem Teilnehmenden und Zeitraum**
- Reports/Auswertung: **ab 590 EUR / Monat**
- Moderation/Governance: **ab 790 EUR / Monat**

### 4.4 Add-ons (klar getrennt von Grundpaketen)

- Event-Begleitung: **ab 690 EUR je Einsatz**
- Moderation/Assistenz: **ab 450 EUR / Monat**
- Reports/Outcomes: **ab 390 EUR / Monat**
- Managed Governance: **ab 1.200 EUR / Monat**
- Companion-/Kommunikationsformate: **ab 290 EUR / Monat**
- Optionales Faktencheck-Kontingent: **ab 290 EUR / Monat**

Produktfuehrung Add-ons:
- nicht als lose Preisliste, sondern als progressive Auswahl im Guided-Flow
- zuerst 2-3 empfohlene Erweiterungen, weitere Optionen nachgeordnet
- je Add-on mit Einsatzkontext (wann sinnvoll / wann eher nicht noetig), Reifestand und Bestellbarkeit
- Rueckfragen erscheinen erst bei Auswahl des jeweiligen Add-ons

Standardisierte Reifestandslogik (SSOT):
- `direct_orderable` -> **Direkt bestellbar**
- `orderable_review_required` -> **Bestellbar, intern geprueft**
- `followup_required` -> **Bestellbar, mit Folgeabstimmung**
- `in_rollout` -> intern reserviert (nicht fuer den aktuellen oeffentlichen Kernbestand aktiv)

CTA-Leitsprache auf `/pricing/institutionen` (Guided-Flow):
- DE: `Direkt zur Auswahl`, `Empfehlung übernehmen`, `Direkt bestellen`, `Kostenvoranschlag anfordern`, `Gespräch anfragen`, `Kontakt`
- EN: `Jump to guided selection`, `Apply recommendation`, `Direct order`, `Request quote`, `Request conversation`, `Contact`

### 4.5 Aktivierung / Freischaltung

- Paketkonditionen ueber `/pricing/institutionen` vorauswaehlen und direkt beauftragen
- Aktivierung mit Rollen-, Team- und Prozessabstimmung
- Freischaltung entlang abgestimmtem Betriebsrahmen
- Mitgliedschaft und Paketfreischaltung bleiben getrennt

## 5. Zielgruppen-Pakete

### 5.1 Kommune / Verwaltung

#### Open Civic / Radar
- Radar
- Sichtbarkeit von Themen
- vorbereitbare Anlassraeume
- kein offizieller Vollbetrieb

#### Basis Governance
- offizieller Raum
- Anlassraeume
- Event-/QR-Basics
- einfache Beteiligung

#### Professional Governance
- mehrere Anlassraeume
- Agenda-/Dossier-Unterstuetzung
- Verwaltungsmodus
- Reporting / Executive Surface

#### Managed / Enterprise
- kontinuierliche Begleitung
- Reports
- Moderations-/Nachbereitungsunterstuetzung
- Managed Governance

### 5.2 Organisationen / Verbaende
Pakete orientieren sich eher an:
- Teams / Rollen
- Anlassraeumen
- Dossiers
- Events
- Reports

### 5.3 Medien
Pakete orientieren sich eher an:
- Anlassraeumen pro Redaktion / Projekt
- Dossiers
- Factcheck Assist
- Embeds / QR / Companion-Flaechen

### 5.4 Parteien
Pakete orientieren sich eher an:
- Teamgroesse
- Themenraeumen
- Dossiers
- Event-/Dialogformaten

## 6. Die drei verkaufsstarken Features

1. **Themenradar + Anlassraum-Vorschlaege**
2. **Anlassraum + Event-/QR-Integration**
3. **Dossier + Entscheidungslogik**

Das sind in der Regel die staerksten Aktivierungshebel vor Abstimmungen selbst.

## 7. Pilotmodell

Empfohlenes Einstiegsmodell:
- 3–6 Monate
- 1–2 Anlassraeume
- Radar
- Event-/QR-Test
- begrenzter Scope
- reduzierte Preise oder pilothafer Rabatt

## 8. Rabattmodell

### 8.1 Grundregel
Rabatte sind **bis zu 30 %** moeglich.

### 8.2 Aber:
- nie pauschal auf alles
- immer komponentenbezogen
- oft nur auf Base oder Anlassraum-Komponente
- selten oder nie auf jede variable Komponente gleichzeitig

### 8.3 Rabattarten
- Pilot
- Jahreszahlung
- Custom
- Founder / Early
- Partnerschaft / Foerderlogik

### 8.4 Kontrollregeln
- >20 % braucht Approval
- zeitlich begrenzt
- im Audit Log dokumentieren
- klarer Scope (`base`, `anlassraum`, `participant`, `total`, `addon`)

## 9. Caps / Planbarkeit

Fuer groeßere Kunden muessen Preis-Caps moeglich sein.
Beispiel:
- monatlicher Maximalpreis
- Anlassraum-Cap
- Teilnehmer-Cap

Ziel:
- Planbarkeit fuer Institutionen
- keine Kostenexplosion bei erfolgreicher Nutzung

## 10. Funding-Gebuehren

### 10.1 Mission Funding
- typischer Plattformanteil: 10–20 %

### 10.2 Projekt Funding
- typischer Plattformanteil: 5–10 %

### 10.3 Ressourcen Funding
- indirekte oder servicebasierte Monetarisierung
- optional Vermittlungs-/Abwicklungsgebuehren

### 10.4 Boost / Express / Zusatzservice
- 10–20 % oder pauschale Servicepreise

## 11. Funding Intent vor Funding

Vor Crowdfunding / Projekt-Funding soll moeglichst zuerst gemessen werden:
- besteht Bereitschaft?
- gibt es genuegend Interesse?
- ist das Thema funding-ready?

Das senkt Leerlauf und erhoeht Conversion.

## 12. Matching Funds

Institutionen oder Partner koennen Beitraege matchen.
Regeln:
- sichtbar und transparent
- nie mit Einfluss auf Wahrheits- oder Faktenstatus
- fuer Motivation / Aktivierung sehr wertvoll

## 13. Signals und Funding zusammen denken

Merksatz:

**Signals zeigen, was Menschen bewegt. Funding ermoeglicht, was umgesetzt wird.**

## 14. Beispielrechner

### 14.1 Kleine Kommune
- Base: 2.500 EUR
- 2 mittlere Anlassraeume: 2 x 800 EUR
- 500 aktive Teilnehmende optional: z. B. 0,75 EUR = 375 EUR

Total: 4.475 EUR / Monat vor Rabatt

### 14.2 Mittlere Kommune
- Base: 2.500 EUR
- 4 Anlassraeume gemischt: 3.200 EUR
- 1.500 aktive Teilnehmende optional: 1.125 EUR

Total: 6.825 EUR / Monat vor Rabatt

### 14.3 Verband / Organisation
- Base: 1.500–3.000 EUR
- Anlassraeume / Dossiers / Events je Nutzung
- kein Einwohnermodell

### 14.4 Redaktion
- je nach Anlassraeumen, Dossiers, Factcheck Assist, Embed-Nutzung
- kein Einwohnermodell

## 15. Admin Pricing Control

Im Admin muss man je Entity manuell pflegen koennen:
- Preisprofil
- Base
- Anlassraumpreise
- Teilnehmerpreise
- Caps
- Add-ons
- Rabattregeln
- Approval
- Audit Log

## 16. Kommunikationssatz fuer Vertrieb

Nicht sagen:
- „Sie zahlen pro Nutzer“

Sondern:
- „Die Grundinfrastruktur ist fix. Zusätzlicher Aufwand entsteht, wenn echte Themen, Anlassraeume und Beteiligung entstehen.“

Noch besser:
- **„Sie zahlen nicht fuer Software. Sie zahlen fuer funktionierende Entscheidungsprozesse.“**
