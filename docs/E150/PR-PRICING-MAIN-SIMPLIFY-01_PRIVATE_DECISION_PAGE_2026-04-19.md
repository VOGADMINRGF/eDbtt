# PR-PRICING-MAIN-SIMPLIFY-01

Datum: 2026-04-19  
Status: done

## Ziel

`/pricing` als kurze, klare Privat-Entscheidungsseite vereinfachen:

- Hero stark reduzieren (Headline + 1 Satz + 2 CTAs)
- 3 Privatpakete als direkte Hauptentscheidung
- Mitgliedschaft klar und kompakt einordnen
- B2B/B2G nur nachgeordnet verlinken
- keinen zusaetzlichen Mittelblock zwischen Hero und Entscheidung lassen

## Umsetzung

### 1) Hauptseite deutlich reduziert

Datei:

- `apps/web/src/app/pricing/page.tsx`

Ergebnis:

- Hero ist auf das Wesentliche reduziert.
- Paketentscheidung startet direkt im Anschluss.
- Der separate Zwischenblock `Was du konkret machen kannst` wurde entfernt.
- B2B/B2G-Hinweis bleibt als kurzer Nebenpfad auf `/pricing/institutionen`.

### 2) Mitgliedschaft klarer und kompakter

Datei:

- `apps/web/src/app/pricing/page.tsx`

Ergebnis:

- Mitgliedschaft ist als Grundsatzentscheidung klarer formuliert:
  - `Interessiert` kostenfrei fuer Mitglieder
  - `Interessiert` regulaer `3,99 EUR`
  - freier Mitgliedsbeitrag bleibt unabhaengig
  - Empfehlung `5,63 EUR`
  - finale Bestaetigung separat per E-Mail-Link
  - organisatorisch/technisch getrennte Systeme + zusaetzliche Sicherheits-/Trennlogik moeglich

### 3) Paketumfang konkreter gemacht

Dateien:

- `features/pricing/domain/plans.de.ts`
- `features/pricing/domain/plans.en.ts`
- `apps/web/src/components/pricing/PackagesGrid.tsx`

Ergebnis:

- Private Paketleistungen sind konkreter mit sichtbaren Begriffen wie:
  - Swipes
  - Streams/Resonanz
  - Guided Flow
  - Human Loop
  - optionale Add-ons
- Karten zeigen im kompakten Modus bis zu 4 konkrete Leistungszeilen (`Was ist enthalten?`).

## Tests / Contracts

Neu:

- `apps/web/tests/pricing-main-page-simplified-decision-flow.contract.test.ts`
- `apps/web/tests/pricing-membership-block-clarity.contract.test.ts`
- `apps/web/tests/pricing-package-capabilities-visible.contract.test.ts`
- `apps/web/tests/pricing-no-extra-middle-blocks.contract.test.ts`
- `apps/web/tests/pricing-b2b-secondary-only.contract.test.ts`
- `apps/web/tests/pricing-mobile-decision-hierarchy.contract.test.ts`

Aktualisiert:

- `apps/web/tests/pricing-page.contract.test.ts`
- `apps/web/tests/pricing-private-member-price.contract.test.ts`
- `apps/web/tests/private-package-capability-clarity.contract.test.ts`
- `apps/web/tests/pricing-package-logic-aligned-with-create.contract.test.tsx`

## Verifikation

Ausgefuehrt:

```bash
pnpm -C apps/web exec vitest run tests/pricing-page.contract.test.ts tests/pricing-short-main-flow.contract.test.ts tests/pricing-private-member-price.contract.test.ts tests/private-package-capability-clarity.contract.test.ts tests/pricing-package-logic-aligned-with-create.contract.test.tsx tests/pricing-i18n.contract.test.ts tests/pricing-initiative-link.contract.test.ts tests/pricing-private-package-prices.contract.test.ts tests/pricing-main-page-simplified-decision-flow.contract.test.ts tests/pricing-membership-block-clarity.contract.test.ts tests/pricing-package-capabilities-visible.contract.test.ts tests/pricing-no-extra-middle-blocks.contract.test.ts tests/pricing-b2b-secondary-only.contract.test.ts tests/pricing-mobile-decision-hierarchy.contract.test.ts
pnpm -C apps/web exec vitest run tests/wrapper-mvp-surface-contract.test.ts tests/mobile-app-shell-contract.test.ts tests/wrapper-android-mvp-policy.test.ts
pnpm -C apps/web exec tsc --noEmit
```

Ergebnis:

- alle ausgefuehrten Pricing-/Wrapper-/Typecheck-Checks gruen
