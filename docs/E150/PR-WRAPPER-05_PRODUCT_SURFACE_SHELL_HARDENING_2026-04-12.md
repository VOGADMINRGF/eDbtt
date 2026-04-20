# PR-WRAPPER-05 - Product Surface Shell / Wrapper Hardening (2026-04-12)

## Scope

Dedizierter Einbettungs-Slice fuer produktnahe Flaechen:

- `/pricing`
- `/vormerken`
- `/pricing/institutionen`

Ziel war **kein** neues Featurepaket, sondern Layout-/Shell-Hardening:

- Wrapper-/Container-Drift reduzieren
- mobile-first Einbettung stabilisieren
- Safe-Area-/Bottom-Nav-Spacing konsistent machen
- Header/Footer-Uebergaenge ruhiger machen
- Contract-basierte Wiederverwendbarkeit fuer weitere Produktseiten schaffen

## Umsetzung

### 1) Kanonischer Product-Surface-Layout-Contract

Neu:

- `apps/web/src/features/wrapper/productSurfaceLayoutContract.ts`

Enthaelt:

- explizite Pfadklassifikation fuer `/pricing`, `/vormerken`, `/pricing/institutionen`
- gemeinsame Main-/Shell-Containerklassen fuer Produktseiten
- helper fuer testbare Surface-Zuordnung

### 2) Gemeinsame Product-Surface-Shell-Komponente

Neu:

- `apps/web/src/components/layout/ProductSurfaceShell.tsx`

Zweck:

- eine gemeinsame Wrapper-Struktur fuer die drei Pricing-nahen Hauptflaechen
- keine parallelen Sonderhuellen je Seite
- klare Data-Attribute fuer Contract-Tests (`data-product-surface-root`, `data-product-surface-shell`)

Anbindung:

- `apps/web/src/app/pricing/page.tsx`
- `apps/web/src/app/vormerken/page.tsx`
- `apps/web/src/app/pricing/institutionen/page.tsx`

### 3) Mobile-App-Shell-Padding nur einmal am Site-Main

Anpassungen:

- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/globals.css`

Wichtig:

- Root-Main ist jetzt explizit markiert (`data-site-main="true"`)
- Bottom-Nav-Safe-Area-Padding wirkt nur auf diesen Main
- kein breiter Selektor mehr auf alle `main`-Elemente (verhindert doppelte Padding-Kaskaden bei verschachtelten Page-Mains)

### 4) Manual-QA fuer Wrapper-/Layout-Pfade erweitert

Ergaenzt:

- `docs/E150/QA_MANUAL_CHECKLIST_CRITICAL_JOURNEYS_2026-04-12.md`

Neue Pflichtpunkte:

- mobile/tablet/desktop Einbettung fuer `/pricing`, `/vormerken`, `/pricing/institutionen`
- keine Doppel-Wrapper
- keine Safe-Area-/Bottom-Spacing-Leerzonen
- kein Layout-Drift bei Segmentfokus/Add-ons

## Verifikation

Ausgefuehrt:

- `pnpm -C apps/web exec vitest run tests/product-surface-shell.contract.test.tsx tests/mobile-app-shell-contract.test.ts tests/pricing-page.contract.test.ts tests/vormerken-page.contract.test.tsx tests/pricing-institutionen-page.contract.test.ts`
- `pnpm -w run tc:web`

## Ergebnis

Der Slice ist abgeschlossen:

- Produktnahe Pricing-Flaechen sind ueber einen gemeinsamen Shell-/Container-Contract eingebettet
- mobile Shell-Bottom-Spacing ist konsistent und ohne doppeltes `main`-Padding
- Wrapper-/Shell-Verhalten ist testbar und dokumentiert
- Manual-QA enthaelt explizite Layout-/Safe-Area-/Container-Pruefpunkte
