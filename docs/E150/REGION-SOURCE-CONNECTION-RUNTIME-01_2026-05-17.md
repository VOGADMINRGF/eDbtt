# REGION-SOURCE-CONNECTION-RUNTIME-01

Stand: 2026-05-17  
Issue: `#161`

## Ziel

Regionen sollen produktive, manuelle und kuratierte Quellen explizit konfigurieren und testweise
auswerten koennen, ohne daraus einen allgemeinen Live-Crawler, unkontrolliertes Scraping oder
automatische Folgeaktionen zu machen.

## Umgesetzt

### 1. Source Connection Runtime und Registry

Neu eingefuehrt wurden ein persistenter Runtime-/Registry-Pfad und typed Contracts fuer regionale
Quellverbindungen:

- `features/region/sourceConnections.ts`
- `features/region/server/sourceConnectionRuntime.ts`

Unterstuetzte Typen:

- `manual_source`
- `curated_pilot_source`
- `official_feed`
- `municipal_news`

Guardrails bleiben am Contract sichtbar:

- `reviewRequired`
- `noLiveCrawlerClaim`
- `noScraping`
- `noDeepSearchAutoCosts`

`official_feed` und `municipal_news` akzeptieren nur explizite URLs.

### 2. Dry Run statt Live-Lauf

Dry Runs erzeugen bewusst nur reviewpflichtige `RegionSourceTestResult`-Eintraege:

- `resultMode: dry_run`
- `visibilityState: internal_review`
- `reviewStatus: needs_review`
- `noAutoPublish: true`
- `noPublicOfficial: true`

Es gibt keinen allgemeinen Live-Crawler, keine automatische DeepSearch-Ausloesung, kein Social
Publishing und keine automatische Veroeffentlichung.

### 3. Review Queue und Admin-Surfaces

Die Ergebnisse erscheinen als reviewpflichtige `Source Results` in den bestehenden
Fachoberflaechen:

- `/admin/region?regionId=...`
- `/admin/regions`
- `/admin/review`

Die zentrale Queue verwendet dafuer die bestehende Review-Readmodel-Aggregation statt einer neuen
Parallel-Runtime.

### 4. APIs

Neue Admin-APIs:

- `GET/POST /api/admin/region/source-connections`
- `POST /api/admin/region/source-connections/[id]/test`

Die Berechtigung bleibt an bestehende Region-Review-/Draft-Rechte gebunden.

## Bewusst nicht umgesetzt

- kein allgemeiner Live-Crawler
- kein unkontrolliertes Scraping
- keine DeepSearch-Automatikkosten
- kein Social Publishing
- keine automatische Veroeffentlichung
- kein `public_official`
- keine automatische Dossier-/Anlassraum-Finalisierung
- kein Payment
- kein GeoReferenceLayer

## Validierung

Ausgefuehrt:

- `pnpm -C apps/web exec vitest run tests/admin-region-source-connections.route.test.ts tests/admin-region-page.render.test.tsx tests/admin-regions-page.render.test.tsx tests/admin-review.page.test.tsx tests/review-queue.readmodel.test.ts tests/admin-region-cockpit.route.test.ts`
- `pnpm -C apps/web exec tsc --noEmit -p tsconfig.json --pretty false`

## Follow-up

`REGION-INTELLIGENCE-SOURCE-CONNECTION-01` bleibt offen: der produktive Adapter ist jetzt
konfigurierbar und review-first testbar, aber noch nicht als echte externe Laufzeitquelle auf
`connected` gehoben.
