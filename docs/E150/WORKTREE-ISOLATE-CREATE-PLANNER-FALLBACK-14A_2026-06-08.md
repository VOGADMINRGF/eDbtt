# WORKTREE-ISOLATE-CREATE-PLANNER-FALLBACK-14A

Datum: 2026-06-13
Geprüfter Commit-Stand: `eeae5907` (`docs(e150): audit create planner followup drift`)

## Ziel

Den kleinsten sicheren Create-Folgeslice um den technischen Planner-Fallback isolieren:

- `planner_unavailable`
- Retry-Verhalten für `planner_only`
- degradierte Followup-UI ohne erfundene Themenstruktur
- veraltete Test-Erwartungen auf `heuristic_fallback` / `local_fallback`
- bestehende `server-only`-Importbarriere in `tests/create-mode.page.test.ts`

## Direkt geprüfte Dateien

Source-/UI-relevant:

- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/features/create/createPlanner.ts`
- `apps/web/src/features/create/intelligentFollowup.ts`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/app/api/create/intelligent-followup/route.ts`

Direkt angepasste Tests:

- `apps/web/tests/create-planner-no-domain-heuristic-expansion.contract.test.ts`
- `apps/web/tests/create-chat-first-mobile-dialog-experience.contract.test.tsx`
- `apps/web/tests/create-curated-dialog-workspace.contract.test.tsx`
- `apps/web/tests/create-entry-hierarchy.contract.test.tsx`
- `apps/web/tests/create-mode.page.test.ts`
- `apps/web/tests/create-degraded-followup-actions.contract.test.tsx`
- `apps/web/tests/create-planner-degraded-ui.contract.test.tsx`

Zusätzlich revalidiert:

- `apps/web/tests/create-planner-routing.contract.test.ts`
- `apps/web/tests/create-planner-timeout.contract.test.ts`
- `apps/web/tests/create-planner-complex-civic-input.contract.test.ts`

## Ergebnis

Der Fallback-Slice ist regressionsseitig sauber isoliert.

Was in diesem Slice belastbar grün ist:

- fehlender oder scheiternder Planner fällt konservativ auf `planner_unavailable` zurück
- die Retry-CTA ist im degraded Followup konsistent als `GPT-Einordnung erneut versuchen` bzw. `GPT-Einordnung wird erneut versucht …`
- degradierte Followup-Flächen behaupten keine fertige Themenstruktur mehr
- alte `heuristic_fallback`-/`local_fallback`-Assertions sind aus der direkt betroffenen Planner-Suite entfernt
- `tests/create-mode.page.test.ts` umgeht den bestehenden `server-only`-Import aus `createContributionDrafts` per Mock, ohne Produktcode zu ändern

## Bewusst nicht angefasst

Außerhalb dieses Slices geblieben:

- `apps/web/.env.example`
- `apps/web/src/app/globals.css`
- Multibranch-/Place-/Street-Producer und zugehörige untracked Tests
- Contribution-Ledger-/Handoff-Persistenz
- `apps/web/src/features/create/createSurfaceConfig.ts`
- `apps/web/src/features/quickActions/taskFirstQuickActions.ts`
- `apps/web/tests/account-organization-dashboard.page.test.tsx`
- `apps/web/src/app/account/AccountReviewSupplementSections.tsx`
- `apps/web/src/app/api/factcheck/status/[jobId]/prepareGraphCandidateAction.ts`
- `apps/web/src/features/surfaces/runden/manualAnlassraumSetup.ts`

## Risiken und Restmischung

Der Slice ist fachlich isoliert, aber noch nicht als reiner File-Level-Commit-Scope sauber.

Gemischte Dateien mit weiterem Restdrift:

- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/features/create/createPlanner.ts`
- `apps/web/src/features/create/intelligentFollowup.ts`

Folge daraus:

- ein späterer Commit für 14A muss hunkgenau cachen
- Multibranch-/Place-/Ledger-/Copy-Hunks dürfen dabei nicht mitgezogen werden

## Checks

Erfolgreich ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-planner-routing.contract.test.ts tests/create-planner-no-domain-heuristic-expansion.contract.test.ts tests/create-chat-first-mobile-dialog-experience.contract.test.tsx tests/create-curated-dialog-workspace.contract.test.tsx tests/create-entry-hierarchy.contract.test.tsx tests/create-mode.page.test.ts tests/create-planner-degraded-ui.contract.test.tsx tests/create-planner-timeout.contract.test.ts tests/create-planner-complex-civic-input.contract.test.ts tests/create-degraded-followup-actions.contract.test.tsx`

Ergebnis:

- `10/10` Dateien grün
- `35/35` Tests grün

## Staging / Commit

Kein Staging-Probe-Lauf und kein Commit in diesem Slice.

Grund:

- der Worktree enthält noch breite fremde Restdrift
- der nächste Schritt ist ein eigener Commit-Slice mit hunkgenauem Caching

## Nächster empfohlener Task

`WORKTREE-COMMIT-CREATE-PLANNER-FALLBACK-14A`

Begründung:

- die direkt betroffenen Planner-/Fallback-Contracts sind jetzt grün
- der nächste sinnvolle Schritt ist kein weiterer Audit, sondern ein strikt hunkgenauer Commit nur für den technischen Fallback-Scope
