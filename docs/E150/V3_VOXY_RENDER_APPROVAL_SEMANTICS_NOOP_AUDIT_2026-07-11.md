# V3 Voxy Render Approval Semantics Noop Audit

## Scope

Slice: `V3-VOXY-RENDER-APPROVAL-SEMANTICS-NOOP-01`

This slice adds a typed, review-first `Approval Semantik` layer on top of the existing V3 Voxy chain:

- Preview Review Flow
- Preview Review Decision Persistence
- Preview Outcome Handoff
- Publish Readiness Guard
- Social Distribution Handoff

The slice is intentionally noop-only. It does not introduce:

- render runtime
- preview video generation
- provider execution
- uploads
- scheduling
- social posting
- publishing
- media files
- cost or credit debits

## Inventory

Repo inventory before implementation showed three nearby term clusters:

1. Existing publication approval terminology in broader publication/runtime flows
2. Review-first Voxy terminology around `review_ready`, `publish_ready`, `publish_guard`, and `distribution_handoff`
3. Older output/social workbench wording that is about review preparation, not posting

The new slice keeps those vocabularies separated instead of harmonizing them into one implicit state machine.

## Semantic boundaries

The slice hardens these distinctions:

- `review_ready` is not `approved`
- `publish_readiness` is not `approval`
- `distribution_handoff` is not `social_post`
- `approval_candidate` is not `approved`
- `approved` is not `uploaded`
- `approved` is not `scheduled`
- `approved` is not `social_posted`
- `approved` is not `published`

The UI repeats these boundaries explicitly so the approval layer cannot be misread as a hidden runtime trigger.

## What the approval layer protects

The new contract models:

- an explicit approval candidate
- human approval as a later manual requirement
- legal, source, claim, language/RTL, accessibility, media, publish-guard, distribution-guard, and runtime gates
- typed noop effects and execution flags that all remain false

This keeps the later approval discussion attachable without pretending that a real approval runtime already exists.

## Builder behavior

Deterministic builder rules in this slice:

- without `socialDistributionHandoffId` the layer is `blocked_by_missing_distribution_handoff`
- upstream publish/runtime blockers remain upstream and map to `blocked_by_publish_guard` or `blocked_by_runtime_truth`
- `keep_as_script_only` pauses approval as well
- `mark_review_ready` may set `reviewReady: true`, but `approved` remains `false`
- missing media truth can block approval via `blocked_by_missing_media`
- missing human approval can block approval via `blocked_by_missing_human_approval`
- all execution flags remain `false`

## Runtime and persistence boundary

The store and admin route are audit-only:

- `POST /api/admin/voxy-render-approval-semantics` stores typed semantics and audit metadata only
- `GET /api/admin/voxy-render-approval-semantics` reads typed semantics only
- records can exist without implying upload, schedule, post, or publish truth

Persisted approval semantics are therefore operational notes, not runtime completion.

## Surface integration

The panel is rendered additively in:

- `/create`
- `/account`
- `/admin/review`
- `/dossier/[id]/studio`

`/create` and `/account` stay readmodel-only.
`/admin/review` and `/dossier/[id]/studio` can show the latest persisted approval semantics read-only when available.

## Missing future runtime

Still intentionally absent after this slice:

- real named approver workflow
- approval action execution runtime
- approval-to-upload handoff runtime
- approval-to-scheduling handoff runtime
- approval-to-social-post runtime
- approval-to-publish runtime
- media-truth runtime
- provider/runtime truth for actual video execution

These remain future follow-up work and must not be inferred from the new panel or store.

## Evidence

Implemented files:

- `apps/web/src/features/create/voxyRenderApprovalSemanticsContract.ts`
- `apps/web/src/features/create/voxyRenderApprovalSemanticsStore.ts`
- `apps/web/src/features/create/VoxyRenderApprovalSemanticsPanel.tsx`
- `apps/web/src/app/api/admin/voxy-render-approval-semantics/route.ts`
- surface integrations in `/create`, `/account`, `/admin/review`, `/dossier/[id]/studio`

Tests added:

- `apps/web/tests/voxy-render-approval-semantics.contract.test.tsx`
- `apps/web/tests/voxy-render-approval-semantics.route.test.ts`

Surface regressions extended:

- `apps/web/tests/create-candidate-preview.contract.test.ts`
- `apps/web/tests/account-resume-workbench.contract.test.tsx`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/dossier-studio-server-persistence-ui.test.tsx`
