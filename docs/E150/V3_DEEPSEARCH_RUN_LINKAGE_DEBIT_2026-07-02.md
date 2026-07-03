# V3 DeepSearch Run Linkage Debit

Datum: 2026-07-02
Slice: `V3-DEEPSEARCH-RUN-LINKAGE-DEBIT-03`

## Ziel

Die bestehende V3-Consumption-Truth-Sicht um eine ehrliche
Run-/Job-/Usage-/Debit-Linkage-Lesart erweitern, ohne neues Billing,
Payment, Fake-Debits oder neue Runtime-Architektur zu bauen.

## Analyse vor Umsetzung

1. Bestehende Run-, Job-, Operation- und Telemetry-Strukturen

- Analyze / Research:
  `apps/web/src/app/api/contributions/analyze/route.ts`,
  `features/analyze/schemas.ts`,
  `apps/web/src/lib/db/runReceiptsRepo.ts`
- Factcheck / Research Jobs:
  `features/factcheck/db.ts`,
  `features/factcheck/jobRunner.ts`,
  `apps/web/src/app/api/factcheck/enqueue/route.ts`
- Material Extraction:
  `apps/web/src/features/material/materialExtractionJobs.ts`
- Export / Social Distribution:
  `features/outputEngine/socialDistributionRuntime.ts`,
  `features/outputEngine/socialDistributionQueueReadModel.ts`
- AI Usage / Telemetry:
  `core/telemetry/aiUsageTypes.ts`,
  `core/telemetry/aiUsage.ts`,
  `apps/web/src/features/ai/adminTelemetryStore.ts`,
  `apps/web/src/app/api/admin/telemetry/ai/events/route.ts`

2. Bereits vorhandene Korrelationen

- Analyze fuehrt `runId` im Contract, aber der persistierte `RunReceipt`
  speichert keine kanonische Usage- oder Debit-Verknuepfung.
- Factcheck fuehrt bereits `jobId`, `dossierId`, `organizationId`,
  `regionId`, `userId`.
- Material Extraction fuehrt bereits `job.id`, `materialId`,
  `dossierId`, `organizationId`, `regionId`, `submittedBy`.
- Admin-Orchestrator-Smokes fuehren `runId` und `correlationId`.
- Export / Social fuehrt `entry.id`, `dossierId`, `channels`.
- `AiUsageEvent` fuehrt weiterhin nur Provider-/Pipeline-/User-/Tenant-
  Kontext, aber keine kanonischen `runId`-/`jobId`-Felder.

3. Wo heute echte Runtime-Wahrheit endet

- `AiUsageEvent` ist recorded usage, aber nicht fachlich an Run/Job/Export
  rueckgebunden.
- Factcheck-, Material- und Export-Pfade haben Guardrails, Review-Gates und
  Objekt-IDs, aber keine Usage-Referenz.
- Echte `credit_debit`-/Settlement-Records existieren auf diesen Pfaden
  weiterhin nicht.

4. Kleinste belastbare Luecke

Nicht mehr fehlende Gate-Sichtbarkeit, sondern die fehlende explizite
Struktur-Wahrheit:

- Hat dieser Pfad Run-Linkage?
- Hat er Job-Linkage?
- Hat er Usage-Linkage?
- Hat er echten Credit-/Debit-Bezug?
- Oder fehlt Runtime-Wahrheit weiterhin?

## Umsetzung

- Das bestehende Readmodel
  `apps/web/src/features/admin/v3DeepsearchConsumptionTruthReadModel.ts`
  wurde erweitert um:
  `has_run_linkage`, `has_job_linkage`, `has_usage_linkage`,
  `has_credit_debit`.
- Die bestehende `/admin`-Sektion
  `V3 DeepSearch / Consumption Truth`
  zeigt diese Linkage-Felder jetzt pro Operation neben
  `estimated_cost`, `recorded_usage`, `credit_debit`,
  `review_required`, `blocked_by_limit` und `missing_runtime_truth`.
- Vorhandene V3-Folgepfade in Control Center, Pricing / Credits / Limits,
  DeepSearch Cost Governance und Test Regression Matrix wurden auf den
  naechsten ehrlichen Folgeslice
  `V3-DEEPSEARCH-AI-USAGE-CORRELATION-04`
  fortgeschrieben.
- Ein separater Folgepfad
  `V3-DEEPSEARCH-DEBIT-TRUTH-05`
  markiert ausdruecklich, dass Debit-/Settlement-Wahrheit weiterhin
  fehlt und nicht simuliert wird.

## Was bewusst nicht gebaut wurde

- kein neues Billing
- keine Payment-Integration
- keine echte Abbuchung
- keine Fake-Credit-Debits
- keine Backfills aus Vermutungen
- keine Runtime-Stop- oder Auto-Governance-Logik
- keine Auto-Publish- oder Auto-Research-Logik

## Runtime-Status nach diesem Slice

- Runtime-Logik unveraendert
- Admin-/Readmodel-Sicht erweitert
- echte Debit-/Billing-Logik weiterhin nicht vorhanden

## Offene Luecken nach diesem Slice

- `AiUsageEvent` ist weiterhin nicht fachlich an Run-/Job-Objekte
  rueckgebunden
- `RunReceipt` bleibt Provenance-Wahrheit statt Usage-Wahrheit
- Factcheck-, Material- und Export-Objekte bleiben ohne Usage-Referenz
- `credit_debit` bleibt auf allen betrachteten Pfaden
  `missing_runtime_truth`

## Tests

Gruen in diesem Slice:

- `apps/web/tests/v3-deepsearch-consumption-truth-readmodel.contract.test.ts`
- `apps/web/tests/v3-deepsearch-consumption-truth-admin.page.test.tsx`
- `apps/web/tests/v3-deepsearch-cost-governance-readmodel.contract.test.ts`
- `apps/web/tests/v3-control-center-readmodel.contract.test.ts`
- `apps/web/tests/v3-test-regression-matrix.contract.test.ts`

Zusatz-Revalidierung laut Taskabschluss:

- `git diff --check`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- fokussierte V3-/DeepSearch-/Pricing-/AI-Usage-/Research-/Material-/Cost-Gate-Suite
- `pnpm -C apps/web run build`
