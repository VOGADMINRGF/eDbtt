# PR-CREATE-SAFETY-QUALITY-GATE-02

## Goal

Harden the existing /create safety gate after PR #91.

This PR is safety-only. Do not redesign /create, do not touch curated dialog UX except the existing CreateInputSafetyPanel.

## Implement

1. Add:
- apps/web/src/features/create/safety/createSafetyLexicon.ts
- apps/web/src/features/create/safety/createSafetyTelemetry.ts
- apps/web/src/features/create/safety/createSafetyReviewContract.ts

2. Refactor:
- apps/web/src/features/create/safety/createInputSafety.ts

3. Improve:
- apps/web/src/components/analyze/CreateInputSafetyPanel.tsx

4. Add tests:
- apps/web/tests/create-input-safety-lexicon.contract.test.ts
- apps/web/tests/create-input-safety-telemetry.contract.test.ts
- apps/web/tests/create-safety-review-contract.test.ts

5. Extend existing tests:
- apps/web/tests/create-input-safety.contract.test.ts
- apps/web/tests/create-analyze.safety-gate.test.ts
- apps/web/tests/create-save.safety-gate.test.ts
- apps/web/tests/create-finalize.safety-gate.test.ts

## Rules

- Never store raw PII in telemetry.
- Never store raw PII in review items.
- Low readability alone must never block.
- Political framing alone must never block.
- Concrete threat or doxxing CTA must block.
- Third-party PII plus accusation must require moderation.
- Unsupported serious factual allegations must require factcheck unless higher severity applies.
- Cross-lingual matches must not silently merge.
- Safe questions may proceed even when the original allegation was unsafe.

## Validation

pnpm -C apps/web run typecheck
pnpm -C apps/web run lint
pnpm -C apps/web exec vitest run \
  tests/create-input-safety.contract.test.ts \
  tests/create-input-safety-lexicon.contract.test.ts \
  tests/create-input-safety-telemetry.contract.test.ts \
  tests/create-safety-review-contract.test.ts \
  tests/create-analyze.safety-gate.test.ts \
  tests/create-save.safety-gate.test.ts \
  tests/create-finalize.safety-gate.test.ts
