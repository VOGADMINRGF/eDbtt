# V3 Participation Moderation Agent Runtime 2026-07-13

## Scope

- Task: `V3-PARTICIPATION-MODERATION-AGENT-RUNTIME-01`
- Batch branch: `pr/v3-agentic-consent-claims-dossier-participation-01`
- Primary role: `participation_moderation`
- Supporting: `personal_voxy`, `governance_compliance`

## Ziel

Participation-/Moderation-Folgepfade als typed review-first Contract auf bestehender Participation-Handoff-Basis ergaenzen, ohne echte Runtime oder Enforcement zu aktivieren.

## Umgesetzte Artefakte

- Neu: `apps/web/src/features/agenticRuntime/participationModerationAgentRuntimeContract.ts`

Der Contract macht testbar:

- format fitness != final participation decision
- clustering candidate != merged cluster
- missing perspective != required user position
- moderation suggestion != enforcement
- kein Voting fuer Nutzer
- keine premium vote weighting
- keine externe Notification

## Guardrails

- keine Runtime-Aktivierung
- keine automatische Entfernung
- keine automatische Aktivierung
- keine externe Benachrichtigung

## Validierung

- Batch-validiert mit fokussierten Contract-Tests
- `pnpm -C apps/web exec vitest run tests/participation-moderation-agent-runtime.contract.test.ts ...`
- `lint`, `build` und `typecheck` im finalen Batch-Lauf
