# BUILD-MONGO-STATIC-COLLECT-01

Stand: 2026-05-17
Issue: `#164`
Technischer Legacy-Untername: `PR-ENV-02C`

## Ziel

Während `pnpm --filter @vog/web build` sollen bei `Collecting page data` keine Mongo-SRV-Lookups mehr ausgelöst werden, wenn Seiten nur Preview-, Admin- oder fallback-lastige Readmodels rendern.

Nicht Ziel:

- kein DB-Migrationsschnitt
- keine neue Persistenzarchitektur
- kein Austausch von Mongo/Prisma
- keine neue Produktlogik

## Umsetzung

- `core/db/triMongo.ts` exportiert jetzt einen zentralen Static-Collection-Guard ueber `NEXT_PHASE=phase-production-build`.
- Derselbe Guard schaltet waehrend Static Collection produktnahe Read-Zugriffe auf build-sichere leere Collection-/Cursor-Fallbacks um.
- Region-/Admin-/Studio-Repos mit bestehenden In-Memory-Testpfaden nutzen denselben Guard nun auch fuer Build-Zeiten:
  - `features/region/server/repo.ts`
  - `features/region/server/participationSignalReviewRuntime.ts`
  - `features/region/server/sourceConnectionRuntime.ts`
  - `features/region/server/membershipRuntime.ts`
  - `features/region/server/paidEntitlements.ts`
  - `features/region/regionSignalDrafts.ts`
  - `features/dossier/server/studioPersistence.ts`
- `features/region/regionParticipationSignals.ts` ueberspringt Runtime-DB-Lookups im Build und bleibt fixture-safe.
- `features/dossier/lookup.ts` liefert waehrend Static Collection bewusst `null`, damit produktnahe Studio-/Preview-Seiten auf ehrliche Missing-/Empty-States fallen statt eine DB-Verbindung aufzubauen.
- `apps/web/src/app/dossier/[id]/studio/page.tsx` liest im Build keinen Workspace aus Mongo nach.

## Verhalten nach dem Fix

- `Collecting page data` laeuft ohne `querySrv ECONNREFUSED _mongodb._tcp...`.
- Preview-/Admin-/Fallback-Readmodels geben im Build leere, fixture-safe oder bewusst fehlende States zurueck.
- Die echte Request-Runtime bleibt unveraendert; Mongo wird nicht global deaktiviert.
- Client-/Server-Grenzen bleiben unveraendert.

## Verifikation

Ausgefuehrt:

- `pnpm -C apps/web exec vitest run tests/static-collection-mongo-guard.test.ts tests/dossier-output-studio.page.contract.test.ts tests/admin-region-page.render.test.tsx tests/admin-regions-page.render.test.tsx tests/admin-review.page.test.tsx`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm --filter @vog/web build`

Ergebnis:

- Tests gruen.
- Typecheck gruen.
- Lint gruen.
- Web-Build gruen.
- Bei der finalen Build-Revalidierung traten waehrend `Collecting page data` keine `querySrv ECONNREFUSED`-Warnungen mehr auf.
