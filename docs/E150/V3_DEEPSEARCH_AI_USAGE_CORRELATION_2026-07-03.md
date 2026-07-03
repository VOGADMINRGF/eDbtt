# V3 DeepSearch AI Usage Correlation

Datum: 2026-07-03
Slice: `V3-DEEPSEARCH-AI-USAGE-CORRELATION-04`

## Ziel

Die bestehende AI-Usage- und Consumption-Truth-Sicht dort haerten, wo heute
schon reale Runtime-Korrelation existiert, ohne neues Billing, Payment,
Fake-Debits, Backfills oder neue Runtime-Architektur zu bauen.

## Analyse vor Umsetzung

1. Bestehende AI-Usage-, Telemetry-, Research-, Material- und Job-Bausteine

- AI Usage:
  `core/telemetry/aiUsageTypes.ts`,
  `core/telemetry/aiUsage.ts`,
  `core/telemetry/aiUsageSnapshot.ts`
- Analyze / Research:
  `features/analyze/analyzeContribution.ts`,
  `apps/web/src/app/api/contributions/analyze/route.ts`
- Admin-Orchestrator-Smoke:
  `apps/web/src/app/api/admin/ai/orchestrator-smoke/route.ts`,
  `apps/web/src/features/ai/adminTelemetryStore.ts`
- Factcheck / Material / Export:
  `features/factcheck/db.ts`,
  `apps/web/src/features/material/materialExtractionJobs.ts`,
  `features/outputEngine/socialDistributionRuntime.ts`

2. Ausgangszustand von `AiUsageEvent`

Vor diesem Slice fuehrte `AiUsageEvent` nur Provider-, Pipeline-, User-,
Tenant-, Region-, Token-, Kosten- und Fehlersignale. Es gab keine
kanonischen Felder fuer `runId`, `jobId`, `operationId`, `dossierId` oder
`organizationId`.

3. Wo heute echte AI-Usage-Events entstehen

- `features/ai/orchestratorE150.ts` schreibt reale Usage-Events fuer
  Provider-Outcomes und Provider-Probes.
- `apps/web/src/features/localization/translateAndStore.ts` schreibt
  Translation-Events, aber ohne DeepSearch-/Run-Kontext.
- Factcheck-, Material- und Export-Pfade schreiben heute keine eigenen
  AI-Usage-Events.

4. Wo heute echte Run-/Job-Korrelation existiert

- Analyze fuehrt `runId` im Request-/Response-Contract und optional
  `dossierId`.
- Admin-Orchestrator-Smoke fuehrt `runId`, `correlationId` und `userId`
  aus dem Admin-Gate.
- Factcheck und Material fuehren belastbare Job-/Dossier-/Org-Kontexte,
  schreiben aber noch keine korrelierten Usage-Events.

5. Kleinste belastbare Luecke

Nicht fehlende Gates, sondern fehlende optionale Korrelation genau auf den
bereits existierenden AI-Usage-Writern:

- Analyze kennt `runId` und optional `dossierId`, schreibt diese aber nicht
  in `AiUsageEvent`.
- Admin-Orchestrator-Smoke kennt `runId` und `userId`, schreibt diese aber
  nicht in `AiUsageEvent`.
- Die Admin-/V3-Sichten koennen diese Wahrheit deshalb bisher nicht lesen.

## Umsetzung

- `AiUsageEvent` fuehrt jetzt optionale Korrelationsfelder:
  `runId`, `jobId`, `operationId`, `operationType`, `requestId`,
  `dossierId`, `organizationId`.
- `features/ai/orchestratorE150.ts` uebernimmt diese Felder aus der
  bestehenden `telemetry`-Struktur in alle realen AI-Usage-Writes.
- `features/analyze/analyzeContribution.ts` nimmt jetzt optionalen
  Lauf-/Dossier-/Operation-Kontext entgegen und reicht ihn in die
  Orchestrator-Telemetry durch.
- `apps/web/src/app/api/contributions/analyze/route.ts` gibt reale
  `runId`-, `dossierId`-, `userId`- und `operationId`-Wahrheit an
  `analyzeContribution` weiter.
- `apps/web/src/app/api/admin/ai/orchestrator-smoke/route.ts` gibt reale
  `runId`-, `correlationId`- und `userId`-Wahrheit an den Orchestrator und
  den internen Create-Analyze-Smoke weiter.
- `core/telemetry/aiUsageSnapshot.ts` und
  `apps/web/src/app/admin/telemetry/ai/usage/page.tsx` lesen und zeigen die
  neuen optionalen Korrelationsfelder fuer Recent Events.
- Das bestehende V3-Readmodel
  `apps/web/src/features/admin/v3DeepsearchConsumptionTruthReadModel.ts`
  unterscheidet jetzt zusaetzlich:
  `has_ai_usage_writer`, `has_run_correlation`, `has_job_correlation`,
  `has_dossier_correlation`, `has_org_or_user_scope`,
  `has_cost_estimate`, `records_usage`.

## Was bewusst nicht gebaut wurde

- kein neues Billing
- keine Payment-Integration
- keine echte Credit-Abbuchung
- keine Fake-Debits
- keine Backfills fuer historische Events
- keine neuen AI-Usage-Writer fuer Factcheck, Material oder Export
- keine Runtime-Stop- oder Auto-Governance-Logik

## Runtime-Status nach diesem Slice

- Runtime-Logik punktuell erweitert:
  vorhandene Analyze- und Admin-Smoke-Writer schreiben jetzt optionale
  Korrelation in `AiUsageEvent`
- keine neue Billing- oder Debit-Runtime
- echte AI-Usage-Korrelation existiert nur dort, wo die Runtime diese IDs
  heute schon real kennt

## Offene Luecken nach diesem Slice

- Factcheck-, Material- und Export-Pfade haben weiterhin keine eigenen
  AI-Usage-Writer und bleiben daher `missing_runtime_truth`
- `jobId`-Korrelation fehlt weiter fuer Factcheck-/Material-Jobs, solange
  diese Pfade keine AI-Usage-Events schreiben
- Debit-/Settlement-Wahrheit bleibt weiterhin offen
- historische AI-Usage-Events werden bewusst nicht rueckwirkend angereichert

## Tests

Gruen in diesem Slice:

- `apps/web/tests/v3-deepsearch-consumption-truth-readmodel.contract.test.ts`
- `apps/web/tests/v3-deepsearch-consumption-truth-admin.page.test.tsx`
- `apps/web/tests/create-analyze.route.test.ts`
- `apps/web/tests/analyze-contribution.null-hardening.test.ts`
- `apps/web/tests/admin-ai-orchestrator-smoke.route.test.ts`

Zusatz-Revalidierung laut Taskabschluss:

- `git diff --check`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- fokussierte V3-/DeepSearch-/Consumption-Truth-/AI-Usage-/Pricing-/Research-/Material-/Cost-Gate-Suite
- `pnpm -C apps/web run build`
