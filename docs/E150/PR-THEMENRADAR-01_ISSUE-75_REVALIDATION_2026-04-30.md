# PR-THEMENRADAR-01 - Issue #75 Revalidierung (2026-04-30)

## Kontext

Referenz: GitHub Issue `#75`  
Repo: `VOGADMINRGF/edebatte-org`

Ziel dieses Follow-ups war die SSOT-konforme Revalidierung von `PR-THEMENRADAR-01` unter den verbindlichen Guardrails:

- review-first
- no-auto-publish
- kein offizielles Social-Autoposting
- keine Tracking-Logik / keine Pixel-/Third-Party-Tracker
- keine Architekturverletzung gegen E150

## Umgesetzte Nachhaertung

### 1) No-Tracking Guardrail in Themenradar-Telemetrie-Route

Datei:

- `apps/web/src/app/api/admin/themenradar/[id]/telemetry/route.ts`

Ergänzung:

- Payloads mit Tracking-Identifiers werden explizit abgewiesen (`400`):
  - `userId`, `user_id`
  - `sessionId`, `session_id`
  - `trackingId`, `tracking_id`
  - `pixelId`, `pixel_id`
  - `visitorId`, `visitor_id`
  - `fingerprint`
  - `ipHash`, `ip_hash`
- Fehlercode: `tracking_fields_not_allowed`

Wirkung:

- Themenradar-Telemetrie bleibt auf aggregierte Operator-Zähler (`click`, `lead`, `membership`) begrenzt.
- Keine schleichende Einführung von Nutzertracking-Feldern über API-Payloads.

### 2) Testabdeckung für Guardrail ergänzt

Datei:

- `apps/web/tests/themenradar-actions.route.test.ts`

Neuer Test:

- `rejects telemetry payloads with tracking identifiers`

Abdeckung:

- Route liefert `400` + `tracking_fields_not_allowed`
- `applyThemenradarTelemetry` wird nicht aufgerufen

## SSOT-/OpenTasks-Update

Datei:

- `docs/E150/OpenTasks.md`

Aktualisiert:

- `PR-THEMENRADAR-01` um Issue-#75-Revalidierungsnotiz erweitert.
- Folgeaufgaben aus Issue #75 als operative Tasks ergänzt:
  - `PR-THEMENRADAR-03` (`codex_ready`)
  - `PR-MEMBERSHIP-ENGINE-01` (`codex_ready`)
  - `PR-OUTPUT-ENGINE-02` (`codex_ready`)
  - `PR-SHARE-DIST-01` (`codex_ready`)
  - `GOV-CIVIC-ECON-01` (`open`)
  - `PR-EDITORIAL-SERIES-01` (`open`)
- `Next codex_ready tasks` auf Issue-#75-kompatible Reihenfolge umgestellt.

## E150-Guardrail-Check

Bestätigt:

- Keine neue öffentliche Surface
- Kein Auto-Publish
- Kein offizielles Social-Autoposting
- Kein Umbau von `/create` als Intake-Orchestrator
- Keine externe Tracking-/Pixel-Integration

