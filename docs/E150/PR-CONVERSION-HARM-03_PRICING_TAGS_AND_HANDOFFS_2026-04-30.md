# PR-CONVERSION-HARM-03 + PR-PRICING-TAGS-ANNUAL-01 + PR-PRICING-HANDOFF-CLICK-01

Datum: 2026-04-30

## Kontext
Follow-up aus Chat/Issue-Normalisierung: Preiskennzeichnung, Abrechnungsmodus und klickbare Handoffs auf `/pricing`, `/pricing/institutionen`, `/vormerken` und `/order` konsistent machen.

## Umsetzung
- Shared Billing-Mode-Formatter ergänzt:
  - `features/pricing/domain/formatters.ts`
  - Neuer Export: `formatPackageBillingModeLabel(...)`
- Preis-/Billing-Tags auf Karten sichtbar gemacht:
  - `apps/web/src/components/pricing/PackagesGrid.tsx` (Preis + `Abrechnungsmodus`)
  - `apps/web/src/app/vormerken/page.tsx` (Preis + `Abrechnungsmodus` je Paketkarte)
  - `apps/web/src/app/pricing/institutionen/page.tsx` (B2B/B2G-Paketkarten + empfohlener Rahmen)
- Preislabels auf Monats-/MwSt.-Klarheit und Jahrespräferenz nachgezogen:
  - `features/pricing/domain/plans.de.ts`
  - `features/pricing/domain/plans.en.ts`
- CTA-Handoffs gehärtet:
  - `apps/web/src/app/pricing/page.tsx`
  - Interne Paket-CTAs werden segmentstabil als `/vormerken?...&segment=<segment>` gebaut.

## Guardrails
- Keine neue Checkout-/Payment-Engine.
- Keine Skonto-/Pseudo-Rabatt-Copy.
- B2B/B2G bleibt `zzgl. MwSt.`.
- Keine Vergabe-/Rechtsberatungsaussagen ergänzt.

## Tests
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web exec vitest run tests/pricing-page.contract.test.ts tests/vormerken-page.contract.test.tsx tests/pricing-order-shared-entry.contract.test.tsx tests/pricing-communities-entry.contract.test.ts tests/pricing-institutionen-b2g-vergabe.contract.test.ts tests/pricing-handoff-click.contract.test.ts`
- `NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 pnpm --filter @vog/web build`

Ergebnis: grün.
