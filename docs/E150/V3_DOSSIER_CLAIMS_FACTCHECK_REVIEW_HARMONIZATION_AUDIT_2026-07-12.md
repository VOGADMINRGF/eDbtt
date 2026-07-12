# V3 Dossier / Claims / Factcheck / Review Harmonization Audit

Date: 2026-07-12
Branch: `pr/v3-dossier-claims-factcheck-review-harmonization-01`

Completed task:

- `V3-DOSSIER-CLAIMS-FACTCHECK-REVIEW-HARMONIZATION-01`

## What changed

- Added `apps/web/src/features/review/reviewSurfaceStatusLabels.ts` as a shared presenter for review-first status language across:
  - queue state
  - preparation state
  - source/factcheck enrichment state
  - dossier decision state
  - create handoff review state
  - dossier runtime review state
- Wired the shared status helper into active surfaces and contracts:
  - `apps/web/src/features/create/CreateHandoffPanel.tsx`
  - `apps/web/src/features/surfaces/factcheck/FactcheckHandoffShell.tsx`
  - `apps/web/src/features/create/V3RuntimeWorkflowSurface.tsx`
  - `apps/web/src/features/create/V3ReviewContextSummary.tsx`
  - `apps/web/src/features/create/sourceFactcheckFeedEnrichmentContract.ts`
  - `apps/web/src/features/create/dossierWorkspaceDecisionContract.ts`
  - `apps/web/src/app/dossier/[id]/studio/page.tsx`
  - `apps/web/src/app/admin/review/page.tsx`
- The shared wording now keeps `needs_source`, `needs_factcheck_review`, `review_ready`, `publish_ready` and review/publish distinctions aligned instead of letting each surface drift.

## Harmonized product truth

- `review_ready` is visible as review preparation, not approval.
- `publish_ready` is visible as release readiness, not published output.
- Factcheck remains review-first:
  - no automatic research run
  - no automatic seal
  - no automatic publish
- Dossier, create handoff, factcheck and admin review surfaces now reuse the same human labels for their nearest shared states.

## Validation

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/review-surface-status-labels.test.ts tests/factcheck-handoff-shell.contract.test.tsx tests/source-factcheck-feed-enrichment.contract.test.tsx tests/v3-review-context-summary.test.tsx tests/v3-runtime-workflow-surface.test.tsx tests/create-b2c-handoff-closure.contract.test.tsx tests/dossier-output-studio.page.contract.test.ts tests/admin-factcheck-jobs.page.test.tsx tests/admin-review.page.test.tsx`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web run typecheck`
