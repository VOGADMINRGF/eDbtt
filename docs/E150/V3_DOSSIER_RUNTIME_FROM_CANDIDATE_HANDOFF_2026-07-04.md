# V3 Dossier Runtime From Candidate Handoff

Stand: 2026-07-04
Task: `V3-DOSSIER-RUNTIME-FROM-CANDIDATE-HANDOFF-01`

## Was umgesetzt wurde

- Die bestehende serverseitige Handoff-Route
  `/api/create/handoffs/[handoffId]` liefert fuer reale `create_dossier`-
  Handoffs jetzt zusaetzlich eine kleine client-safe
  Dossier-Runtime-Zusammenfassung.
- Diese Zusammenfassung wird ausschliesslich serverseitig aus
  `apps/web/src/features/create/dossierRuntimeServer.ts` abgeleitet.
- `/create` zeigt daraus nur einen typed Handoff-/Status-Readmodel-Schritt;
  es wurde keine neue Persistenz, kein neuer Write-Pfad, kein Auto-Dossier,
  kein Auto-Publish, kein Graph-Write und kein DeepSearch aktiviert.
- `createCandidatePreview.ts` bleibt client-safe. Mongo-/triMongo- und
  server-only-Abhaengigkeiten bleiben auf Route-/Server-Modulen.

## Wahrheitsgrenze

- Reale Source-of-Truth bleibt der bestehende
  `create_handoff_review_items`-Record.
- Wenn noch kein echtes Dossier-Runtime-Record existiert, bleibt
  `dossierRuntimeId` leer und `missing_dossier_runtime_truth` sichtbar.
- Candidate- und Feed-Payloads werden nur als typed Vorschau-/Handoff-Daten
  im Frontend Readmodel weitergetragen, nicht neu persistiert.

## Checks

- `git diff --check`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-handoff.persistence.route.test.ts tests/create-candidate-preview.contract.test.ts tests/create-claim-to-dossier-pipeline.contract.test.ts tests/create-feed-enrichment-review-suggestions.contract.test.ts tests/frontend-ai-transparency.contract.test.ts tests/ai-orchestration-provenance-trace.contract.test.ts`
- `pnpm -C apps/web run build`
- `pnpm exec turbo run build`

Alle Checks waren gruen.
