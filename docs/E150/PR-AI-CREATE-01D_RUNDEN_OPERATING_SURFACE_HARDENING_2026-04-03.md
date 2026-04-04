# PR-AI-CREATE-01D - /runden operating-surface hardening (2026-04-03)

## Scope
- Harmonize `/runden` as running work/status/results surface.
- Keep `/create` as canonical intake/analyze/routing/draft orchestrator.
- Avoid UI rewrite, billing/funding scope, or new governance decisions.

## Implemented
1. Entry-source contract uplift (`features/topicRound/entrySource.ts`)
   - Added explicit link contexts:
     - `intakeHref` (continue in `/create`)
     - `operatingHref` (open running context in `/runden`/`/anlassraum` or internal publish target)
     - `resultsHref` (closed/public result target)
   - Added closure metadata:
     - `finished`
     - `finishedAt`
   - Kept legacy-compatible `entryHref` unchanged to avoid regressions in existing flows.

2. `/runden` product-role clarity (`apps/web/src/app/runden/page.tsx`)
   - Hero/start cards now explicitly separate `/create` (start) vs `/runden` (running work).
   - Active cards prioritize `operatingHref`; optional secondary continuation to `intakeHref`.
   - Results cards prioritize `resultsHref`, then safe operating fallback.
   - Copy clarified:
     - round = process/status context
     - anlassraum = open context
     - dossier = larger knowledge context

## Guardrails kept
- No truth/ranking/priority/voting privilege introduced.
- No auto-publish or hidden intake bypass.
- No new route or parallel domain introduced.

## Tests
- Updated: `apps/web/tests/runden-entry.service.test.ts`
- Updated: `apps/web/tests/runden-page.acceptance.test.ts`
- Recommended check suite for this slice:
  - `pnpm -C apps/web exec vitest run apps/web/tests/runden-entry.service.test.ts apps/web/tests/runden-page.acceptance.test.ts`
  - `pnpm -C apps/web run typecheck`
  - `pnpm -C apps/web run lint`

## Out of scope
- No redesign of `/runden` navigation IA.
- No personal-assignment backend expansion for `mine` view.
- No new pricing/funding/organization policy.
