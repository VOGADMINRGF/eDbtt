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

- `PR-ADMIN-DASHBOARD-FULL-AUDIT-REPAIR-01`
  - Betreiberflaechen sind weiter `in_progress`; fuer breiteren Rollout fehlt der vollstaendige
    browsernahe Admin-Healthcheck ueber Feeds, weitere Admin-Hubs und Datenparitaet.
- `REGION-DASHBOARD-PRODUCTION-CUT`
  - Der Produktionsschnitt bleibt als Klammer `in_progress`, weil feinere AllowedActions-Paritaet,
    restliche Legacy-/Betreiberpfad-Isolation und der letzte generische Self-Service-Rest noch
    nicht vollstaendig geschlossen sind.

## Fuer kontrollierten Pilot akzeptabel offen

- `PR-ADMIN-DASHBOARD-FULL-AUDIT-REPAIR-01`, solange der Pilot nur wenige klar bekannte
  Betreiberflaechen nutzt und Betreiber-Modus sichtbar bleibt
- offener Rest in `REGION-DASHBOARD-PRODUCTION-CUT`, solange der Pilot auf verifizierte
  Organisationen, manuelle Freischaltungen und die bereits gehärteten Review-/Visibility-/Audit-
  Pfade begrenzt bleibt
- breitere externe Directory-/Membership-Anbindung, solange der lokale Runtime-Store mit
  sichtbarem Source-of-Truth-/Confidence-Marker den Pilot kontrolliert traegt
- Payment/Billing-/Checkout-Automatisierung
- breitere produktive Quellenabdeckung jenseits expliziter Einzel-URLs

## Vor production_ready zwingend

- `PR-ADMIN-DASHBOARD-FULL-AUDIT-REPAIR-01` abschliessen
- offenen Rest in `REGION-DASHBOARD-PRODUCTION-CUT` schliessen
- breitere externe Provider-/Membership-/Directory-Anbindung ueber den lokalen Runtime-Store
  hinaus schaffen
- verbleibende Self-Service-Grenzen in AllowedActions, Admin-/Legacy-Pfaden und Betreiber-
  Abhaengigkeiten schliessen

## Bereits erledigte Pflichtbausteine

- `AUTH-PROVIDER-RUNTIME-INTEGRATION-01`
- `GOV-SEC-02`
- `GOV-SEC-03`
- `PR-CREATE-WORKFLOW-LIVE-QA-01`
- `PR-QUALITY-HARM-02`

Diese Bausteine entlasten den Rollout wesentlich, ersetzen aber die offenen Admin- und
Self-Service-Blocker nicht.

## Zusammenfassung

Der aktuelle Stand ist plausibel fuer einen kontrollierten, review-first Pilot mit
Betreiberkanten und generischer Organisations-/Regionen-Lesart. Gegenueber Checkpoint 02 sind
Auth-/Scope-, Route-/AI- und Content-Zonen-Haertung jetzt als erledigte Produktionsbausteine
einzustufen. Nicht ehrlich behauptbar bleiben ein breiter Self-Service-Rollout und
`production_ready`, solange Admin-Gesamthaertung, restliche AllowedActions-/Legacy-Paritaet und
breitere externe Membership-/Directory-Anbindung offen sind.
