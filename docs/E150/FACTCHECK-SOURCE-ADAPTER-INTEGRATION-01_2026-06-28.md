# FACTCHECK-SOURCE-ADAPTER-INTEGRATION-01

Stand: 2026-06-28
Status: done

## Ziel

`factcheck_request`-Handoffs aus dem sichtbaren Create-/Dialog-Follow-up an die bestehende review-first Factcheck-/Quellenpruefungsruntime anschliessen, ohne Auto-DeepSearch, Auto-Seal, Auto-Publish, Auto-Create oder Wahrheitsbehauptung.

## Umsetzung

- Neuer Adapter `apps/web/src/features/create/factcheckSourceAdapterBridge.ts` uebersetzt Create-Handoff-Claims und Source-Grounding kontrolliert auf den bestehenden `/api/factcheck/enqueue`-Contract.
- `apps/web/src/features/create/createHandoffReviewQueueRuntimeBridge.ts` routed `factcheck_request` nicht mehr ueber `/api/create/handoffs`, sondern direkt in die bestehende Factcheck-Runtime; alle anderen Handoff-Ziele bleiben auf dem bisherigen Persistenzpfad.
- `apps/web/src/features/create/CreateHandoffDraftSummary.tsx` zeigt fuer erfolgreiche Factcheck-Uebergaben explizit `Zur Quellenprüfung übergeben` und die Guardrail-Copy, dass noch keine Wahrheit bestaetigt und keine Quelle automatisch bewertet wurde.
- Die Uebergabe bleibt review-first: `requestedAction: "factcheck"`, `withSerp: false`, `deepSearch: false`, `researchConfirmed: false`.
- 4xx-/Access-Denials bleiben blockierte Uebergaben mit ehrlicher Meldung `Quellenprüfung vorgemerkt – direkte Übergabe ist noch nicht verfügbar.`; Transport-/Runtime-Fehler bleiben Fehler und werden nicht als Erfolg maskiert.

## Betroffene Dateien

- `apps/web/src/features/create/factcheckSourceAdapterBridge.ts`
- `apps/web/src/features/create/createHandoffReviewQueueRuntimeBridge.ts`
- `apps/web/src/features/create/CreateHandoffDraftSummary.tsx`
- `apps/web/tests/factcheck-source-adapter-bridge.test.ts`
- `apps/web/tests/create-handoff-review-queue-runtime-bridge.test.ts`
- `apps/web/tests/create-handoff-review-queue-panel.test.tsx`

## Validierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/factcheck-source-adapter-bridge.test.ts tests/create-handoff-review-queue-runtime-bridge.test.ts tests/create-handoff-review-queue.test.ts tests/create-handoff-review-queue-panel.test.tsx tests/create-curated-dialog-workspace.contract.test.tsx`
- `pnpm -C apps/web run build`

## Ergebnisgrenze

- Verdrahtet ist der sichtbare `factcheck_request`-Handoff aus dem Create-/Dialog-Follow-up.
- Offen bleiben breitere Match-Panel-/`source_question`-Automationen, DeepSearch-/Provider-Orchestrierung, Seal-Entscheidungen, Dossier-/Anlassraum-/Participation-Space-Runtime-Erzeugung und Graph-/Deduplication-Folgepfade.
