# PRICING-FREEMIUM-TRUST-COPY-01

Datum: 2026-07-12

## Ergebnis

Die verbleibende Cross-Surface-Harmonisierung fuer Freemium-, Membership- und Freischaltungs-Copy ist fuer die produktiven Pricing-/Order-/Organisationspfade abgeschlossen.

## Geaenderte Nutzerpfade

- `/pricing/institutionen`
- `/vormerken` beziehungsweise `/order`
- `/account/organization`

## Umgesetzter Contract

- Lesen, Swipes und Grundbeteiligung bleiben als freier Basiskern explizit sichtbar.
- Paket-, Membership- und Organisationsfreischaltungen werden als bewusste, review-first Folgepfade beschrieben.
- Self-Service-Checkout wird weiterhin nur als bewusst aktivierter Sonderfall beschrieben.
- Keine versteckten AI-Kosten: zusaetzliche Recherche-, Review- oder Aktivierungspfade werden nur bewusst aktiviert.
- Keine internen Statuskeys oder falschen Auto-Publish-/Auto-Checkout-Claims wurden neu eingefuehrt.

## Test- und Validierungsstand

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/pricing-institutional-trust-copy.contract.test.ts tests/order-entry-trust-copy.contract.test.tsx tests/account-organization-page.contract.test.tsx tests/pricing-no-hidden-ai-costs.contract.test.ts tests/member-checkbox-flow.contract.test.tsx tests/pricing-conversion-harm.contract.test.tsx tests/pricing-institutionen-i18n.contract.test.ts`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web run typecheck`

Alle genannten Pruefungen waren in diesem Slice gruen.
