# V3 Candidate Review Handoff

Stand: 2026-07-03
Task: `V3-CANDIDATE-REVIEW-HANDOFF-01`
Status: done

## Ziel

Der kleinste saubere V3-Slice nach der Kandidatenvorschau in `/create`:
Preview-Kandidaten sollen review-first in einen bestehenden Handoff-/Review-
Kontext ueberfuehrbar sein, ohne neue Persistenz, Auto-Publish, Auto-Graph,
Fake-Carrier oder eine neue Produktparallelwelt zu erfinden.

## Analyse 1-9

1. Bestehende review-first Traegerstrukturen

- `apps/web/src/features/create/createHandoff.ts`
  - typed `CreateHandoffDraft` fuer den bestehenden `/create`-Handoff
- `apps/web/src/features/create/persistedHandoffReviewQueue.ts`
  - echter persistenter Create-Handoff-Record fuer den bisherigen
    Handoff-Pfad
- `apps/web/src/features/create/createHandoffDrafts.ts`
  - review-first lokale Draft-Zieltypen wie `dossier_candidate`,
    `anlassraum_candidate`, `participation_space_candidate`
- `apps/web/src/features/create/createHandoffReviewQueue.ts`
  - bestehender review-first Queue-Kontext mit klaren Guardrails
- `apps/web/src/features/create/createHandoffReviewQueueRuntimeBridge.ts`
  - ehrliche Runtime-Bridge mit Blockern statt Fake-Erfolg

2. Bereits vorhandene ReviewQueue-/Runtime-/Handoff-Modelle

- Vorhanden:
  - `CreateHandoffReviewQueueItem`
  - `PersistedCreateHandoffRecord`
  - `dossier_runtime_record`
  - `participation_space_runtime_record`
  - Anlassraum-/Dossier-/Participation-Runtime-Serverpfade
- Nicht vorhanden:
  - ein eigener persistenter Candidate-Handoff fuer Claim-/Question-/Poll-
    Einzelkandidaten aus der neuen `/create`-Preview

3. In `#297` genannte Carrier

- `dossier_runtime_record`
- `participation_space_runtime_record`

4. Sind diese Carrier echte Persistenz?

- Ja, aber nicht fuer den neuen Candidate-Handoff direkt.
- Sie bleiben die ehrlichen spaeteren Runtime-Ziele fuer bestaetigte Claims /
  Fragen bzw. Poll-/Participation-Pfade.
- Der neue Slice behauptet deshalb **keine** direkte Candidate-Persistenz in
  diesen Carriern.

5. Bestehende Routen / Actions

- Draft speichern:
  - `/api/create/save`
  - `/api/create/finalize`
  - `/api/create/handoffs`
- Handoff vorbereiten / laden:
  - `/api/create/handoffs`
  - `/api/create/handoffs/[handoffId]`
- Dossier vorbereiten / Runtime:
  - `/api/admin/dossier-runtime/[sourceHandoffId]`
- Anlassraum vorbereiten / Runtime:
  - `/api/admin/anlassraum-runtime/[sourceHandoffId]`
- Review vormerken:
  - bestehende `createHandoffReviewQueue`-Modelle und `/admin/review`

6. Kleinster bestehender review-first Zielkontext

- Der kleinste ehrliche Zielkontext ist **nicht** direkter Dossier- oder
  Participation-Write, sondern der bestehende
  `create_handoff_review_queue`-Kontext.
- Deshalb nutzt der Slice einen typed Candidate-Review-Handoff-Envelope fuer
  diesen Kontext, statt neue Persistenz zu behaupten.

7. Zu erhaltende Provenance

Der neue Handoff traegt weiter:

- `candidate_id`
- `candidate_type`
- `input_ref`
- `input_origin`
- `source_provenance`
- `evidence_refs`
- `derived_by`
- `provider` / `model` nur bei realer Runtime-Truth
- `review_state`
- `publish_state`
- `graph_target_state`
- `missing_runtime_truth`

8. Welche Kandidaten duerfen nicht uebernommen werden?

Der Handoff ignoriert Kandidaten ohne Mindestinhalt oder mit unpassendem State:

- leerer Titel
- leerer Text
- fehlender `input_ref`
- nicht `review_required`
- nicht `not_published`
- nicht `candidate_only`

`missing_source_provenance` blockiert den Handoff **nicht**, solange dieser
Zustand ehrlich weitergetragen wird.

9. Relevante Tests

- `apps/web/tests/create-candidate-preview.contract.test.ts`
- `apps/web/tests/frontend-ai-transparency.contract.test.ts`
- `apps/web/tests/ai-orchestration-provenance-trace.contract.test.ts`
- `apps/web/tests/create-analyze.contract.test.ts`
- `apps/web/tests/create-intelligent-followup.contract.test.ts`
- `apps/web/tests/create-intelligent-followup.route.test.ts`
- `apps/web/tests/create-mode.page.test.ts`
- `apps/web/tests/runden-create-handoff-integrity.contract.test.ts`
- `apps/web/tests/runden-entry-canon.contract.test.ts`
- `apps/web/tests/create-dossier-handoff.contract.test.ts`
- `apps/web/tests/create-anlassraum-handoff.contract.test.tsx`
- `apps/web/tests/create-handoff-review-queue-runtime-bridge.test.ts`

## Umsetzung

### Entstandene Handoff-Struktur

`apps/web/src/features/create/createCandidatePreview.ts` fuehrt jetzt zusaetzlich
zum Preview-Readmodel einen typed `reviewHandoff`:

- Zielkontext:
  - `targetCarrier = create_handoff_review_queue`
  - `targetState = review_draft`
- Persistenztruth:
  - `persistenceTruth = missing_persistence_truth`
- kein Write:
  - `carriesPersistentWrite = false`

Jeder Handoff-Item traegt:

- `candidateId`
- `candidateType`
- `title`
- `text`
- `inputRef`
- `inputOrigin`
- `sourceProvenance`
- `evidenceRefs`
- `derivedBy`
- `provider`
- `model`
- `targetCarrier`
- `targetState`
- `targetRuntimeCarrier`
- `reviewState`
- `publishState`
- `graphTargetState`
- `missingRuntimeTruth`

### UI / Transparenz / Trace

- `CreateCandidatePreviewPanel.tsx`
  - rendert den neuen Review-Handoff sichtbar mit
    `missing_persistence_truth`
- `frontendAiTransparency.ts`
  - sagt jetzt explizit, dass Kandidaten reviewfaehig als typed Handoff
    vorbereitet sind
- `aiOrchestrationProvenanceTrace.ts`
  - fuehrt den Schritt nun als `candidate_review_handoff`, wenn der Handoff
    vorbereitet ist

## Warum dieser Slice noch keine Feed-Anreicherung ist

- Feed-Anreicherung waere ein weiterer Downstream-Pfad.
- Solange Claim-/Question-/Poll-Kandidaten noch nicht reviewfaehig in einen
  ehrlichen Handoff getragen werden koennen, waere Feed-Anreicherung nur eine
  zweite Parallelwelt mit noch weniger Persistenz- und Provenance-Wahrheit.
- Der saubere Reihenfolgepunkt ist deshalb:
  1. Kandidaten sichtbar machen
  2. Kandidaten reviewfaehig tragen
  3. erst danach spaetere Feed-/Output-/Graph-Folgepfade

## Folgepfade danach

- Feed-Anreicherung als review-first Vorschlag
- Dossier-/Anlassraum-Graph-Handoff
- Social Output Drafts
- Voxy Video Briefing Flow

Diese Pfade bleiben bewusst eigene Folge-Slices und werden in diesem Task
nicht still vorgezogen.

## Nicht gebaut

- keine neue Candidate-Persistenz
- kein Auto-Publish
- kein Auto-Graph-Write
- keine automatische Dossier-/Anlassraum-/Participation-Finalisierung
- keine Feed-, Social- oder Voxy-Erzeugung
- keine No-AI-Aenderung auf `/runden/new`

## Geaenderte Dateien

- `apps/web/src/features/create/createCandidatePreview.ts`
- `apps/web/src/features/create/CreateCandidatePreviewPanel.tsx`
- `apps/web/src/features/create/frontendAiTransparency.ts`
- `apps/web/src/features/create/aiOrchestrationProvenanceTrace.ts`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/tests/create-candidate-preview.contract.test.ts`
- `apps/web/tests/frontend-ai-transparency.contract.test.ts`
- `apps/web/tests/ai-orchestration-provenance-trace.contract.test.ts`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`
- `docs/E150/V3_TEST_RESULTS_REGRESSION_MATRIX_2026-07-02.md`

## Validierung

Ausgefuehrt:

- `git diff --check`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-candidate-preview.contract.test.ts tests/frontend-ai-transparency.contract.test.ts tests/ai-orchestration-provenance-trace.contract.test.ts tests/create-analyze.contract.test.ts tests/create-intelligent-followup.contract.test.ts tests/create-intelligent-followup.route.test.ts tests/create-mode.page.test.ts tests/runden-create-handoff-integrity.contract.test.ts tests/runden-entry-canon.contract.test.ts tests/create-dossier-handoff.contract.test.ts tests/create-anlassraum-handoff.contract.test.tsx tests/create-handoff-review-queue-runtime-bridge.test.ts`
- `pnpm -C apps/web run build`
