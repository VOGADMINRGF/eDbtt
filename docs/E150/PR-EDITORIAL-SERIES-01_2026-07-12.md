# Evidence: PR-EDITORIAL-SERIES-01 (2026-07-12)

## Ziel des Slices

`PR-EDITORIAL-SERIES-01` als separaten Produktionsreife-Cluster für
Dossier / Claims / Editorial / Review-first Export umsetzen, ohne
Auto-Publish, Tracking, Scheduling oder externe Provider-Anbindung.

## Umgesetzter Scope

- Neuer gemeinsamer `Editorial Series`-Contract für bestehende Review-/Export-Pfade
- Shared Panel für Editorial-Series-Arbeitsstände
- Integration in:
  - `apps/web/src/app/admin/themenradar/[id]/page.tsx`
  - `apps/web/src/app/dossier/[id]/studio/page.tsx`
  - `apps/web/src/app/admin/editorial/queue/page.tsx`
- Harmonisiertes Queue-Mapping von `triage/review/fact_check/ready/published` auf dieselbe
  review-first Serienwahrheit
- Contract-/Route-Tests für Themenradar-, Dossier- und Admin-Queue-Kontext

## Produktwahrheit

- Editorial Series bleibt review-first und exportgebunden.
- `Entwurf -> review-ready -> approved -> published` wird explizit getrennt sichtbar gemacht.
- `review_ready` ist nicht `approved`.
- `approved` ist nicht `published`.
- Quellen- und Claim-Kontext bleiben im Modell und im Panel sichtbar.
- Es gibt keinen Auto-Publish, kein Tracking, kein Scheduling und kein Social Posting.

## Geänderte Dateien

- `apps/web/src/features/editorialSeries/editorialSeriesContract.ts`
- `apps/web/src/features/editorialSeries/EditorialSeriesPanel.tsx`
- `apps/web/src/app/admin/themenradar/[id]/page.tsx`
- `apps/web/src/app/dossier/[id]/studio/page.tsx`
- `apps/web/src/app/admin/editorial/queue/page.tsx`
- `apps/web/tests/editorial-series.contract.test.tsx`
- `apps/web/tests/admin-editorial-hubs.page.test.tsx`
- `apps/web/tests/dossier-studio-social-queue.contract.test.tsx`
- `apps/web/tests/dossier-studio-server-persistence-ui.test.tsx`
- `docs/E150/OpenTasks.md`

## Validierung

- `git diff --check`
  - grün
- `pnpm -C apps/web exec vitest run tests/editorial-series.contract.test.tsx tests/admin-editorial-hubs.page.test.tsx tests/dossier-studio-server-persistence-ui.test.tsx tests/dossier-studio-social-queue.contract.test.tsx tests/themenradar-export.contract.test.ts tests/themenradar-share-distribution.contract.test.ts tests/themenradar-membership-entry.contract.test.ts`
  - 7 Test Files, 16 Tests grün
- `pnpm -C apps/web run lint`
  - grün
- `pnpm -C apps/web run typecheck`
  - grün
- `pnpm -C apps/web run build`
  - grün

## Umgang mit `/admin/editorial/queue`

- `/admin/editorial/queue` ist aktiv, im Admin-Navi verlinkt und produktionsrelevant für Editorial Review.
- Deshalb wurde die Surface im selben PR an den shared Contract angebunden, statt als bewusste Ausnahme stehen zu bleiben.
- Die Queue zeigt jetzt einen gemeinsamen Editorial-Series-Überblick und pro Zeile einen harmonisierten Serienstatus:
  - `triage` -> `Entwurf`
  - `review` / `fact_check` -> `Review-ready`
  - `ready` -> `Approved`
  - `published` -> `Published`
  - `rejected` / `archived` bleiben explizit außerhalb des aktiven Serienpfads

## Risiken / Rest

- Der Slice liefert einen gemeinsamen Review-/Export-Vertrag und zwei produktive Leseflächen, aber keine neue Publish- oder Approval-Runtime.
- Die Detail-Item-Surface `/admin/editorial/items/[id]` nutzt weiterhin ihre bestehende Statusbedienung; die zentrale Queue-Semantik ist jetzt harmonisiert, aber ein späterer UI-Hardening-Slice könnte die Detailansicht noch enger an dieselbe Darstellung anlehnen.
- Unabhängige Review bleibt sinnvoll, weil der Slice gemeinsame Produktsemantik (`review_ready`, `approved`, `published`) sichtbar harmonisiert.
