# PR-OPENTASKS-HYGIENE-01 - Revalidierung OpenTasks SSOT + Decision Boundaries

Datum: 2026-05-03
Repo: `VOGADMINRGF/edebatte-org`

## Ziel

OpenTasks-Hygiene-Slice fuer die vier angefragten IDs revalidieren, ohne Architektur- oder Produktscope still zu verschieben.

## Gepruefte IDs

1. `PR-CHAT-BACKLOG-01`
2. `GOV-CIVIC-ECON-01`
3. `PR-BETEILIGUNGSRADAR-00`
4. `DOMAIN-HARM-01C`

## Ergebnis je Task

### 1) PR-CHAT-BACKLOG-01

- Status bleibt `done`.
- Revalidiert: Chat-Backlog-Ideen aus Issue #74 sind weiterhin als operative Tasks im SSOT vorhanden (u. a. `PR-DOSSIER-EVIDENCE-FIRST-01`, `PR-DOSSIER-NUMBERS-AUDIT-01`, `PR-DOSSIER-PARTICIPATION-AUDIT-01`, `PR-DEMO-MASTER-DOSSIER-02`, `PR-OUT-EXPORT-01`, `PR-OUT-TELEMETRY-01`, `PR-BETEILIGUNGSRADAR-00`).
- Kein neuer Parallel-Backlog angelegt.

### 2) GOV-CIVIC-ECON-01

- Status bleibt `needs_decision`.
- Einordnung: echte Product-/Governance-Entscheidungsgrenze zur verbindlichen Wirtschafts-/Satzungsabgrenzung.
- Keine stille Umsetzung in Code oder Neben-SSOT.

### 3) PR-BETEILIGUNGSRADAR-00

- Status bleibt `needs_decision`.
- Einordnung: bleibt docs-only bis expliziter Scope-/Policy-Entscheid.
- Kein Beteiligungsradar-Build, keine Ingestion und keine automatische Anlassraum-/Runden-Erzeugung.

### 4) DOMAIN-HARM-01C

- Status bleibt `needs_decision`.
- Einordnung: keine harte Migration auf `/anlassraum` ohne expliziten Migrationsentscheid inkl. Redirect-/Backlink-/SEO-Policy.
- Keine harte Migration in diesem Slice.

## Guardrail-Bestaetigung

- Keine Architekturgrenzen verschoben.
- Kein Beteiligungsradar gebaut.
- Keine harte `/anlassraum`-Migration umgesetzt.
- Keine stillen Product-/Governance-Entscheide implementiert.

## Geaenderte Dateien in diesem Hygiene-Slice

- `docs/E150/OpenTasks.md`
- `docs/E150/PR-OPENTASKS-HYGIENE-01_REVALIDATION_2026-05-03.md`
