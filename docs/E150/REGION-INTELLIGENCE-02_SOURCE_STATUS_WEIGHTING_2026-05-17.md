# REGION-INTELLIGENCE-02

Stand: 2026-05-17  
Issue: `#159`

## Ziel

Region Intelligence produktionsnaeher machen, ohne neue Live-Quellen zu behaupten:

- konfigurierbare regionale Quellen vorbereiten
- produktive / kuratierte / manuelle Quellen klar unterscheiden
- Quellenstatus und regionale Gewichtung sichtbar machen
- typed Source-Adapter-Contract vorbereiten
- Intelligence-Ergebnisse als reviewpflichtige Vorschlaege in Startlage und Review-Queue fuehren

## Umgesetzt

### 1. Typed Source-Adapter-Contract

`features/region/intelligence.ts` fuehrt jetzt einen expliziten Contract fuer drei Quellkategorien:

- `productive_regional_source`
- `curated_starting_point`
- `manual_review_queue`

Je Adapter werden Status, Beschreibung, Gewichtung, erlaubte Source-Kinds und Guardrails getragen.

Wichtige Guardrails:

- `noLiveCrawlerClaim`
- `noScraping`
- `noDeepSearchAutoCosts`
- review-only

### 2. Sichtbarer Quellenstatus

Die Preparation liefert jetzt zusaetzlich:

- `configuredSources`
- `sourceStatusSummary`
- `weightingSummary`
- `reviewSuggestions`

Damit werden produktive, kuratierte und manuelle Quellen in der UI nicht mehr implizit vermischt.

### 3. Reviewpflichtige Intelligence-Vorschlaege

Region Intelligence erzeugt jetzt reviewpflichtige Vorschlaege fuer:

- Themencluster
- Dossier-Vorschlaege
- Anlassraum-Vorschlaege

Diese Vorschlaege bleiben `internal_review` und werden nicht automatisch veroeffentlicht, nicht automatisch amtlich und nicht automatisch finalisiert.

## Sichtbare Oberflaechen

### `/admin/regions`

- zeigt jetzt einen Region-Intelligence-Ueberblick
- trennt produktive / kuratierte / manuelle Quellen sichtbar
- erklaert, dass Importquellen keine Render-Abhaengigkeit sind

### `/admin/region?regionId=...`

- zeigt Quellenstatus fuer produktive / kuratierte / manuelle Quellen
- zeigt vorbereitete Gewichtung
- zeigt reviewpflichtige Intelligence-Vorschlaege in der Startlage

### `/account/organization/dashboard`

- zeigt Quellenstatus, Gewichtung und Review-Vorschlaege in der regionalen Startlage
- bleibt dabei organisationsbezogen und review-first

### `/admin/review`

- aggregiert jetzt auch `Region-Intelligence-Vorschlaege`
- nutzt dieselbe zentrale Review-Queue statt einer neuen Parallel-Runtime

## Nicht umgesetzt

Bewusst nicht Teil dieses Slices:

- keine echte produktive Live-Quelle angebunden
- keine Live-Crawler-Behauptung
- kein Scraping
- keine DeepSearch-Automatikkosten
- kein `public_official`
- keine automatische Veroeffentlichung
- keine automatische Dossier-/Anlassraum-Finalisierung
- kein Social Publishing
- kein Payment
- kein GeoReferenceLayer

## Validierung

Ausgefuehrt:

- `pnpm -C apps/web exec vitest run tests/region-intelligence.contract.test.ts tests/admin-region-page.render.test.tsx tests/admin-regions-page.render.test.tsx tests/organization-dashboard.readmodel.test.ts tests/account-organization-dashboard.page.test.tsx tests/review-queue.readmodel.test.ts tests/admin-review.page.test.tsx`
- `pnpm -C apps/web exec tsc --noEmit -p tsconfig.json --pretty false`
- `pnpm -C apps/web run lint`

Ergebnis:

- Tests gruen
- Typecheck gruen
- Lint gruen

## Follow-up

Naechster sauberer Anschluss:

- `REGION-INTELLIGENCE-SOURCE-CONNECTION-01`

Damit wird spaeter eine erste echte produktive Regionalquelle an den bereits vorbereiteten Adapter-Contract angeschlossen, ohne die Render- oder Review-Guardrails aufzuweichen.
