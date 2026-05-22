# ORG-REGION-ROLLOUT-RC-01

Stand: 2026-05-22
Status: done
Typ: Docs-/Readiness-Slice

## Ziel

Den generischen Organisations-/Regionen-Rollout nach Abschluss von `REGION-DASHBOARD-PRODUCTION-CUT`,
`GOV-SEC-02`, `GOV-SEC-03`, `AUTH-PROVIDER-RUNTIME-INTEGRATION-01`,
`PR-ADMIN-DASHBOARD-FULL-AUDIT-REPAIR-01`, `PR-CREATE-WORKFLOW-LIVE-QA-01` und den
Review-to-Publish-Haertungen als Release-Candidate fuer kontrollierte Piloten dokumentieren.

Nicht Ziel dieses Slices:

- keine neuen Runtime-Features
- keine neue Produktparallelwelt
- keine neue `production_ready`-Behauptung

## Lesart

- Reinickendorf ist nur Beispiel-Seed oder moeglicher erster Pilot.
- Produktziel ist der generische Organisations-/Regionen-Rollout fuer Verwaltung, Kommune,
  Bezirk, Verein, Verband, Traeger und Medienpartner.
- Der ehrliche Reifestand ist jetzt: kontrollierter Pilot-Release-Candidate mit Betreiberkanten.
- Nicht ehrliche Lesart bleiben vorerst breiter Self-Service-Rollout und `production_ready`.

## Pilotfaehige End-to-End-Kette

Die aktuell dokumentierbare kontrollierte Pilotkette lautet:

1. Organisation anmelden oder gefuehrt anlegen
2. Wirkraum oder Region waehlen
3. Quelle, URL oder Snapshot review-first pruefen
4. eigene Review-Aufgaben bearbeiten
5. Topic, Dossier oder Anlassraum vorbereiten
6. Sichtbarkeit bewusst setzen
7. Public URL, QR oder Share nutzen
8. Audit Trail nachvollziehen

Dabei gelten durchgaengig:

- kein Auto-Publish
- kein automatisches `public_official`
- keine automatische Amtlichkeit
- keine stille DeepSearch- oder Research-Kostenlogik
- Review, Content Release, Public Surface und Audit bleiben auf denselben gehaerteten Pfaden

## Rollen-Demos

### Verwaltung / Kommune / Bezirk

- kann im eigenen Organisations- und Regionscope arbeiten
- kann Quellen, Snapshots, Review-Aufgaben und Content-Release-Vorbereitung review-first nutzen
- bleibt auf bewusste Sichtbarkeit und auditierbare Aktionen begrenzt

### Verein / Verband / Traeger

- kann denselben generischen Organisationspfad ohne Verwaltungsstatus nutzen
- arbeitet review-first im eigenen Scope
- erhaelt keine automatische Amtlichkeits- oder Official-Release-Behauptung

### Medienpartner

- kann als Organisation im eigenen Scope mit Review-, Topic-, Dossier- und Share-Pfaden arbeiten
- bekommt keine Sonderlogik fuer automatische Freigabe oder automatische Quellenvollabdeckung

### Betreiber / Admin

- sieht globale Betreiberperspektive explizit markiert
- bleibt getrennt von Organisationsmodus
- nutzt keine versteckten Admin-Fallbacks in Org-Pfaden

## Erlaubte Pitch-Aussagen

- kontrollierter Pilot ist moeglich
- review-first ist verbindlich
- Organisationen arbeiten im eigenen Scope
- Betreiber-Modus ist global sichtbar und explizit markiert
- Sichtbarkeit wird bewusst gesetzt, nicht automatisch
- Public URL, QR und Share entstehen nur aus sichtbaren Zustaenden
- keine automatische Amtlichkeit
- Reinickendorf ist nur Beispiel-Seed oder moeglicher erster Pilot

## Nicht erlaubte Pitch-Aussagen

- vollstaendiger Self-Service ohne Betreiberkante
- `production_ready` fuer alle Kommunen oder Organisationen
- automatische amtliche Antwort oder automatische Amtlichkeit
- automatische Quellen- oder Crawler-Vollabdeckung
- fertiges Payment, Checkout oder Billing
- automatisches `public_official`
- automatische oeffentliche Freigabe ohne Review und bewusste Sichtbarkeit

## Rest- und Follow-up-Liste

Vor breitem Self-Service-Rollout oder spaeterem `production_ready` bleiben insbesondere offen:

- externe Membership-, Directory- und Register-Anbindung
- Self-Provisioning fuer Organisation, Wirkraum und Freischaltung
- Billing, Checkout und wiederholbare Provisionierung
- breitere produktive Quellenabdeckung ueber explizit verbundene Einzel-URLs hinaus
- spaeteres Social Publishing, falls separat priorisiert

## Fazit

Der generische Organisations-/Regionen-Rollout ist jetzt dokumentarisch als Release-Candidate fuer
kontrollierte Piloten belastbar. Die End-to-End-Kette ist review-first, scoped, auditierbar und
ohne Reinickendorf-Sonderstatus lesbar. Breiter Self-Service und `production_ready` bleiben
bewusst nachgelagerte Reifestufen.

## Validierung

Docs-only-Slice. Keine Tests ausgefuehrt, da keine Runtime-/Code-Aenderung erfolgt ist.
