# V3 Claims Factcheck Agent Graph Integration 2026-07-13

## Scope

- Task: `V3-CLAIMS-FACTCHECK-AGENT-GRAPH-INTEGRATION-01`
- Batch branch: `pr/v3-agentic-consent-claims-dossier-participation-01`
- Primary role: `claims_factcheck`
- Supporting: `research_source`, `governance_compliance`

## Ziel

Claim-, Factcheck- und Graph-Kandidaten auf bestehender Create-Handoff- und Source-Transferability-Wahrheit typed und review-first sichtbar machen.

## Umgesetzte Artefakte

- Neu: `apps/web/src/features/agenticRuntime/claimsFactcheckAgentGraphIntegrationContract.ts`

Der Contract macht testbar:

- claim candidate != fact
- interpretation/policy candidate != evidence
- hypothesis != verification
- source candidate != verified source
- factcheck candidate != final factcheck
- graph candidate != graph write
- translation != evidence

## Guardrails

- kein Auto-Graph-Merge
- kein Fake-Factcheck
- keine Fake-Quelle
- keine automatische offizielle Bewertung

## Validierung

- Batch-validiert mit fokussierten Contract-Tests
- `pnpm -C apps/web exec vitest run tests/claims-factcheck-agent-graph-integration.contract.test.ts ...`
- `lint`, `build` und `typecheck` im finalen Batch-Lauf
