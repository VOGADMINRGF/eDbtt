# REGION-SOURCE-SNAPSHOT-TEMPLATE-01

Stand: 2026-05-19

## Ziel

Generische regionale Source-Snapshot-Templates sollen fuer beliebige `regionId` funktionieren:

- Gemeinden
- Staedte
- Kommunen
- Bezirke
- Regionen
- internationale Regionen

Eine explizite URL kann damit reviewpflichtig als reproduzierbarer Snapshot in dieselbe URL-to-Publish-Kette uebergehen:

Quelle / URL
-> moegliche Aussagen, Themen, Belege, offene Fragen
-> Review Queue
-> Dossier-/Anlassraum-Vorschau
-> bewusster Sichtbarkeits-Schritt

## Umsetzung

- `features/region/sourceConnections.ts` fuehrt einen typed `RegionSourceSnapshotTemplate`-Contract ein.
- `curated_pilot_source` kann jetzt reproduzierbare `template_only`-Snapshots tragen.
- `municipal_news` und `official_feed` koennen zusaetzliche Snapshot-Hinweise als `template_plus_explicit_url` mitfuehren.
- `features/region/server/sourceConnectionRuntime.ts` baut daraus reviewpflichtige `Source Results`, ohne neue Parallel-Runtime.
- Die bestehende Review Queue uebernimmt diese `Source Results` weiter als reviewpflichtige Aufgaben.
- Die bestehende Content Release Workbench kann daraus Dossier- oder Anlassraum-Entwuerfe vorbereiten.

## Guardrails

- Kein Live-Crawler.
- Kein Scraping.
- Keine DeepSearch-Automatikkosten.
- Keine automatische Veroeffentlichung.
- Kein automatisches `public_official`.
- Keine automatische Dossier-/Anlassraum-Finalisierung.
- Reinickendorf ist nur Beispiel-Seed, keine Produktlogik.

## UI

- `/admin/region`
  - generischer Hinweis auf regionale Source-Snapshot-Templates
  - Snapshot-Typ `Regionales Snapshot-Template` oder `Beispiel-Seed`
  - Snapshot-/Review-Hinweise direkt an Quelle und `Source Result`
- `/admin/regions`
  - Quellenstatus
  - Snapshot vorhanden
  - Review-CTA
- `/admin/review`
  - `Source Result` zeigt Snapshot-Template-Hinweis
  - Review-to-Publish-Workbench bleibt derselbe Pfad

## Beispiel-Seed

Reinickendorf wird nur noch als Beispiel-Seed verwendet:

- `Beispiel-Snapshot`
- `Beispiel-Seed`

Die Produktlogik ist aber region-generic und arbeitet nicht berlin-only oder bezirks-only.

## Validierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/admin-region-source-connections.route.test.ts tests/review-queue.readmodel.test.ts tests/content-release-workbench.test.ts tests/admin-region-page.render.test.tsx tests/admin-review.page.test.tsx tests/admin-regions-page.render.test.tsx tests/admin-region-cockpit.route.test.ts tests/region-intelligence.contract.test.ts`
- `pnpm --filter @vog/web build`

## Relevante Dateien

- `features/region/sourceConnections.ts`
- `features/region/server/sourceConnectionRuntime.ts`
- `features/reviewQueue.ts`
- `apps/web/src/app/admin/region/RegionSourceConnectionsPanel.tsx`
- `apps/web/src/app/admin/regions/page.tsx`
- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/tests/admin-region-source-connections.route.test.ts`
- `apps/web/tests/review-queue.readmodel.test.ts`
- `apps/web/tests/content-release-workbench.test.ts`
- `apps/web/tests/admin-region-page.render.test.tsx`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/admin-regions-page.render.test.tsx`
- `apps/web/tests/admin-region-cockpit.route.test.ts`
- `apps/web/tests/region-intelligence.contract.test.ts`
