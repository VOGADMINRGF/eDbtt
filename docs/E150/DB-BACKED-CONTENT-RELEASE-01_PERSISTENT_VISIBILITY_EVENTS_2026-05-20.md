# DB-BACKED-CONTENT-RELEASE-01

Stand: 2026-05-20

## Scope

Persistenzhaertung fuer den bestehenden Content-Release-/Visibility-Pfad:

- `make_visible`
- `retract_visibility`
- `archive_target`
- Public URL / Share / QR
- `topic_page`-Ziele ueber `PublicTopicPageRepository`
- Admin-/Org-Readmodels auf derselben persistierten Quelle

Nicht im Scope:

- Auto-Publish
- automatisches `public_official`
- Social Publishing
- Payment
- GeoReferenceLayer
- neue AI-/Source-Adapter-Logik
- neue Produktparallelwelt

## Umsetzung

### Repository-Haertung

- `features/contentReleaseWorkbench.ts`
  - `ContentReleaseRepository` exponiert jetzt expliziten Persistenzmodus via `getPersistenceState()`.
  - Batchfaehige Audit-Leser `listAuditEventsForRecords(...)` ergaenzen den stabilen Repo-Vertrag.
  - In-Memory bleibt explizit `in_memory_fallback` und ist nie Produktionswahrheit.
  - Persistente Visibility-/Archive-Aktionen spiegeln fuer production-truth Stores zusaetzlich in den bestehenden Audit-Stream (`recordAuditEvent`), ohne neuen Audit-Store.

### Persistierte Readmodels

- `features/reviewQueue.ts`
  - traegt `contentReleasePersistence` jetzt explizit im zentralen Review-Readmodel mit.
- `features/region/organizationDashboard.ts`
  - uebernimmt dieselbe `contentReleasePersistence` fuer den Organisationsbereich.
- `features/publicTopicPage.ts`
  - `PublicTopicPageRepository` exponiert dieselbe Persistenzgrenze und bleibt fuer `topic_page` auf denselben Content-Release-Records.

### UI / Surfaces

- `/admin/review`
  - zeigt `Content-Release-Persistenz` explizit neben der Queue-Operations-Persistenz.
  - Workbench-Karten markieren die persistierte Sichtbarkeitsquelle sichtbar.
- `/account/organization/dashboard`
  - zeigt im Bereich `Veröffentlichbare Inhalte` dieselbe persistierte Content-Release-Quelle.
- `/topic/[slug]`, Dossier-Topic-Andockung und `/runden`
  - bleiben auf persistierten Content-Release-/Topic-Page-Records; Public Links kommen nicht aus transientem UI-Zustand.

## Tests

Gezielt gruen:

- `pnpm -C apps/web exec vitest run tests/content-release-workbench.test.ts tests/content-release-repository.test.ts tests/topic-public-page.contract.test.tsx tests/review-queue.readmodel.test.ts tests/admin-review.page.test.tsx tests/organization-dashboard.readmodel.test.ts tests/account-organization-dashboard.page.test.tsx tests/persistence-inventory.contract.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm --filter @vog/web build`

Abgedeckt:

- `make_visible` bleibt ueber Repo/Audit rekonstruierbar
- `retract_visibility` bleibt ueber Repo/Audit rekonstruierbar
- `archive_target` bleibt ueber Repo/Audit rekonstruierbar und loescht nicht hart
- `public_official` wird im Content-Release-Pfad nie automatisch gesetzt
- Public URL / Share / QR erscheinen nur aus persistiert sichtbarem Zustand
- `/admin/review` und `/account/organization/dashboard` tragen den persistierten Content-Release-State sichtbar durch
- `PublicTopicPageRepository` und `/topic/[slug]` respektieren denselben persistierten Status
- In-Memory-Fallback ist explizit nicht Produktionswahrheit

## Geaenderte Dateien

- `features/contentReleaseWorkbench.ts`
- `features/publicTopicPage.ts`
- `features/reviewQueue.ts`
- `features/region/organizationDashboard.ts`
- `features/persistenceInventory.ts`
- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/admin/review/ContentReleaseWorkbenchActions.tsx`
- `apps/web/src/app/account/organization/dashboard/page.tsx`
- `apps/web/tests/content-release-workbench.test.ts`
- `apps/web/tests/content-release-repository.test.ts`
- `apps/web/tests/review-queue.readmodel.test.ts`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/organization-dashboard.readmodel.test.ts`
- `apps/web/tests/account-organization-dashboard.page.test.tsx`
- `apps/web/tests/persistence-inventory.contract.test.ts`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`

## Ergebnis

Der produktionskritische Content-Release-Zustand ist jetzt als persistente, explizit gekennzeichnete Wahrheit gehaertet. Visibility, Archive, Public Links und `topic_page`-Ableitungen laufen weiter auf der bestehenden Route- und Produktfamilie, aber nicht mehr implizit als transiente Runtime-Annahme.
