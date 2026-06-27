# Participation Benchmark Gap Capture (2026-06-27)

## Kurzkontext

Diese Notiz fasst eine neutrale Referenzanalyse zu einer externen kommunalen Beteiligungsplattform zusammen.
Ziel ist nicht, fremde Produktlogik zu übernehmen, sondern die für eDebatte relevante Lücke zwischen
Beitragserfassung, Review, Auswertung und sichtbarer Ergebnisrückmeldung als docs-only Folgeblock sauber
im kanonischen OpenTasks-Katalog zu verankern.

## Was eDebatte bereits hat

eDebatte ist bereits stark in den bestehenden review-first und draft-first Pfaden:

- `/start` als Create-Light-Einstieg
- `/create` als Voxy-/Planner-/Review-first Intake
- Draft-/Resume-Kosmos über Start, Create, Themen, Runden und Account
- Editorial Review Queue
- Truth-/Source-/Review-Guardrails
- Factcheck-/Entitlement-Gates
- Graph-Candidate-Staging statt Auto-Merge
- Live-/Kampagnen-/QR-/Media-Kit-Flächen

Diese Bausteine decken die Erfassung, Einordnung, Prüfung und geschützte Weiterarbeit bereits gut ab.

## Sichtbare Lücke im Vergleich

Die Referenzanalyse zeigt als fehlenden Produktblock vor allem die disziplinierte Wirkungskette von
eingehenden Beiträgen zu sichtbarer Ergebnisrückmeldung:

- nachvollziehbarer Status zwischen Einreichung, Prüfung, Bündelung und Rückmeldung
- sichtbarer Ergebnisentwurf für Themen-, Live- und Beteiligungskontexte
- klarer Container für projekt- oder kampagnenbezogene Beteiligung ohne neue Kernmigration
- operative Transparenz für Moderation, Redaktion oder Organisationen
- später optional ortsbezogene Beteiligungslogik, aber nur nach sauberem Place-/Street-Followup

## Warum dies weitgehend docs-only bleibt

Die neu angelegten Tasks öffnen bewusst keinen großen technischen oder produktiven Umsetzungspfad.
Sie dokumentieren einen sauber abgegrenzten Folgeblock, damit die identifizierte Lücke im SSOT
sichtbar ist, ohne bestehende Guardrails zu schwächen oder eine Verwaltungsplattform zu behaupten.

Stand 2026-06-27:

- `PARTICIPATION-IMPACT-STATUS-01` ist jetzt als kleiner contract-first Slice umgesetzt
- `PARTICIPATION-RESULT-FEEDBACK-02` ist jetzt als kleiner contract-first Slice umgesetzt
- `PARTICIPATION-ADMIN-COCKPIT-04` ist jetzt als kleiner contract-first Slice umgesetzt
- der Slice ergänzt nur einen typed Statusvertrag und Tests
- weiterhin unverändert bleiben Routen, Persistenz, Runtime-Automation und bestehende Publish-, Merge-, Vote- oder Dossierlogik

## Guardrails

- kein Auto-Publish
- kein Auto-Dossier
- kein Auto-Anlassraum
- kein Auto-Graph
- kein Auto-Vote
- keine Wettbewerberbegriffe
- keine Übernahme fremder Produktclaims

## Zugehörige OpenTasks

- `PARTICIPATION-IMPACT-STATUS-01`
- `PARTICIPATION-RESULT-FEEDBACK-02`
- `PARTICIPATION-SPACE-CONTAINER-03`
- `PARTICIPATION-ADMIN-COCKPIT-04`
- `PARTICIPATION-MAP-PLACE-FUTURE-05`

## Update 2026-06-27

`PARTICIPATION-IMPACT-STATUS-01` liefert jetzt den kleinsten belastbaren Kern für die sichtbare Wirkungskette:

- typed Statuswerte
- klare Transition-Regeln
- Guardrails gegen Auto-Publish, Auto-Dossier, Auto-Anlassraum, Auto-Graph und automatische amtliche Bewertung

`PARTICIPATION-RESULT-FEEDBACK-02` ergänzt darauf aufbauend den kleinsten belastbaren Kern für Ergebnis- und Rückmeldelogik:

- typed Feedback-Statuswerte
- typed Source-/Review-Statuswerte
- klare Publishability- und Public-Readiness-Regeln
- separate Modellierung von TopicSummary, MinorityPosition, OpenQuestion und NextStep
- Guardrails gegen Auto-Publish, Auto-Dossier, Auto-Anlassraum, Auto-Graph und amtliche Überdehnung

`PARTICIPATION-ADMIN-COCKPIT-04` ergänzt darauf aufbauend den kleinsten belastbaren Kern für eine operative Arbeitsliste:

- typed Queue Keys für Rückfrage-, Review-, Auswertungs-, Rückmeldungs- und Archivlisten
- typed manuelle Operator-Actions ohne Workflow-Runner oder automatische Folgeschritte
- typed Risk Flags für ungeprüfte Quellen, Minderheitenpositionen, offene Fragen, sensible Claims und manuellen Review-Bedarf
- Guardrails gegen Auto-Publish, Auto-Dossier, Auto-Anlassraum, Auto-Graph und automatische amtliche Bewertung

Die sichtbare Produktfläche für diese Wirkungsspur bleibt weiterhin ein separater Folgeblock.
