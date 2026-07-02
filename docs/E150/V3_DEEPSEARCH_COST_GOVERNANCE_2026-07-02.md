# V3 DeepSearch / Research Cost Governance

## Ziel dieses Slices

Der kleinste saubere V3-Slice war nicht neue Billing- oder Research-Runtime,
sondern eine kanonische Sichtbarkeit ueber bereits vorhandene Gates.

Umgesetzt wurde deshalb:

- ein neues Readmodel
  `apps/web/src/features/admin/v3DeepsearchCostGovernanceReadModel.ts`
- ein sichtbarer `/admin`-Abschnitt
  `V3 DeepSearch / Research Cost Governance`
- klare Statussemantik fuer bestehende Gates:
  `allowed`, `blocked`, `review_required`, `missing_runtime_truth`
- Nachzug von V3-Control-Center-, Test-Matrix-, SSOT- und Readiness-Doku

Nicht gebaut wurden:

- keine neue Billing-Runtime
- keine echte Verbrauchsabrechnung
- keine Auto-Publish-Logik
- keine unkontrollierte Deep-Research-Automation
- keine neue Produktparallelwelt

## Analyse 1. Bestehende Bausteine

Bereits vorhanden waren:

- Research-/DeepSearch-Gates:
  `features/factcheck/entitlementGate.ts`,
  `apps/web/src/app/api/contributions/analyze/researchEntitlementGate.ts`,
  `apps/web/src/app/api/factcheck/enqueue/route.ts`
- Provider-/Lane-/Policy-Bausteine:
  `apps/web/src/features/ai/researchProviderPolicy.ts`,
  `apps/web/src/features/ai/providerRoleRouting.ts`,
  `apps/web/src/features/ai/v2OrchestrationPolicy.ts`
- Material-Cost-Gates:
  `apps/web/src/features/material/materialExtractionJobs.ts`
- AI-Usage-/Telemetry-Sicht:
  `apps/web/src/app/api/admin/telemetry/ai/usage/route.ts`,
  `apps/web/src/app/admin/telemetry/ai/usage/page.tsx`,
  `apps/web/src/features/admin/aiUsageView.ts`
- Pricing-/Entitlement-/Checkout-Basis:
  `apps/web/src/features/admin/v3PricingCreditsReadModel.ts`,
  `apps/web/src/lib/server/entitlements/createEntitlements.ts`,
  `features/pricing/*`
- Export-/Output-Gates:
  `features/outputEngine/distributionExport.ts`,
  `features/outputEngine/socialDistribution.ts`,
  `features/outputEngine/socialDistributionQueueReadModel.ts`

## Analyse 2. Wo heute schon entschieden wird

Heute wird bereits entschieden ueber:

- Research / DeepSearch:
  Login, Entitlement/Pricing und explizite Bestätigung in
  `features/factcheck/entitlementGate.ts`,
  `researchEntitlementGate.ts` und `factcheck/enqueue/route.ts`
- Material Extraction:
  `free`, `requires_approval`, `blocked` in
  `materialExtractionJobs.ts`
- AI Usage:
  operative Warn- und Attention-Flags ueber Budget-, Cost-per-Call-,
  Timeout-, Fallback- und Research-Heavy-Signale in AI Usage Telemetry
- Export / Output:
  review-first, kein Auto-Publish, manuelle Output-/Social-Draft-Pfade

## Analyse 3. Welche bestehende Admin-/Evidence-Struktur erweitert wurde

Erweitert wurden nur bestehende V3-Sichtbarkeitsstrukturen:

- `/admin` als bestehende Operator-Konsole
- `v3ControlCenterReadModel.ts`
- `v3TestRegressionMatrix.ts`
- `v3PricingCreditsReadModel.ts`
- `OpenTasks.md`
- `ProductionReadinessMatrix.md`

Es wurde keine neue Runtime-Architektur eingefuehrt.

## Analyse 4. Welche Tests bestehende Cost-Gates bereits decken

Relevante bestehende Testbasis:

- `apps/web/tests/factcheck-entitlement-gate.contract.test.ts`
- `apps/web/tests/create-analyze-entitlement-gate.route.test.ts`
- `apps/web/tests/factcheck-enqueue.auth.route.test.ts`
- `apps/web/tests/material-extraction-cost-guardrail.contract.test.ts`
- `apps/web/tests/ai-cost-research-guardrail.contract.test.ts`
- `apps/web/tests/admin-ai-usage.route.test.ts`
- `apps/web/tests/ai-usage-operational-signals.contract.test.ts`
- `apps/web/tests/pricing-no-hidden-ai-costs.contract.test.ts`

Neu fuer diesen Slice:

- `apps/web/tests/v3-deepsearch-cost-governance-readmodel.contract.test.ts`
- `apps/web/tests/v3-deepsearch-cost-governance-admin.page.test.tsx`

## Analyse 5. Kleinste echte Luecke

Die kleinste Luecke war nicht ein fehlender Gate-Mechanismus.

Die kleinste Luecke war:

- keine kanonische V3-Wahrheit, die die vorhandenen Research-, Material-,
  AI-Usage- und Export-Gates zusammenzieht
- keine ehrliche Statussicht, welche Pfade erlaubt, geblockt,
  reviewpflichtig oder ohne Runtime-Wahrheit sind
- keine sichtbare Markierung, dass per-run Verbrauch, Debit, Limit-Stand
  und Nachaudit weiterhin fehlen

Genau diese Luecke schliesst der Slice.

## Was konkret umgesetzt wurde

- Neues Readmodel `v3DeepsearchCostGovernanceReadModel.ts`
  mit Checks fuer:
  - `Research / DeepSearch Request Gate`
  - `Hidden DeepSearch Fallback Block`
  - `Material Extraction Cost Gate`
  - `AI Usage Threshold Visibility`
  - `Export / Social Output Review Gate`
  - `Per-run Consumption Truth`
- Neuer `/admin`-Abschnitt mit:
  - Status-Badges
  - Repo-Belegen
  - Test-Referenzen
  - realen Admin-/Public-Links
  - offenen Folgewahrheiten
- `DeepSearch / Cost Governance` in
  `v3ControlCenterReadModel.ts` auf `operational_basic` gezogen
- Test-Matrix um die Capability
  `deepsearch_cost_governance` erweitert
- Follow-up `V3-DEEPSEARCH-CONSUMPTION-TRUTH-02` explizit in `OpenTasks.md`
  angelegt

## Ehrliche Restluecken

Weiter offen bleiben bewusst:

- keine per-run Debit-Wahrheit
- keine belastbare Research-Credit-Abbuchung
- kein gemeinsamer Limit-Stand ueber Research, Material und Export
- kein durchgehender Approval- und Nachaudit-Workflow pro Lauf
- keine automatische Runtime-Stop-Logik aus AI-Usage-Warnwerten

Deshalb ist der neue Stand:

- `DeepSearch Cost Governance`: `operational_basic`
- nicht `endstate_ready`
- nicht `production_ready`
- nicht `live`

## Runtime-Auswirkung

Runtime-Logik wurde nicht veraendert.

Geaendert wurden:

- Readmodel- und Admin-Sichtbarkeit
- V3-Control-Center-/Matrix-Klassifikation
- Tests
- SSOT-/Evidence-Doku

## Validierung

- `git diff --check`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/v3-deepsearch-cost-governance-readmodel.contract.test.ts tests/v3-deepsearch-cost-governance-admin.page.test.tsx tests/v3-control-center-readmodel.contract.test.ts tests/v3-control-center-admin.page.test.tsx tests/v3-test-regression-matrix.contract.test.ts tests/v3-test-regression-matrix-admin.page.test.tsx tests/v3-pricing-credits-readmodel.contract.test.ts tests/v3-pricing-credits-admin.page.test.tsx tests/factcheck-entitlement-gate.contract.test.ts tests/create-analyze-entitlement-gate.route.test.ts tests/factcheck-enqueue.auth.route.test.ts tests/material-extraction-cost-guardrail.contract.test.ts tests/ai-cost-research-guardrail.contract.test.ts tests/admin-ai-usage.route.test.ts tests/ai-usage-operational-signals.contract.test.ts tests/pricing-no-hidden-ai-costs.contract.test.ts`
- `pnpm -C apps/web run build`
