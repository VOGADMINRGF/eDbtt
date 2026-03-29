# GOV-AI-04B Stage-/Boundary-Contract (2026-03-27)

## Ziel

Strict-staged Hauptfluss (`Analyze -> Match -> CTA`) boundary-seitig als technischen Contract einfrieren, ohne neue Produktlogik.

## Umgesetzter Ist-Stand

- Shared Boundary-Parser eingefuehrt: `apps/web/src/features/create/analyzeBoundaryContract.ts`
  - feste Contract-Keys: `schemaVersion`, `orchestrator`, `runId/inputRef`, `phases`, `matchSourceState`, `noAutoPublish`, `noSilentMerge`
  - Stage-Allowlist:
    - `intake: done`
    - `quality: done|review_required`
    - `graph_matching: done|review_required`
    - `cta_suggestions: done`
  - degraded-Contract: `matchSourceState=degraded` erzwingt `graph_matching.status=review_required`
- Workspace-Parsing nutzt den shared Parser (`AnalyzeWorkspace`), statt lokaler ad-hoc-Validierung.

## Test-Evidenz

- `apps/web/tests/create-analyze.boundary-contract.test.ts`
  - valid staged snapshot accepted
  - missing stage rejected
  - degraded/status mismatch rejected
  - provenance/runId mismatch rejected
- `apps/web/tests/create-analyze.route.test.ts`
  - route payload prueft runId/inputRef/provenance und stage-status fuer degraded fallback
- `apps/web/tests/create-analyze.create-route.test.ts`
  - wrapper parity bleibt unveraendert

## Nicht Teil dieses Slices

- keine neue CTA-Priorisierung
- keine Routing-Aenderung
- keine neue Provider-Logik
