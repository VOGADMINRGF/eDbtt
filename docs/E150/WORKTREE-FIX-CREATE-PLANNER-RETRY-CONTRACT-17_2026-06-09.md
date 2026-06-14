# WORKTREE-FIX-CREATE-PLANNER-RETRY-CONTRACT-17

## Ausgangslage nach Cleanup

- Ausgangs-Commitstand fuer den PR-Readiness-Audit: `6dd06b2596ee5c7e4ee9db17d558daac1eb1f069`
- `WORKTREE-CLEANUP-PARK-RESTDRIFT-16` hat den Worktree bereinigt, aber keinen Commit erzeugt.
- Der Branch war danach weiter nicht PR-ready, weil der committed Stand selbst einen kleinen Planner-/Retry-Vertragsbruch enthielt.

## Exakte Blocker

1. `apps/web/src/features/create/CreateVisualFollowup.tsx` verglich gegen `planner.source === "planner_unavailable"`, obwohl `CreatePlannerSource` im committed Stand nur `openai | heuristic_fallback` erlaubt.
2. `apps/web/tests/create-planner-no-domain-heuristic-expansion.contract.test.ts` erwartete fuer den Quoten-/Gleichberechtigungs-Fallback noch `planner_unavailable`, obwohl der committed Planner-Vertrag dort `heuristic_fallback` mit `technical_fallback_only` ausspielt.
3. `apps/web/tests/create-degraded-followup-actions.contract.test.tsx` erwartete in `apps/web/src/app/create/CreateClient.tsx` die Retry-Pending-Logik `setIsRetryPlannerPending(true/false)`, die im committed Stand fehlte.

## Vertragsentscheidung

- Kanonischer `CreatePlannerSource` bleibt `heuristic_fallback`.
- Technischer Planner-Ausfall wird in der UI nicht ueber einen zweiten Source-Wert, sondern ueber `qualityStatus === "failed"` oder `qualityIssues` inklusive `technical_fallback_only` erkannt.
- Damit bleiben konkrete lokale Fallback-Strukturen weiter von echten technischen Retry-/Unavailable-Zustaenden unterscheidbar.

## Geaenderte Dateien

- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/tests/create-planner-no-domain-heuristic-expansion.contract.test.ts`
- `apps/web/tests/create-degraded-followup-actions.contract.test.tsx`
- `apps/web/tests/create-planner-degraded-ui.contract.test.tsx`
- `apps/web/tests/create-chat-first-mobile-dialog-experience.contract.test.tsx`
- `docs/E150/OpenTasks.md`
- `docs/E150/WORKTREE-FIX-CREATE-PLANNER-RETRY-CONTRACT-17_2026-06-09.md`

## Guardrails

- Retry bleibt explizit nutzergefuehrt.
- Kein stiller AI-, DeepSearch- oder Kostenpfad.
- Kein Auto-Dossier.
- Kein Auto-Anlassraum.
- Kein Auto-Vote.
- Kein Auto-Graph.
- Der degradierte Planner-Zustand bleibt sichtbar und nicht als belastbare Vollstruktur getarnt.

## Tests und Ergebnis

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-planner-no-domain-heuristic-expansion.contract.test.ts tests/create-degraded-followup-actions.contract.test.tsx tests/create-planner-routing.contract.test.ts tests/create-planner-timeout.contract.test.ts tests/create-planner-complex-civic-input.contract.test.ts tests/create-chat-first-mobile-dialog-experience.contract.test.tsx tests/create-curated-dialog-workspace.contract.test.tsx tests/create-entry-hierarchy.contract.test.tsx`
- `pnpm -C apps/web exec vitest run tests/create-planner-routing.contract.test.ts tests/create-planner-no-domain-heuristic-expansion.contract.test.ts tests/create-chat-first-mobile-dialog-experience.contract.test.tsx tests/create-curated-dialog-workspace.contract.test.tsx tests/create-entry-hierarchy.contract.test.tsx tests/create-degraded-followup-actions.contract.test.tsx tests/create-branch-handoff-workbench.contract.test.tsx tests/create-existing-match-counting.contract.test.tsx tests/create-qr-swipes-drafts.contract.test.tsx tests/create-multibranch-actions.contract.test.tsx tests/admin-review.page.test.tsx tests/account-factcheck-jobs.contract.test.tsx tests/live-campaign-entry.contract.test.tsx tests/live-media-kit.contract.test.tsx tests/voxy-guide.render.test.tsx`

Ergebnis:

- Typecheck gruen
- Lint gruen
- Fokussierte Planner-/Retry-Suite gruen: `8/8` Dateien, `28/28` Tests
- Finale PR-Smoke-Auswahl gruen: `15/15` Dateien, `52/52` Tests

## PR-Readiness

- Der Branch ist nach diesem Slice wieder PR-ready.
- Der Worktree ist sauber und der verbleibende Planner-/Retry-Vertragsbruch des committed Stands ist geschlossen.
