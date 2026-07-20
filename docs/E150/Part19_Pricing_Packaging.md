# Part 19 – Pricing, Packaging & Discount Engine

## 1. Ziel

Dieses Part beschreibt ein harmonisiertes Produkt- und Preismodell fuer:
- Kommunen
- Verwaltungen
- Organisationen / Verbaende
- Parteien
- Medien
- Unternehmen / interne Raeume

## 2. Grundsatz

Nicht:
- pauschal pro Einwohner
- nicht rein pro Nutzer
- nicht rein pro Softwaremodul

Sondern:
- **Basis**
- **aktive Anlassraeume**
- **optionale aktive Beteiligung**
- **Add-ons / Reports / Assistenz**
- **Caps / Rabatte / Piloten**

## 2.1 Kanonische Seitenrollen

- `/pricing` bleibt die kanonische Uebersichtsseite fuer Pakete, Preise, Add-ons und Segmentlogik.
- `/pricing/institutionen` ist die kanonische Detailseite fuer vollstaendige B2B-/B2G-Preisstruktur.
- `/order` ist der kanonische Folgepfad fuer Paketstart und Bestellung (privat + institutionell) inkl. segmentgefuehrter Paketauswahl.
- Legacy-Kompatibilitaet: `/vormerken` bleibt als Alias erreichbar und zeigt denselben Flow.
- Paketabschluss und Freischaltung sind getrennt organisiert: Abschluss jetzt, Aktivierung danach passend zum Nutzungskontext.
- Keine Wartelisten-Semantik als Standardfall.

### 2.2 Frontend-Finalisierung (2026-04-18)

Fuer die oeffentliche Produktdarstellung gilt verbindlich:

- Reihenfolge auf `/pricing`: **kurzer Hero -> 3 Privatpakete -> kurzer Hinweis auf Konditionsseite**
- Sichtbare B2C-Hauptlogik (kanonisch):
  - `eDebatte Interessiert` -> `0 EUR fuer VoiceOpenGov-Mitglieder`, `3,99 EUR regulaer`
  - `eDebatte Aktiv` -> `9,90 EUR`
  - `eDebatte Mitgestaltend` -> `29,90 EUR`
- Hero auf `/pricing` bleibt kurz und entscheidungsorientiert:
  - CTA `Paket waehlen`
  - CTA `B2B/B2G-Konditionen ansehen`
- Paketlogik folgt direkt den `/create`-Nutzungen:
  - Anliegen einbringen
  - Beitrag/Agenda pruefen
  - Thema gemeinsam ausarbeiten
- Mitgliedschaft kann im `/order`-Formular optional mitbeantragt werden (Checkbox), Paketstart und Mitgliedschaftsfreischaltung bleiben getrennt.
- Institutionelle/redaktionelle Zugaenge bleiben vorbereitet und klar nachgeordnet.
- B2B/B2G-Konditionen sind bewusst auf `/pricing/institutionen` ausgelagert, damit `/pricing` eine klare B2C-Entscheidungsseite bleibt.
- Keine user-facing internen Tier-Begriffe oder technisches Mapping-Wording

### 2.3 Research-Credit Alignment (Issue #64, 2026-04-29)

Public wording folgt verbindlich:

- `docs/E150/V3_AI_ORCHESTRATION_AND_RESEARCH_CREDIT_POLICY_2026-07-18.md`

Verbindliche Privatpreis- und Credit-Zielwelt:

- `0 EUR`:
  - Voting/Participation bleibt frei.
  - Keine Recherche-Kontingente enthalten.
- `3,99 EUR` (`eDebatte Interessiert`):
  - 1 Contribution pro Monat.
  - Keine erweiterten Recherche-Kontingente enthalten.
- `9,99 EUR` (`eDebatte Aktiv`):
  - 3 Contributions pro Monat.
  - 1 Anlassraum-Credit.
  - Keine automatische externe Quellenanalyse.
- `29,99 EUR` (`eDebatte Mitgestaltend`):
  - 10 Contributions pro Monat.
  - 1 Anlassraum-Credit.
  - 1 Entwicklungsthema.
  - Optional 1 Recherche-Kontingent, sobald die Kosten-/Provider-Policy aktiv ist.

Segment-Kontingente (ohne automatische Membership-Rabattlogik):

- Journalismus:
  - Fokus: `Starter-Kontingent` (3 Contributions/Monat + 1 Anlassraum) oder `Arbeitskontingent` (10 Contributions/Monat + 1 Anlassraum).
- Kleine Vereine (Organization Activation):
  - `Starter-Kontingent` (3 Contributions/Monat + 1 Anlassraum) als Einstiegspfad.
- Membership bleibt optionaler Antrag in allen Segmenten, erzeugt aber außerhalb des privaten Basispakets keinen automatischen Paketrabatt.

Add-on-Rahmen (orientierend, explizit optional):

- Quellenprüfung / Recherche-Kontingent: rund `10 EUR`.
- Premium-Recherche / vertiefte externe Quellenanalyse: rund `20 EUR`.

Guardrails:

- Contributions sind nicht gleich externe Quellenanalyse.
- Anlassraum ist nicht gleich Premium-Recherche.
- Dossier ist kein automatischer externer Recherchelauf.
- Keine unbegrenzte externe Research-Nutzung in günstigen Paketen.
- Unbekannte Providerkosten bleiben `unknown`/`n/a` (`costKnown=false`) und werden nie als `0 EUR` dargestellt.
- Standard Analyze bleibt ohne automatische externe Recherche lauffähig.

### 2.4 Bestellbarkeit + interne Steuerbarkeit

- Privatpakete: direkt bestellbar (low friction).
- Journalismus/Organisationen/Kommunen: direkt bestellbar ueber den Shoppfad (`/pricing/institutionen` -> `/order`), bei internem Review weiterhin admin-pruefbar.
- Kontaktanfragen ueber `sales@edebatte.org` bleiben als optionaler Parallelpfad fuer Sonderkonditionen verfuegbar.
- Kostenvoranschlag ist im Shoppfad per Knopfdruck erzeugbar (inkl. Leistungsuebersicht und Add-on-Positionen).
- Rollenrouting-/Dashboard-Qualitaet ist als separater Contract-Hardening-Slice dokumentiert (`docs/E150/PR-QUALITY-HARM-01_ROLE_ROUTING_DASHBOARD_CONTRACT_2026-04-12.md`).
- E2E-/Manual-QA-Hardening ist als **essentieller Pflichtpfad** dokumentiert (`docs/E150/PR-QUALITY-HARM-02_E2E_MANUAL_QA_HARDENING_2026-04-12.md`) und darf nicht als optionaler Polish behandelt werden.
- Operative Manual-Abnahme fuer kritische Nutzerreisen folgt `docs/E150/QA_MANUAL_CHECKLIST_CRITICAL_JOURNEYS_2026-04-12.md`.

Order-Statusmodell (minimal, anschlussfaehig fuer Billing):
- `submitted`
- `under_review`
- `approved`
- `adjusted`
- `rejected`
- `active`
- `paused`
- `cancelled`

Damit bleibt die Public Journey einfach, waehrend intern Freigabe-/Anpassungslogik vorbereitet ist.

### 2.5 Bilingual Pricing Contract (DE/EN)

- Pricing-/Order-/Add-on-Flows werden aus einer gemeinsamen SSOT gespeist; Sprache aendert Darstellung, nicht Logik.
- Bilingual abgesicherte Kernflaechen:
  - `/pricing`
  - `/order`
  - `/pricing/institutionen`
  - pricing-nahe Follow-up-/Orderbestaetigungstexte
- Reifestandsbegriffe sind semantisch deckungsgleich (oeffentlicher Kern):
  - DE: `Direkt bestellbar`, `Bestellbar, intern geprueft`, `Bestellbar, mit Folgeabstimmung`
  - EN: `Directly orderable`, `Orderable, internally reviewed`, `Orderable, with follow-up coordination`
- `in_rollout` / `Rolling out gradually` bleibt ein internes Reifestandsvokabular und ist fuer den aktuellen oeffentlichen Kernbestand nicht aktiv.
- Segment-/Add-on-Fokusparameter (`segment`, `addon`, `addons`) bleiben ueber Sprachen stabil; `lang=en` beeinflusst nur Texte und Labels.
- Kern-CTA-Links auf `/pricing`, `/order` und `/pricing/institutionen` erhalten `lang=en` konsistent in EN-Ansicht.
- EN darf keine staerkere Verfuegbarkeit behaupten als DE (kein semantisches Over-Promise).

### 2.6 Endzustandsregel (Final Closure)

Fuer oeffentliche Produktflaechen gilt verbindlich:

1. fertig und abgesichert
2. intern vorhanden, aber oeffentlich nicht versprochen
3. aus oeffentlicher UX/CTA/Docs entfernt

Keine Zwischenzusagen im Kernprodukt.

### 2.7 Trust-/Legitimations-Loop (DE/EN, SSOT-gebunden)

Der Pricing-/Membership-/Registry-Umfang fuehrt einen zentralen Trust-Contract:

- VoiceOpenGov ist bewusst **keine Partei**, sondern eine **unabhaengige Initiative** fuer strukturierte gesellschaftliche Beteiligung und Mehrheitsprinzip.
- Hohe Legitimation bleibt Pflicht, aber nicht als Rueckfall in papierhafte Altlogik.
- Ziel ist starke digitale Verifikation mit moeglichst wenig unnoetiger Reibung.

Kanonische Trust-Texte laufen in drei Tiefen und bilingual aus einer Quelle:

- Leitsatz
- Kurzform
- Mittelform
- Langform (FAQ/Trust-Bloecke)

Kanonische source of truth:

- `features/pricing/domain/trustLoop.de.ts`

Kanonische Einbindung (produktnah):

- `/pricing`
- `/order`
- `/pricing/institutionen`
- registry-/payment-nahe Hinweise
- order-/followup-Hinweise

Guardrail:

- Riskante/rechtlich unsaubere Formulierungen sind explizit ausgeschlossen (forbidden-phrase-contract).

## 3. Formel

**Total = Grundaktivierung + laufender Betrieb + aktive Anlassraeume + optionale aktive Beteiligung + Reports + Moderation/Governance + Add-ons - Discounts**

## 4. Segmentbasierte Grundaktivierung und Betrieb

Organisationen / Verbaende / Vereine:
- Grundaktivierung: `ab 1.500 EUR / Monat`
- Laufender Betrieb (Betrieb Plus): `ab 2.900 EUR / Monat`
- Reports / Auswertung: `ab 390 EUR / Monat`
- Moderation / Governance: `ab 450 EUR / Monat`

Kommunen / Verwaltungen / Landkreise:
- Grundaktivierung: `ab 2.500 EUR / Monat`
- Laufender Betrieb (Betrieb Plus): `ab 4.500 EUR / Monat`
- Reports / Auswertung: `ab 590 EUR / Monat`
- Moderation / Governance: `ab 790 EUR / Monat`

## 5. Anlassraum-Komponente

Anlassraeume werden nach Komplexitaet eingestuft.

Beispielhafte Range:
- Small: 300 EUR
- Medium: 600–1.000 EUR
- Large: 1.000–1.500 EUR

Komplexitaetsfaktoren:
- Quellenanzahl
- Konfliktintensitaet
- Event-/QR-Logik
- Stakeholder-Dichte
- Dossier-/Entscheidungsnaehe
- Teilnehmerzahl

## 6. Teilnehmer-Komponente

Nicht:
- pauschal pro Einwohner
- nicht fuer inaktive Accounts

Sondern optional:
- pro aktivem Teilnehmenden innerhalb eines Anlassraums / Zeitraums
- Startwert fuer institutionelle Orientierung: `ab 0,75 EUR` je aktivem Teilnehmenden und Zeitraum

Kommunikationssatz:
- **„Sie zahlen nur fuer aktive Beteiligung, nicht fuer inaktive Registrierungen.“**

## 7. Reports, Moderation/Governance, Add-ons

Als klar getrennte Bausteine:
- Reports / Outcomes
- Moderation / Assistenz
- Managed Governance
- Companion-/Kommunikationsformate
- Event-Begleitung
- optionales Faktencheck-Kontingent

Add-ons werden auf Konditionsflaechen gefuehrt als:
- empfohlene Erweiterungen (2-3 relevante Add-ons je Konfiguration)
- weitere Optionen nachgeordnet (kein Vollkatalog im Erstblick)
- je Add-on mit Einsatzkontext (wann sinnvoll / wann eher nicht noetig)
- Reifestand + Bestellbarkeit sichtbar und im Konfigurator nutzbar
- Rueckfragen erst bei Auswahl des Add-ons (nicht upfront)

Standardisierte Reifestandslogik (SSOT):
- `direct_orderable` -> Badge: **Direkt bestellbar**
- `orderable_review_required` -> Badge: **Bestellbar, intern geprueft**
- `followup_required` -> Badge: **Bestellbar, mit Folgeabstimmung**
- `in_rollout` -> intern reserviert (nicht fuer den aktuellen oeffentlichen Kernbestand aktiv)

CTA-Leitsprache auf `/pricing/institutionen` (Guided-Flow):
- DE: `Direkt zur Auswahl`, `Empfehlung übernehmen`, `Direkt bestellen`, `Kostenvoranschlag anfordern`, `Gespräch anfragen`, `Kontakt`
- EN: `Jump to guided selection`, `Apply recommendation`, `Direct order`, `Request quote`, `Request conversation`, `Contact`

Orientierungswerte fuer Add-ons:
- Event-Begleitung: `ab 690 EUR je Einsatz`
- Moderation / Assistenz: `ab 450 EUR / Monat`
- Reports / Outcomes: `ab 390 EUR / Monat`
- Managed Governance: `ab 1.200 EUR / Monat`
- Companion-/Kommunikationsformate: `ab 290 EUR / Monat`
- Optionales Faktencheck-Kontingent: `ab 290 EUR / Monat`

## 8. Persona-Pakete

### 8.1 Buergermeister / Kommune
- Radar
- Anlassraeume
- Event-/QR-Beteiligung
- Dossier / Entscheidungslogik
- Verwaltungs-/Executive Surface

### 8.2 Verwaltung / Fachamt
- Anlassraeume
- Dezernatslogik
- Prozessstatus
- Monitoring

### 8.3 Medien / Redaktion
- Anlassraum zu Beitraegen
- Factcheck Assist
- Community-/QR-Companion
- Dossiers

### 8.4 Organisation / Verband
- Themenraeume
- Stellungnahmen
- Dossiers
- Mitglieder- / Stakeholder-Beteiligung

### 8.5 Partei
- Programmarbeit
- Themenraeume
- Event-/Dialogformate
- Dossiers

## 9. Pilotmodell

Empfohlen:
- 3–6 Monate
- 1–2 Anlassraeume
- Radar
- Event-/QR-Test
- reduzierte oder rabattierte Basis
- klarer Success Case

## 10. Rabattmodell

Rabatt:
- bis zu 30 %
- nicht pauschal auf alles
- komponentenbezogen
- mit Scope
- oft fuer Pilot oder Jahreszahlung
- ab >20 % Freigabe + Audit

Rabatt-Scope:
- `base`
- `anlassraum`
- `participant`
- `addon`
- `total` (selten / mit besonderer Freigabe)

## 11. Caps

Fuer groeßere Kunden:
- Monats-Cap
- Anlassraum-Cap
- Teilnehmer-Cap
- Paket-Cap

Ziel:
- Planbarkeit
- keine Kostenexplosion

## 12. Die drei verkaufsstarken Features

1. Themenradar + Anlassraum-Vorschlaege
2. Anlassraum + Event-/QR-Integration
3. Dossier + Entscheidungslogik

## 13. Beispielrechner

### Kleine Kommune
- Base: 2.500 EUR
- 2 mittlere Anlassraeume: 1.600 EUR
- 500 aktive Teilnehmende a 0,75 EUR: 375 EUR
= 4.475 EUR vor Rabatt

### Mittlere Kommune
- Base: 2.500 EUR
- 4 Anlassraeume gemischt: 3.200 EUR
- 1.500 aktive Teilnehmende a 0,75 EUR: 1.125 EUR
= 6.825 EUR vor Rabatt

### Verband / Organisation
- Base je nach Setup: 1.500–3.000 EUR
- Anlassraeume / Dossiers / Events nach Nutzung
- keine Einwohnerlogik

### Redaktion
- Preis nach Anlassraeumen / Dossiers / Factcheck / Embed-Nutzung
- keine Einwohnerlogik

## 14. Admin Pricing Control

Der Admin braucht:
- Preisprofil je Entity
- manuelle Preise
- Rabattregeln
- Approval
- Audit
- Laufzeit
- Add-ons
- Hinweis, welche Komponente rabattiert wurde

## 15. Messaging fuer Vertrieb

Nicht:
- „Sie zahlen pro Nutzer.“

Sondern:
- **„Die Grundinfrastruktur ist fix. Zusätzlicher Aufwand entsteht nur, wenn echte Themen, Anlassraeume und Beteiligung entstehen.“**

Noch besser:
- **„Sie zahlen nicht fuer Software. Sie zahlen fuer funktionierende Entscheidungsprozesse.“**
