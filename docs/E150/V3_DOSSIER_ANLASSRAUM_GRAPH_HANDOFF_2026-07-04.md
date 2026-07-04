# V3 Dossier Anlassraum Graph Handoff

## Scope

Slice: `V3-DOSSIER-ANLASSRAUM-GRAPH-HANDOFF-01`

Ziel war der kleinste saubere Anschluss vom bestehenden persistierten
`dossier_runtime_draft` zu Graph-, Anlassraum-, Participation- und
Branch-Folgepfaden, ohne neue Produktparallelwelt, ohne neuen
Downstream-Write und ohne clientseitige Server-only-Leakage.

## Analyseergebnis

- Echte Persistenz ist vorhanden fuer:
  - `dossier_runtime_records`
  - `topic_graph_edge_mutations`
  - `anlassraum_runtime_records`
  - `participation_space_runtime_records`
- Branch-Workspaces sind dagegen vorhandene Arbeitsmodus-/Readmodel-Pfade,
  aber keine eigene persistierte Runtime mit `target_branch_workspace_id`.
- Der direkte Pfad `dossier_runtime_draft -> topic_graph_edge_mutations` oder
  `dossier_runtime_draft -> anlassraum_runtime_records` ist noch nicht als
  kanonischer server-only Direktvertrag vorhanden.
- Ein neuer automatischer Write aus diesem Slice haette deshalb einen neuen
  fachlichen Downstream-Pfad kanonisiert.

## Umsetzung

- `/create` zeigt jetzt einen typed
  `CreateDossierGraphAnlassraumHandoffReadModel` auf Basis des bestehenden
  Dossier-Runtime-Handoffs.
- Reine Runtime-Helper fuer Anlassraum und Participation beziehen ihren
  `PersistedCreateHandoffRecord` sowie die Summary-/Title-Helper jetzt aus dem
  client-safe `createHandoffPersistenceContract` statt aus dem
  `server-only`-Persistenzmodul.
- Die Struktur traegt:
  - `graph_handoff_id`
  - `source_dossier_runtime_id`
  - `source_review_item_id`
  - `source_draft_id`
  - `source_candidate_ids`
  - `target_graph_id`, nur wenn ein echter Topic-Match mit ID vorliegt
  - `target_anlassraum_id`, nur wenn ein echter Anlassraum-Match mit ID vorliegt
  - `target_participation_space_id`, aktuell bewusst `null`
  - `target_branch_workspace_id`, aktuell bewusst `null`
  - `graph_target_state`
  - `branchWorkspaceTargetState`
  - `anlassraum_target_state`
  - `participation_target_state`
  - `review_state`
  - `publish_state`
  - `source_provenance`
  - `evidence_refs`
  - `feed_enrichment_refs`
  - `topic_seed`
  - `graph_matches`
  - `audit_ref`
  - `missing_runtime_truth`
- `/create` macht dadurch sichtbar:
  - welche Dossier-Kandidaten und Feed-Hinweise spaeter in Graph oder
    Anlassraum-Kontexte laufen koennen
  - ob schon reale Topic-/Anlassraum-Ziel-IDs aus bestehenden Graph-Matches
    vorliegen
  - dass Branch-Workspace nur ein bestehender Arbeitsmodus bleibt und keine
    eigene Runtime-ID erzeugt

## Bewusste Nicht-Umsetzung

- Kein neuer Write in `topic_graph_edge_mutations`
- Kein neuer Write in `anlassraum_runtime_records`
- Kein neuer Write in `participation_space_runtime_records`
- Kein Auto-Publish
- Kein öffentlicher Graph-Write
- Kein öffentliches Dossier
- Kein öffentlicher Anlassraum
- Kein DeepSearch-Start
- Kein Factcheck-Seal
- Kein Social- oder Voxy-Output

## Warum kein Downstream-Write

Die erforderliche Persistenz existiert zwar, aber nicht als bereits
kanonisierter Direktpfad vom `dossier_runtime_draft`. Ein automatischer oder
neuer server-only Write haette in diesem Slice einen weiteren fachlichen
Runtime-Vertrag geschaffen. Deshalb bleibt der Anschluss hier review-first,
typed und ehrlich sichtbar, aber ohne neue Runtime-Mutation.

## Reale Ziel-IDs

- `target_graph_id` ist nur gesetzt, wenn ein vorhandener Topic-Match mit
  echter ID vorliegt.
- `target_anlassraum_id` ist nur gesetzt, wenn ein vorhandener Anlassraum-Match
  mit echter ID vorliegt.
- `target_branch_workspace_id` bleibt `null`, weil dafuer heute kein eigener
  persistierter Runtime-Traeger existiert.
- `target_participation_space_id` bleibt `null`, solange kein eigener
  persistierter Participation-Handoff oder Runtime-Record aus diesem Pfad
  geschrieben wurde.

## Geänderte Dateien

- `apps/web/src/features/create/createCandidatePreview.ts`
- `apps/web/src/features/create/CreateCandidatePreviewPanel.tsx`
- `apps/web/src/features/create/frontendAiTransparency.ts`
- `apps/web/src/features/create/aiOrchestrationProvenanceTrace.ts`
- `apps/web/src/features/create/anlassraumRuntime.ts`
- `apps/web/src/features/create/participationSpaceRuntime.ts`
- `apps/web/tests/create-candidate-preview.contract.test.ts`
- `apps/web/tests/create-claim-to-dossier-pipeline.contract.test.ts`
- `apps/web/tests/create-dossier-anlassraum-graph-handoff.contract.test.ts`
- `apps/web/tests/create-dossier-anlassraum-graph-handoff.boundary.test.ts`
- `apps/web/tests/frontend-ai-transparency.contract.test.ts`
- `apps/web/tests/ai-orchestration-provenance-trace.contract.test.ts`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`
- `docs/E150/V3_TEST_RESULTS_REGRESSION_MATRIX_2026-07-02.md`

## Folgepfade

- persistierter Participation-/Poll-Handoff
- `V3-DOSSIER-SOCIAL-OUTPUT-DRAFTS-01`
- Voxy Video Briefing Flow
- `DRAFTS-LEGACY-SSOT-ALIGN-01`

## Validierung

Gruen ausgefuehrt:

- `git diff --check`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/dossier-runtime-draft-persistence.test.ts tests/dossier-runtime-creation.test.ts tests/branch-workspace-handoff.contract.test.ts tests/topic-graph-runtime.test.ts tests/anlassraum-runtime-creation.test.ts tests/participation-space-runtime-creation.test.ts tests/create-candidate-preview.contract.test.ts tests/create-claim-to-dossier-pipeline.contract.test.ts tests/create-dossier-anlassraum-graph-handoff.contract.test.ts tests/create-dossier-anlassraum-graph-handoff.boundary.test.ts tests/frontend-ai-transparency.contract.test.ts tests/ai-orchestration-provenance-trace.contract.test.ts`
- `pnpm -C apps/web run build`
- `pnpm exec turbo run build`
- `pnpm -C apps/web exec vitest run tests/create-candidate-preview.contract.test.ts tests/create-claim-to-dossier-pipeline.contract.test.ts tests/create-dossier-anlassraum-graph-handoff.contract.test.ts tests/create-dossier-anlassraum-graph-handoff.boundary.test.ts tests/frontend-ai-transparency.contract.test.ts tests/ai-orchestration-provenance-trace.contract.test.ts`
