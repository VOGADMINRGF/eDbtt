# PR-PRICING-TAGS-ANNUAL-01 + PR-PRICING-HANDOFF-CLICK-01 Revalidation (2026-04-30)

## Scope
- `/pricing`
- `/pricing/institutionen`
- `/vormerken`
- `/order`

## Ziel
- Preis-/Abrechnungslabels auf relevanten Paketkarten klar und konsistent halten.
- CTA-Klickpfade stabil und segmentkontextfest halten (`segment`, `paket`, `completion`).

## Umsetzung
- Neue Contracts:
  - `apps/web/tests/pricing-tags-annual-handoff.contract.test.ts`
  - `apps/web/tests/order-entry.contract.test.ts`
- Bestehende Contracts bleiben erhalten und sichern weiterhin:
  - Kommunen-Bridge auf `/pricing` -> `/pricing/institutionen?segment=kommunen#guided-selection`
  - institutionelle CTA-Handoffs mit `segment`, `paket`, `completion`
  - Paketwechsel trotz Query-Preselection

## Verifizierte Aussagen
- B2C-Preislabels bleiben `inkl. MwSt.`.
- B2B/B2G-Preislabels bleiben `zzgl. MwSt.`.
- Abrechnungsrhythmus bleibt sichtbar (`monatlich`, `einmalig`, `jährliche Zahlung bevorzugt` wo sinnvoll).
- Keine Skonto-/Pseudo-Rabatt-Copy.
- `/order` bleibt Wrapper fuer denselben paketfuehrenden Einstieg wie `/vormerken`.

## Validierung
- `pnpm -C apps/web run typecheck` ✅
- `pnpm -C apps/web run lint` ✅
- `pnpm -C apps/web exec vitest run tests/pricing-*.test.ts tests/order-*.test.ts` ✅

Hinweis: Es besteht weiterhin eine bereits bekannte, nicht-slice-spezifische Lint-Warnung in `apps/web/src/components/dossier/DossierViewer.tsx` (`react-hooks/exhaustive-deps`), ohne neue Fehler.
