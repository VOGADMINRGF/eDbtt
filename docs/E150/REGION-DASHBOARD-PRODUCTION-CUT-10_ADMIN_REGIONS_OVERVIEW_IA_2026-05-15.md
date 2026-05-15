# REGION-DASHBOARD-PRODUCTION-CUT-10

Datum: 2026-05-15

## Scope

- neue Übersichtssurface `/admin/regions`
- bestehende `/admin/region`-Surface als Detail-/Arbeitsansicht schärfen
- Admin-Navigation auf die neue Übersicht umstellen
- produktive Directory-Einträge und Pilot-/Fixture-Pfade getrennt zeigen

## Ziel

Die regionale Admin-IA soll klar zwischen Überblick und Arbeitsansicht trennen:

- `/admin/regions` = produktive Betreiber-/Admin-Übersicht
- `/admin/region?regionId=...` = Detail-/Arbeitsansicht

Ohne neue Fachlogik, ohne neue Write-Pfade und ohne zusätzliche Scope-Ausweitung.

## Umsetzung

### 1. Neue Overview-Route

Neue Seite:

- `apps/web/src/app/admin/regions/page.tsx`

Verhalten:

- nutzt `listOperationalRegions()`
- trennt Einträge in:
  - produktive Directory-basierte Regionen
  - Pilot-/Fixture-Pfade
- jeder Eintrag führt explizit nach:
  - `/admin/region?regionId=...`

Wichtige Guardrails in der Copy:

- keine GeoReference
- kein Live-Crawler
- kein Payment
- keine Publishing-Logik
- keine Reinickendorf-only-Sonderführung

### 2. `/admin/region` als Arbeitsansicht geschärft

Datei:

- `apps/web/src/app/admin/region/page.tsx`

Änderungen:

- fehlendes `regionId` redirectet jetzt nach `/admin/regions`
- der bisherige Region-Selector im Kopf wurde entfernt
- stattdessen zeigt die Surface:
  - Rücksprung zur Übersicht
  - sichtbaren Arbeitskontext
  - Hinweis auf die Detailroute

Die Fachmodule der bestehenden Surface bleiben unverändert:

- Access Summary
- Guardrails
- Feed-/Signal-Hinweise
- Leitlinienmatrix
- Public Participation
- Suggestions / Review / Prepare-only

### 3. Admin-Navigation

Datei:

- `apps/web/src/app/admin/adminNav.ts`

Änderung:

- Nav-Eintrag zeigt jetzt auf `/admin/regions`
- Label/Copy wurde auf Overview-Semantik angepasst

## Bewusst nicht geändert

- keine GeoReference-Layer-Logik
- kein Live-Crawler
- kein Payment-/Checkout-/Billing-Pfad
- keine neue Publishing-Logik
- keine neue Draft-/Mutation-API
- keine Reinickendorf-only-Produktlogik

## Geänderte Dateien

- `apps/web/src/app/admin/regions/page.tsx`
- `apps/web/src/app/admin/region/page.tsx`
- `apps/web/src/app/admin/adminNav.ts`
- `apps/web/tests/admin-regions-page.render.test.tsx`
- `apps/web/tests/admin-region-page.render.test.tsx`
- `docs/E150/OpenTasks.md`

## Tests

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/admin-nav-routes.contract.test.ts tests/admin-region-page.render.test.tsx tests/admin-regions-page.render.test.tsx tests/admin-region-entitlement-ui.test.tsx tests/admin-region-participation-signals.test.tsx`

Ergebnis:

- alle genannten Tests grün
- Typecheck grün
- Lint grün

## Ergebnis

Issue `#132` ist damit als reiner UX-/IA-Slice umgesetzt:

- `/admin/regions` ist der neue produktive Einstieg
- `/admin/region` bleibt die bestehende Detail-/Arbeitsansicht
- Pilot-Fixtures werden in der Übersicht getrennt vom produktiven Verzeichnis gezeigt
