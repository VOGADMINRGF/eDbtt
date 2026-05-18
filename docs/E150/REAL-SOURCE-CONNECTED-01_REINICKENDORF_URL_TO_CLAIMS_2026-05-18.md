# REAL-SOURCE-CONNECTED-01

Stand: 2026-05-18
Issue: `#168`
Technischer Untername des Umsetzungsslices: `REGION-SOURCE-URL-REVIEW-01`

## Ziel

Aus einer explizit verbundenen Verwaltungs- oder Regions-URL sollen sofort reviewpflichtige, strukturierte Vorschlaege fuer die weitere Arbeit in eDebatte entstehen, ohne Live-Crawler, unkontrolliertes Scraping, DeepSearch-Automatik oder automatische Veroeffentlichung einzufuehren.

## Umgesetzter Pfad

- `features/region/server/sourceConnectionRuntime.ts` wertet explizite `official_feed`- und `municipal_news`-URLs kontrolliert als Single-Page-Dry-Run aus.
- Die bestehende `features/region/intelligence.ts`-Preparation erzeugt daraus reviewpflichtige Vorschlaege fuer Claims, Themencluster, Anlassraum, Dossier, Quellen-/Belegauszuege, offene Fragen sowie betroffene Region, Ortsteil und Fachbereich.
- `/api/admin/region/source-connections/[id]/test` liefert denselben strukturierten Review-Pfad fuer eine explizit konfigurierte Quelle.
- `/admin/region` zeigt den Arbeitsblock sichtbar als `Quelle auswerten`.
- `/admin/regions` zeigt Quellenstatus plus Review-CTA.
- `/admin/review` fuehrt `Source Results` klar als Review-Aufgaben.

## Guardrails

- Alles bleibt review-first und `internal_review`.
- Kein `public_official`.
- Kein Auto-Publish.
- Keine automatische Dossier- oder Anlassraum-Finalisierung.
- Kein allgemeiner Live-Crawler.
- Kein unkontrolliertes Scraping.
- Keine DeepSearch-Automatikkosten.
- Reinickendorf ist nur der priorisierte Pilotkontext, keine Hardcode-Produktgrenze.

## Validierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/admin-region-source-connections.route.test.ts tests/review-queue.readmodel.test.ts tests/admin-region-cockpit.route.test.ts tests/admin-region-page.render.test.tsx tests/admin-regions-page.render.test.tsx tests/admin-review.page.test.tsx`
- `pnpm --filter @vog/web build`

## Ergebnis

Die URL-to-Claims-Workbench fuer explizite Regionalquellen ist umgesetzt und fuer den Reinickendorf-Pilot operatorisch nutzbar. Offen bleiben bewusst spaetere Folgepfade fuer Live-Crawler, breiteres Scraping, DeepSearch-Automatik und jegliche automatische Veroeffentlichung.
