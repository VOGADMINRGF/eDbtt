# GOV-ATLAS-01B - Erste read-only Atlas-UI (2026-04-04)

## Scope

Erste produktive Surface fuer den Dossier-Atlas als read-only Themenlandschaft:
- neue Route `/atlas` als eigenstaendige Makro-Surface,
- contract-gebundener Readmodel-Adapter aus Anlassraum-/Round-Seed-Daten,
- ruhige mobile-first Struktur-/Flussansicht fuer Thema, Region, Anlassraum, Dossier, Runde, Ergebnis und Companion.

Kein Schreibworkflow, kein Admin-Ausbau, kein Ranking, kein Auto-Publish.

## Umgesetzt

1. Readmodel-Adapter fuer Atlas-Contract
- `features/anlassraum/dossierAtlasReadModel.ts`
- Enthalten:
  - `loadDossierAtlasLandscapeReadModel(...)` fuer DB-basierte Read-only-Ableitung
  - `mapAtlasSourceRecords(...)` als pure Mapper-Funktion fuer Tests
  - Mapping von Lifecycle-/Activity-/Work-State und Kontextgruppen
  - Degrade-tolerante Ableitung ohne neue Macht- oder Prioritaetslogik

2. Erste Atlas-Surface
- `apps/web/src/app/atlas/page.tsx`
- `apps/web/src/app/atlas/AtlasClient.tsx`
- Enthalten:
  - Route `/atlas` (read-only first, `dynamic = "force-dynamic"`)
  - Strukturansicht (Themencluster + Kontextknoten)
  - Flussansicht light (Thema -> Anlass -> Dossier -> Runde -> Ergebnis)
  - getrennte Regionenachse und Kontextmarker
  - klarer Fallback-Hinweis bei Source-Ausfall, ohne Fake-Daten

## Guardrails

- Thema- und Regionenachse bleiben explizit getrennt.
- Kontextmarker (Verband/Verein/Organisation/Redaktion/Civic/Experten) bleiben Sichtbarkeit, kein Wahrheits- oder Prioritaetsprivileg.
- Keine Toplist-/Reputations-/Wahrheitslogik.
- Feed bleibt Signalquelle; kein Auto-Publish im Atlas.
- Read-only first: keine Schreib-/Freigabeaktionen in dieser Surface.

## Tests

- `apps/web/tests/dossier-atlas-readmodel.test.ts`
  - Mapper-Contract fuer Lifecycle/Work-State/Kontextgruppen
  - degradierte/fallbackfaehige Ableitung fuer unvollstaendige Source-Daten

## Offene Folgearbeit (nicht Teil von 01B)

- optionale Wochen-Snapshot-Export-Surface (keine Toplist),
- visuelle Politur/Interaktionstiefe fuer Atlas-UI,
- ggf. Social-Review-Queue separat als eigener Block.
