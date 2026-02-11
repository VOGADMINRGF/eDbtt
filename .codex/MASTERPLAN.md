# MASTERPLAN (E150)

## PR-0000: Control Plane
1. Add repo guardrails in `AGENTS.md`.
2. Add standardized verification scripts (`verify.sh`, `verify-web.sh`).
3. Add standardized Codex runner (`codex-pr.sh`).
4. Add masterplan + PR prompt templates.
5. Update `docs/E150/Part15.md` and record verification.

## PR-0001: Part02 baseline (XP/Levels/Gamification)
1. Confirm scope vs `docs/E150/Part02_Roles_Levels_XP_Gamification.md` and list target files.
2. Define XP/level constants and shared types.
3. Implement baseline XP accrual hooks (no UI expansion beyond scope).
4. Add level thresholds + labels mapping.
5. Update `docs/E150/Part15.md`.
6. Verification: run `./verify.sh`.

## PR-0002: Block C Paket 1 (Graph Sync Minimal)
1. Add minimal Graph sync adapter skeleton.
2. Map AnalyzeResult to Graph nodes/edges (minimal viable fields).
3. Add sync API route with guarded write path.
4. Add minimal admin view for Graph stats.
5. Update `docs/E150/Part15.md`.
6. Verification: run `./verify.sh`.

## PR-0003: Block C Paket 2 (Backfill/Resilience)
1. Add backfill job and cursor-based pagination.
2. Add retry/backoff for Graph writes.
3. Add idempotency guards.
4. Add basic telemetry for sync failures.
5. Update `docs/E150/Part15.md`.
6. Verification: run `./verify.sh`.

## PR-0004: Block D Persist/Types (Eventualities)
1. Define Eventuality/DecisionTree types and Prisma models.
2. Add migrations and minimal API routes.
3. Add storage service layer with validation.
4. Add read-only admin list.
5. Update `docs/E150/Part15.md`.
6. Verification: run `./verify.sh`.

## PR-0005: Block D Read-only UI
1. Add read-only Eventuality UI components.
2. Add routing and basic filters.
3. Add empty-state + loading states.
4. Wire API reads into UI.
5. Update `docs/E150/Part15.md`.
6. Verification: run `./verify.sh`.

## PR-0006: Block E Models+API (Research)
1. Define Research models + types.
2. Add list/detail API endpoints.
3. Add seeding hooks for Questions/Knots.
4. Add basic anti-spam guardrails.
5. Update `docs/E150/Part15.md`.
6. Verification: run `./verify.sh`.

## PR-0007: Block E UI + XP hook
1. Add Research UI list/detail views.
2. Add contributor feedback actions.
3. Hook XP on research contributions.
4. Add UI states for empty/loading/error.
5. Update `docs/E150/Part15.md`.
6. Verification: run `./verify.sh`.
