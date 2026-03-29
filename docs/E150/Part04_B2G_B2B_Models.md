# E150 Master Spec – Part 4: B2G, B2B, B2O & institutionelle Modelle

> Status-Hinweis (2026-03-19): Dieses Part beschreibt das Zielmodell fuer Kommunen, Parteien, Organisationen, Verbaende, Medien und weitere institutionelle Akteure. Der operative Aufgabenstand liegt in `docs/E150/OpenTasks.md`.

## 1. Zweck dieses Parts

Dieser Part definiert die institutionellen Betriebs- und Produktmodelle fuer:

- Kommunen / Verwaltungen
- Parteien
- Organisationen / Verbaende / NGOs
- Medien / Redaktionen
- Unternehmen / interne Beteiligung

Ziel ist **nicht** eine Sammlung getrennter Feature-Silos, sondern ein gemeinsames Modell auf Basis von:
- `Entity`
- `Anlassraum`
- `Dossier`
- `Runde`
- `Mandat`
- `Impact`

## 2. Gemeinsames Entity-Modell

### 2.1 Entity Types

Mindestens:
- `municipality`
- `district`
- `government`
- `party`
- `organization`
- `association`
- `ngo`
- `company`
- `media`
- `initiative`
- `other`

### 2.2 Pflichtfelder

- `id`
- `type`
- `slug`
- `name`
- `regionKey`
- `scope`
- `status`
- `ownerType`
- `ownerId`
- `stewardUserId`
- `createdAt`
- `updatedAt`

### 2.3 Entity Status

- `draft`
- `curated`
- `reviewed`
- `approved`
- `published`
- `archived`

## 3. Kommunen / Verwaltungen (B2G)

### 3.1 Zielbild

Kommunen kaufen keine „Abstimmungsmaschine“, sondern:
- Themenradar
- Anlassraeume
- Verwaltungsmodus
- Event-/QR-Einbindung
- Dossiers
- nachvollziehbare Entscheidungsprozesse
- Reporting / Monitoring

### 3.2 Die drei staerksten kommunalen Features

1. **Themenradar + Anlassraum-Vorschlaege**  
   Sicht auf relevante Themen, Signale, Konflikte und moegliche Anlassraeume.

2. **Anlassraum + Event-Integration**  
   Buergerabend / Sitzung / Workshop / QR / Nachbereitung in einem Fluss.

3. **Dossier + Entscheidungslogik**  
   Optionen, Konsequenzen, Gegenpositionen, Nachvollziehbarkeit.

### 3.3 Verwaltungslogik

Verwaltungen brauchen:
- einfache operative Oberflaechen
- Statusverfolgung
- Dezernatslogik
- Buergermeister-/Executive-Sicht
- keine Vollredaktion als Voraussetzung

### 3.4 Raumstatus fuer kommunale Prozesse

Beispiele:
- `community_driven`
- `administrative_review`
- `official_consultation`
- `approved`
- `in_implementation`
- `rejected`
- `monitoring`

## 4. Parteien

Parteien koennen Anlassraeume initiieren fuer:
- Programmarbeit
- lokale Konflikte
- Mitgliederdialog
- Positionierungsfragen

Regeln:
- Anlassraeume koennen offiziell von Parteien getragen werden,
- aber Gegenpositionen / Quellenpflicht / Review duerfen nicht abgeschaltet werden.

## 5. Organisationen / Verbaende / NGOs

Organisationen sollen sich primaer ueber:
- Dossiers
- Anlassraeume
- Stellungnahmen
- evidenzbasierte Themenraeume

identifizieren, nicht ueber freie Social-Posts.

Wichtige Modi:
- `official`
- `public`
- `member_only`
- `internal`
- `hybrid`

## 6. Medien / Journalismus

Journalismus nutzt das gleiche Kernmodell:
- Artikel / Sendung / Podcast / Beitrag = `source_anchor`
- daraus kann ein Anlassraum entstehen
- daraus wiederum ein offenes Dossier

Wichtig:
- journalistische Ausloeser = Anlassgeber
- nicht gleich Wahrheitsurteil
- Truth Guardrails bleiben sichtbar

## 7. Unternehmen / interne Beteiligung

Auch Unternehmen koennen das Modell intern nutzen:
- Anlassraeume fuer Kultur / Prozesse / Konflikte
- Dossiers fuer Optionen / Konsequenzen
- Runden fuer Beteiligung

Wichtig:
- klar getrennt von oeffentlichen politischen Raeumen
- intern / hybrid / privat moeglich

## 8. Pricing-Logik fuer institutionelle Akteure

Die alte pauschale Einwohnerlogik wird nicht mehr als Hauptpfad fortgeschrieben.

### 8.1 Neues Grundmodell

Preis setzt sich zusammen aus:

- **Basispreis** (Infrastruktur)
- **Anlassraum-Komponente** (aktive / komplexe Themenraeume)
- **optionale Teilnehmer-Komponente** (aktive, tatsaechliche Beteiligung)
- **Add-ons** (Event, Assistenz, Reports, Managed Governance)
- optional **Outcome-/Report-Komponenten**

### 8.2 Kommunen

Beispielhafte Logik:
- Basis: ab 2.500 EUR / Monat
- Anlassraeume: z. B. 300–1.500 EUR je nach Komplexitaet
- aktive Teilnehmende: nur optional und nur fuer aktive Beteiligung
- kein Preis fuer inaktive, bloß registrierte Accounts

### 8.3 Organisationen / Verbaende

Preis orientiert sich eher an:
- Nutzung
- Anlassraeumen
- Rollen / Teams
- Event- und Dossierintensitaet

nicht an Einwohnern.

### 8.4 Medien

Preis orientiert sich eher an:
- Anlassraeumen / Dossiers
- Anzahl Redaktionsraume
- Factcheck / Review / Embed Nutzung

### 8.5 Parteien

Preis orientiert sich eher an:
- Team / Rollen
- Anzahl Anlassraeume / Dossiers
- Event-/Dialogformaten

## 9. Rabatt-Logik

Rabatte:
- bis zu 30 %
- nicht pauschal auf alles
- besonders fuer Piloten oder Jahreszahlungen
- component-scoped
- zeitlich begrenzt
- ab hoher Rabattstufe mit Approval + Audit

## 10. Pilot- und Aktivierungslogik

### 10.1 Pilot
Ziel:
- ein echter Anlassraum
- eine echte Beteiligung
- ein echter Review-/Publish-/Impact-Fluss

### 10.2 Activation Funnel
- Radar sichtbar
- erster offizieller Anlassraum
- Event / QR / Fragen
- Dossier
- weitere Themen

## 11. Admin Pricing Control

Admin Pricing Control folgt dem manifestierten Pricing-Kanon (`GOV-PRICING-01`) und bleibt
ausdruecklich governance-gebunden (`GOV-PRICING-02`):

- Segment-/Tarif-/Verifizierungsstatus steuerbar
- Creator-Typ (Civic/Media/Publisher-Team-Organization) sichtbar
- Kommune/Institution/oeffentlicher Traeger Status sichtbar
- Funding-Fee-Regel und Caps/Obergrenzen steuerbar
- Specials/Add-ons/Pilotstatus transparent steuerbar
- Overrides nur mit Begruendung + Auditspur
- Explainability-Pflicht: warum Tarif/Fee/Segment/Sonderstatus greift

Der operative Vorbereitungscontract ist dokumentiert in:
`docs/E150/GOV-PRICING-02_ADMIN_PRICING_CONTROL_CONTRACT_2026-03-29.md`.
Policy-/Override-/Explainability-Contract (`02A`), Audit-/KPI-Contract (`02B`) und
Readmodel-Integration (`02C`) sind umgesetzt; weiterhin ohne Checkout-/Payment-Ausbau.

## 12. Erfolgsdefinition

Ein institutionelles Modell ist erfolgreich, wenn:
- es ohne Vollredaktion genutzt werden kann,
- Anlassraeume sauber reviewt und publiziert werden,
- Entscheidungen nachvollziehbarer werden,
- Beteiligung und Wirkung gemeinsam sichtbar werden.

## 13. Zugeordnete Vertikal-Dokumente (harmonisiert 2026-03-26)

Die folgenden `/docs`-Dateien sind inhaltlich diesem Part zugeordnet:

- `docs/municipality-operating-model.md` (kommunaler Betriebsfluss)
- `docs/mayor-dashboard.md` (Executive-Surface fuer Kommunen)
- `docs/journalism-open-dossier-model.md` (Journalismus als Anlassgeber, nicht Wahrheitsautomat)
- `docs/organization-and-association-publishing.md` (Organisations-/Verbandsmodus)
- `docs/civic-initiative-lifecycle.md` (Civic-Lifecycle inkl. Funding-Modi)

Review-/Operator-Logik bleibt part-uebergreifend:
- Governance/Review-Pflicht: `docs/E150/Part01_Systemvision_Mission_Governance.md`
- Operativer Backlog: `docs/E150/OpenTasks.md`
