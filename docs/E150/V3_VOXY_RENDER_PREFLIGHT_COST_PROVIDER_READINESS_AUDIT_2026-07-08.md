# V3 Voxy Render Preflight Cost Provider Readiness Audit

Date: 2026-07-08
Task: `V3-VOXY-RENDER-PREFLIGHT-COST-PROVIDER-READINESS-01`
Status: done

## Scope

- Added a typed review-first preflight contract and presenter for Voxy render readiness.
- Reused existing Voxy script-candidate and render-handoff readmodels instead of introducing new runtime state.
- Integrated the preflight additively into `/create`, `/account`, `/admin/review` and `/dossier/[id]/studio`.

## What changed

- `apps/web/src/features/create/voxyRenderPreflightReadinessContract.ts`
  - derives `preflightStatus`, provider/asset/cost states, multilingual and RTL review gates, blockers, and next decisions
  - keeps `originalPreserved: true`, `translationIsEvidence: false`, and all runtime actions explicitly disabled
- `apps/web/src/features/create/VoxyRenderPreflightReadinessPanel.tsx`
  - presents provider, cost, capability, asset, review-gate, blocker, and next-decision sections as a readmodel-only preflight
- Existing Create, Account, Admin Review, and Dossier Studio surfaces now render the same additive preflight layer after the render/provider handoff.

## Inventory truth kept explicit

- Static Voxy avatar and brand overlays are visible as partial asset truth.
- No video-specific voice profile, subtitle template, lower-third template, source-caption template, export preset, or provider runtime was invented.
- No render-specific cost, credit, limit, or billing truth was invented.
- Cross-lingual and RTL cases remain explicitly review-first.

## Non-goals preserved

- No rendering
- No provider execution
- No uploads
- No cost debit
- No publish or schedule trigger
- No new queue
- No new persistence
- No runtime/provider truth claims beyond existing readmodels

## Tests

- `apps/web/tests/voxy-render-preflight-readiness.contract.test.tsx`
- `apps/web/tests/voxy-render-provider-handoff.contract.test.tsx`
- `apps/web/tests/create-candidate-preview.contract.test.ts`
- `apps/web/tests/account-resume-workbench.contract.test.tsx`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/dossier-studio-server-persistence-ui.test.tsx`
