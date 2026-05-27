# V2-PAYMENT-CHECKOUT-PROVIDER-01

## Ziel

Den bestehenden manuellen/operatorischen Vertrags- und Billing-Pfad um einen optionalen Self-Service-Checkout ergaenzen, ohne Grundbeteiligung zu paywallen, ohne versteckte AI-Kosten, ohne automatische Amtlichkeit und ohne zweite Billing-Wahrheit.

## Abgrenzung

- V1 bleibt manueller/operatorischer Vertrags- und Freischaltungspfad.
- Dieser V2-Slice fuehrt nur Contracts, Session-/Audit-Logik, optionale Provider-Readiness und ehrliche Pricing-/Dashboard-Copy ein.
- Kein Auto-Publish.
- Kein automatisches `public_official`.
- Keine automatische `publication_approved`-Rolle.
- Keine Fake-Stripe-/Self-Service-Behauptung, wenn kein Provider konfiguriert ist.

## Umsetzung

### Payment-/Checkout-Contracts

- Neuer client-safe Contract in `features/pricing/checkoutProvider.ts`
  - `PaymentProviderContract`
  - `CheckoutSession`
  - `BillingStatus`
  - Guardrail-Helper fuer Provider-Readiness und Billing-Ableitung
- Provider-Modi:
  - `stripe`
  - `manual_invoice`
  - `disabled`
- Self-Service-Checkout ist nur bei `stripe + ready` startbar.
- Ohne aktive Provider-Konfiguration bleibt der ehrliche Fallback `manual_invoice`.

### Session-/Audit-Logik

- Neue persistente Session-Runtime in `features/pricing/server/checkoutSessionsRepo.ts`
  - Checkout-Session anlegen
  - Status fortschreiben
  - Audit-Events schreiben
  - nach `paid` ein entitlements-basiertes Arbeitsrecht erzeugen
- Entitlement-Handoff:
  - Quelle `external_checkout`
  - nur klar erlaubte Arbeitsrechte
  - nie automatische Amtlichkeit
  - nie automatische Publikationsfreigabe
- Bestehende Vertrags-/Billing-Auditkette wird weiterverwendet:
  - bei verknuepfter Order wird `billingSource = external_checkout_integrated`
  - Plan-/Provisioning-Entscheidungen bleiben auditierbar

### API

- `/api/billing/provider`
  - liefert ehrlichen Provider-/Konfigurationsstatus
- `/api/billing/checkout/session`
  - erzeugt nur dann eine Checkout-Session, wenn ein Self-Service-Provider wirklich startbar ist
  - sonst sauberer Fehler mit `manual_invoice`-Fallback

### Copy / UI

- `/pricing`
  - Grundbeteiligung bleibt klar frei
  - Self-Service-Checkout wird nur als optionaler, konfigurationsabhaengiger Pfad beschrieben
  - keine versteckten AI-Kosten
- `/pricing/institutionen`
  - Betreiber-Verifikation, Vertragsaudit und manueller Fallback bleiben klar
- `/account/organization/dashboard`
  - Billing-/Freischaltungsbereich behauptet keinen pauschal fehlenden Checkout mehr
  - stattdessen: optionaler Self-Service bei aktiviertem Provider, sonst manueller auditierbarer Pfad

## Persistenz / Wahrheit

| Bereich | Wahrheit |
| --- | --- |
| Payment Provider | derived/readiness contract aus ENV |
| Checkout Session | persistent (`edebatte_checkout_sessions`) |
| Entitlement nach bezahlter Session | persistent (`paid_dashboard_entitlements`) |
| Vertrags-/Billing-Update bei verknuepfter Order | persistent Audit-/Order-Pfad |
| Pricing-/Dashboard-Copy | user-facing Guardrail, keine Runtime-Wahrheit |

## Geaenderte Dateien

- `features/pricing/checkoutProvider.ts`
- `features/pricing/index.ts`
- `features/pricing/server/checkoutSessionsRepo.ts`
- `features/region/server/paidEntitlements.ts`
- `features/region/organizationContracts.ts`
- `features/region/organizationDashboard.ts`
- `apps/web/src/app/api/billing/provider/route.ts`
- `apps/web/src/app/api/billing/checkout/session/route.ts`
- `apps/web/src/app/pricing/page.tsx`
- `apps/web/src/app/pricing/institutionen/page.tsx`
- `apps/web/src/app/account/organization/dashboard/page.tsx`
- `apps/web/tests/payment-provider-contract.test.ts`
- `apps/web/tests/payment-checkout-session.contract.test.ts`
- `apps/web/tests/payment-entitlement-after-checkout.contract.test.ts`
- `apps/web/tests/pricing-no-paywall-basic-participation.contract.test.ts`
- `apps/web/tests/pricing-no-hidden-ai-costs.contract.test.ts`
- `apps/web/tests/account-organization-dashboard.page.test.tsx`
- `docs/E150/OpenTasks.md`

## Validierung

Gruen gelaufen:

- `pnpm -C apps/web exec vitest run tests/payment-provider-contract.test.ts tests/payment-checkout-session.contract.test.ts tests/payment-entitlement-after-checkout.contract.test.ts tests/pricing-no-paywall-basic-participation.contract.test.ts tests/pricing-no-hidden-ai-costs.contract.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm run release:validate:production`

## Bewusst offen

- kein echter Stripe-/Provider-Redirect ohne konfigurierten Zahlungsprovider
- kein automatischer Settlement-Webhook im Repo ohne reale Provider-Anbindung
- keine Ausweitung auf automatische Amtlichkeit, `public_official` oder `publication_approved`
- keine Paywall fuer Lesen, Swipes oder Grundbeteiligung
