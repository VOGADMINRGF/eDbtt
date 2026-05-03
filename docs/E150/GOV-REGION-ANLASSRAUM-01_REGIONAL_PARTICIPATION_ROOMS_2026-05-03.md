# Evidence: GOV-REGION-ANLASSRAUM-01 Regional Participation Rooms (2026-05-03)

## Ziel des Slices

Neuer E150-SSOT-Slice fuer regionale Anlassraeume und kommunale Beteiligungsraeume.

eDebatte soll strukturell abbilden koennen, dass jeder Bezirk, jede Kommune und jeder regionale Verwaltungsraum
als eigene dauerhafte Betriebsebene einen Anlassraum fuehren kann.

Der Slice ist bewusst docs-/contract-first.

## Scope

Bearbeitet:
- `docs/E150/OpenTasks.md`
- `docs/E150/GOV-REGION-ANLASSRAUM-01_REGIONAL_PARTICIPATION_ROOMS_2026-05-03.md`

Nicht im Scope:
- keine Runtime-Implementierung
- keine neuen Routen
- keine neue automatische Ingestion
- keine Scraping-Engine
- keine automatische Mandatserzeugung
- kein Auto-Publish

## Neu angelegte Task-Familie (OpenTasks)

1. `GOV-REGION-01` (`codex_ready`)
- Domain Contract Region/Bezirk/Kommune
- Region als eigene Scope-Ebene mit `id`, `slug`, `name`, `type`, `parentRegion`, `officialBody`, `publicVisibility`
- keine Tenant-Isolation als Zwang, stattdessen region-scoped Produktlogik

2. `GOV-REGIONAL-ANLASSRAUM-01` (`codex_ready`)
- Jede Region kann einen dauerhaften Anlassraum besitzen
- Anlassraum buendelt Signale, Themen, Akteure, Dossiers, Runden, Mandate, Aktivitaeten
- keine harte `/anlassraum`-Migration
- bestehende `/runden`-/`dossier`-/`create`-Logik bleibt anschlussfaehig

3. `GOV-ACTOR-REGISTER-01` (`codex_ready`)
- Regionales Akteursregister fuer Vereine, Initiativen, lose Gruppen, Bewegungen und weitere lokale Akteure
- Pflichtarten: `verein`, `initiative`, `lose_gruppe`, `bewegung`, `sozialtraeger`, `schule`, `gewerbe`, `verwaltung`, `sonstige`
- keine automatische politische Zuordnung
- keine automatische VoiceOpenGov-Mitgliedschaft
- Verifizierung bleibt statusbasiert

4. `GOV-COMMUNITY-SIGNAL-01` (`codex_ready`)
- Niedrigschwellige Signal-Inbox fuer Hinweise, Quellen, Ortswissen, Themenvorschlaege
- Einstieg ohne komplexes Profil moeglich
- Moderation/Review ist Pflicht
- kein Auto-Publish, kein Auto-Mandat, kein automatisches Dossier ohne Review

5. `GOV-ADMIN-REGION-01` (`codex_ready`)
- Verwaltungscockpit fuer regionales Lagebild
- Konzeptfelder: `Themenlage`, `Akteurskarte`, `Beteiligungsstatus`, `offene Fragen`, `Teilhabegaps`, `naechste Rueckmeldungen`, `Mandatsstatus`
- keine Ueberwachungs-/Scoringlogik gegen Buerger:innen oder Vereine

6. `GOV-GUIDELINES-BERLIN-01` (`codex_ready`)
- Leitlinien-Matrix Berlin / Buergerbeteiligung als Transparenz- und Arbeitsmatrix
- keine Rechtsberatung
- Matrixdimensionen: `Fruehzeitigkeit`, `Transparenz`, `Rueckmeldung`, `Zielgruppenansprache`, `Barrierefreiheit`, `Dokumentation`, `Nachvollziehbarkeit`
- anwendbar fuer Reinickendorf und spaeter weitere Bezirke

7. `GOV-B2G-REGIONAL-ROOM-01` (`codex_ready`)
- B2G-/Ausschreibungs-Paket fuer Bezirke/Kommunen/Vergaben
- Leistungsbeschreibung enthaelt:
  - Einrichtung regionaler Anlassraum
  - Akteursaktivierung
  - Signal-Inbox
  - Dossierarbeit
  - Beteiligungsrunden
  - Reporting
  - Leitlinien-Matrix
  - Schulung/SOP
  - Vor-Ort-Aktivierung
- keine formale Rechtsberatung
- keine Behauptung automatischer Erfuellung gesetzlicher Beteiligungspflichten

## Dokumentierte Entscheidungen (verbindlich)

- eDebatte bleibt Arbeitsflaeche.
- VoiceOpenGov bleibt Initiative/Register/Vertrauenslayer.
- Regionaler Anlassraum ist dauerhafte Betriebsebene zwischen Verwaltung, Bevoelkerung, Vereinen und Dossiers.
- Beteiligungsradar bleibt vorerst Konzept-/Doku-/Architekturscope; keine automatische Ingestion.
- Kleinstvereine und lose Bewegungen werden ausdruecklich als legitime Akteure aufgenommen.
- Kein Parteienbuch-Wording.
- Kein automatisches Mandat.
- Kein automatisches Scraping.
- Kein Auto-Publish.

## Ergebnis

OpenTasks ist um eine eigenstaendige, zusammenhaengende Regional-Familie erweitert.
Alle sieben neuen Eintraege sind als `codex_ready` gesetzt und fuer docs-/contract-first Folgearbeit priorisierbar,
ohne Runtime-/Routing-/Ingestion-Entscheidungen vorwegzunehmen.
