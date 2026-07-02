# V3 Live Claims Social Programm Endstate

## 1. Executive Summary

V3 muss Live, Claims, Dossier-Outputs und `/programm` als zusammenhaengende
Produktlinie verstehen.

eDebatte soll nicht nur Beteiligung sammeln, sondern Formate bereitstellen, die
nahe an moderne Live-, Debatten- und Media-Tools herankommen, ohne Review,
Wahrheit, Veroeffentlichung oder Kostenpfade zu automatisieren.

Repo-Anker fuer diesen Endstate sind bereits vorhanden, aber nicht end-to-end
geschlossen:

- Live-/Event-/QR-Pfade ueber `/stream`, `/stream/[slug]`, `/live/[campaignId]`,
  `/live/[campaignId]/host`, `/live/[campaignId]/report`, `/qr/[qrId]`
- Claim-/Review-/Factcheck-/Dossier-Handoffs ueber Create-, Review-,
  Factcheck- und Topic-Dedup-Pfade
- Dossier-/Social-/Share-Outputs ueber Studio, Social Queue, Share-ready Assets
  und Dossier-Update-Hinweise
- VoiceOpenGov nur mit vorhandenen Mandat-/Register-/Membership-Grundlagen,
  aber ohne fertige `/programm`-Runtime

Nicht Ziel dieses Slices:

- kein Auto-Publish
- keine automatische Wahrheit
- kein Auto-Factcheck
- kein Auto-Programm
- keine Meeting-API- oder Bot-Pflicht

## 2. Live-Format Endstate

Das V3-Endziel fuer Live-Formate ist eine gemeinsame Linie aus Live Session,
Anlassraum, Stream und Beteiligungsraum.

Der Endstate umfasst:

- Live Session oder Anlass mit klarer Statuslesart
- QR und Shortlink fuer denselben Beteiligungseinstieg
- Host-Cockpit fuer Moderation, Review-Hinweise, offene Punkte und
  Nachbereitung
- review-first Moderation statt Live-Bypass
- oeffentliche und interne Eingabetypen auf derselben Produktfamilie

Pflichtformate:

- offene Frage
- Claim
- Multiple Choice
- Ranking
- Skala
- Punkt- oder Budgetverteilung
- Quellenhinweis
- Gegenquelle
- Unsicher / brauche mehr Informationen

Live-Ergebnisse duerfen sichtbar werden als:

- Zwischenstand
- Haeufungen
- offene Fragen
- Minderheitenpositionen
- Quellenlage
- Review- und Freigabestatus

Live-Ergebnisse duerfen nicht:

- automatisch verifizieren
- automatisch veroeffentlichen
- automatisch Programmbausteine beschliessen

Nachbereitung muss anschliessen an:

- Dossier
- Anlassraum
- Beteiligungsraum
- Social-Draft
- Newsletter-Draft
- Programm-Kandidat

## 3. Claim Pipeline Endstate

Der V3-Endstate ist keine reine Texteingabe, sondern eine review-first
Claim-Pipeline:

`Claim -> Analyse -> Quelle/Gegenquelle/Kontext -> Dedupe/Cluster -> Review ->
Dossier-Anschluss -> Factcheck-/Research-Bedarf -> Programm-Kandidat`

Ein Claim-Endstate umfasst:

- Claim erkennen
- Claim zerlegen
- Quellenlage erfassen
- Gegenpositionen erfassen
- Unsicherheit markieren
- aehnliche Claims clustern
- Dossier-Anschluss finden
- Factcheck- oder Research-Bedarf markieren
- Review-Queue erzeugen
- Dossier-Fortschreibung vorbereiten
- Programm-Relevanz pruefen

Guardrails:

- Claim ist kein Fakt.
- Analyse ist keine Verifikation.
- Dossier ist review-first Wissensstand.
- Factcheck-/Research-Bedarf ist nur ein Hinweis.
- Programm-Baustein ist nie automatisch beschlossen.

## 4. Social / Dossier Output Endstate

V3-Social- und Output-Pfade sollen nicht nur einzelne Inputs posten, sondern
Dossier-Entwicklungen als review-first Outputs vorbereiten.

Relevante Draft-Typen:

- neues Dossier
- Dossier-Update
- Zwischenstand
- neue Gegenposition
- Beteiligung laeuft
- Programm-Kandidat
- Review abgeschlossen
- Frage bleibt offen

Jeder Output bleibt:

- Draft
- Queue Item
- Admin- oder Redaktionsfreigabe
- review-first

Erlaubt ist:

- Auto-prepare
- Vorbefuellen
- Clustern
- Formatvorschlaege

Nicht Standard und nicht Teil dieses Slices:

- Auto-publish
- externer Social-Connector-Zwang
- automatische Newsletter-Ausspielung

Auto-publish darf hoechstens spaeter als explizites, stark begrenztes
Policy-Thema diskutiert werden, nie als V3-Default.

## 5. VoiceOpenGov.org/programm Endstate

Das V3-Maximalziel fuer `/programm` ist ein stetig wachsender,
versionierter und nachvollziehbarer Programmraum aus geprueften Themen,
Dossiers und Beteiligungssignalen.

Der Endstate umfasst:

- Wachstum aus geprueften Themen
- Wachstum aus Dossiers
- Wachstum aus Beteiligungssignalen
- Mindestbeteiligungsquote als optionales Gate
- Review und Freigabe vor Aufnahme
- Versionierung
- Historisierung
- Nachvollziehbarkeit

Pflicht-Gates:

- Mindestbeteiligungsquote
- Quellenlage transparent
- Dossier-Reife ausreichend
- Gegenpositionen beruecksichtigt
- Guardrails gruen
- Review abgeschlossen
- Admin oder Redaktion gibt frei
- Historie und Version sichtbar

Nicht erlaubt:

- einzelner Claim wird automatisch Programm
- ungepruefter Live-Impuls wird automatisch Programm
- Factcheck oder Research ersetzt Freigabe

## 6. Optional Meeting Integration

Das Low-effort-Ziel ist nicht eine neue Meeting-Plattform, sondern die
anschlussfaehige Verknuepfung externer Meeting-Links mit vorhandenen
Live-/Anlassraum-/Beteiligungspfaden.

Low-effort Ziel:

- externe Meeting-Links erfassen
- Zoom
- MS Teams
- Google Meet
- Google Hangouts historisch nur als Meet-kompatibler Begriff
- QR oder Shortlink fuer Beteiligung parallel nutzbar machen
- Nachbereitung aus Live- oder Meeting-Kontext vorbereiten

Nicht-Ziele:

- keine harte API-Integration
- kein Pflicht-Bot
- kein automatisches Recording
- kein automatisches Transkript
- keine automatische Veroeffentlichung
- keine neue Connector-Abhaengigkeit in diesem Slice

Optionaler Folgepfad:

- `V3-MEETING-LINK-INTEGRATION-LIGHT-01`

## 7. Admin Control Center Anforderungen aus diesem Endstate

Das spaetere Admin Control Center muss aus diesem Endstate mindestens ableiten
koennen:

- Live Sessions
- laufende Beteiligung
- Claim Queue
- Moderationsstatus
- Dossier Updates
- Social Drafts
- Programm-Kandidaten
- Mindestbeteiligungsquote
- Freigabestatus
- Auto-Prepare Settings
- Meeting-Link Status
- QR- und Share-Status
- Credits und Cost Gates
- Review / Publish / Rollback

Das ist eine Anforderung an den spaeteren Control-Center-Slice, nicht dessen
schon vorhandene Realitaet.

## 8. Neue / konkretisierte Folgepfade

Neu oder geschaerft offen:

- `V3-LIVE-FORMAT-HOST-COCKPIT-01`
- `V3-LIVE-PARTICIPATION-FORMATS-01`
- `V3-CLAIM-TO-DOSSIER-PIPELINE-01`
- `V3-DOSSIER-SOCIAL-OUTPUT-DRAFTS-01`
- `V3-PROGRAMM-GROWTH-APPROVAL-PIPELINE-01`
- `V3-MEETING-LINK-INTEGRATION-LIGHT-01`

Bestehende Pfade bleiben bestehen:

- `V3-ADMIN-DASHBOARD-CONTROL-CENTER-01`
- `V3-HANDOFF-INTEGRITY-AND-LINKAGE-MAP-01`
- `V3-AUTOMATION-SUGGESTION-ENGINE-01`
- `V3-PRICING-CREDITS-LIMITS-01`
- `V3-ROLES-PERMISSIONS-ENTITLEMENTS-01`
- `V3-QR-SHARING-PUBLIC-ENTRY-01`
- `V3-TEMPLATE-OUTPUT-STANDARDIZATION-01`
- `V3-IMAGE-GENERATION-VOXY-ASSETS-DOSSIER-OUTPUTS-01`

Der Live-/Claims-/Social-/Programm-Endstate muss vor oder parallel zu
`V3-ADMIN-DASHBOARD-CONTROL-CENTER-01` beruecksichtigt werden, damit das
Control Center nicht zu klein fuer den spaeteren V3-Scope gebaut wird.

## 9. Non-Goals / Guardrails

- Kein Auto-Publish
- Kein Auto-Programm
- Kein Auto-Factcheck
- Kein Auto-Verification
- Kein Auto-Graph-Write
- Kein Auto-Merge
- Keine hidden DeepSearch
- Keine hidden Cost Paths
- Keine Meeting-API-Pflicht
- Keine Bot-/Recording-/Transkriptionspflicht

## 10. Akzeptanzkriterien

Der Slice ist erfolgreich, wenn:

- das Maximalziel fuer Live / Claims / Social / Programm dokumentiert ist
- Meeting-Link-Integration optional und low-effort eingeordnet ist
- Admin-Control-Center-Anforderungen daraus abgeleitet sind
- Folgepfade in `OpenTasks.md` ergaenzt sind
- `ProductionReadinessMatrix.md` den V3-Endstate ergaenzt, ohne die Reality als
  gebaut zu verkaufen
- keine Produktlogik geaendert wurde
