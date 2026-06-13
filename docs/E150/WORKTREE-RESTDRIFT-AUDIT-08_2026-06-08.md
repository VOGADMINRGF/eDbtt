# WORKTREE-RESTDRIFT-AUDIT-08

Datum: 2026-06-13
Repo: `edebatte-org`
Scope: reiner Audit-/Planungsslice, keine Feature-Arbeit

## Geprüfter Commit-Stand

- Letzter Commit: `a4706ba28ba55ffb68a9269409b8132a1858258e`
- Commit-Message: `style(live): polish public live surfaces`
- `git status --short`: `modified=33`, `untracked=36`
- `git diff --stat`: `33 files changed, 5447 insertions(+), 993 deletions(-)`
- `git log --oneline -20` zeigt den abgeschlossenen Public-Live-Strang direkt vor dem Audit:
  - `a4706ba2 style(live): polish public live surfaces`
  - `9b21e4bc test(live): validate public live surfaces`
  - `5d1cc7d5 feat(live): add campaign media kit preview`
  - `300001ff feat(live): add guarded report handoff`
  - `5327174c feat(live): add host moderation cockpit`
  - `d4ed471a feat(live): add conservative trust labels`
  - `75e56f0b feat(live): add campaign qr draft entry`

## Vollständige Datei-/Clusterliste

### A. Create-/Planner-/Followup-Cluster

Dateien:

```text
apps/web/src/app/api/contributions/save/route.ts
apps/web/src/app/api/create/intelligent-followup/route.ts
apps/web/src/app/create/CreateClient.tsx
apps/web/src/features/create/CreateVisualFollowup.tsx
apps/web/src/features/create/createPlanner.ts
apps/web/src/features/create/createProductionAccess.ts
apps/web/src/features/create/createSurfaceConfig.ts
apps/web/src/features/create/intelligentFollowup.ts
apps/web/src/features/create/intelligentFollowupContract.ts
apps/web/src/features/surfaces/runden/manualAnlassraumSetup.ts
apps/web/tests/create-degraded-followup-actions.contract.test.tsx
apps/web/tests/create-mode-selector.contract.test.ts
apps/web/tests/create-mode.page.test.ts
apps/web/tests/create-planner-complex-civic-input.contract.test.ts
apps/web/tests/create-planner-degraded-ui.contract.test.tsx
apps/web/tests/create-planner-openai-happy-path.contract.test.ts
apps/web/tests/create-planner-routing.contract.test.ts
apps/web/tests/create-planner-timeout.contract.test.ts
```

Bewertung:

- Gehört zu bereits committed Slice: nein, aber klar zu bereits als `done` dokumentierten `/create`-Folgeslices aus Anfang Juni.
- Wahrscheinlich wertvoll: ja. Der Diff ist zu groß und zu absichtlich, um Zufallsdrift zu sein.
- Wahrscheinlich versehentlicher Drift: nur in Teilaspekten. Der Kern ist fachlich motiviert.
- Isoliert commitbar: nicht als ein Block.
- Braucht weitere Entmischung: ja. `CreateClient.tsx`, `CreateVisualFollowup.tsx`, `createPlanner.ts`, `intelligentFollowup.ts` und `save/route.ts` tragen gleichzeitig Followup-, Multibranch-, Existing-Match-, Place- und Handoff-Änderungen.
- Riskant: hoch. Es sind Kern-ViewModels, Save-/Followup-Routen und mehrere große Contracts betroffen.
- Relevante Tests:
  - `tests/create-degraded-followup-actions.contract.test.tsx`
  - `tests/create-mode-selector.contract.test.ts`
  - `tests/create-mode.page.test.ts`
  - `tests/create-planner-complex-civic-input.contract.test.ts`
  - `tests/create-planner-degraded-ui.contract.test.tsx`
  - `tests/create-planner-openai-happy-path.contract.test.ts`
  - `tests/create-planner-routing.contract.test.ts`
  - `tests/create-planner-timeout.contract.test.ts`
  - zusätzlich `typecheck` und `lint`
- Empfohlene Aktion: vorher entmischen

### B. Review-/Telemetry-/Orchestrator-Cluster

Dateien:

```text
apps/web/src/app/admin/telemetry/ai/orchestrator/page.tsx
apps/web/src/app/api/admin/ai/orchestrator-smoke/route.ts
apps/web/src/features/ai/adminTelemetryDiagnostics.ts
apps/web/src/features/ai/providerSmokeDirectRunner.ts
apps/web/tests/admin-ai-orchestrator-smoke.route.test.ts
apps/web/tests/ai-provider-smoke-cli.test.ts
```

Bewertung:

- Gehört zu bereits committed Slice: nein.
- Wahrscheinlich wertvoll: ja. Die Änderungen sind klar auf Provider-Smoke-/Telemetry-Diagnostik ausgerichtet.
- Wahrscheinlich versehentlicher Drift: eher nein.
- Isoliert commitbar: weitgehend ja.
- Braucht weitere Entmischung: gering bis mittel. Die Fachlogik hängt eng zusammen; nur `.env.example` liegt außerhalb dieses Clusters.
- Riskant: mittel bis hoch. `orchestrator-smoke/route.ts` ist groß und verändert Timeout-, Fallback-, BAD_JSON- und Billing-/Provider-Diagnostik.
- Relevante Tests:
  - `tests/admin-ai-orchestrator-smoke.route.test.ts`
  - `tests/ai-provider-smoke-cli.test.ts`
  - zusätzlich `typecheck` und `lint`
- Empfohlene Aktion: genauer prüfen

### C. Voxy-/Public-Style-Cluster

Dateien:

```text
apps/web/src/app/globals.css
apps/web/src/components/voxy/VoxyGuide.tsx
apps/web/src/features/voxy/voxyCopy.ts
apps/web/tests/voxy-copy.contract.test.ts
```

Bewertung:

- Gehört zu bereits committed Slice: nein.
- Wahrscheinlich wertvoll: teilweise. Der Drift wirkt wie echter Public-/Start-/Runden-Polish, aber nicht sauber abgeschlossen.
- Wahrscheinlich versehentlicher Drift: eher nein, aber unvollständig.
- Isoliert commitbar: nur nach inhaltlicher Nachprüfung.
- Braucht weitere Entmischung: ja. `globals.css` wirkt global auf Start-/Public-/Runden-Flächen, `VoxyGuide.tsx` ist shared UI.
- Riskant: hoch. Globales CSS plus shared Guide-Copy kann mehrere bereits committed Flächen regressieren.
- Relevante Tests:
  - `tests/voxy-copy.contract.test.ts`
  - zusätzlich die Start-/Runden-/Public-Vertrags- und Layout-Tests
- Empfohlene Aktion: genauer prüfen

Konkreter Warnhinweis:

- Dieser Cluster ist aktuell intern inkonsistent. `apps/web/src/features/voxy/voxyCopy.ts` setzt z. B. `VOXY_COPY.start` auf `Schreib kurz, worum es geht...`, während `apps/web/tests/voxy-copy.contract.test.ts` gleichzeitig `Du entscheidest, wann du etwas einreichst.` erwartet.

### D. Multibranch-/Place-/Street-Registry-Cluster

Direkt zuordenbare Dateien:

```text
apps/web/src/features/create/branchHandoffTargets.ts
apps/web/src/features/create/placeResolution.ts
features/create/createContributionLedger.ts
apps/web/tests/create-branch-handoff-workbench.contract.test.tsx
apps/web/tests/create-existing-match-counting.contract.test.tsx
apps/web/tests/create-multibranch-actions.contract.test.tsx
apps/web/tests/create-place-clarification.contract.test.tsx
apps/web/tests/create-place-planner-unavailable-stability.contract.test.tsx
apps/web/tests/create-place-registry-jurisdiction.contract.test.tsx
apps/web/tests/create-qr-swipes-drafts.contract.test.tsx
apps/web/tests/create-street-registry-lookup.contract.test.tsx
docs/E150/CREATE-BRANCH-HANDOFF-WORKBENCH-12_2026-06-04.md
docs/E150/CREATE-BRANCH-LEDGER-PERSISTENCE-05_2026-06-03.md
docs/E150/CREATE-EXISTING-MATCH-COUNTING-06_2026-06-04.md
docs/E150/CREATE-MULTIBRANCH-ACTION-BOARD-01_2026-06-03.md
docs/E150/CREATE-MULTIBRANCH-COMPLETION-COPY-07_2026-06-04.md
docs/E150/CREATE-MULTIBRANCH-FRONTEND-PILOT_GREEN_2026-06-03.md
docs/E150/CREATE-MULTIBRANCH-MICROCOPY-04_2026-06-03.md
docs/E150/CREATE-MULTIBRANCH-PILOT-FREEZE-08_2026-06-04.md
docs/E150/CREATE-MULTIBRANCH-PRODUCTION-POLISH-02_2026-06-03.md
docs/E150/CREATE-MULTIBRANCH-STABILITY-FIX-06_2026-06-04.md
docs/E150/CREATE-MULTIBRANCH-UX-POLISH-03_2026-06-03.md
docs/E150/CREATE-PLACE-BRANCH-COPY-NORMALIZATION-11_2026-06-04.md
docs/E150/CREATE-PLACE-CLARIFICATION-BRANCH-SCOPE-10_2026-06-04.md
docs/E150/CREATE-PLACE-CLARIFICATION-INTAKE-09_2026-06-04.md
docs/E150/CREATE-PLACE-PLANNER-UNAVAILABLE-STABILITY-11_2026-06-04.md
docs/E150/CREATE-PLACE-REGISTRY-JURISDICTION-08_2026-06-04.md
docs/E150/CREATE-PLACE-REGISTRY-JURISDICTION-STABILITY-10_2026-06-04.md
docs/E150/CREATE-QR-SWIPES-PUBLISH-PREP-07_2026-06-04.md
docs/E150/CREATE-STREET-REGISTRY-LOOKUP-12_2026-06-04.md
```

Mit A vermischte Kern-Touchpoints:

```text
apps/web/src/app/api/contributions/save/route.ts
apps/web/src/app/create/CreateClient.tsx
apps/web/src/features/create/CreateVisualFollowup.tsx
apps/web/src/features/create/createPlanner.ts
apps/web/src/features/create/intelligentFollowup.ts
apps/web/src/features/create/intelligentFollowupContract.ts
```

Bewertung:

- Gehört zu bereits committed Slice: nein, aber OpenTasks markiert die meisten zugehörigen Tasks bereits als `done`.
- Wahrscheinlich wertvoll: ja.
- Wahrscheinlich versehentlicher Drift: nein.
- Isoliert commitbar: nur teilweise.
- Braucht weitere Entmischung: ja, zwingend. Die eigentlichen Leaf-Dateien und untracked Evidence sind sauber, aber die produktiven Kernänderungen hängen in denselben großen Files wie Cluster A.
- Riskant: hoch. Branch-/Ledger-/Existing-Match-/Place-/Street-Registry-Schema greift tief in Client, Save und Followup ein.
- Relevante Tests:
  - `tests/create-branch-handoff-workbench.contract.test.tsx`
  - `tests/create-existing-match-counting.contract.test.tsx`
  - `tests/create-multibranch-actions.contract.test.tsx`
  - `tests/create-place-clarification.contract.test.tsx`
  - `tests/create-place-planner-unavailable-stability.contract.test.tsx`
  - `tests/create-place-registry-jurisdiction.contract.test.tsx`
  - `tests/create-qr-swipes-drafts.contract.test.tsx`
  - `tests/create-street-registry-lookup.contract.test.tsx`
  - zusätzlich `typecheck`, `lint` und mehrere A-Tests
- Empfohlene Aktion: vorher entmischen

### E. Factcheck-/Account-/Docs-Reste

Dateien:

```text
apps/web/src/app/admin/review/page.tsx
apps/web/tests/admin-review.page.test.tsx
apps/web/src/app/account/AccountReviewSupplementSections.tsx
apps/web/src/app/api/factcheck/status/[jobId]/prepareGraphCandidateAction.ts
features/account/factcheckJobTypes.ts
features/account/loadAccountFactcheckJobs.ts
```

Bewertung:

- Gehört zu bereits committed Slice: formal nein, inhaltlich aber sehr wahrscheinlich zu bereits als `done` dokumentierten Review-/Factcheck-Slices 13 bis 18.
- Wahrscheinlich wertvoll: ja.
- Wahrscheinlich versehentlicher Drift: eher nein.
- Isoliert commitbar: wahrscheinlich ja, aber nicht ohne kurze fachliche Nachprüfung.
- Braucht weitere Entmischung: mittel. `prepareGraphCandidateAction.ts` verbindet Factcheck mit Graph-Candidate-Preparation; `admin/review/page.tsx` bündelt Editorial- und Factcheck-UI.
- Riskant: mittel bis hoch. Review-/Factcheck-/Graph-Handoffs sind guardrail-sensitiv.
- Relevante Tests:
  - `tests/admin-review.page.test.tsx`
  - zusätzlich Factcheck-/Account-/Graph-Status-Tests, die laut OpenTasks-Slices zu 17/18 gehören
- Empfohlene Aktion: genauer prüfen

### F. OpenTasks-/Evidence-Hygiene

Befunde:

- `docs/E150/OpenTasks.md` enthält `PR-AI-CREATE-01I` doppelt.
- Untracked Worktree-Evidence ohne Queue-Eintrag:
  - `docs/E150/WORKTREE-COMMIT-TRUTH-GUARD-00I_2026-06-06.md`
  - `docs/E150/WORKTREE-RECOVERY-ISOLATION-00_2026-06-06.md`
- Zahlreiche untracked `docs/E150/CREATE-*.md`-Dateien referenzieren Tasks, die in `OpenTasks.md` bereits auf `done` stehen.

Bewertung:

- Gehört zu bereits committed Slice: teilweise. Es handelt sich um Dokumentations-/Queue-Hygiene rund um bereits dokumentierte Arbeit.
- Wahrscheinlich wertvoll: ja.
- Wahrscheinlich versehentlicher Drift: teilweise. Die Doppelnennung in `OpenTasks.md` ist sehr wahrscheinlich reine Hygiene-Drift.
- Isoliert commitbar: ja, als docs-only Cluster.
- Braucht weitere Entmischung: gering.
- Riskant: niedrig.
- Relevante Tests: keine.
- Empfohlene Aktion: committen

### G. Sonstiges / Mischcluster

Dateien:

```text
apps/web/.env.example
apps/web/src/features/quickActions/taskFirstQuickActions.ts
apps/web/tests/account-organization-dashboard.page.test.tsx
```

Bewertung:

- Gehört zu bereits committed Slice: unklar.
- Wahrscheinlich wertvoll: teilweise. Die Quick-Action-/Organization-Copy wirkt absichtlich; `.env.example` ist technischer Mischdrift.
- Wahrscheinlich versehentlicher Drift: bei `.env.example` möglich, weil Create-Planner- und Admin-Smoke-ENV gemeinsam geändert werden.
- Isoliert commitbar: nur nach Aufteilung.
- Braucht weitere Entmischung: ja. `taskFirstQuickActions.ts` ist UI-/Copy-Drift, `.env.example` mischt Cluster A und B.
- Riskant: mittel. ENV-Beispiel beeinflusst Erwartungshaltung für AI-Runtime, Quick-Actions verändern user-facing Orientierung.
- Relevante Tests:
  - `tests/account-organization-dashboard.page.test.tsx`
  - `tests/ai-provider-smoke-cli.test.ts`
  - zusätzlich `typecheck` und `lint`
- Empfohlene Aktion: zurückstellen

## Risiken

- Größtes Risiko ist die Vermischung von Cluster A und D in denselben Kern-Dateien.
- `apps/web/src/app/api/contributions/save/route.ts`, `apps/web/src/app/create/CreateClient.tsx`, `apps/web/src/features/create/CreateVisualFollowup.tsx`, `apps/web/src/features/create/createPlanner.ts`, `apps/web/src/features/create/intelligentFollowup.ts` und `apps/web/src/features/create/intelligentFollowupContract.ts` sind die riskantesten Dateien.
- `apps/web/src/app/api/admin/ai/orchestrator-smoke/route.ts` ist groß genug, um einen eigenen Review zu brauchen.
- `apps/web/src/app/globals.css` ist global und damit regressionsgefährlich.
- `apps/web/src/features/voxy/voxyCopy.ts` plus `tests/voxy-copy.contract.test.ts` sind aktuell nicht konsistent.
- `OpenTasks.md` behauptet bei mehreren Create-/Review-/Factcheck-Slices bereits `done`, obwohl Evidence und teils Code weiterhin nur als Worktree-Drift vorliegen.

## Empfohlene nächste Reihenfolge

1. OpenTasks-/Evidence-Hygiene zuerst isolieren.
2. Danach den Voxy-/Public-Style-Cluster nur dann anfassen, wenn er vorher gegen `voxy-copy` und die globalen Start-/Runden-Flächen sauber reconciled wird.
3. Danach Create-/Planner-/Followup und Multibranch-/Place gemeinsam neu schneiden, aber nicht als einen Commit, sondern zuerst per hunk-/taskbezogener Entmischung.
4. Danach den Telemetry-/Orchestrator-Cluster separat prüfen und von `.env.example` trennen.
5. Danach den Factcheck-/Account-/Review-Rest separat prüfen.
6. `.env.example` und Quick-Action-/Dashboard-Copy erst ganz am Ende oder explizit neu zuordnen.

Begründung:

- Cluster F ist der kleinste, risikoärmste und klar docs-only commitbare Schritt.
- Cluster C ist thematisch klar, aber aktuell nicht commit-reif.
- Cluster A und D sind die größte Wertmasse, aber auch die am stärksten vermischte.
- Cluster B ist wahrscheinlich gut isolierbar, sollte aber nicht vor der Queue-/Evidence-Hygiene priorisiert werden.

## Was ausdrücklich nicht verändert wurde

- Keine Source-Dateien bearbeitet.
- Keine Tests angepasst.
- Nichts gestaged.
- Nichts committed.
- Keine Drift bereinigt oder verworfen.
- Keine Datei gelöscht.

## Commit-Empfehlung

- In diesem Audit-Slice selbst: nein, außer der jetzt angelegten Audit-Dokumentation und der docs-only Queue-Hygiene.
- Als nächster echter Bereinigungsschritt: ja, aber zuerst ein kleiner docs-only Hygiene-Commit.

## Nächster konkreter Task-Vorschlag

- `WORKTREE-RESTDRIFT-DECISION-09`

Empfohlener Scope:

- `OpenTasks.md`-Doppelnennung (`PR-AI-CREATE-01I`) bereinigen.
- Untracked Worktree-Evidence (`WORKTREE-COMMIT-TRUTH-GUARD-00I`, `WORKTREE-RECOVERY-ISOLATION-00`) sauber einordnen.
- Die untracked `docs/E150/CREATE-*.md`-Evidence gegen die bereits auf `done` gesetzten Create-Slices abgleichen und entscheiden, was als docs-only commitbar ist und was noch auf einen Code-Commit warten muss.
