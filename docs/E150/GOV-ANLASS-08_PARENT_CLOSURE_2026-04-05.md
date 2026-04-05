# GOV-ANLASS-08 - Parent Closure (2026-04-05)

## Scope

Closure check for the remaining parent scope after completed slices:
- `GOV-ANLASS-08A` (inventory/mapping)
- `GOV-ANLASS-08B` (safety-startform contract linkage)
- `GOV-ANLASS-08C` (guardrail regression tests)

No new community/social product scope.
No wrapper/app/store scope.

## Parent rest matrix

| Bereich | Route / Surface / Doku | Through 08A/08B/08C covered | Real drift | Small closable | Still GOV-ANLASS-08 scope |
| --- | --- | --- | --- | --- | --- |
| Research inventory baseline | `docs/E150/Part09_Community_Research_Workflow.md`, `docs/E150/Part16_AI_Orchestration_and_Safety.md` | yes (`08A`) | no | n/a | yes |
| Public research read path | `GET /api/research/tasks/list` (`apps/web/src/app/api/research/tasks/list/route.ts`) | yes (`08B`,`08C`) | no | n/a | yes |
| Public research detail path | `GET /api/research/tasks/[id]` (`apps/web/src/app/api/research/tasks/[id]/route.ts`) | yes (`08B`,`08C`) | no | n/a | yes |
| Public research submit path | `POST /api/research/tasks/[id]/contribute` (`apps/web/src/app/api/research/tasks/[id]/contribute/route.ts`) | yes (`08B`,`08C`) | no | n/a | yes |
| Admin review status path | `POST /api/admin/research/contributions/status` (`apps/web/src/app/api/admin/research/contributions/status/route.ts`) | yes (`08B`,`08C`) | no | n/a | yes |
| Research surface guardrail hint | `apps/web/src/app/research/tasks/page.tsx` | yes (`08B`) | no | n/a | yes |
| Future community flow expansion | beyond current guardrail hardening | no (intentional) | no parent drift | not in this slice | no |

## Verification

### Route/contract checks
- Safety-startform contract remains explicit in research list/detail/submit responses.
- Admin review status route remains admin-gated (`requireAdminOrResponse`) and carries the same safety meta contract.
- Research submit path keeps payload contract strict; contact-escalation fields are not mapped into contribution write payload.

### Test verification
- `pnpm -C apps/web exec vitest run tests/research-safety-contract.routes.test.ts tests/research-review-guardrails.route.test.ts`
- Result: 2 files passed, 6 tests passed.

## Result

There is no remaining small parent drift inside `GOV-ANLASS-08` after `08A/08B/08C`.
Remaining items are future community-flow expansion and are outside this hardening parent.

`GOV-ANLASS-08` is closure-ready and can be set to `done`.
