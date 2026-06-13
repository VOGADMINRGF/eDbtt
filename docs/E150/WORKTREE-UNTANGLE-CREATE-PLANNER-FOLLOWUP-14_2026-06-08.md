# WORKTREE-UNTANGLE-CREATE-PLANNER-FOLLOWUP-14

Datum: 2026-06-13
Geprüfter Commit-Stand: `82a47054` (`fix(account): isolate review and factcheck status surfaces`)

## Geprüfte Dateien

Direkt geprüft:

- `apps/web/.env.example`
- `apps/web/src/app/api/contributions/save/route.ts`
- `apps/web/src/app/api/create/intelligent-followup/route.ts`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/features/create/createPlanner.ts`
- `apps/web/src/features/create/createProductionAccess.ts`
- `apps/web/src/features/create/createSurfaceConfig.ts`
- `apps/web/src/features/create/intelligentFollowup.ts`
- `apps/web/src/features/create/intelligentFollowupContract.ts`
- `apps/web/src/features/quickActions/taskFirstQuickActions.ts`
- `apps/web/src/features/surfaces/runden/manualAnlassraumSetup.ts`
- `apps/web/src/features/create/branchHandoffTargets.ts`
- `apps/web/src/features/create/placeResolution.ts`
- `features/create/createContributionLedger.ts`
- `apps/web/tests/create-mode-selector.contract.test.ts`
- `apps/web/tests/create-mode.page.test.ts`
- `apps/web/tests/create-planner-routing.contract.test.ts`
- `apps/web/tests/create-planner-no-domain-heuristic-expansion.contract.test.ts`
- `apps/web/tests/create-degraded-followup-actions.contract.test.tsx`
- `apps/web/tests/create-chat-first-mobile-dialog-experience.contract.test.tsx`
- `apps/web/tests/create-curated-dialog-workspace.contract.test.tsx`
- `apps/web/tests/create-entry-hierarchy.contract.test.tsx`
- `apps/web/tests/create-place-clarification.contract.test.tsx`
- `apps/web/tests/create-existing-match-counting.contract.test.tsx`
- `apps/web/tests/create-multibranch-actions.contract.test.tsx`
- `apps/web/tests/create-street-registry-lookup.contract.test.tsx`
- `apps/web/tests/create-branch-ledger-persistence.contract.test.tsx`
- `apps/web/tests/create-branch-handoff-workbench.contract.test.tsx`
- `apps/web/tests/create-place-planner-unavailable-stability.contract.test.tsx`
- `apps/web/tests/create-place-registry-jurisdiction.contract.test.tsx`
- `apps/web/tests/create-qr-swipes-drafts.contract.test.tsx`
- `apps/web/tests/manual-anlassraum-setup.contract.test.ts`

Bewusst nur gegengeprüft und nicht in den Slice gezogen:

- `apps/web/src/app/globals.css`
- `apps/web/src/app/account/AccountReviewSupplementSections.tsx`
- `apps/web/src/app/api/factcheck/status/[jobId]/prepareGraphCandidateAction.ts`
- `apps/web/tests/account-organization-dashboard.page.test.tsx`

## Cluster-Bewertung

### 1. Planner-Fallback / Retry / Degraded-UI

Dateien:

- `apps/web/src/features/create/createPlanner.ts`
- `apps/web/src/features/create/intelligentFollowup.ts`
- `apps/web/src/features/create/intelligentFollowupContract.ts`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/app/api/create/intelligent-followup/route.ts`
- Planner-/Fallback-/Degraded-Tests

Bewertung:

- gehört eindeutig zum aktuellen Create-/Planner-/Followup-Cluster
- fachlich wertvoll, weil hier die Umstellung von `heuristic_fallback` auf `planner_unavailable`, Retry-Verhalten und konservative degraded UI zusammenlaufen
- nicht versehentliche Drift
- noch nicht sauber commitbar als Dateiscope, weil `CreateClient.tsx` und `CreateVisualFollowup.tsx` zusätzlich Multibranch-/Place-/Handoff-Änderungen tragen
- braucht weitere Entmischung
- mittleres Risiko, weil mehrere rote Expectations direkt daran hängen

Relevante Tests:

- `tests/create-planner-routing.contract.test.ts`
- `tests/create-planner-no-domain-heuristic-expansion.contract.test.ts`
- `tests/create-degraded-followup-actions.contract.test.tsx`
- `tests/create-chat-first-mobile-dialog-experience.contract.test.tsx`
- `tests/create-planner-timeout.contract.test.ts`
- `tests/create-planner-degraded-ui.contract.test.tsx`

Empfohlene Aktion:

- vorher entmischen

### 2. Multibranch / Place / Street / Create-UI

Dateien:

- `apps/web/src/features/create/intelligentFollowup.ts`
- `apps/web/src/features/create/intelligentFollowupContract.ts`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/createPlanner.ts`
- `apps/web/src/features/create/placeResolution.ts`
- `apps/web/tests/create-place-clarification.contract.test.tsx`
- `apps/web/tests/create-multibranch-actions.contract.test.tsx`
- `apps/web/tests/create-street-registry-lookup.contract.test.tsx`
- `apps/web/tests/create-place-planner-unavailable-stability.contract.test.tsx`
- `apps/web/tests/create-place-registry-jurisdiction.contract.test.tsx`

Bewertung:

- gehört klar zum Cluster
- fachlich wertvoll
- keine bloße Zufallsdrift
- noch nicht klein genug für einen sicheren ersten Commit, weil Producer, UI und lokale Korrekturpfade in denselben großen Dateien stecken
- braucht weitere Entmischung
- höheres Risiko als der Planner-Fallback-Slice, weil mehrere neue Interaktionspfade und Orts-/Zuständigkeitsheuristiken zusammenspielen

Relevante Tests:

- `tests/create-place-clarification.contract.test.tsx`
- `tests/create-multibranch-actions.contract.test.tsx`
- `tests/create-street-registry-lookup.contract.test.tsx`
- `tests/create-place-planner-unavailable-stability.contract.test.tsx`
- `tests/create-place-registry-jurisdiction.contract.test.tsx`

Empfohlene Aktion:

- vorher entmischen

### 3. Contribution-Ledger / Handoff-Persistenz

Dateien:

- `apps/web/src/app/api/contributions/save/route.ts`
- `apps/web/src/features/create/intelligentFollowupContract.ts`
- `apps/web/src/features/create/branchHandoffTargets.ts`
- `features/create/createContributionLedger.ts`
- `apps/web/tests/create-existing-match-counting.contract.test.tsx`
- `apps/web/tests/create-branch-ledger-persistence.contract.test.tsx`
- `apps/web/tests/create-branch-handoff-workbench.contract.test.tsx`
- `apps/web/tests/create-qr-swipes-drafts.contract.test.tsx`

Bewertung:

- gehört zum Cluster
- fachlich wertvoll
- technisch überraschend geschlossen
- noch nicht der beste erste Folgeslice, weil der Producer für `contributionPackage` parallel in den großen Create-Dateien steckt
- braucht Entmischung gegen Multibranch-/Place-Producer, ist aber testseitig bereits stabil
- mittleres Risiko

Relevante Tests:

- `tests/create-existing-match-counting.contract.test.tsx`
- `tests/create-branch-ledger-persistence.contract.test.tsx`
- `tests/create-branch-handoff-workbench.contract.test.tsx`
- `tests/create-qr-swipes-drafts.contract.test.tsx`

Empfohlene Aktion:

- genauer prüfen

### 4. Create-Surface / Copy / Access

Dateien:

- `apps/web/src/features/create/createSurfaceConfig.ts`
- `apps/web/src/features/create/createProductionAccess.ts`
- `apps/web/src/features/quickActions/taskFirstQuickActions.ts`
- `apps/web/tests/create-mode-selector.contract.test.ts`
- `apps/web/tests/create-mode.page.test.ts`
- `apps/web/tests/account-organization-dashboard.page.test.tsx`
- indirekt betroffene, aktuell unveränderte Expectations in `tests/create-entry-hierarchy.contract.test.tsx` und `tests/create-curated-dialog-workspace.contract.test.tsx`

Bewertung:

- fachlich wertvoll, aber klar gemischt mit Start-/Dashboard-/Account-Copy
- teilweise versehentliche Vermischung, weil `taskFirstQuickActions.ts` und `account-organization-dashboard.page.test.tsx` nicht mehr rein im Create-Scope liegen
- nicht als erster Create-Slice zu empfehlen
- braucht weitere Entmischung
- mittleres Risiko, weil mehrere Oberflächen dieselben Texte spiegeln

Relevante Tests:

- `tests/create-mode-selector.contract.test.ts`
- `tests/create-mode.page.test.ts`
- `tests/create-entry-hierarchy.contract.test.tsx`
- `tests/create-curated-dialog-workspace.contract.test.tsx`
- `tests/account-organization-dashboard.page.test.tsx`

Empfohlene Aktion:

- zurückstellen

### 5. Runden-Start-Draft-Helfer

Dateien:

- `apps/web/src/features/surfaces/runden/manualAnlassraumSetup.ts`
- `apps/web/tests/manual-anlassraum-setup.contract.test.ts`
- fachlich nah: `tests/start-draft-handoff-targets.contract.test.ts`

Bewertung:

- technisch klein
- wahrscheinlich wertvoll
- gehört eher in einen separaten `runden`-/manual-setup-Slice als in den ersten Create-Folgescope
- isoliert commitbar denkbar, aber nicht der beste nächste Schritt für den großen Create-Rest
- geringes Risiko

Relevante Tests:

- `tests/manual-anlassraum-setup.contract.test.ts`
- `tests/start-draft-handoff-targets.contract.test.ts`

Empfohlene Aktion:

- separat prüfen

### 6. Fremde Drift, die draußen bleibt

Dateien:

- `apps/web/.env.example`
- `apps/web/src/app/globals.css`
- `apps/web/src/app/account/AccountReviewSupplementSections.tsx`
- `apps/web/src/app/api/factcheck/status/[jobId]/prepareGraphCandidateAction.ts`
- `apps/web/tests/account-organization-dashboard.page.test.tsx`

Bewertung:

- `.env.example` ist kein sicherer Teil des Create-Slices
- `globals.css` ist explizit ausgeschlossen
- `AccountReviewSupplementSections.tsx` und `prepareGraphCandidateAction.ts` gehören weiterhin nicht in den Create-Cluster
- `account-organization-dashboard.page.test.tsx` ist Copy-Drift an einer fremden Oberfläche und nur indirekt von `taskFirstQuickActions.ts` berührt

Empfohlene Aktion:

- draußen lassen

## Testlauf

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-mode-selector.contract.test.ts tests/create-mode.page.test.ts tests/create-planner-routing.contract.test.ts tests/create-planner-no-domain-heuristic-expansion.contract.test.ts tests/create-degraded-followup-actions.contract.test.tsx tests/create-place-clarification.contract.test.tsx tests/create-existing-match-counting.contract.test.tsx tests/create-multibranch-actions.contract.test.tsx tests/create-street-registry-lookup.contract.test.tsx tests/manual-anlassraum-setup.contract.test.ts tests/create-branch-ledger-persistence.contract.test.tsx tests/create-chat-first-mobile-dialog-experience.contract.test.tsx tests/create-curated-dialog-workspace.contract.test.tsx tests/create-entry-hierarchy.contract.test.tsx`
- `pnpm -C apps/web exec vitest run tests/create-branch-handoff-workbench.contract.test.tsx tests/create-qr-swipes-drafts.contract.test.tsx tests/create-place-planner-unavailable-stability.contract.test.tsx tests/create-place-registry-jurisdiction.contract.test.tsx`

Ergebnis:

- Typecheck: grün
- Lint: grün
- Vitest Hauptsuite: `8/14` Dateien grün, `58/64` Tests grün
- Vitest Zusatzsuite Place/Handoff/Ledger: `4/4` Dateien, `9/9` Tests grün

Aktuelle rote Punkte:

- `tests/create-degraded-followup-actions.contract.test.tsx`
  - erwartet noch ältere degraded-Copy (`GPT-Einordnung ...`-Label stimmt nicht mehr vollständig)
- `tests/create-chat-first-mobile-dialog-experience.contract.test.tsx`
  - erwartet noch die alte Klarstellung `Wir konnten dein Anliegen noch nicht sicher einordnen.`
- `tests/create-planner-no-domain-heuristic-expansion.contract.test.ts`
  - erwartet noch `heuristic_fallback` statt `planner_unavailable`
- `tests/create-entry-hierarchy.contract.test.tsx`
  - erwartet noch alte Start-Copy (`Was möchtest du einbringen?`, `Beitrag einreichen`)
- `tests/create-curated-dialog-workspace.contract.test.tsx`
  - prüft noch alte englische Start-Copy im `CreateClient`-Source
- `tests/create-mode.page.test.ts`
  - Suite bricht aktuell zusätzlich an einer bestehenden `server-only`-Importbarriere

## Ist ein kleiner Commit-Scope schon eindeutig möglich?

Noch nicht als klarer file-level Scope.

Begründung:

- `CreateClient.tsx`, `CreateVisualFollowup.tsx`, `createPlanner.ts` und `intelligentFollowup.ts` tragen jeweils mehrere der oben getrennten Cluster gleichzeitig
- die derzeit roten Tests hängen an mindestens zwei verschiedenen Subclustern
- eine Hunk-Probe wäre deshalb in diesem Schritt zu spekulativ gewesen

## Empfohlene Reihenfolge

1. `WORKTREE-ISOLATE-CREATE-PLANNER-FALLBACK-14A`
2. danach Multibranch-/Place-/Street-Producer und UI
3. danach Contribution-Ledger-/Handoff-Persistenz
4. danach Create-/Start-/Dashboard-Copy
5. den `runden`-Start-Draft-Helfer separat

## Was ausdrücklich nicht verändert wurde

- keine Source-Datei außerhalb des bereits dirty Worktrees
- keine Tests außerhalb dieses Auditlaufs
- kein Commit
- kein `git add`
- keine Datei gelöscht
- keine automatische Restdrift-Bereinigung

## Nächster empfohlener Task

- `WORKTREE-ISOLATE-CREATE-PLANNER-FALLBACK-14A`

Begründung:

- Das ist der kleinste fachlich eigenständige Teil mit dem höchsten Nutzen.
- Die aktuelle rote Testmenge konzentriert sich zuerst auf genau diesen Fallback-/Retry-/Degraded-UI-Strang.
- Er lässt sich vor Multibranch-/Place-/Ledger sauberer isolieren und hält `.env.example`, Dashboard-Copy und fremde Drift draußen.
