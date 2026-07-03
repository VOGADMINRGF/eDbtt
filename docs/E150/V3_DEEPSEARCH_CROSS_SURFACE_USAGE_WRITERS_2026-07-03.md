# V3 DeepSearch Cross-Surface Usage Writers

Datum: 2026-07-03
Slice: `V3-DEEPSEARCH-CROSS-SURFACE-USAGE-WRITERS-06`

## Ziel

Bestehende AI-Usage-Writer nur dort auf weitere reale Oberflaechen ausdehnen,
wo heute wirklich AI-/LLM-/orchestratorE150-Nutzung stattfindet, ohne neues
Billing, Payment, Fake-Debits, Fake-Usage oder neue Runtime-Architektur zu
bauen.

## Analyse vor Umsetzung

1. Bestehende AI-Usage-Writer seit `#289`

- `features/ai/orchestratorE150.ts` schreibt reale AI-Usage-Events fuer
  Analyze-/Orchestrator-Laeufe und Provider-Probes.
- `apps/web/src/features/localization/translateAndStore.ts` schreibt
  Translation-Usage, ist aber kein aktiver DeepSearch-/V3-Laufpfad.
- Weitere aktive Writer in Factcheck-, Material-, Export- oder Social-Pfaden
  existieren heute nicht.

2. Reale Oberflaechen mit echter AI-Nutzung

- `/api/contributions/analyze` und der E150-Orchestrator
- `/api/admin/ai/orchestrator-smoke`
- `/api/create/intelligent-followup` ueber
  `apps/web/src/features/create/createPlanner.ts`

3. Reale Laufkontexte, die heute bereits belastbar existieren

- Analyze / Admin-Smoke:
  `runId`, `operationId`, `dossierId`, `userId`
- Create Intelligent Follow-up:
  `requestId`, `operationId`, `operationType`, optional `dossierId`,
  optional `userId`
- Factcheck / Material / Export / Social:
  teils Guardrail-, Queue-, Job- oder Review-Kontext, aber kein echter
  AI-Usage-Writer

4. Pfade mit Guardrails, aber ohne echten AI-Writer

- Factcheck-Queue und Research-Review-Gates
- Material-Extraction-Cost-Guardrails
- Export-/Social-Review-Queue
- Dossier-/Output-/Distribution-Pfade ohne eigenen LLM-Write

5. Kleinste ehrliche Cross-Surface-Luecke

Der aktive Create-Intelligent-Follow-up-Planner fuehrt heute reale
OpenAI-Planeraufrufe aus, schrieb aber bisher keine AI-Usage-Events. Dieser
Pfad ist die kleinste echte Cross-Surface-Erweiterung, ohne neue Runtime zu
erfinden.

## Umsetzung

- `apps/web/src/features/create/createPlanner.ts` schreibt jetzt fuer reale
  OpenAI-Planeraufrufe AI-Usage-Events mit:
  `requestId`, `operationId`, `operationType`, `dossierId`, `organizationId`,
  `userId`, `locale`, Erfolgsstatus und Fehlertyp.
- `apps/web/src/features/create/intelligentFollowup.ts` reicht vorhandenen
  Request-/Operation-/Dossier-/User-Kontext an den Planner-Weg weiter.
- `apps/web/src/app/api/create/intelligent-followup/route.ts` erzeugt eine
  reale `requestId`, nutzt sie zugleich als `operationId` und reicht
  optionalen `userId`-/`dossierId`-Kontext in denselben Writer-Pfad.
- Das bestehende Readmodel
  `apps/web/src/features/admin/v3DeepsearchConsumptionTruthReadModel.ts`
  fuehrt den neuen Oberflaechenpfad
  `create_intelligent_followup_planner` mit ehrlichen Feldern fuer
  `has_ai_usage_writer`, `has_run_correlation`, `has_job_correlation`,
  `has_dossier_correlation`, `has_org_or_user_scope`, `has_cost_estimate`,
  `records_usage`, `has_credit_debit`, `review_required`,
  `blocked_by_limit` und `missing_runtime_truth`.
- `/admin` zeigt diesen Pfad sichtbar unter
  `V3 DeepSearch / Consumption Truth`.

## Was bewusst `missing_runtime_truth` bleibt

- Factcheck-Pfade: haben Job-/Review-Kontext, aber keinen echten
  AI-Usage-Writer
- Material-Extraction-Pfade: haben Guardrails und Jobs, aber keinen echten
  AI-Usage-Writer
- Export-/Social-Pfade: haben Review-/Queue-Kontext, aber keinen echten
  AI-Usage-Writer
- Debit-/Settlement-Wahrheit: keine echte Debit-Runtime vorhanden

## Was bewusst nicht gebaut wurde

- kein neues Billing
- keine Payment-Integration
- keine echte Credit-Abbuchung
- keine Fake-Debits
- keine Fake-AI-Usage-Events fuer Factcheck, Material, Export oder Social
- keine Runtime-Stop-Logik
- keine Auto-Publish-Logik
- keine neue Produktparallelwelt

## Runtime-Status nach diesem Slice

- Runtime-Logik punktuell erweitert:
  Der reale Create-Intelligent-Follow-up-Planner schreibt jetzt AI-Usage
  auf denselben bestehenden Telemetry-Pfad wie andere echte Writer.
- Keine neue Billing- oder Debit-Runtime.
- Reale Cross-Surface-Korrelation existiert jetzt fuer Analyze,
  Admin-Smoke und Create-Intelligent-Follow-up.

## Offene Luecken nach diesem Slice

- Factcheck-, Material-, Export- und Social-Pfade bleiben offen, bis dort
  tatsaechlich reale AI-Runtime entsteht
- `credit_debit` bleibt `missing_runtime_truth`
- `estimated_cost` bleibt fuer den Create-Planner bewusst unbelegt
- Backfills fuer historische Events wurden bewusst nicht gebaut

## Tests

Gruen in diesem Slice:

- `apps/web/tests/create-intelligent-followup.route.test.ts`
- `apps/web/tests/create-planner-openai-happy-path.contract.test.ts`
- `apps/web/tests/create-planner-timeout.contract.test.ts`
- `apps/web/tests/create-planner-routing.contract.test.ts`
- `apps/web/tests/v3-deepsearch-consumption-truth-readmodel.contract.test.ts`
- `apps/web/tests/v3-deepsearch-consumption-truth-admin.page.test.tsx`

Zusaetzliche Revalidierung laut Taskabschluss:

- `git diff --check`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- fokussierte V3-/DeepSearch-/AI-Usage-/Analyze-/Factcheck-/Material-/Export-/Pricing-/Cost-Gate-Suite
- `pnpm -C apps/web run build`
