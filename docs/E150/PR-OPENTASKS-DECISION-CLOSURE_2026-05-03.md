# Evidence: PR-OPENTASKS-DECISION-CLOSURE (2026-05-03)

## Ziel des Slices

Kleiner Decision-Closure-/OpenTasks-SSOT-Slice zur Klärung verbleibender offener Einträge,
ohne Runtime-/UI-/Routing-Implementierung.

Bearbeiteter Scope:
- `docs/E150/OpenTasks.md`
- diese Evidence-Datei

Nicht im Scope:
- keine Runtime-Änderungen
- keine UI-Änderungen
- keine neuen Routen
- keine neuen Datenmodelle außerhalb Task-/Doku-Klärung

## Getroffene Entscheidungen und Status-Umstellung

### 1) PR-EDITORIAL-SERIES-01
- Status: `open` -> `codex_ready`
- Entscheidung:
  - Redaktionelle Serien sind als review-/exportgebundene Wochen-/Kampagnenstruktur erlaubt.
  - Kein Autopublish.
  - Kein Tracking.
  - Kein manipulativer Growth-Funnel.
  - Kein Ersatz für Dossier-/Runden-/Mandatslogik.

### 2) GOV-MANDATE-04
- Status: `needs_decision` -> `codex_ready`
- Entscheidung:
  - VoiceOpenGov-Mitgliedschaft/Register-Handoff nur mit explizitem Opt-in/Consent.
  - Kein automatischer Mitgliedschaftseintrag.
  - Kein automatischer Rollen-/Parteibezug.
  - Kein stilles Übertragen aus eDebatte-Mandaten in VoiceOpenGov.
  - Consent, Rolle, Provenienz und Widerrufbarkeit müssen sichtbar sein.

### 3) GOV-CIVIC-ECON-01
- Status: `needs_decision` -> `codex_ready`
- Entscheidung:
  - eDebatte ist Tool/Produkt.
  - VoiceOpenGov ist Initiative/Register/Community-/Vertrauenslayer.
  - Toolpakete, Mitgliedschaft, Förderung und Governance werden getrennt dokumentiert.
  - Keine automatische Rabatt-/Mitgliedschaftslogik.
  - Keine stille Satzungs-/Förderentscheidung im Code.
  - Nächster Slice: docs-/contract-first.

### 4) PR-BETEILIGUNGSRADAR-00
- Status: `needs_decision` -> `codex_ready`
- Entscheidung:
  - Beteiligungsradar ist als Konzept-/Architektur-/Doku-Slice freigegeben.
  - Keine automatische Ingestion.
  - Keine automatische Anlassraum-/Dossier-/Runden-Erzeugung.
  - Keine Ausschreibungs-/Behörden-Scraping-Engine.
  - Zielpfad als klare Abgrenzung: `Signale/Ausschreibungen -> Anlassraum -> Dossier -> Runde -> Mandat`.

### 5) DOMAIN-HARM-01C
- Status: `needs_decision` -> `done`
- Entscheidung:
  - Keine harte Migration auf `/anlassraum` im aktuellen Stand.
  - Bestehende Surface-Struktur bleibt bestehen.
  - `/runden` bleibt operative Runde-/Anlassraum-nahe Surface.
  - Eine spätere harte Migration erfordert separaten Migrations-PR mit SEO-/Redirect-/Backlink-Konzept.

## Was ausdrücklich nicht gebaut wird

- Kein Beteiligungsradar-Build mit Ingestion/Scraping.
- Kein Membership-/Register-Handoff-Feature in Runtime/UI.
- Keine harte `/anlassraum`-Migration in Code/Routing.
- Keine wirtschaftliche Entscheidungslogik im Produktcode.
- Keine Tracking-/Growth-Mechanik im Editorial-Serien-Slice.

## Nächste Codex-Slices (aus der Klärung ableitbar)

1. `PR-EDITORIAL-SERIES-01` (codex_ready, review-first/no-tracking)
2. `GOV-MANDATE-04` (codex_ready, consent-/provenienzsichtbarer docs-/contract-first Handoff)
3. `GOV-CIVIC-ECON-01` (codex_ready, docs-/contract-first wirtschaftliche Trennung)
4. `PR-BETEILIGUNGSRADAR-00` (codex_ready, Konzept-/Architektur-Doku ohne Runtime-Engine)

## Ergebnis

- OpenTasks-SSOT für den genannten Block bereinigt.
- Für diesen Block verbleiben keine `needs_decision`-Einträge mehr.
- Keine Code-/UI-/Routing-Änderungen in diesem Slice.
