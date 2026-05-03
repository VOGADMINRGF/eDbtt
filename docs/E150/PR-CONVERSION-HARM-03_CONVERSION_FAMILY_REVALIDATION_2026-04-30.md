# PR-CONVERSION-HARM-03 Conversion Family Revalidation (2026-04-30)

## Scope
- Conversion-Familie entlang `/pricing`, `/vormerken`, `/order` erneut kontraktsicher geprueft.
- Keine neue Checkout-Engine.
- Keine Payment-Integration.
- Keine aggressive Conversion-Copy.

## Implemented
- Neuer Regression-Contract:
  - `apps/web/tests/pricing-conversion-harm.contract.test.tsx`
  - prueft Hero-Scale-Paritaet, Preselection-ohne-Paketlock, Trennung Mitgliedschaft/Paketfreischaltung und `/order` als vorausgewaehlten Einstieg.
- Bestehende Contracts auf aktuellen Canon angepasst:
  - `apps/web/tests/pricing-i18n.contract.test.ts`
  - `apps/web/tests/pricing-institutionen-i18n.contract.test.ts`
  - `apps/web/tests/pricing-package-capabilities-visible.contract.test.ts`
  - `apps/web/tests/pricing-initiative-link.contract.test.ts`
  - `apps/web/tests/pricing-preorder-verification-gates.contract.test.ts`

## Why these test updates were required
- Segment-stabile CTA-Handoffs auf `/pricing` fuegen `segment` in `/vormerken`-Links hinzu.
- EN-Label in `/pricing/institutionen` wurden auf den aktuellen B2B/B2G-Wording-Stand angehoben.
- Initiative-/Capabilities-Copy wurde bereits harmonisiert und brauchte aktualisierte Assertions.
- Preorder-Route verlangt inzwischen verpflichtende Zustimmungen (`acceptedPrivacy`, `acceptedTerms`, `acceptedContact`) vor den nachgelagerten Verification-Gates.

## Validation
- `pnpm -C apps/web run typecheck` ✅
- `pnpm -C apps/web run lint` ✅ (1 bestehende Warning in `src/components/dossier/DossierViewer.tsx`, keine neue Warning aus diesem Slice)
- `pnpm -C apps/web exec vitest run $(rg --files apps/web/tests | rg '(pricing|order|vormerken)-.*\\.test\\.(ts|tsx)$' | sed 's#^apps/web/##')` ✅
  - 42 Test Files passed
  - 108 Tests passed

## Result
- Conversion-Familie bleibt kohaerent:
  - `/pricing` als Preis-/Segment-Einstieg
  - `/vormerken` als paketfuehrender Start
  - `/order` als vorausgewaehlter Einstieg auf demselben Paketstart-Flow
- Paketwechsel nach Query-Preselection bleibt moeglich.
- Toolzugang/Freistellung bleibt klar von Paketkauf getrennt.
