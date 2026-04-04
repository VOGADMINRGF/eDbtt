# GOV-CIVIC-04 - Share-ready Target Contract (2026-04-04)

## Scope

Small, contract-near slice for a share-ready asset layer on top of the existing CIVIC/ORG/Create/Runden baseline.

In scope:
- Canonical target resolution per context (anlass, round running, round results, dossier, companion).
- QR target resolution aligned to context.
- Share metadata and social qualification flags.
- Optional non-blocking quality hints (factcheck/context docking).

Out of scope:
- No social API integration.
- No auto-posting engine.
- No UI expansion.
- No truth/trust/ranking/priority system.

## Implemented Contract

- New shared contract: `features/anlassraum/shareReadyAssetContract.ts`
- New typed output includes:
  - `targetKinds`
  - `primaryTargetKind`
  - `canonicalPublicTarget`
  - `qrTarget`
  - `targets.{anlassPublicTarget, roundOperatingTarget, roundResultsTarget, dossierPublicTarget, companionPublicTarget}`
  - `shareMeta.{shareTitle, sharePrompt, shareSummary}`
  - `socialPublication.{shareReady, socialCandidate, autoPostEligible, needsReviewBeforeOfficialSocial, qualification}`
  - `qualityHints.{factcheckOptional, factcheckSuggested, existingContextHint, allowsNonBlockingContextSuggestion}`
  - Guardrails + forbidden inference list

## Resolution Rules (Start Canon)

1. Canonical target priority:
- `round_results_target`
- `companion_public_target`
- `dossier_public_target`
- `round_operating_target`
- `anlass_public_target`

2. QR target:
- For results contexts, QR can point to running context to keep participation/follow-up open.
- Otherwise QR follows canonical public target.

3. Social qualification:
- Every resolved context is `shareReady: true`.
- `autoPostEligible` is always `false` in this slice.
- Official social remains review/curation gated via `needsReviewBeforeOfficialSocial: true`.
- `socialCandidate` is context-qualified, not a privilege signal.

## Guardrails

The contract explicitly enforces:
- share-ready is not truth
- social-candidate is not priority
- QR target is not voting weight
- official social requires review
- context hints are non-blocking (no auto-merge)

No hidden promotion to epistemic, political, or ranking authority is introduced.

## Tests

- `apps/web/tests/share-ready-asset-contract.test.ts`
  - running context behavior
  - closed/results behavior
  - dossier/companion behavior
  - non-public behavior
  - parser + consistency helper behavior
