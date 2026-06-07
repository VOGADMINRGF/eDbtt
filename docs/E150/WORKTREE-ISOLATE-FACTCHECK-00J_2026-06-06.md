# WORKTREE-ISOLATE-FACTCHECK-00J

Datum: 2026-06-06
Repo: `edebatte-org`
Scope: Isolation des Factcheck-/Entitlement-/Runner-Clusters fuer

- `FACTCHECK-ENTITLEMENT-GATE-14`
- `FACTCHECK-JOB-RUNNER-PRODUCTION-PATH-17`
- `REVIEW-QUEUE-READMODEL-DRIFT-AUDIT-17B`

## Gepruefte Dateien

Eindeutig factcheckbezogen geprueft:

- `apps/web/src/app/api/contributions/analyze/researchEntitlementGate.ts`
- `apps/web/src/app/api/contributions/analyze/route.ts`
- `apps/web/src/app/api/factcheck/enqueue/route.ts`
- `apps/web/src/app/api/factcheck/status/[jobId]/route.ts`
- `apps/web/src/app/api/factcheck/status/[jobId]/seal/route.ts`
- `apps/web/src/app/api/factcheck/result/[contributionId]/route.ts`
- `apps/web/src/app/factcheck/page.tsx`
- `apps/web/src/app/demo/factcheck/page.tsx`
- `apps/web/src/features/surfaces/factcheck/FactcheckSurface.tsx`
- `apps/web/src/features/surfaces/factcheck/FactcheckHandoffShell.tsx`
- `apps/web/src/hooks/useFactcheckJob.ts`
- `features/factcheck/entitlementGate.ts`
- `features/factcheck/db.ts`
- `features/factcheck/jobRunner.ts`
- `features/factcheck/workflow.ts`
- `features/ai/e150/factcheckStatus.ts`
- `features/reviewQueue.ts`
- `apps/web/src/app/account/AccountFactcheckJobSection.tsx`
- `apps/web/src/app/admin/review/FactcheckJobActions.tsx`
- `apps/web/src/app/admin/review/page.tsx`

Zugehoerige Tests:

- `apps/web/tests/factcheck-entitlement-gate.contract.test.ts`
- `apps/web/tests/factcheck-enqueue.auth.route.test.ts`
- `apps/web/tests/create-analyze-entitlement-gate.route.test.ts`
- `apps/web/tests/factcheck-job-runner.contract.test.ts`
- `apps/web/tests/account-factcheck-jobs.contract.test.tsx`
- `apps/web/tests/factcheck-status.detail.contract.test.ts`
- `apps/web/tests/factcheck-status-seal.route.test.ts`
- `apps/web/tests/review-queue.readmodel.test.ts`
- `apps/web/tests/admin-review.page.test.tsx`

Zugehoerige Evidence:

- `docs/E150/FACTCHECK-ENTITLEMENT-GATE-14_2026-06-06.md`
- `docs/E150/FACTCHECK-JOB-RUNNER-PRODUCTION-PATH-17_2026-06-06.md`
- `docs/E150/REVIEW-QUEUE-READMODEL-DRIFT-AUDIT-17B_2026-06-06.md`

## Dateien, die eindeutig in den Factcheck-Cluster gehoeren

Sauber und fachlich eindeutig:

- `apps/web/src/app/api/contributions/analyze/researchEntitlementGate.ts`
- `apps/web/src/app/api/factcheck/enqueue/route.ts`
- `apps/web/src/app/api/factcheck/status/[jobId]/seal/route.ts`
- `apps/web/src/app/api/factcheck/result/[contributionId]/route.ts`
- `apps/web/src/app/factcheck/page.tsx`
- `apps/web/src/app/demo/factcheck/page.tsx`
- `apps/web/src/features/surfaces/factcheck/FactcheckSurface.tsx`
- `apps/web/src/features/surfaces/factcheck/FactcheckHandoffShell.tsx`
- `apps/web/src/hooks/useFactcheckJob.ts`
- `features/factcheck/entitlementGate.ts`
- `features/factcheck/db.ts`
- `features/factcheck/jobRunner.ts`
- `features/factcheck/workflow.ts`
- `features/ai/e150/factcheckStatus.ts`
- `apps/web/src/app/account/AccountFactcheckJobSection.tsx`
- `apps/web/src/app/admin/review/FactcheckJobActions.tsx`
- `apps/web/tests/factcheck-entitlement-gate.contract.test.ts`
- `apps/web/tests/factcheck-enqueue.auth.route.test.ts`
- `apps/web/tests/create-analyze-entitlement-gate.route.test.ts`
- `apps/web/tests/factcheck-job-runner.contract.test.ts`
- `apps/web/tests/account-factcheck-jobs.contract.test.tsx`
- `apps/web/tests/factcheck-status.detail.contract.test.ts`
- `apps/web/tests/factcheck-status-seal.route.test.ts`
- `docs/E150/FACTCHECK-ENTITLEMENT-GATE-14_2026-06-06.md`
- `docs/E150/FACTCHECK-JOB-RUNNER-PRODUCTION-PATH-17_2026-06-06.md`
- `docs/E150/REVIEW-QUEUE-READMODEL-DRIFT-AUDIT-17B_2026-06-06.md`

## Hunk-Pruefung kritischer Mischdateien

### `apps/web/src/app/api/contributions/analyze/route.ts`

Status: hunkgenau sauber.

Factcheck-Hunk:

- Import von `resolveAnalyzeResearchGateBlock`
- frueher Gate-Exit mit `RESEARCH_GATE_BLOCKED`
- Rueckgabe von `entitlementGate` und `meta`

Bewertung:

- dieser Hunk ist klar `FACTCHECK-ENTITLEMENT-GATE-14`
- keine verbleibende Truth-Guard-Vermischung im aktuellen Diff dieses Hunks

### `features/reviewQueue.ts`

Status: wahrscheinlich hunkgenau sauber fuer `17B`.

Factcheck-/Readmodel-Hunks:

- `requestedAction` im `factcheckContext`
- Einschluss weiterer Factcheck-Status (`queued`, `running`, `completed`, `failed`, `cancelled`, `needs_manual_review`)
- spezifische Workflow-Labels fuer Factcheck-Arbeitsstaende
- `sourceType` aus `requestedAction`

Bewertung:

- die sichtbaren Hunks sind factcheck-/readmodel-spezifisch
- kein klarer Graph-/Start-/Runden-Drift in den geprueften Hunks

### `apps/web/src/app/api/factcheck/status/[jobId]/route.ts`

Status: nicht vollstaendig sauber.

Factcheck-Hunks:

- neue `PATCH`-Aktionen (`run`, `retry`, `take_review`, `cancel`)
- Serialisierung von `requestedAction`, `truthStatus`, `sourceSupport`, `sourceStatus`, `providerMatrix`, `result`
- Nutzung von `refreshFactcheckJobState` und `runFactcheckJob`

Gemischter Hunk:

- Import und Nutzung von `prepareGraphMergeCandidateFromFactcheckJob`
- `PATCH`-Aktion `prepare_graph_candidate`

Bewertung:

- der GraphCandidate-Pfad gehoert nicht in diesen Commit
- Datei ist nur hunkgenau, nicht dateisauber

### `apps/web/src/app/admin/review/page.tsx`

Status: nicht hunkgenau sauber fuer einen sicheren Factcheck-only-Commit.

Gemischt in derselben Datei:

- Editorial-Review-Abschnitte
- Factcheck-Jobs und Factcheck-Aktionen
- Graph-Kandidaten und Merge-Gates

Bewertung:

- Factcheck-Hunks sind erkennbar
- die Datei fuehrt Editorial-, Factcheck- und Graph-UI gleichzeitig ein
- fuer einen sicheren isolierten Commit derzeit zu riskant

### `apps/web/tests/admin-review.page.test.tsx`

Status: nicht hunkgenau sauber.

Gemischt in derselben Testdatei:

- Editorial-Review-Mocks und Assertions
- Factcheck-Job-Mocks und Assertions
- GraphCandidate-Mocks und Assertions

Bewertung:

- fuer einen sauberen Factcheck-only-Commit nicht geeignet

### `apps/web/tests/review-queue.readmodel.test.ts`

Status: ueberwiegend `17B`, aber nicht vollkommen eng auf Factcheck begrenzt.

Factcheck-/Readmodel-Hunks:

- neue Factcheck-Seed-Daten
- neue Assertions fuer `queued`, `running`, `completed`, `needs_manual_review`, `failed`
- konservative Working-State-Assertions fuer Factcheck-Ergebnisse

Angrenzend:

- Anpassung konservativer Distributions-Seed-Semantik (`review_requested`)

Bewertung:

- noch im Sinn von `17B` vertretbar
- aber nicht rein Factcheck-only auf Dateiebene

## Ausgeschlossen aus diesem Cluster

Ausdruecklich draussen:

- alle Runden-Dateien
- alle bereits committed Truth-Guard-Dateien
- alle Start-/Create-/Draft-Dateien ausser dem kleinen Gate-Hunk in `analyze/route.ts`
- alle GraphMergeCandidate-Dateien
- Editorial-Review-Statusmaschine ausser factchecknaher Anzeige
- `docs/E150/OpenTasks.md`
- `apps/web/src/app/globals.css`

Zusatz:

- `apps/web/src/app/admin/review/page.tsx` und `apps/web/tests/admin-review.page.test.tsx` bleiben im aktuellen Zustand draussen, weil sie Factcheck mit Editorial und Graph vermischen
- aus `apps/web/src/app/api/factcheck/status/[jobId]/route.ts` muss der GraphCandidate-Hunk spaeter separat behandelt werden

## Ist der Cluster commitbar?

Kurzantwort: noch nicht sauber.

Blocker:

1. `apps/web/src/app/admin/review/page.tsx`
   Factcheck, Editorial und Graph sind zusammen eingefuehrt.

2. `apps/web/tests/admin-review.page.test.tsx`
   derselbe Mischzustand auf Testebene.

3. `apps/web/src/app/api/factcheck/status/[jobId]/route.ts`
   enthaelt einen klaren GraphCandidate-Hunk (`prepare_graph_candidate`) neben sauberen Factcheck-Hunks.

4. `apps/web/tests/review-queue.readmodel.test.ts`
   ist fuer `17B` plausibel, aber dateiweit nicht streng factcheck-exklusiv.

## Falls spaeter staged wird: voraussichtlich passende Factcheck-Dateien

Klar stagebar:

- `apps/web/src/app/api/contributions/analyze/researchEntitlementGate.ts`
- Factcheck-Hunk in `apps/web/src/app/api/contributions/analyze/route.ts`
- `apps/web/src/app/api/factcheck/enqueue/route.ts`
- `apps/web/src/app/api/factcheck/status/[jobId]/seal/route.ts`
- `apps/web/src/app/api/factcheck/result/[contributionId]/route.ts`
- `apps/web/src/app/factcheck/page.tsx`
- `apps/web/src/app/demo/factcheck/page.tsx`
- `apps/web/src/features/surfaces/factcheck/FactcheckSurface.tsx`
- `apps/web/src/features/surfaces/factcheck/FactcheckHandoffShell.tsx`
- `apps/web/src/hooks/useFactcheckJob.ts`
- `features/factcheck/entitlementGate.ts`
- `features/factcheck/db.ts`
- `features/factcheck/jobRunner.ts`
- `features/factcheck/workflow.ts`
- `features/ai/e150/factcheckStatus.ts`
- `features/reviewQueue.ts`
- `apps/web/src/app/account/AccountFactcheckJobSection.tsx`
- `apps/web/src/app/admin/review/FactcheckJobActions.tsx`
- `apps/web/tests/factcheck-entitlement-gate.contract.test.ts`
- `apps/web/tests/factcheck-enqueue.auth.route.test.ts`
- `apps/web/tests/create-analyze-entitlement-gate.route.test.ts`
- `apps/web/tests/factcheck-job-runner.contract.test.ts`
- `apps/web/tests/account-factcheck-jobs.contract.test.tsx`
- `apps/web/tests/factcheck-status.detail.contract.test.ts`
- `apps/web/tests/factcheck-status-seal.route.test.ts`
- `docs/E150/FACTCHECK-ENTITLEMENT-GATE-14_2026-06-06.md`
- `docs/E150/FACTCHECK-JOB-RUNNER-PRODUCTION-PATH-17_2026-06-06.md`
- `docs/E150/REVIEW-QUEUE-READMODEL-DRIFT-AUDIT-17B_2026-06-06.md`

Nur hunkgenau:

- `apps/web/src/app/api/contributions/analyze/route.ts`
- `apps/web/src/app/api/factcheck/status/[jobId]/route.ts`
- `apps/web/tests/review-queue.readmodel.test.ts`

Derzeit nicht empfohlen:

- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/tests/admin-review.page.test.tsx`

## Tests

Ausgefuehrt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/factcheck-entitlement-gate.contract.test.ts tests/factcheck-enqueue.auth.route.test.ts tests/create-analyze-entitlement-gate.route.test.ts tests/factcheck-job-runner.contract.test.ts tests/account-factcheck-jobs.contract.test.tsx tests/factcheck-status.detail.contract.test.ts tests/factcheck-status-seal.route.test.ts tests/review-queue.readmodel.test.ts`

Ergebnis:

- `typecheck`: gruen
- `lint`: gruen
- `vitest`: `8/8` Testdateien, `28/28` Tests gruen

## Verbleibender Drift

Der Worktree bleibt ueber mehrere Cluster dirty, insbesondere:

- Graph / GraphCandidate / Merge
- Editorial Review Queue
- Start / Create / Draft
- Account-Querschnitt
- weitere Evidence-/Recovery-Dateien

## Naechster empfohlener Cluster

Nicht direkt ein Produkt-Feature-Commit, sondern zuerst Entmischung der gemeinsamen Admin-Review-Oberflaeche:

- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/tests/admin-review.page.test.tsx`
- optional danach `apps/web/src/app/api/factcheck/status/[jobId]/route.ts` Graph-Hunk von Factcheck-Hunks trennen

Danach ist entweder

- ein sauberer Factcheck-Commit moeglich

oder

- der Graph-/Merge-Cluster als eigener naechster Isolationsschritt sinnvoll.

## Nicht angefasst

- keine Produktlogik neu gebaut
- nichts gestaged
- nichts committed
- `docs/E150/OpenTasks.md` nicht veraendert
