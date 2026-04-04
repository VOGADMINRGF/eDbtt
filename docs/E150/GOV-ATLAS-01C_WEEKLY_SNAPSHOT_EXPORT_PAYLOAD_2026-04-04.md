# GOV-ATLAS-01C - Wochen-Snapshot-Export / Graphic-ready Payload (2026-04-04)

## Scope

Kontraktnaher Export-Block fuer eine wiederverwendbare Wochenlage auf Atlas-Basis:
- kein Rendering, keine Bild-Engine,
- kein Auto-Posting, keine Social-API-Integration,
- stattdessen ein stabiler, typed Snapshot-Payload fuer spaetere Grafik-/Newsletter-/Partner-/Internal-Pipelines.

## Umgesetzt

1. Typed Snapshot-Export-Contract
- `features/anlassraum/dossierAtlasWeeklySnapshotExport.ts`
- Enthalten:
  - `resolveDossierAtlasWeeklySnapshotExport(...)`
  - `loadDossierAtlasWeeklySnapshotExportFromReadModel(...)`
  - `parseDossierAtlasWeeklySnapshotExport(...)`
  - `evaluateDossierAtlasWeeklySnapshotExportConsistency(...)`

2. Snapshot-Payload-Felder (graphic-ready)
- `snapshotWindow` (Start/End/Label)
- `summary` (totals + weekly)
- `topicHighlights` (alphabetisch, `nonRankingSelection: true`)
- `activityFlows` (Anlass->Runde, Dossier->Runde, Runde->Ergebnis, Anlass->Companion, Follow-up gesamt)
- `contextVisibility` (Verband/Verein/Initiative/Organisation/Redaktion/Civic/Experten)
- `regionView` (von Themenachse getrennt)
- `graphicNotes`
- `publicSafeSummary`
- `internalDenseSummary`
- `guardrails`

3. Public vs Internal mitgedacht
- `publicSafeSummary` fuer ruhige, nicht-ueberladene externe Kommunikation.
- `internalDenseSummary` fuer operativ dichtere Auswertung.
- Kein harter Dual-Mode-Stack erforderlich, aber modelseitig vorbereitet.

## Guardrails

- Snapshot ist explizit keine Toplist und keine Wahrheits-/Prioritaetsmaschine.
- Topic-Window ist nicht-ranking-basiert (alphabetische Auswahl).
- Thema und Region bleiben getrennte Achsen.
- Kontextmarker bleiben Sichtbarkeits-/Arbeitskontext ohne Sondermacht.
- Feed bleibt Signalquelle; kein Auto-Publish.

## Tests

- `apps/web/tests/dossier-atlas-weekly-snapshot-export.test.ts`
  - Resolver erzeugt konsistenten graphic-ready Payload aus Atlas-Contract.
  - Parse-/Consistency-Pfade validieren Guardrails und Fensterkonsistenz.

## Nicht Teil von 01C

- keine Bild-/Render-Pipeline,
- keine Social-Review-Queue,
- keine Publishing-Automation.
