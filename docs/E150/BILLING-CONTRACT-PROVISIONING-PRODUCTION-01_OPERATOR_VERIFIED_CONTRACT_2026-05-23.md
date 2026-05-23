# BILLING-CONTRACT-PROVISIONING-PRODUCTION-01

Stand: 2026-05-23
Status: done
Issue: #212

## Entscheidung

Fuer v1 gilt ein persistenter, auditierbarer Betreiber-Vertragsprozess als autoritative Produktionswahrheit fuer Billing/Contract/Provisioning.

Das bedeutet:

- `operator_verified_contract` ist die v1-Produktionswahrheit
- `external_checkout_pending` bleibt nur ein optionaler spaeterer Integrationsmodus
- `fixture_demo` ist nie Produktionswahrheit
- es wird nirgends behauptet, dass bereits ein externer Checkout aktiv ist

## Umgesetzter Scope

- Pricing-/Order-Runtime um `OrganizationContract`, `OrganizationContractStatus`, `OrganizationBillingStatus`, `OrganizationBillingSource`, `OrganizationPlanAssignment`, `OrganizationContractAuditEvent` und `OrganizationAccessProvisioningDecision` erweitert
- `/admin/pricing/orders` liest und schreibt bewusste Vertrags-, Billing- und Provisioning-Entscheidungen auf denselben bestehenden Order-Pfaden
- `/account/organization/dashboard` zeigt eine ehrliche Vertrags-/Billing-Karte inklusive `sourceOfTruth`, `confidence`, Audit-Hinweis, Planwirkung und naechsten sicheren Schritten
- Org-Entitlements werden mit Contract-/Billing-Status gekoppelt; Scopes koennen sichtbar bleiben, sind aber nur noch bei passender Vertragslage `accessEnabled`
- `billing_pending`, `overdue`, `suspended`, `cancelled` und `expired` fuehren nicht mehr zu vorgetaeuschtem Vollzugriff
- `publication_approved`, `public_official`, Betreiberrechte und Auto-Publish entstehen nie aus Vertrag oder Billing
- Org-A sieht nicht Org-B-Contract/Billing

## Guardrails

- keine neue Produktparallelwelt
- kein externer Checkout-Claim
- kein Auto-Publish
- kein automatisches `public_official`
- keine automatische `publication_approved`-Rolle

## Reifestand

`Billing/Contract/Provisioning` ist jetzt `production_ready-v1`, aber nur in der engen v1-Lesart:

- produktive Wahrheit kommt aus persistenter, auditierbarer Betreiber-Vertragsentscheidung
- nicht aus `fixture_demo`
- nicht aus `external_checkout_pending`
- nicht aus einer behaupteten Self-Checkout-Integration

## Validierung

- `pnpm -C apps/web exec vitest run tests/account-organization-dashboard.page.test.tsx tests/organization-dashboard.readmodel.test.ts tests/admin-pricing-orders.route.test.ts tests/admin-pricing-control-contract.test.ts tests/admin-pricing-control-readmodel.test.ts`
- ergaenzend route-nahe Regressionen fuer org-scoped Writes:
  - `tests/org-review-item-ops.route.test.ts`
  - `tests/org-content-release.route.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `rm -rf apps/web/.next`
- `pnpm --filter @vog/web build`

## Offene Folgearbeit

- echte externe Checkout-/Billing-Integration
- Konflikt-/Sync-Regeln zwischen Betreiber-Vertragswahrheit und externer Quelle
- Failure-/Replay-/Rollback-Regeln fuer `external_checkout_integrated`
- breiterer Self-Service ohne Betreiberkante
