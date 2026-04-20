# PR-TRUST-LEGIT-01 — Pricing/Registry/Membership Trust-Loop (DE/EN)

Datum: 2026-04-13
Status: Done

## Ziel
Bilingualen, source-of-truth-basierten Trust-/Legitimations-Loop fuer pricing-nahe Kernreisen verankern:

- bewusst keine Partei
- unabhaengige Initiative fuer strukturierte Beteiligung + Mehrheitsprinzip
- hohe digitale Legitimation statt papierhafter Huerden
- keine semantische Drift zwischen DE/EN

## Umsetzung

1. Zentraler Trust-SSOT eingefuehrt
- `features/pricing/domain/trustLoop.de.ts`
- Enthaelt DE/EN:
  - Leitsatz
  - Kurz-/Mittel-/Langform
  - Kontexttexte (pricing/membership, registry verification, order/activation, age logic)
  - FAQ (3 Kernfragen)
  - `TRUST_LOOP_FORBIDDEN_PHRASES`

2. SSOT-Anbindung in Pricing-Content
- `features/pricing/domain/content.de.ts`
- Trust-/Hinweistexte werden nicht mehr verstreut hart verdrahtet.

3. Platzierung auf Kernflaechen
- `/pricing`: mittel + lang + FAQ + Kontext-Hinweise
- `/vormerken`: kurze/mittlere trust-nahe Einordnung und followup-Hinweis
- `/pricing/institutionen`: trust-nahe Einordnung inkl. FAQ
- registry-/payment-nahe Hinweise:
  - `apps/web/src/app/register/RegisterPageClient.tsx`
  - `apps/web/src/app/account/payment/page.tsx`
- order-followup:
  - `features/pricing/domain/orderFollowup.de.ts`

4. Test-/Contract-Absicherung
- `apps/web/tests/pricing-trust-loop.contract.test.ts`
  - DE/EN semantic guardrails
  - SSOT sourcing checks
  - forbidden phrase checks
  - mixed-language drift checks

Zusatz: bestehende `/vormerken`-Contract-Tests auf aktuellen wording-/segment-contract angepasst.

## Verifikation

Ausgefuehrte Tests:

- `pnpm -C apps/web exec vitest run tests/pricing-trust-loop.contract.test.ts tests/pricing-page.contract.test.ts tests/vormerken-page.contract.test.tsx tests/pricing-institutionen-page.contract.test.ts tests/pricing-i18n.contract.test.ts tests/vormerken-i18n.contract.test.tsx tests/pricing-institutionen-i18n.contract.test.ts tests/pricing-order-followup-i18n.contract.test.ts`
- `pnpm -C apps/web exec vitest run tests/edebatte-preorder.route.test.ts tests/pricing-preorder-verification-gates.contract.test.ts tests/pricing-order-flow.contract.test.ts tests/pricing-order-role-followup.contract.test.ts`
- `pnpm -C apps/web exec tsc --noEmit`

## Nicht Teil dieses Slices

- neue Pricing-/Order-Logik
- neue Billing-/Booking-Engine
- dritte Sprache
