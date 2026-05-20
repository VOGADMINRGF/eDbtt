# DB-BACKED-REVIEW-OPERATIONS-01

Stand: 2026-05-20

## Ziel

Nach `PERSISTENCE-INVENTORY-HARDENING-01` sollte der bestehende Review-Operations-Overlay nicht
nur implizit persistent sein, sondern als explizit rekonstruierbare Operator-Wahrheit lesbar
werden:

- dauerhafte Zuweisungen
- dauerhafte Notizen
- dauerhafte operatorische Statuswechsel
- nachvollziehbare Activity-/Audit-Historie
- klar markierter In-Memory-Fallback statt stiller Produktionsbehauptung

## Umsetzung

- `features/reviewQueueOperations.ts`
  - `ReviewQueueOperationsRepository` um Persistenzstatus (`persistent_primary` vs.
    `in_memory_fallback`) gehärtet
  - batchfähige Audit-Leser `listAuditEventsForItems(...)` ergänzt
  - expliziter Dev-/Test-/Runtime-Fallback-Hinweis für In-Memory-Szenarien ergänzt
- `features/reviewQueue.ts`
  - Operations-Overlay liest jetzt Status, Assignment, Notizen und Activity-Trail zentral aus dem
    Repository
  - Readmodel trägt `operationsPersistence` sichtbar mit
- `features/region/organizationDashboard.ts`
  - Organisationsdashboard übernimmt dieselbe Operations-Persistenzquelle statt einer separaten
    Dashboard-Sicht
- `/admin/review`
  - zeigt Persistenzstatus und letzte Activity-Einträge aus demselben Overlay
- `/account/organization/dashboard`
  - zeigt denselben Persistenzstatus und dieselbe letzte Activity im eigenen Scope

## Guardrails

- keine Bulk-Freigabe
- kein Auto-Publish
- kein automatisches `public_official`
- `public_official` bleibt separater Official-Release-Pfad
- kein Payment
- kein Social Publishing
- keine neue Produktparallelwelt

## Verifikation

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/review-queue-operations.repo.test.ts tests/review-queue.readmodel.test.ts tests/admin-review-item-ops.route.test.ts tests/organization-dashboard.readmodel.test.ts tests/admin-review.page.test.tsx tests/account-organization-dashboard.page.test.tsx tests/persistence-inventory.contract.test.ts`
- `pnpm --filter @vog/web build`

## Ergebnis

Review Queue Operations sind jetzt als DB-backed bzw. klar fallback-markierte Operator-Wahrheit
gehärtet:

- `assign` bleibt über Repository-Lesezugriffe erhalten
- `add_note` bleibt über Repository-Lesezugriffe und Audit-Historie erhalten
- `archive`, `block` und `request_changes` ändern nur den operatorischen Overlay-Status und setzen
  nie automatisch `public_official`
- Review Queue und Organisationsdashboard lesen dieselbe persistierte Operationsquelle
- In-Memory-Fallback ist ausdrücklich nur Dev-/Test-/Runtime-Fallback und nicht
  Produktionswahrheit
