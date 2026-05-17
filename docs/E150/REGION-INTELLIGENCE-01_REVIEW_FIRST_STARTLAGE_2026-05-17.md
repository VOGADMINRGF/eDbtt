# REGION-INTELLIGENCE-01

Datum: 2026-05-17
Status: done

## Ziel

Eine reviewpflichtige regionale Startlage vorbereiten, die Region-, Organisations- und Ausrichtungs-Kontext strukturiert aufnimmt und daraus Themencluster, Dossier-Vorschläge, Anlassraum-Vorschläge und offene Fragen ableiten kann, ohne daraus einen Live-AI- oder Auto-Publishing-Pfad zu machen.

## Nicht-Ziele

- keine Live-Crawler-Behauptung
- kein Scraping
- keine DeepSearch-Automatikkosten
- kein GeoReferenceLayer
- kein Payment
- kein Publishing
- keine automatische Dossier-/Anlassraum-Erstellung
- keine automatische amtliche Bewertung
- keine Ausschreibungs-/Vergabelogik

## Umgesetzt

- Neuer typed Preparation-Layer in `features/region/intelligence.ts`
  - `buildRegionIntelligencePrompt(...)`
  - `runRegionIntelligencePreparation(...)`
  - `mapRegionIntelligenceToSignals(...)`
- Der Prompt berücksichtigt jetzt explizit:
  - Region
  - Organisation / Rolle / Freischaltungsstatus
  - Ausrichtung / gewünschte Outputs
  - harte Guardrails gegen Live-Crawler-, Scraping-, Vergabe- und Auto-Freigabe-Behauptungen
- Ein deterministischer Adapter ersetzt vorerst echte externe AI-Calls:
  - typed
  - testbar
  - review-first
  - ohne Netz-/Modellabhängigkeit
- `features/region/store.ts` speist das regionale Cockpit jetzt über diese Preparation-Foundation:
  - bestehende Feed-Signale bleiben nutzbar
  - Community-Signale werden weiter reviewpflichtig gemappt
  - Themencluster, Dossier-/Anlassraum-Vorschläge und offene Fragen hängen damit an einem vorbereiteten Intelligence-Pfad statt nur an ad-hoc-Logik

## Guardrails

- keine automatische Veröffentlichung
- kein automatisches Dossier
- kein automatischer Anlassraum
- keine automatische amtliche Einordnung
- keine Ausschreibungs- oder Vergabelogik
- keine Live-Suche oder Scraping-Behauptung
- alles bleibt reviewpflichtig

## Geänderte Dateien

- `features/region/intelligence.ts`
- `features/region/store.ts`
- `features/region/index.ts`
- `apps/web/tests/region-intelligence.contract.test.ts`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`

## Tests

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/region-intelligence.contract.test.ts tests/regional-feed-signals.contract.test.ts tests/regional-dashboard-readmodel.test.ts tests/admin-region-cockpit.route.test.ts`

## Ergebnis

- Die regionale Startlage hat jetzt eine eigene typed Preparation-Struktur.
- Die Produktlogik behauptet weiterhin keine echte Live-AI-Lage.
- Das Cockpit bleibt review-first und kann später an echte Adapter angeschlossen werden, ohne heute Crawler-, Publishing- oder Vergabelogik einzuführen.
