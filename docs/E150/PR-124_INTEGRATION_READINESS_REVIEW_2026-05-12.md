# PR #124 Integration Readiness Review

Stand: 2026-05-12

## Kurzfazit

PR #124 ist auf dem aktuellen Stand kein schmaler `Mobile Shell`-PR mehr.

Der Diff gegen `origin/main` umfasst mehrere dokumentierte E150-Slices gleichzeitig:

- Mobile UX
- Planner / Graph
- Handoff
- Material
- Live-QA / Hardening
- Region / Admin

Damit ist PR #124 nur dann ehrlich mergebar, wenn er als Integrations-PR behandelt und benannt wird.

## Diff-Stat

Aus dem aktuellen Branchzustand:

- `git diff --stat origin/main...HEAD`
  - `105 files changed, 10403 insertions(+), 957 deletions(-)`

Dominante Blöcke:

- `CreateVisualFollowup.tsx`
- `CreateClient.tsx`
- `createPlanner.ts`
- `createHandoff.ts`
- `materialRouting.ts`
- Region-/Admin-Routen und -Contracts

## Scope-Klassifikation

### Gehört zu Mobile UX

- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/features/create/SharedCreateComposer.tsx`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/tests/create-chat-first-mobile-dialog-experience.contract.test.tsx`
- `apps/web/tests/create-entry-hierarchy.contract.test.tsx`

### Gehört zu Planner / Graph

- `apps/web/src/features/create/createPlanner.ts`
- `apps/web/src/features/create/intelligentFollowup.ts`
- `apps/web/src/features/create/intelligentFollowupContract.ts`
- `apps/web/src/features/create/createConnectionSuggestions.ts`
- `apps/web/tests/create-planner-*.test.ts*`
- `apps/web/tests/create-graph-match-*.test.ts`

### Gehört zu Handoff

- `apps/web/src/features/create/createHandoff.ts`
- `apps/web/src/features/create/CreateHandoffPanel.tsx`
- `apps/web/src/app/dossier/page.tsx`
- `apps/web/src/app/dossier/[id]/page.tsx`
- `apps/web/src/app/factcheck/page.tsx`
- `apps/web/src/app/runden/RundenCreateHandoffBanner.tsx`
- `apps/web/src/app/community/contributions/page.tsx`

### Gehört zu Material

- `apps/web/src/features/create/materialRouting.ts`
- `apps/web/src/components/analyze/AnalyzeWorkspace.tsx`
- `apps/web/src/app/api/contributions/analyze/route.ts`
- `apps/web/src/app/api/contributions/save/route.ts`
- `apps/web/src/features/material/notebookMaterialAdapter.ts`

### Gehört zu Live-QA / Hardening

- `apps/web/tests/live-click-hardening.contract.test.ts`
- `apps/web/tests/create-analyze.route.test.ts`
- `apps/web/tests/create-analyze.workspace-ui.test.ts`
- `apps/web/tests/create-mode.save.route.test.ts`

### Gehört zu Region / Admin

- `apps/web/public/Listen/Anschriften_der_Gemeinde_und_Stadtverwaltungen_Stand_31012023_final.xlsx`
- `features/region/**`
- `apps/web/src/app/admin/region/page.tsx`
- `apps/web/src/app/api/admin/region/**`
- `apps/web/tests/regional-*.test.ts`

## Datei-Entscheidungen

### `apps/web/next-env.d.ts`

Behalten.

Grund:

- der Build läuft auf dem aktuellen Next-16-Stand nur mit dem Importpfad `./.next/types/routes.d.ts`
- es ist kein fachlicher Slice-Bestandteil, aber ein legitimer Build-/Tooling-Fix

### `apps/web/public/Listen/*.xlsx`

Nicht versehentlich.

Grund:

- die Datei ist nur sinnvoll, wenn der Region-/Admin-Slice bewusst Teil von PR #124 bleibt
- ohne Region-/Admin-Slice sollte sie aus einem schmalen Mobile-/Create-PR entfernt werden

## Kanonische `/create`-Pipeline

Für den aktuellen Branch ist die kanonische Kette:

`SharedCreateComposer -> createPlanner -> intelligentFollowup -> CreateVisualFollowup -> createHandoff -> Zielsurface/AnalyzeWorkspace -> Save/Finalize/Rückweg`

### Kanonische Komponenten

- `/create`
- `SharedCreateComposer`
- `createPlanner`
- `intelligentFollowup`
- `CreateVisualFollowup`
- `createHandoff`
- `AnalyzeWorkspace`

### Handoff-Ziele

- `/dossier`
- `/factcheck`
- `/runden`
- `/swipes`
- `/community/contributions`

### Wrapper / Legacy / Demo

- Wrapper:
  - `/contributions/new` -> Redirect auf `/create`
  - `/statements/new` -> Redirect auf `/create`
- Demo:
  - `/demo/create` bleibt eigene Demo-Surface, nicht kanonischer Produktpfad
- Alias / Legacy:
  - produktive Create-Logik bleibt in `/create`, nicht in parallelen neuen Oberflächen

## Merge-Einschätzung

### Ist #124 mergebar?

Technisch:

- ja, auf dem aktuellen Stand sind Typecheck, Lint, Build und die relevanten Create-/Handoff-/Material-Suites grün

Fachlich / organisatorisch:

- nicht als ehrlicher `Mobile Shell`-PR
- nur als Integrations-PR oder nach Split

### Empfehlung

Option B ist aktuell die sauberste:

- PR #124 als Integrations-PR umbenennen
- PR-Body nach Slice-Gruppen aufteilen:
  - Mobile UX
  - Planner / Graph
  - Handoff
  - Material
  - Live-QA
  - Region / Admin

Zusätzlich möglich:

- Option C selektiv für Dateien, die im Ziel-PR nicht bewusst enthalten sein sollen

## Produktionsblocker

Der klare Restblock bleibt:

- `PR-CREATE-WORKFLOW-LIVE-QA-01` ist weiterhin `in_progress`

Noch nicht vollständig browsernah abgehakt:

- Save
- Finalize
- Rückwege
- Link
- YouTube
- PDF
- Upload

Solange dieser Matrixlauf nicht vollständig dokumentiert ist, sollte der `/create`-Integrationsblock nicht als produktionsreif abgeschlossen markiert werden.

## Verifikation

Ausgeführt in diesem Review-Nachlauf:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web exec vitest run tests/create-planner-debug-diagnostics.contract.test.ts tests/create-planner-openai-happy-path.contract.test.ts tests/create-degraded-followup-actions.contract.test.tsx tests/create-planner-quality-gate.contract.test.ts tests/create-planner-routing.contract.test.ts tests/create-chat-first-mobile-dialog-experience.contract.test.tsx tests/create-entry-hierarchy.contract.test.tsx`
- `pnpm -C apps/web exec vitest run tests/live-click-hardening.contract.test.ts tests/create-handoff-draft.contract.test.ts tests/create-factcheck-handoff.contract.test.ts tests/create-dossier-handoff.contract.test.ts tests/create-material-routing.contract.test.ts tests/create-analyze.route.test.ts tests/create-chat-first-mobile-dialog-experience.contract.test.tsx tests/create-entry-hierarchy.contract.test.tsx`

Ergebnis:

- Typecheck grün
- Lint grün
- Build grün
- Planner-/degraded-Suite grün
- Create-/Handoff-/Material-Suite grün

Build-Hinweise ohne Fail:

- `baseline-browser-mapping` Update-Hinweis
- Mongo-SRV-Noise während Static Build, Exit trotzdem `0`
