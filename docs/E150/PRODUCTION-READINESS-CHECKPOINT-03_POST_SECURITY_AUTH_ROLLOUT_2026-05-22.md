# PRODUCTION-READINESS-CHECKPOINT-03

Stand: 2026-05-22
Issue: #200
Status: done

## Fokus

Erneuter SSOT-Abgleich nach `AUTH-PROVIDER-RUNTIME-INTEGRATION-01`, `GOV-SEC-02`,
`GOV-SEC-03` und `PR-CREATE-WORKFLOW-LIVE-QA-01`.

Leitlinie:

- Reinickendorf ist nur Beispiel-Seed oder moeglicher erster Pilot.
- Produktziel ist der generische Organisations-/Regionen-Rollout fuer Verwaltung, Bezirke,
  Kommunen, Vereine, Verbaende, Traeger und Medienpartner.

## Lesart des aktuellen Stands

### pilot_ready

- `/create` als kanonischer Intake
- Analyze-/Planner-/Link-Intake-Bausteine
- Save/Finalize-Basis
- Dossier-Datenmodell
- Factcheck-Enqueue
- Mandat als read-only Statusraum
- Pricing/Order/Vormerken als Angebots- und Pilotpfad
- Community Contributions
- Meta-/Provenance-/Audit-Grundlagen
- Akteursregister und Community-Signal-Inbox als interne review-first Arbeitsgrundlage

### production_candidate

- Create-Handoff-Persistenz und reviewfaehige Weitergabe
- `/create`-Workflow inkl. sichtbarem Scope-Feedback und scoped Handoff-Fallback
- Anlassraum als oeffentlicher review-first Themenraum
- oeffentliche Dossier-Leseflaeche
- Regionales Verwaltungscockpit und Organisationsbereich
- Region-/Org-Isolation auf den zentralen Review-/Region-/Studio-Pfaden
- org-scoped Moderation und Content-Release-Vorbereitung fuer verifizierte Organisationen
- Review-/Freigabeprozess inkl. persistenter Review-Operationen, Content Release und Unified Audit
- Topic Page als leichter oeffentlicher Zielpfad
- Output Studio Workspace und serverseitige Studio-Persistenz
- Paid Dashboard Entitlement als manuelle Pilot-/Admin-Grant-Grundlage
- Route-/Auth-/AI- und Content-Zonen-Haertung ueber `GOV-SEC-02`, `GOV-SEC-03` und `AUTH-PROVIDER-RUNTIME-INTEGRATION-01`
- generischer Organisations-/Regionen-Pilotpfad mit Reinickendorf nur als Beispiel-Seed

### foundation

- Create Entitlements als echtes regionales Self-Service-Produkt
- Material-Intake als fertiger Produktionspfad
- echte externe Membership-/Directory-/Register-Anbindung
- VoiceOpenGov Membership-/Register-Sync
- Journalismus-/Medienpakete als fertiges Produkt
- Funding-/Partnerpfade
- Beteiligungsradar
- spaetere Geo-/Register-/Import-Layer ausserhalb des aktuellen MVP

## Echte Blocker vor breitem Self-Service-Rollout

- breitere externe Membership-/Directory-/Register-Anbindung
  - Der Runtime-Store ist fuer kontrollierte Piloten ausreichend, aber kein ehrlicher
    breit skalierter Self-Service-Ersatz fuer externe Directory-/Provider-Aufloesung.
- Self-Provisionierung
  - Organisationen koennen noch nicht durchgaengig ohne Betreiberkante ihren Arbeitsraum,
    ihre Freischaltung und ihren Regionszugang selbst staendig anlegen und fortfuehren.
- Billing-/Checkout-Automatisierung
  - Kommerzielle Freischaltung, Provisionierung und wiederholbare Abrechnung sind nicht als
    geschlossener Self-Service-Pfad vorhanden.
- breitere produktive Quellenabdeckung
  - Die review-first Source-Connection-Workbench ist produktionsnah, aber kein allgemeiner
    Live-Crawler und keine automatische Vollabdeckung externer Quellenlandschaften.

## Fuer kontrollierten Pilot akzeptabel offen

- breitere externe Directory-/Membership-Anbindung, solange der lokale Runtime-Store mit
  sichtbarem Source-of-Truth-/Confidence-Marker den Pilot kontrolliert traegt
- Self-Provisionierung, solange Betreiber gefuehrte Einrichtung und Freischaltung uebernehmen
- Payment/Billing-/Checkout-Automatisierung
- breitere produktive Quellenabdeckung jenseits expliziter Einzel-URLs

## Vor production_ready zwingend

- breitere externe Provider-/Membership-/Directory-Anbindung ueber den lokalen Runtime-Store
  hinaus schaffen
- Self-Provisionierung und belastbare Rollout-Freischaltung fuer Organisation/Wirkraum schliessen
- Billing-/Checkout- und Provisionierungsgrenzen fuer die betroffenen kommerziellen Pfade
  schliessen
- verbleibende Self-Service-Grenzen ausserhalb des kontrollierten Betreiber-Pilotmodus
  explizit abbauen oder aus dem Produktversprechen herausnehmen

## Bereits erledigte Pflichtbausteine

- `AUTH-PROVIDER-RUNTIME-INTEGRATION-01`
- `GOV-SEC-02`
- `GOV-SEC-03`
- `PR-CREATE-WORKFLOW-LIVE-QA-01`
- `PR-QUALITY-HARM-02`

Diese Bausteine entlasten den Rollout wesentlich, ersetzen aber die offenen Admin- und
Self-Service-Blocker nicht.

- `PR-ADMIN-DASHBOARD-FULL-AUDIT-REPAIR-01`
- `REGION-DASHBOARD-PRODUCTION-CUT`

Diese beiden Parent-/Haertungsslices sind inzwischen ebenfalls geschlossen und muessen vor
`production_ready` nur regressionssicher aktuell gehalten werden; sie sind keine offenen
Blocker mehr.

## Zusammenfassung

Der aktuelle Stand ist plausibel fuer einen kontrollierten, review-first Pilot mit
Betreiberkanten und generischer Organisations-/Regionen-Lesart. Gegenueber Checkpoint 02 sind
Auth-/Scope-, Route-/AI- und Content-Zonen-Haertung jetzt als erledigte Produktionsbausteine
einzustufen; auch `PR-ADMIN-DASHBOARD-FULL-AUDIT-REPAIR-01` und
`REGION-DASHBOARD-PRODUCTION-CUT` gelten inzwischen als geschlossen. Nicht ehrlich behauptbar
bleiben ein breiter Self-Service-Rollout und `production_ready`, solange externe Membership-/
Directory-/Register-Anbindung, Self-Provisionierung, Billing-/Checkout-Automatisierung und
breitere produktive Quellenabdeckung offen sind.
