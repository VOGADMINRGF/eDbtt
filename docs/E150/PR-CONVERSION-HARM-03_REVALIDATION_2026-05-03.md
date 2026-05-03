# PR-CONVERSION-HARM-03 - Conversion Family Revalidierung

Datum: 2026-05-03
Repo: `VOGADMINRGF/edebatte-org`

## Scope-Check

Geprueft wurde die Conversion-Familie ueber:

- `/pricing`
- `/vormerken`
- `/order`

Sollzustand aus PR-CONVERSION-HARM-03:

- gemeinsame Hero-/Card-Hierarchie und lesbare Scale
- keine miniaturisierte Wirkung auf `/pricing` und `/vormerken`
- Paketwechsel trotz Query-Preselection weiterhin moeglich
- klare Trennung Toolzugang/Freistellung vs. Paketkauf
- keine unlogischen Lock-in-Pfade fuer B2C/B2B/B2G

Ergebnis: Status bestaetigt, keine neue Umsetzungsabweichung gefunden.

## Validierung

1. `pnpm -C apps/web run typecheck` -> gruen
2. `pnpm -C apps/web run lint` -> gruen
3. Vitest Pricing/Order/Vormerken -> gruen

Hinweis zur Testausfuehrung:

- Der direkte Zsh-Glob-Aufruf
  `pnpm -C apps/web exec vitest run tests/pricing-*.test.ts tests/order-*.test.ts tests/vormerken-*.test.ts`
  kann in Zsh mit `no matches found` fehlschlagen.
- Reproduzierbar lauffaehige Variante:
  `pnpm -C apps/web exec sh -lc 'vitest run tests/pricing-*.test.ts tests/order-*.test.ts tests/vormerken-*.test.ts'`

Testresultat (korrigierter Lauf):

- 27 Testdateien
- 67 Tests
- alle bestanden

## Guardrails

- Keine neue Checkout-Engine.
- Keine Payment-Integration.
- Keine aggressive Conversion-Copy.
- Keine Architekturgrenzen verschoben.

