# V3 Persisted Candidate Dossier Handoff Runtime

Stand: 2026-07-04
Task: `V3-PERSISTED-CANDIDATE-DOSSIER-HANDOFF-RUNTIME-01`
Status: done

## Ziel

Der Slice schliesst die neue Claim-to-Dossier-Lesart in `/create` an den
bereits existierenden persistierten Review-Handoff an, ohne neue Persistenz,
keinen neuen Write-Pfad und kein Auto-Dossier einzufuehren.

## Analyse

### Reale bestehende Persistenz

- `apps/web/src/features/create/persistedHandoffReviewQueue.ts`
  - echter Persistenzpfad `create_handoff_review_items`
- `apps/web/src/app/api/create/handoffs/route.ts`
  - bestehender serverseitiger Write-Pfad fuer review-first Create-Handoffs
- `apps/web/src/features/create/dossierRuntimeServer.ts`
  - bestehende Runtime, die aus einem persistierten
    `PersistedCreateHandoffRecord` spaeter ein echtes `dossier_runtime_record`
    ableiten kann

### Was vorher fehlte

- Die neue Candidate-/Claim-to-Dossier-Lesart in
  `createCandidatePreview.ts` kannte nur
  `missing_persistence_truth`, auch wenn bereits ein echter persistierter
  `create_dossier`-Review-Record vorlag.
- Dadurch blieb die Zwischenwahrheit zwischen Preview und echter
  Dossier-Runtime unsichtbar.

### Was bewusst offen bleibt

- Kein neues `dossier_runtime_record` wird aus `/create` direkt erzeugt.
- `target_record_id` bleibt leer, solange die bestehende Dossier-Runtime nicht
  separat freigegeben und geschrieben wurde.
- Umfragen bleiben `planned_handoff`.
- Feed-Suggestions bleiben readmodel-only und starten weder DeepSearch noch
  Factcheck.

## Umsetzung

### Readmodel

`apps/web/src/features/create/createCandidatePreview.ts`

- `BuildCreateCandidatePreviewInput` akzeptiert jetzt optional einen
  client-sicheren Hinweis auf einen bereits persistierten Review-Record:
  `persistedReviewRecord`.
- Die Claim-to-Dossier-Pipeline traegt jetzt zusaetzlich:
  - `reviewRecordId`
  - `reviewRecordTruth`
- Wenn ein echter persistierter `create_dossier`-Record vorliegt und zum
  aktuellen Source-Text passt:
  - `handoffId` zeigt den realen Review-Record
  - nicht-Poll-Items gehen auf `targetState = persisted_review_record`
  - `persistenceState = runtime_path_available`
  - `missingRuntimeTruth` verliert
    `candidate_handoff_not_persisted`, behaelt aber ehrlich
    `dossier_runtime_record_not_created_yet`

### Client-Verkabelung

`apps/web/src/app/create/CreateClient.tsx`

- Beim Resume ueber `/api/create/handoffs/[handoffId]` wird ein real
  persistierter `create_dossier`-Record jetzt als solcher erkannt.
- Nach erfolgreichem POST auf `/api/create/handoffs` wird dieselbe Wahrheit
  clientseitig an das Candidate-Readmodel weitergereicht.
- Es werden nur primitive, client-sichere Daten uebergeben:
  `reviewRecordId`, `selectedAction`, `sourceText`.

### UI

`apps/web/src/features/create/CreateCandidatePreviewPanel.tsx`

- Die Claim-to-Dossier-Karte zeigt jetzt explizit:
  - `reviewRecordTruth`
  - `reviewRecordId`
  - dass ein echtes Target-Record weiterhin fehlt

## Fachliche Guardrails

- keine neue Persistenz
- kein neuer Write-Pfad
- kein Auto-Publish
- kein Auto-Dossier
- kein Auto-Graph-Write
- kein Auto-DeepSearch
- No-AI auf `/runden/new` unveraendert

## Was real gespeichert vs. nur vorbereitet bleibt

Real gespeichert ueber den bestehenden Pfad:

- der vorhandene `PersistedCreateHandoffRecord` im Store
  `create_handoff_review_items`
- darin wie bisher:
  - `sourceText`
  - `plannerResult`
  - `graphMatches`
  - `claims`
  - `arguments`
  - `openQuestions`
  - `sourceGrounding`
  - `topicSeed`
  - Scope-/Access-Kontext

Nur vorbereitet, nicht extra gespeichert in diesem Slice:

- die frontend-seitige Candidate-Preview-Struktur selbst
- die Feed-Enrichment-Suggestion-Envelopes
- ein echtes `dossier_runtime_record`
- ein `target_record_id`

## Geaenderte Dateien

- `apps/web/src/features/create/createCandidatePreview.ts`
- `apps/web/src/features/create/CreateCandidatePreviewPanel.tsx`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/tests/create-candidate-preview.contract.test.ts`
- `apps/web/tests/create-claim-to-dossier-pipeline.contract.test.ts`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`
- `docs/E150/V3_TEST_RESULTS_REGRESSION_MATRIX_2026-07-02.md`

