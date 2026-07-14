# V3 Dossier Cause Effect Responsibility Transfer Graph 2026-07-13

## Scope

- Task: `V3-DOSSIER-CAUSE-EFFECT-RESPONSIBILITY-TRANSFER-GRAPH-01`
- Batch branch: `pr/v3-agentic-consent-claims-dossier-participation-01`
- Primary role: `dossier_briefing`
- Supporting: `research_source`, `claims_factcheck`, `governance_compliance`

## Ziel

Ursache-, Wirkung-, Verantwortungs- und Transferability-Zweige ueber bestehender Claims-/Source-Wahrheit als review-first Dossier-Kandidaten vorbereiten.

## Umgesetzte Artefakte

- Neu: `apps/web/src/features/agenticRuntime/dossierCauseEffectResponsibilityTransferGraphContract.ts`

Der Contract macht testbar:

- cause/effect bleiben candidate_only
- responsibility candidate != institutionally verified responsibility
- transferability candidate != approved comparison
- Dossier-Zweig != final finding
- kein automatischer Graph-Write
- kein automatisches Dossier-Publish

## Guardrails

- keine neue Dossier-Architektur
- keine Runtime-Aktivierung
- kein Auto-Handoff

## Validierung

- Batch-validiert mit fokussierten Contract-Tests
- `pnpm -C apps/web exec vitest run tests/dossier-cause-effect-responsibility-transfer-graph.contract.test.ts ...`
- `lint`, `build` und `typecheck` im finalen Batch-Lauf
