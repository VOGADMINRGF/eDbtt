# PRODUCTION-READINESS-CHECKPOINT-02

Stand: 2026-05-21
Issue: #193
Status: done

## Fokus

Pruefung des aktuellen SSOT-Stands nach `ORG-REGION-ROLLOUT-CLOSURE-01`.

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

### production_candidate

- Create-Handoff-Persistenz und Review-Weitergabe
- Anlassraum als oeffentlicher review-first Themenraum
- oeffentliche Dossier-Leseflaeche
- Regionales Verwaltungscockpit und Organisationsbereich
- Region-/Org-Isolation auf den zentralen Review-/Region-/Studio-Pfaden
- Behoerden-/Org-Draft-Erstellung aus reviewten Signalen
- Review-/Freigabeprozess inkl. persistenter Review-Operationen, Content Release und Unified Audit
- Topic Page als leichter oeffentlicher Zielpfad
- Output Studio Workspace und serverseitige Studio-Persistenz
- Paid Dashboard Entitlement als manuelle Pilot-/Admin-Grant-Grundlage
- generischer Organisations-/Regionen-Pilotpfad mit Reinickendorf nur als Beispiel-Seed

### foundation

- Create Entitlements als echtes regionales Produkt
- Material-Intake als fertiger Produktionspfad
- Region Contract plus produktive Register-/Directory-Anbindung
- VoiceOpenGov Membership-/Register-Sync
- Journalismus-/Medienpakete als fertiges Produkt
- Funding-/Partnerpfade
- Beteiligungsradar

## Echte Blocker vor breitem Rollout

- `REGION-DASHBOARD-PRODUCTION-CUT`
  - Der Produktionsschnitt bleibt offen, weil vollstaendige Isolation und AllowedActions-Paritaet
    ueber alle relevanten Admin-/Legacy-Pfade noch nicht geschlossen sind.
- `AUTH-PROVIDER-RUNTIME-INTEGRATION-01`
  - Der zentrale RequestScopeResolver ist da, aber die echte externe Membership-/Directory-
    Aufloesung fehlt.
- `PR-ADMIN-DASHBOARD-FULL-AUDIT-REPAIR-01`
  - Betreiberflaechen sind weiter `in_progress`; fuer breiteren Rollout fehlt der vollstaendige
    browsernahe Admin-Healthcheck.
- `PR-CREATE-WORKFLOW-LIVE-QA-01`
  - Der reale `/create`-Gesamtworkflow ist noch nicht vollstaendig live-revalidiert; besonders
    der Pruef-/Analyze-Endpfad bleibt laut SSOT offen.
- `GOV-SEC-02`
  - Strukturierter Route-/Auth-/AI-Anbindungs-Audit ist als Pflicht vor groesseren Schritten
    noch offen.
- `GOV-SEC-03`
  - Das operative PII-/Content-/AI-Zonenmodell mit High-impact Audit-/Trace-/Review-Pflicht ist
    noch nicht produktiv operationalisiert.

## Fuer kontrollierten Pilot akzeptabel offen

- `AUTH-PROVIDER-RUNTIME-INTEGRATION-01`, solange Session + persistierte Runtime-Repos den Pilot
  kontrolliert tragen und der Source-of-Truth-Status sichtbar bleibt
- `PR-ADMIN-DASHBOARD-FULL-AUDIT-REPAIR-01`, wenn der Pilot nur wenige klar bekannte
  Betreiberflaechen nutzt
- `PR-CREATE-WORKFLOW-LIVE-QA-01`, solange `/create` nicht als vollstaendig self-service-faehiger
  Hauptpfad vermarktet wird
- `GOV-SEC-02`, nur fuer einen engen, betreiberbegleiteten Pilot kurzfristig tolerierbar
- Payment/Billing-/Checkout-Automatisierung
- breitere produktive Quellenabdeckung jenseits expliziter Einzel-URLs

## Vor production_ready zwingend

- `REGION-DASHBOARD-PRODUCTION-CUT` in den offenen Resten schliessen
- `AUTH-PROVIDER-RUNTIME-INTEGRATION-01` umsetzen
- `PR-ADMIN-DASHBOARD-FULL-AUDIT-REPAIR-01` abschliessen
- `PR-CREATE-WORKFLOW-LIVE-QA-01` abschliessen
- `GOV-SEC-02` als echter Auditlauf
- `GOV-SEC-03` als operative Architekturpflicht

## Bereits beruecksichtigte Entlastung

- `PR-QUALITY-HARM-02` ist erledigt und bleibt ein nuetzlicher Qualitaetsbaustein, aber kein
  Ersatz fuer die offenen Rollout-, Auth- oder Security-Blocker.

## Zusammenfassung

Der aktuelle Stand ist plausibel fuer einen kontrollierten, review-first Pilot mit Betreiberkanten
und generischer Organisations-/Regionen-Lesart. Er ist nicht ehrlich als breiter Self-Service-
Rollout und bewusst noch nicht als `production_ready` zu bezeichnen.
