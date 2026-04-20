# PR-OPS-STATUS-REPORT-01 – Automatische interne Statusberichte per E-Mail (2026-04-19)

## Ziel
Interner, produktionsnaher Ops-Statusreport als Plattformmechanismus:
- 2 feste Slots pro Tag (`05:00`, `17:00`, `Europe/Berlin`)
- echte aktive Statussammlung (kein Fake-Report)
- AI-Routen-Smokechecks aktiv
- SMTP-Versand ueber bestehende Mail-Infra
- robuste Fehlerbehandlung + Nachvollziehbarkeit

## Umsetzung

### 1) Scheduler / Slot-Mechanik
- Neuer Scheduler: `apps/web/src/features/ops/statusReport/scheduler.ts`
- Start ueber Next-Instrumentation: `apps/web/src/instrumentation.ts`
- Feste Slots: `05:00`, `17:00`
- Grace-Window konfigurierbar (`STATUS_REPORT_SLOT_GRACE_MINUTES`, default 20)
- Kein Request-gebundener Versand, kein Client-Timer

### 2) Report-Usecase + Report-Shape
- Contracts: `apps/web/src/features/ops/statusReport/contracts.ts`
- Collector: `apps/web/src/features/ops/statusReport/collect.ts`
- Bewertet und aggregiert:
  - Plattform-Kernstatus
  - AI-Routen-Smokes
  - Themenradar/Admin-Readiness
  - Order/Pricing-Kernpfade
- Zusammenfassung liefert `overallStatus` (`green|yellow|red`) + kurze Summary-Punkte

### 3) Aktive AI-Routen-Smokes
- `/api/contributions/analyze` (ping + Standardlauf)
- `/api/create/analyze` (ping)
- Degraded/Fallback wird explizit als `yellow` ausgewiesen
- Schema-/Envelope-Drift wird als `red` ausgewiesen

### 4) SMTP-Versand
- Versand ueber bestehendes `@/utils/mailer`
- Eigene SMTP-Guard-Pruefung (`hasSmtpConfig`) fuer ehrliche Laufbewertung
- Kein stilles "alles gut", wenn SMTP fehlt/auf Fallback faellt

### 5) Doppelversand-Schutz + Laufhistorie
- Persistenter Run-Store: `apps/web/src/features/ops/statusReport/repo.ts`
- Slot-Key-Dedupe (`YYYY-MM-DD@05:00`, `YYYY-MM-DD@17:00`)
- Pro Lauf gespeichert:
  - start/completion
  - status (`running|sent|failed|skipped`)
  - mailSent
  - error
  - report snapshot

### 6) Interne Ops-Route
- `apps/web/src/app/api/admin/ops/status-report/route.ts`
- `GET`: letzte Runs
- `POST`: manueller Run (oder gezielter Slot-Run)
- nur Admin-gated

## ENV-Konfiguration
Ergaenzt in `apps/web/.env.example`:
- `STATUS_REPORT_ENABLED`
- `STATUS_REPORT_RECIPIENTS`
- `STATUS_REPORT_TZ`
- `STATUS_REPORT_SUBJECT_PREFIX`
- `STATUS_REPORT_INCLUDE_AI_SMOKES`
- `STATUS_REPORT_SLOT_GRACE_MINUTES`
- `STATUS_REPORT_BASE_URL`

## Tests
Neu:
- `apps/web/tests/status-report-shape.contract.test.ts`
- `apps/web/tests/ai-route-smoke.contract.test.ts`
- `apps/web/tests/ai-route-fallback-status.contract.test.ts`
- `apps/web/tests/status-report-mail-render.contract.test.ts`
- `apps/web/tests/status-report-scheduler.contract.test.ts`
- `apps/web/tests/status-report-no-double-send.contract.test.ts`
- `apps/web/tests/smtp-config-guard.contract.test.ts`

## Guardrails
Unveraendert:
- kein Auto-Publish
- kein offizielles Social-Autoposting
- keine Marketing-/Massenmail-Engine
- keine neue oeffentliche Surface
- ehrliche Statusdarstellung statt Greenwashing
