# PR-PRICING-MAIN-SIMPLIFY-02

Datum: 2026-04-19  
Status: done

## Ziel

Mikro-Feinschliff auf `/pricing` nach dem ersten Simplify-Slice:

- Karteninformation weiter komprimieren
- Mitgliedschaft visuell klarer priorisieren
- CTA-Verben auf den drei Privatpaketen parallelisieren
- EN-Copy ruhiger machen
- B2B/B2G-Nebenpfad visuell noch leiser staffeln

## Umsetzung

### 1) Karten im compact-Flow weiter verdichtet

Datei:

- `apps/web/src/components/pricing/PackagesGrid.tsx`

Ergebnis:

- Im `compact`-Modus sind `Für wen` + `Wofür gedacht` in einem kombinierten Block gebuendelt.
- Dadurch ist der Kartenkopf auf Mobile schneller scannbar und die vertikale Last pro Karte sinkt.

### 2) Mitgliedschaft mit Preis-Highlights priorisiert

Datei:

- `apps/web/src/app/pricing/page.tsx`

Ergebnis:

- Zwei Kernpreise sind als sichtbare Highlights direkt unter der Introzeile gesetzt:
  - `Mitgliedspreis fuer Interessiert: 0 EUR`
  - `Regulaerer Preis fuer Interessiert: 3,99 EUR`
- Restliche Klarstellung bleibt kompakt darunter (Beitrag unabhaengig, Empfehlung 5,63 EUR, finale E-Mail-Bestaetigung, Trenn-/Sicherheitslogik).

### 3) CTA-Parallelitaet vereinheitlicht

Dateien:

- `features/pricing/domain/plans.de.ts`
- `features/pricing/domain/plans.en.ts`

Ergebnis:

- Privat-CTAs laufen jetzt strikt parallel:
  - DE: `Beitragen` / `Prüfen` / `Entwerfen`
  - EN: `Contribute` / `Review` / `Draft`

### 4) EN-Copy enttechnisiert + B2B-Hinweis beruhigt

Datei:

- `apps/web/src/app/pricing/page.tsx`

Ergebnis:

- EN-Formulierung zur Trennlogik ist ruhiger und weniger technisch.
- B2B/B2G-Nebenpfad bleibt 1 Satz + 1 CTA, mit reduzierter vertikaler/visueller Lautstaerke.

## Tests / Contracts

Aktualisiert:

- `apps/web/tests/pricing-membership-block-clarity.contract.test.ts`
- `apps/web/tests/pricing-package-logic-aligned-with-create.contract.test.tsx`

Zusatz-Verifikation (weiterhin gruen):

- `apps/web/tests/pricing-page.contract.test.ts`
- `apps/web/tests/pricing-main-page-simplified-decision-flow.contract.test.ts`
- `apps/web/tests/pricing-package-capabilities-visible.contract.test.ts`
- `apps/web/tests/pricing-no-extra-middle-blocks.contract.test.ts`
- `apps/web/tests/pricing-b2b-secondary-only.contract.test.ts`
- `apps/web/tests/pricing-mobile-decision-hierarchy.contract.test.ts`

## Verifikation

Ausgefuehrt:

```bash
pnpm -C apps/web exec vitest run tests/pricing-page.contract.test.ts tests/pricing-short-main-flow.contract.test.ts tests/pricing-private-member-price.contract.test.ts tests/private-package-capability-clarity.contract.test.ts tests/pricing-package-logic-aligned-with-create.contract.test.tsx tests/pricing-i18n.contract.test.ts tests/pricing-initiative-link.contract.test.ts tests/pricing-private-package-prices.contract.test.ts tests/pricing-main-page-simplified-decision-flow.contract.test.ts tests/pricing-membership-block-clarity.contract.test.ts tests/pricing-package-capabilities-visible.contract.test.ts tests/pricing-no-extra-middle-blocks.contract.test.ts tests/pricing-b2b-secondary-only.contract.test.ts tests/pricing-mobile-decision-hierarchy.contract.test.ts
pnpm -C apps/web exec vitest run tests/wrapper-mvp-surface-contract.test.ts tests/mobile-app-shell-contract.test.ts tests/wrapper-android-mvp-policy.test.ts
pnpm -C apps/web exec tsc --noEmit
```

Ergebnis:

- alle ausgefuehrten Pricing-/Wrapper-/Typecheck-Checks gruen
