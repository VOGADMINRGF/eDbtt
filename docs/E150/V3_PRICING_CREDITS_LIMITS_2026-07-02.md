# V3 Pricing / Credits / Limits

## Was gebaut wurde

- `/admin` zeigt jetzt einen sichtbaren Abschnitt
  `V3 Pricing / Credits / Limits`.
- Das neue Readmodel
  `apps/web/src/features/admin/v3PricingCreditsReadModel.ts`
  bündelt bestehende Pricing-, Checkout-, Billing-, Entitlement-, Research-,
  Material- und Export-Cost-Gates ohne neue Billing- oder Credit-Runtime.
- Die Sicht zeigt Paketfamilien, Billing Truth, operatorische Scope-Basis,
  bestehende Cost Gates, Repo-Belege, Tests, Guardrails und offene Folgepfade.
- `apps/web/src/features/admin/v3ControlCenterReadModel.ts` stuft
  `Pricing / Credits / Limits` nach diesem Slice auf `operational_basic`.

## Welche bestehende Basis genutzt wurde

- Pricing-Pakete und Credits:
  `features/pricing/domain/plans.de.ts`
- Checkout-/Billing-Vertrag:
  `features/pricing/checkoutProvider.ts`
- Vertrags- und Scope-Wahrheit:
  `features/pricing/domain/organizationContract.ts`
- Checkout- und Entitlement-Runtime:
  `features/pricing/server/checkoutSessionsRepo.ts`
  und `features/region/*`
- Research-/DeepSearch-Gates:
  `apps/web/src/features/ai/researchProviderPolicy.ts`
  und `apps/web/src/app/api/contributions/analyze/researchEntitlementGate.ts`
- Material-Cost-Guard:
  `apps/web/src/features/material/materialExtractionJobs.ts`
- Export-/Social-Draft-Basis:
  `features/outputEngine/*`

## Sichtbare Teilbereiche auf `/admin`

- Paketfamilien:
  Privat, Journalismus, Organisationen, Kommunen / Verwaltung
- Billing Truth:
  Provider, Status, Environment, Self-Service-Checkout-Gate,
  Manual-Invoice-Fallback, Truth Sources und blockierte Nicht-Truth-Sources
- Cost Gates:
  Billing Truth, Entitlement Scopes, Research / DeepSearch,
  Material Extraction, Export / Social Draft / Output
- Folgepfade:
  `V3-DEEPSEARCH-COST-GOVERNANCE-01`,
  `V3-DOSSIER-SOCIAL-OUTPUT-DRAFTS-01`,
  `V3-ROLES-PERMISSIONS-ENTITLEMENTS-01`

## Was ausdruecklich nicht gebaut wurde

- keine neue Billing- oder Credit-Runtime
- kein per-run Verbrauchsledger
- keine automatische Kostenabbuchung
- keine neue Checkout-Integration
- keine Auto-Research-, Auto-Asset- oder Auto-Export-Logik
- keine Auto-Publish-Funktion
- keine neue Admin-Welt

## Reifestand

- `Pricing / Credits / Limits` ist jetzt `operational_basic`.
- Das bedeutet hier:
  bestehende Sicht- und Guardrail-Basis ist sichtbar und testbar,
  aber die eigentliche V3-Verbrauchswahrheit bleibt offen.
- Offen bleiben insbesondere:
  per-run Approval, Verbrauch, Nachaudit und gemeinsame Kostenwahrheit fuer
  Research, Assets, Exporte und spaetere Suggestions.

## Tests und Validierung

- `apps/web/tests/v3-pricing-credits-readmodel.contract.test.ts`
- `apps/web/tests/v3-pricing-credits-admin.page.test.tsx`
- `apps/web/tests/v3-control-center-readmodel.contract.test.ts`
- `apps/web/tests/v3-control-center-admin.page.test.tsx`
- `apps/web/tests/v3-test-regression-matrix.contract.test.ts`
- `git diff --check`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/v3-pricing-credits-readmodel.contract.test.ts tests/v3-pricing-credits-admin.page.test.tsx tests/v3-control-center-readmodel.contract.test.ts tests/v3-control-center-admin.page.test.tsx tests/v3-test-regression-matrix.contract.test.ts tests/v3-test-regression-matrix-admin.page.test.tsx`
- `pnpm -C apps/web run build`
