# WORKTREE-COMMIT-RUNDEN-UX-00F

Date: 2026-06-07
Task: `WORKTREE-COMMIT-RUNDEN-UX-00F`
Repo: `edebatte-org`

## Ziel

Den bereits entkoppelten Slice `UX-RUNDEN-GUIDE-ENTRY-02` hunk-genau stagen und committen, ohne fremde Cluster mitzunehmen.

## Commit

- Commit SHA: `be9d27024d7b62792cafa483f1e77a72db608f06`
- Commit message: `fix(runden): restore guided manual round entry`

## Commit-Inhalt

Committe Dateien:

- `apps/web/src/app/globals.css`
- `apps/web/src/app/runden/page.tsx`
- `apps/web/src/app/runden/new/AnlassraumSetupForm.tsx`
- `apps/web/src/app/runden/new/AnlassraumStartDraftPanel.tsx`
- `apps/web/src/app/runden/new/AnlassraumOptionEditor.tsx`
- `apps/web/src/app/runden/new/AnlassraumVisibilitySettings.tsx`
- `apps/web/src/app/runden/new/AnlassraumSupportSettings.tsx`
- `apps/web/src/app/runden/new/AnlassraumPrePublishCheck.tsx`
- `apps/web/src/app/runden/RundenPublicInputPanel.tsx`
- `apps/web/src/app/runden/RundenPublicSharingGuide.tsx`
- `apps/web/src/features/voxy/rundenVoxyCopy.ts`
- `apps/web/tests/runden-page.acceptance.test.ts`
- `apps/web/tests/runden-manual-create.page.contract.test.tsx`
- `apps/web/tests/runden-working-surface-copy.contract.test.ts`
- `docs/E150/UX-RUNDEN-GUIDE-ENTRY-02_2026-06-06.md`
- `docs/E150/WORKTREE-CROSSCUTTING-UNTANGLE-00B_2026-06-06.md`
- `docs/E150/WORKTREE-ISOLATE-RUNDEN-UX-00C_2026-06-06.md`
- `docs/E150/WORKTREE-COMMIT-RUNDEN-UX-00D_2026-06-06.md`
- `docs/E150/WORKTREE-DECOUPLE-RUNDEN-FROM-START-DRAFT-00E_2026-06-06.md`

## Ausgeschlossen

Explizit nicht im Commit:

- `apps/web/src/components/voxy/VoxyGuide.tsx`
- `apps/web/src/features/voxy/voxyCopy.ts`
- `apps/web/src/features/start/*`
- `apps/web/src/app/account/AccountClient.tsx`
- `features/account/service.ts`
- `features/account/types.ts`
- alle Factcheck-Dateien
- alle Graph-/Merge-Dateien
- alle ReviewQueue-Dateien
- alle Truth-Guard-Dateien
- alle sonstigen Start/Create/Draft-Dateien außerhalb des Runden-Scopes
- `docs/E150/OpenTasks.md`

## globals.css

In `apps/web/src/app/globals.css` wurden nur diese Runden-/Anlassraum-Hunks in den Commit aufgenommen:

- `.runden-hero-title`
- `.anlassraum-hero-title`
- `.anlassraum-soft-signal`
- `.runden-step-line`
- `.anlassraum-step-track`
- `.anlassraum-step-track::-webkit-scrollbar`
- `.anlassraum-step-item`
- `.anlassraum-step-item--active .anlassraum-step-count`
- `.anlassraum-step-count`
- `.anlassraum-step-body`
- `.anlassraum-step-label`
- `.anlassraum-step-lead`
- Media-Query-Ergänzungen für `.anlassraum-step-track` und `.anlassraum-step-item`

Nicht aufgenommen wurden alle `landing-*`, `public-start-*`, `public-action-row`, `public-color-rail`, `public-hero-title`, `public-section-title` und sonstigen Querschnittshunks.

## Tests

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/runden-page.acceptance.test.ts tests/runden-manual-create.page.contract.test.tsx tests/runden-working-surface-copy.contract.test.ts`

Ergebnis:

- `typecheck`: grün
- `lint`: grün
- `vitest`: `17/17` Tests grün

## Verbleibender Drift

Der Worktree bleibt nach dem Runden-Commit breit dirty in den Clustern:

- Start/Create/Draft
- Truth-Guard
- Editorial Review / ReviewQueue
- Factcheck
- Graph / Merge
- Account
- weitere Evidence-Dateien

`apps/web/src/app/globals.css` bleibt im Worktree zusätzlich weiter modifiziert, weil die nicht zum Runden-Slice gehörenden Querschnittshunks bewusst nicht mit committed wurden.

## Nächster empfohlener Cluster

Als nächstes sollte der Start/Create/Draft-Cluster isoliert werden, weil dort die meisten Querschnittsabhängigkeiten und untracked Helfer liegen.

## Hinweis

`END-TO-END-CLOSED-PROCESS-QA-19` darf nach diesem Commit weiterhin nicht gestartet werden. Erst müssen die übrigen Cluster sauber isoliert oder bereinigt werden.
