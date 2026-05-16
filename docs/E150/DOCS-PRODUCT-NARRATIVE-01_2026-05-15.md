# DOCS-PRODUCT-NARRATIVE-01 (2026-05-15)

## Ziel

Die letzten Produktentscheidungen fuer Region, Anlassraum, KI-Startlage, `/create`, Visibility-/Risk-Ladder und Verwaltungs-/Organisationsdashboard als reinen Docs-/FAQ-Konsolidierungsschnitt manifestieren.

## Non-Goals

- keine Runtime-Aenderungen
- keine UI-Aenderungen
- keine neuen APIs
- kein `GeoReferenceLayer`
- kein Payment
- kein Publishing-Code

## Manifestierte Produktnarrative

### 1. KI-orchestrierte regionale Startlage

- Wenn sich Verwaltung, Verband, Verein oder Traeger fuer eine Region interessiert, soll eDebatte aus regionalen Quellen eine hochwertige, aktuelle und vorqualifizierte Themenlage vorbereiten.
- Diese Themenlage ist keine Demo-Fixture, sondern eine kuratierte regionale Startlage.
- Sie bleibt reviewpflichtig und wird nicht automatisch amtlich, verbindlich oder offiziell.

### 2. `/create` statement-first

- `/create` soll zuerst mit der Rueckfrage `Haben wir dich richtig verstanden?` klaeren, was gemeint ist.
- Primaere Folge ist Einreichen / Veroeffentlichen nach Risikologik.
- Tiefere Themenarbeit und Tool-Auswahl sind nachgeordnet.

### 3. Anlassraum als oeffentlicher Themenraum

- Anlassraum ist nicht nur ein Admin-Container.
- Anlassraum ist der oeffentliche Themenraum fuer:
  - Teilen mit Freund:innen und Nachbar:innen
  - QR-Code
  - Event / Veranstaltung
  - Weiterfuehrung aus Zeitung / TV / Artikeln
  - Buergerdialog

### 4. Automatische Veroeffentlichung / Risk Ladder

- Visibility-Logik ist als folgende Ladder manifestiert:
  - `private_draft`
  - `internal_review`
  - `public_unverified`
  - `public_reviewed`
  - `public_official`
  - `archived`
  - `blocked`
- Low-risk Beitraege duerfen spaeter automatisch sichtbar werden.
- Faktenstatus, Dossiers und amtliche Antworten bleiben reviewpflichtig.
- Doxxing, Drohungen und sensible Daten muessen geblockt werden.

### 5. Datenquellenstrategie

- `RegionRegistry`: zuerst Destatis GV-ISys / Gemeindeverzeichnis, spaeter Eurostat NUTS/LAU
- `OfficialDirectory`: Anschriften der Gemeinde- und Stadtverwaltungen
- `GeoBoundaryRegistry`: spaeter BKG VG250 / Eurostat GISCO
- `StatsRegistry`: spaeter GENESIS / Regionalstatistik
- XLSX, CSV und API sind Importquellen, keine Runtime-Abhaengigkeiten.

### 6. Verwaltungs-/Organisationsdashboard

- Verwaltung und Organisation brauchen ein eigenes Dashboard.
- Mindestumfang:
  - Status
  - Region
  - Freischaltung
  - Rollen
  - offene Reviews
  - Dossier-Drafts
  - Anlassraum-Drafts
  - KI-vorqualifizierte Themenlage

## Umgesetzte Dokumentationsorte

- `docs/E150/OpenTasks.md`
  - `DOCS-PRODUCT-NARRATIVE-01` als erledigten Docs-Slice eingetragen
  - neue Folge-Slices angelegt
- `docs/E150/ProductionReadinessMatrix.md`
  - Soll-/Ist-Trennung fuer regionale Startlage, `/create`, Anlassraum, Visibility-Ladder und Dashboard geschaerft
- `apps/web/src/app/faq/faqContent.ts`
  - FAQ-/Glossar-Logik um die neuen Produktnarrative erweitert
- `apps/web/tests/faq-product-narrative.contract.test.ts`
  - FAQ-Contract fuer die neuen Narrative abgesichert

## Neue Folge-Slices

- `REGION-DATA-IMPORT-01`
- `REGION-INTELLIGENCE-01`
- `CREATE-SIMPLE-CONFIRMATION-01`
- `ANLASSRAUM-PUBLIC-SHARING-01`
- `PUBLICATION-RISK-LADDER-01`
- `ORG-DASHBOARD-01`

## Offene Runtime-Folge

- Die Produktentscheidungen sind jetzt docs-seitig manifestiert, aber noch nicht durchgaengig runtime-seitig geschlossen.
- Besonders offen bleiben:
  - die sichtbare statement-first Confirmation-Stage in `/create`
  - die kuratierte regionale Startlage aus echten Importregistern
  - die vollstaendige Visibility-/Risk-Ladder in Runtime und Review-Pfaden
  - das eigenstaendige Verwaltungs-/Organisationsdashboard
