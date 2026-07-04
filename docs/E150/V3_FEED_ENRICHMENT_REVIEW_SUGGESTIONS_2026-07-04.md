# V3 Feed Enrichment Review Suggestions

Stand: 2026-07-04
Task: `V3-FEED-ENRICHMENT-REVIEW-SUGGESTIONS-01`

## Ziel

Der Slice erweitert die bestehende `/create`-Kandidatenvorschau um kleine
review-first Hinweise auf bereits vorhandene Feed-, Quellen-, Material-,
URL- und Evidenzkontexte.

Der Slice baut bewusst **keine** neue DeepSearch-, Faktencheck-, Publish-,
Graph- oder Persistenzruntime.

## Reale bestehende Strukturen

### 1. Feed-, Source-, Material-, URL-, Evidence-, Citation- und Factcheck-Basis

- Feed-Radar-Runtime-Readmodel:
  `features/feeds/runtimeReadModel.ts`
- Feed-Source-Automation-Readmodel:
  `features/feeds/sourceAutomation.ts`
- Region-Source-Connections und Dry-Run-/Snapshot-Pfade:
  `features/region/sourceConnections.ts`
  `features/region/server/sourceConnectionRuntime.ts`
- Material-Intake-Contract und Persistenz:
  `apps/web/src/features/material/materialIntakeContract.ts`
  `apps/web/src/features/material/materialIntakeRepository.ts`
- Material-Extraction-Job-Readmodel:
  `apps/web/src/features/material/materialExtractionJobs.ts`
- Dossier-Update-Statusvertrag:
  `features/dossier/updateStatusContract.ts`
- Factcheck-Handoff-/Enqueue-Adapter:
  `apps/web/src/features/create/factcheckSourceAdapterBridge.ts`
- Create-Handoff-Quellenbasis:
  `apps/web/src/features/create/createHandoff.ts`
- Analyze-Run-Receipt-/SourceSet-Kontext:
  `apps/web/src/features/create/createCandidatePreview.ts`
  `apps/web/src/features/create/aiOrchestrationProvenanceTrace.ts`

### 2. Persistenz vs. Fixtures vs. Readmodels

- Persistente Basen vorhanden:
  Region Source Connections, Source Test Results, Feed Source Automation State,
  Material Intake Records, Material Extraction Jobs, Dossier Runtime,
  Factcheck Jobs.
- Review-first Readmodels vorhanden:
  Feed Radar Runtime, Source Automation, Dossier Update Status,
  Create Candidate Preview, Frontend AI Transparency, Provenance Trace.
- Fixture-/Preview-Basen vorhanden:
  Teile der Create-Kandidatenvorschau, lokale Handoff-Ableitungen und
  einzelne Preview-/Fallback-Kontexte.

### 3. Bereits vorhandene Folgepfade

- Feed Radar / Themenradar:
  `features/feeds/runtimeReadModel.ts`
  `features/feeds/sourceAutomation.ts`
- Source Connection / Snapshot / Review:
  `features/region/server/sourceConnectionRuntime.ts`
- Material Intake / Material Extraction:
  `apps/web/src/features/material/materialIntakeRepository.ts`
  `apps/web/src/features/material/materialExtractionJobs.ts`
- Factcheck Review Handoff:
  `apps/web/src/features/create/factcheckSourceAdapterBridge.ts`
- Dossier Update / Review-first Status:
  `features/dossier/updateStatusContract.ts`
- Candidate Preview / Candidate Review Handoff / Claim-to-Dossier Pipeline:
  `apps/web/src/features/create/createCandidatePreview.ts`

## Was der Slice konkret baut

- Neue typed Readmodel-Sektion in `/create`:
  `feedEnrichmentSuggestions`
- Struktur pro Vorschlag:
  `suggestion_id`
  `source_candidate_id`
  `candidate_type`
  `candidate_text`
  `enrichment_type`
  `source_type`
  `source_ref`
  `source_title`
  `source_url`
  `source_origin`
  `source_provenance`
  `evidence_refs`
  `confidence_state`
  `review_state`
  `publish_state`
  `factcheck_state`
  `deepsearch_state`
  `graph_target_state`
  `missing_runtime_truth`

## Welche Quellen wirklich genutzt werden

Der Slice nutzt nur bereits vorhandene frontend-sichere Hinweisquellen:

- `sourceUrls` aus dem bestehenden Create-Request-Kontext
- `materialItems` aus dem bestehenden Material-Routing
- `intakeContext.sourceUrl` und `intakeContext.sourceLabel`
- `runReceipt.sourceSet`, wenn echte Analyze-Runtime-Truth vorliegt
- bestehende `createHandoff.sourceGrounding`-Referenzen

Es werden **keine** externen Quellen gesucht, keine neuen Feeds abgefragt und
keine Quellentreffer erfunden.

## Kandidatentypen

Angereichert:

- `claim`
- `counter_position`
- `question`

Geplant:

- `poll`

Umfragen bleiben bewusst `planned_handoff`, solange keine passende
Participation-/Survey-Enrichment-Runtime genutzt wird.

## Guardrails

- Kein Auto-DeepSearch
- Kein Auto-Faktencheck
- Kein Auto-Publish
- Kein Auto-Dossier
- Kein Auto-Graph-Write
- Keine neue Persistenz
- Keine Fake-Quellen
- Keine Fake-Treffer
- Keine Fake-Seals

## Warum das keine echte DeepSearch ist

- Der Slice startet keinen externen Such- oder Research-Lauf.
- Er liest nur bereits vorhandene Request-, Material- und Run-Receipt-Hinweise.
- `deepsearch_state` bleibt daher durchgehend `planned_handoff`.

## Warum Quellen nur aus vorhandener Runtime-/Feed-/Material-Wahrheit stammen duerfen

- V3 bleibt review-first und truth-conservative.
- Input-Only-Kontexte werden nicht als verifizierte Quelle ausgegeben.
- Fehlende Runtime- oder Source-Wahrheit bleibt explizit
  `missing_source_truth` oder `missing_runtime_truth`.

## Folgepfade bleiben offen

- Persistierter Candidate-/Dossier-Handoff als Runtime-Input
- Dossier-/Anlassraum-Graph-Handoff
- `V3-DOSSIER-SOCIAL-OUTPUT-DRAFTS-01`
- Voxy Video Briefing Flow

## Geaenderte Dateien

- `apps/web/src/features/create/createCandidatePreview.ts`
- `apps/web/src/features/create/CreateCandidatePreviewPanel.tsx`
- `apps/web/src/features/create/frontendAiTransparency.ts`
- `apps/web/src/features/create/aiOrchestrationProvenanceTrace.ts`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/tests/create-candidate-preview.contract.test.ts`
- `apps/web/tests/create-feed-enrichment-review-suggestions.contract.test.ts`
- `apps/web/tests/frontend-ai-transparency.contract.test.ts`
- `apps/web/tests/ai-orchestration-provenance-trace.contract.test.ts`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`
- `docs/E150/V3_TEST_RESULTS_REGRESSION_MATRIX_2026-07-02.md`

