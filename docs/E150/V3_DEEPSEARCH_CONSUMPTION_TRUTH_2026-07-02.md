# V3 DeepSearch Consumption Truth

Datum: 2026-07-02
Slice: `V3-DEEPSEARCH-CONSUMPTION-TRUTH-02`

## Ziel

Die bestehende V3-Sichtbarkeit aus `V3-DEEPSEARCH-COST-GOVERNANCE-01` und
`V3-PRICING-CREDITS-LIMITS-01` in eine ehrliche Consumption-Truth-Lesart
ueberfuehren, ohne neues Billing, Payment oder Fake-Verbrauchsdaten zu bauen.

## Analyse vor Umsetzung

1. Bestehende Bausteine

- Research-/DeepSearch-Gates:
  `features/factcheck/entitlementGate.ts`,
  `apps/web/src/app/api/contributions/analyze/researchEntitlementGate.ts`,
  `apps/web/src/app/api/factcheck/enqueue/route.ts`
- Material-/Cost-Guardrails:
  `apps/web/src/features/material/materialExtractionJobs.ts`
- AI-Usage-/Telemetry-Bausteine:
  `core/telemetry/aiUsageTypes.ts`,
  `core/telemetry/aiUsageSnapshot.ts`,
  `apps/web/src/app/api/admin/telemetry/ai/usage/route.ts`,
  `apps/web/src/app/api/admin/telemetry/ai/events/route.ts`,
  `apps/web/src/features/ai/adminTelemetryStore.ts`
- Pricing-/Entitlement-Bausteine:
  `apps/web/src/lib/server/entitlements/createEntitlements.ts`,
  `apps/web/src/features/admin/v3PricingCreditsReadModel.ts`,
  `apps/web/src/app/admin/pricing/orders/page.tsx`,
  `apps/web/src/app/admin/entitlements/page.tsx`
- Export-/Review-Bausteine:
  `features/outputEngine/socialDistributionQueueReadModel.ts`,
  `apps/web/src/app/api/dossier/[id]/export/route.ts`
- Provenance-/Run-Receipt-Bausteine:
  `features/analyze/runReceipt.ts`,
  `apps/web/src/lib/db/runReceiptsRepo.ts`,
  `apps/web/src/app/api/runreceipts/route.ts`

2. Wo heute Kosten-, Limit- oder Review-Relevanz markiert wird

- Factcheck-/Deep-Research markiert `login_required`,
  `entitlement_required`, `pricing_required`,
  `confirmation_required`, `noSilentCost`
- Material-Extraction markiert `costGuard` als `free`,
  `requires_approval` oder `blocked`
- AI Usage markiert `costEur`, Tokens, Fehler, Dauer und
  Threshold-/Attention-Flags
- Social-/Export-Pfade markieren `reviewRequired`,
  Statusketten und `noAutoPublish`
- Pricing/Entitlements markieren Paket-, Credit- und Scope-Wahrheit,
  aber keinen per-run Debit

3. Bestehende Korrelationen

- Research / Analyze: `runId`, `RunReceipt.id`, `receiptHash`, `snapshotId`
- Factcheck: `jobId`, `dossierId`, `organizationId`, `regionId`, `userId`
- Material: `job.id`, `materialId`, `dossierId`, `organizationId`,
  `regionId`, `submittedBy`
- Admin AI Smokes: `runId`, `correlationId`
- AI Usage Events: `provider`, `pipeline`, `timestamp`,
  optional `userId` / `tenantId`
- Export / Social Queue: `entry.id`, `dossierId`, `channels`

4. Bestehende Tests

- AI Usage:
  `apps/web/tests/admin-ai-usage.route.test.ts`,
  `apps/web/tests/ai-usage-operational-signals.contract.test.ts`
- Research Guardrails:
  `apps/web/tests/ai-cost-research-guardrail.contract.test.ts`,
  `apps/web/tests/create-analyze-entitlement-gate.route.test.ts`,
  `apps/web/tests/factcheck-enqueue.auth.route.test.ts`
- Material Cost Guardrails:
  `apps/web/tests/material-extraction-cost-guardrail.contract.test.ts`
- Pricing / No Hidden AI Costs:
  `apps/web/tests/pricing-no-hidden-ai-costs.contract.test.ts`
- V3/Admin:
  `apps/web/tests/v3-deepsearch-cost-governance-readmodel.contract.test.ts`,
  `apps/web/tests/v3-pricing-credits-readmodel.contract.test.ts`,
  `apps/web/tests/v3-control-center-readmodel.contract.test.ts`

5. Kleinste ehrliche Luecke

Die Luecke war nicht mehr fehlende Gate-Sichtbarkeit, sondern die fehlende
kanonische Lesart, die pro Lauf/Job/Operation ausdruecklich unterscheidet:

- nur geschaetzt
- recorded usage vorhanden
- kein Credit-/Debit vorhanden
- reviewpflichtig
- limit-/approval-blockiert
- Runtime-Wahrheit fehlt

## Umsetzung

- Neues Readmodel
  `apps/web/src/features/admin/v3DeepsearchConsumptionTruthReadModel.ts`
  fuehrt die vorhandenen Operationspfade in einer ehrlichen
  Consumption-Truth-Sicht zusammen.
- Neue `/admin`-Sektion
  `V3 DeepSearch / Consumption Truth`
  zeigt fuer jede Operation:
  `estimated_cost`, `recorded_usage`, `credit_debit`,
  `review_required`, `blocked_by_limit`, `missing_runtime_truth`.
- Bestehende V3-Readmodels fuer Control Center, Pricing / Credits / Limits,
  DeepSearch Cost Governance und Test Regression Matrix wurden auf diesen
  Slice fortgeschrieben und zeigen jetzt den Folgepfad
  `V3-DEEPSEARCH-RUN-LINKAGE-DEBIT-03`.

## Was bewusst nicht gebaut wurde

- kein neues Billing
- keine Payment-Integration
- keine echten Abbuchungen
- keine Fake-Kostenwerte
- keine neue Runtime-Architektur
- keine automatische Recherche
- keine Auto-Publish-Logik

## Offene Luecken nach diesem Slice

- AI Usage ist weiter nicht sauber an fachliche Runs/Jobs rueckgebunden
- Credits/Pakete bleiben Gate-/Planwahrheit, nicht Debit-Wahrheit
- Export-/Social-Pfade bleiben review-first ohne Usage-/Debit-Telemetry
- Run Receipts bleiben Provenance-Wahrheit, nicht Consumption-Wahrheit

Folgepfad: `V3-DEEPSEARCH-RUN-LINKAGE-DEBIT-03`

## Tests

Gruen in diesem Slice:

- `pnpm -C apps/web exec vitest run tests/v3-deepsearch-consumption-truth-readmodel.contract.test.ts tests/v3-deepsearch-consumption-truth-admin.page.test.tsx tests/v3-deepsearch-cost-governance-readmodel.contract.test.ts tests/v3-control-center-readmodel.contract.test.ts tests/v3-test-regression-matrix.contract.test.ts tests/v3-deepsearch-cost-governance-admin.page.test.tsx`

Revalidierung laut Taskabschluss:

- `git diff --check`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- fokussierte V3-/Pricing-/Research-/Material-/Cost-Gate-Suite
- `pnpm -C apps/web run build`
