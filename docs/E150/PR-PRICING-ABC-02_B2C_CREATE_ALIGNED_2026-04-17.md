# PR-PRICING-ABC-02 — B2C 3er-Paketwelt create-aligned (2026-04-17)

## Ziel

Die sichtbare Privatlogik auf `/pricing` und `/vormerken` wurde auf eine klare 3er-Struktur umgestellt, direkt entlang der realen `/create`-Nutzungen.

## Umgesetzt

- **SSOT-Pakete aktualisiert** (`features/pricing/domain/plans.de.ts`, `plans.en.ts`)
  - `eDebatte Interessiert`: `0 € für VoiceOpenGov-Mitglieder`, `3,99 € regulär`
  - `eDebatte Aktiv`: `9,90 €`
  - `eDebatte Mitgestaltend`: `29,90 €`
- **User-facing Legacy-Tierbegriffe bereinigt** auf den Pricing-/Vormerken-Surfaces
  - keine sichtbaren `citizen*`- oder technischen Mapping-Begriffe
  - keine sichtbaren alten Paketnamen `Basis/Start/Pro` auf den primären B2C-Flächen
- **`/pricing` neu fokussiert**
  - Primär: drei Privatpakete
  - explizite Brücke zu `/create` (`analyze`/`media`/`guided`)
  - Journalismus/Organisationen/Kommunen als vorbereitete, nachgeordnete Zugänge
- **`/vormerken` semantisch gehärtet**
  - direkter Paketabschluss klar kommuniziert
  - Freischaltung/Aktivierung als separater Folgeschritt
  - Default-Fokus auf Privat-3er-Paketwelt, Sonderzugänge nur vorbereitet

## Tests (angepasst/ergänzt)

- `apps/web/tests/pricing-page.contract.test.ts`
- `apps/web/tests/vormerken-page.contract.test.tsx`
- `apps/web/tests/pricing-vormerken-source-of-truth.contract.test.tsx`
- `apps/web/tests/pricing-i18n.contract.test.ts`
- `apps/web/tests/vormerken-i18n.contract.test.tsx`
- `apps/web/tests/e2e-critical-journeys.test.ts`
- `apps/web/tests/pricing-preorder-verification-gates.contract.test.ts`
- `apps/web/tests/edebatte-preorder.route.test.ts`

## Doc-Sync

- `docs/E150/Part19_Pricing_Packaging.md`
- `docs/E150/membership_pricing.md`
- `docs/E150/Part03_AccessTiers_Pricing_B2C.md`
- `docs/E150/OpenTasks.md`

## Ergebnis

Die öffentliche B2C-Produktführung ist jetzt ruhiger und konsistenter:

- klare 3er-Paketwelt mit 0 €/9,90 €/29,90
- konsistenter Anschluss an `/create`
- vorbereitete institutionelle/journalistische Pfade ohne Dominanz auf der Hauptseite
- getrennte Kommunikation von Paketabschluss vs. Freischaltung
