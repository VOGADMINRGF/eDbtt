# REGION-DATA-IMPORT-01

Datum: 2026-05-16
Status: done

## Ziel

Die Region-/Verwaltungsdatenbasis so härten, dass `RegionRegistry` und `OfficialDirectory` getrennt behandelt werden und fehlende Importdateien niemals `/admin/regions` oder `/admin/region` crashen.

## Nicht-Ziele

- kein GeoReferenceLayer
- kein OSM/PostGIS
- kein Live-Crawler
- kein Scraping
- kein Payment
- kein Publishing
- keine neue Anlassraum-Logik

## Umgesetzt

- `features/region/directory.ts` trennt jetzt explizit:
  - `RegionRegistry`
  - `OfficialDirectory`
- Neue Import-/Repository-Abstraktionen:
  - `importOfficialDirectoryFromXlsx`
  - `importRegionRegistrySnapshot`
  - `listRegionsFromRegistry`
  - `listOfficialBodiesForRegion`
  - `getDirectorySourceStatus`
- Fehlende Dateien liefern Missing-States statt Throws:
  - fehlende XLSX -> `Amtliche Verwaltungsanschriften sind nicht verbunden.`
  - fehlender RegionRegistry-Snapshot -> `Amtliches Gemeindeverzeichnis ist nicht verbunden.`
- `/admin/regions`:
  - liest die produktive Übersicht nur aus `RegionRegistry`
  - zeigt bei fehlender Registry den Missing-State
  - hält manuelle/Pilot-Regionen getrennt sichtbar
  - behauptet keine Demo- oder Fixture-Daten als amtlich
- `/admin/region`:
  - rendern für manuelle Regionen bleibt ohne XLSX-/Snapshot-Abhängigkeit stabil
  - unbekannte oder nicht verfügbare Region-IDs redirecten sauber nach `/admin/regions`
- `listOperationalRegions()`:
  - nutzt zuerst `RegionRegistry`
  - ergänzt manuelle Fixtures nur noch als Fallback
  - behandelt `OfficialDirectory` nicht mehr als alleinige RegionRegistry

## Guardrails

- XLSX/CSV/API bleiben Importquellen, nicht UI-Renderpfad
- keine Fake-Daten als amtlich
- keine Demo-Daten als RegionRegistry
- manuelle Regionen bleiben nutzbar
- `OfficialDirectory` bleibt getrennt von der kanonischen Regionsbasis

## Geänderte Dateien

- `features/region/directory.ts`
- `features/region/store.ts`
- `apps/web/src/app/admin/regions/page.tsx`
- `apps/web/src/app/admin/region/page.tsx`
- `apps/web/tests/admin-regions-page.render.test.tsx`
- `apps/web/tests/admin-region-page.render.test.tsx`
- `apps/web/tests/regional-directory-import-foundation.contract.test.ts`
- `docs/E150/ProductionReadinessMatrix.md`
- `docs/E150/OpenTasks.md`

## Tests

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/regional-directory-import-foundation.contract.test.ts tests/regional-official-directory.contract.test.ts tests/admin-regions-page.render.test.tsx tests/admin-region-page.render.test.tsx`

## Ergebnis

- Die Import-Foundation ist jetzt sauber getrennt.
- Eine fehlende amtliche Datei führt zu ehrlichen Missing-States statt zu UI-Abstürzen.
- `OfficialDirectory` kann weiterhin aus XLSX gelesen werden, ist aber nicht mehr implizit die `RegionRegistry`.
- Der nächste fachliche Anschluss bleibt `REGION-INTELLIGENCE-01`, sobald eine echte RegionRegistry-Quelle angebunden wird.
