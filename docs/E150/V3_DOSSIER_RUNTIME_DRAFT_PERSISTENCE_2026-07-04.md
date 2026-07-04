# V3 Dossier Runtime Draft Persistence

## Scope

Slice: `V3-DOSSIER-RUNTIME-DRAFT-PERSISTENCE-01`

Ziel war der kleinste ehrliche Anschluss zwischen bestehendem
`create_handoff_review_items`-Review-Handoff und der bereits vorhandenen
serverseitigen Dossier-Runtime-Persistenz, ohne neue Produktspur, ohne
clientseitige Server-only-Leakage und ohne Auto-Publish-/Graph-Folgen.

## Befund

- Eine echte Dossier-Runtime-Persistenz existierte bereits in
  `apps/web/src/features/create/dossierRuntimeServer.ts` auf
  `dossier_runtime_records` und `dossier_runtime_audits`.
- Vor diesem Slice erzeugte `/create` fuer `create_dossier` nur einen
  persistierten Review-Handoff in `create_handoff_review_items`, aber keinen
  echten `dossier_runtime_record`.
- `GET /api/create/handoffs/[handoffId]` lieferte deshalb nur einen read-only
  Handoff-Snapshot, oft ohne reale `dossierRuntimeId`.

## Umsetzung

- `POST /api/create/handoffs` persistiert fuer echte
  `selectedAction === "create_dossier"`-Records jetzt server-only einen
  review-first Dossier-Runtime-Draft ueber die bestehende
  `dossier_runtime_records`-Persistenz.
- Die neue Ableitung bleibt strikt an den vorhandenen Review-Handoff gebunden:
  `sourceHandoffId` und `sourceReviewItemId` verweisen weiterhin auf den
  bestehenden `create_handoff_review_items`-Record.
- `GET /api/create/handoffs/[handoffId]` fuehrt nur fuer bereits vorhandene
  Legacy-Handoffs einen kontrollierten Backfill aus, falls der zugehoerige
  Runtime-Draft noch fehlt.
- `/create` bekommt dadurch ein client-safe Readmodel mit echter
  `dossierRuntimeId`, `dossier_review_draft` bzw. `dossier_runtime_draft`,
  waehrend `review_required`, `not_published` und `planned_not_active`
  unveraendert bleiben.

## Guardrails

- Keine neue Persistenzstruktur.
- Kein neuer fachlicher Write-Pfad ausser der Nutzung der bereits bestehenden
  `dossier_runtime_records`-Persistenz.
- Kein Auto-Publish.
- Kein Graph-Write.
- Keine DeepSearch-, Factcheck-Seal-, Social-, Voxy- oder Public-Aktivierung.
- No-AI bleibt ohne neue KI-Nutzung.
- Claim-to-Dossier bleibt review-first; fehlende Wahrheit wird nur dort als
  `missing_dossier_runtime_truth` ausgewiesen, wo noch kein echter
  Runtime-Draft vorliegt.

## Betroffene Dateien

- `apps/web/src/features/create/dossierRuntimeServer.ts`
- `apps/web/src/app/api/create/handoffs/route.ts`
- `apps/web/src/app/api/create/handoffs/[handoffId]/route.ts`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/createCandidatePreview.ts`
- `apps/web/tests/create-handoff.persistence.route.test.ts`
- `apps/web/tests/dossier-runtime-draft-persistence.test.ts`
- `apps/web/tests/create-candidate-preview.contract.test.ts`
- `apps/web/tests/create-claim-to-dossier-pipeline.contract.test.ts`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`
- `docs/E150/V3_TEST_RESULTS_REGRESSION_MATRIX_2026-07-02.md`

## Validierung

Gruen ausgefuehrt:

- `git diff --check`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-handoff.persistence.route.test.ts tests/dossier-runtime-draft-persistence.test.ts tests/dossier-runtime-creation.test.ts tests/create-dossier-handoff.contract.test.ts tests/create-candidate-preview.contract.test.ts tests/create-claim-to-dossier-pipeline.contract.test.ts tests/create-feed-enrichment-review-suggestions.contract.test.ts tests/frontend-ai-transparency.contract.test.ts tests/ai-orchestration-provenance-trace.contract.test.ts`
- `pnpm -C apps/web run build`
- `pnpm exec turbo run build`
