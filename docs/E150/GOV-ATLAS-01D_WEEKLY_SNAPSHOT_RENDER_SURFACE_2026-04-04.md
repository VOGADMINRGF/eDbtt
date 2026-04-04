# GOV-ATLAS-01D - Weekly Snapshot Render / Graphic Surface (2026-04-04)

## Scope

Erste produktive Render-Surface fuer den Wochenatlas auf Basis des Snapshot-Payloads:
- read-only,
- public-first lesbar,
- mobile-first,
- screenshot-/graphic-ready.

Kein Auto-Posting, keine Social-API, keine Bild-Engine.

## Umgesetzt

1. Neue Wochenatlas-Route
- `apps/web/src/app/atlas/weekly/page.tsx`
- Serverseitig:
  - laedt Snapshot aus `loadDossierAtlasWeeklySnapshotExportFromReadModel(...)`
  - faellt bei Source-Ausfall auf degradierten, contract-konformen Snapshot zurueck
  - unterstuetzt optionalen internen Detailmodus via `?detail=internal`

2. Weekly Render-Surface
- `apps/web/src/app/atlas/weekly/WeeklySnapshotSurface.tsx`
- Zeigt:
  - Zeitraum + Snapshot-Label
  - Public Summary
  - Topic Highlights (ohne Ranking)
  - Activity Flows
  - Region View (separate Achse)
  - Context Visibility
  - Guardrail-Hinweise
  - optional interne Kurzlage (`internalDenseSummary`)

3. Atlas-Hinweis/Navigation
- `apps/web/src/app/atlas/AtlasClient.tsx`
- Additiver Link auf `/atlas/weekly`.

## Guardrails

- Wochenatlas bleibt keine Toplist.
- Keine Wahrheits-/Prioritaets-/Reputationslogik.
- Kontextmarker bleiben non-epistemisch.
- Thema und Region bleiben getrennte Achsen.
- Feed bleibt Signalquelle.
- Read-only und kein Auto-Publish.

## Nicht Teil von 01D

- keine Render-Engine fuer automatische Bilddateien,
- keine Social-Review-Queue,
- keine Publishing-Automation.
