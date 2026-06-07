# WORKTREE-UNTANGLE-FACTCHECK-ADMIN-GRAPH-00K

Datum: 2026-06-06
Repo: `edebatte-org`
Scope: Entmischung der Blocker-Dateien fuer den Factcheck-/Entitlement-/Runner-Cluster

## Urspruengliche Blocker

Aus `WORKTREE-ISOLATE-FACTCHECK-00J`:

- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/src/app/api/factcheck/status/[jobId]/route.ts`

Blockerbild:

- `page.tsx` mischte Editorial-, Factcheck- und Graph-UI in einer Datei und in einem grossen Diff.
- `admin-review.page.test.tsx` mischte Editorial-, Factcheck- und Graph-Assertions in einer Datei.
- `factcheck/status/[jobId]/route.ts` enthaelt Factcheck-Statuslogik und den GraphCandidate-Handoff `prepare_graph_candidate`.

## Vorgenommene Entkopplung

Neue Dateien:

- `apps/web/src/app/admin/review/AdminFactcheckJobsSection.tsx`
- `apps/web/src/app/api/factcheck/status/[jobId]/prepareGraphCandidateAction.ts`
- `apps/web/tests/admin-factcheck-jobs.page.test.tsx`

Geaenderte Dateien:

- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/src/app/api/factcheck/status/[jobId]/route.ts`

## Hunk-Zuordnung `apps/web/src/app/admin/review/page.tsx`

### Factcheck

Factcheck-spezifisch:

- Import von `getFactcheckWorkflowRepo` / `FactcheckJobDoc`
- Berechnung und Filterung von `factcheckJobs`
- Factcheck-Zaehler im Summary-Bereich
- neuer Komponentenaufruf `AdminFactcheckJobsSection`

Ausgelagert nach `AdminFactcheckJobsSection.tsx`:

- FactcheckJob-Liste
- Status-Chips
- `requestedAction`, `truthStatus`, `sourceSupport`
- Ergebnis-/ProviderMatrix-/OpenQuestions-Ausgabe
- Link zum Ergebnis
- `FactcheckJobActions`

### Editorial

- Editorial-Filter
- `listEditorialReviewRequests`
- `matchesEditorialReviewFilter`
- komplette Editorial-Section mit Nutzerantworten, Rueckfragen und `EditorialReviewRequestActions`

### Graph

- `listGraphMergeCandidates`
- `listGraphMergeAuditEntries`
- `getGraphMergeCandidatesPersistenceState`
- Graph-Kandidaten-Section mit Merge-Gate, Audit, Duplicate-Blockern und `GraphMergeCandidateActions`

### Bewertung

`page.tsx` ist jetzt strukturell besser getrennt, weil die Factcheck-UI in einer eigenen Komponente lebt. Die Datei ist aber nicht vollstaendig dateisauber:

- der Import-/Datenladehunk am Dateianfang bleibt clusteruebergreifend
- Factcheck, Editorial und Graph werden weiter im selben Server-Page-Modul geladen

Praktische Folge:

- die Factcheck-Section selbst ist jetzt klar kapselbar
- `page.tsx` braucht fuer einen spaeteren Factcheck-Commit weiterhin manuelles Hunk-Splitting

## Hunk-Zuordnung `apps/web/tests/admin-review.page.test.tsx`

### Factcheck

Vorher in derselben Datei:

- Factcheck-Job-Mockdaten
- Assertions fuer `Factcheck-Jobs`
- Assertions fuer Jobtext, `GraphCandidate vorbereiten` und Factcheck-Arbeitsstand

Jetzt:

- `mocks.factcheckList.mockResolvedValue([])`
- Factcheck-spezifische Assertions aus der Datei entfernt
- neuer dedizierter Test: `apps/web/tests/admin-factcheck-jobs.page.test.tsx`

### Editorial

Verbleiben in `admin-review.page.test.tsx`:

- Editorial-Mocks
- Assertions fuer redaktionelle Pruefbitten
- Nutzerantworten / Rueckfragen
- accepted-for-workup-Weiterarbeit ohne Auto-Start

### Graph

Verbleiben in `admin-review.page.test.tsx`:

- Graph-Mocks
- Assertions fuer Merge-Gate, Audit-Trail, Duplicate-Blocker und Admin-Aktionen

### Bewertung

Die Testlage ist fuer den Factcheck-Cluster jetzt deutlich sauberer:

- Factcheck-spezifische UI-Assertions liegen in `admin-factcheck-jobs.page.test.tsx`
- `admin-review.page.test.tsx` ist fuer Factcheck nicht mehr notwendig

Damit ist die Testseite fuer einen spaeteren Factcheck-Commit praktisch getrennt.

## Hunk-Zuordnung `apps/web/src/app/api/factcheck/status/[jobId]/route.ts`

### Factcheck

Factcheck-spezifisch:

- neue PATCH-Aktionen `run`, `retry`, `take_review`, `cancel`
- Status-Refresh ueber `refreshFactcheckJobState`
- `runFactcheckJob`
- angereicherte Serialisierung: `requestedAction`, `truthStatus`, `sourceSupport`, `sourceStatus`, `providerMatrix`, `result`, `gate`
- no-auto-Flags in der Response

### Graph

Graph-spezifisch:

- `FACTCHECK_GRAPH_PATCH_ACTION`
- Import von `applyPrepareGraphCandidateAction`
- Spezialbranch fuer `prepare_graph_candidate`
- Audit-Mapping fuer diesen Spezialpfad

Ausgelagert:

- eigentliche Graph-Handoff-Logik nach `prepareGraphCandidateAction.ts`

### Bewertung

Die Graph-Logik ist aus dem Route-Kern herausgezogen, aber nicht vollstaendig aus `route.ts` verschwunden:

- `route.ts` kennt den Graph-Patch-Action weiterhin
- fuer einen spaeteren Factcheck-Commit muss der kleine Graph-Branch in `route.ts` ausgespart werden
- `prepareGraphCandidateAction.ts` gehoert klar in den spaeteren Graph-Cluster

## Ist der Factcheck-Cluster danach commitbar?

Kurzantwort: noch nicht vollautomatisch sauber, aber deutlich naeher an einem isolierten Commit.

### Was jetzt sauber ist

- Factcheck-UI ist in `AdminFactcheckJobsSection.tsx` separiert
- Factcheck-UI-Tests liegen separat in `admin-factcheck-jobs.page.test.tsx`
- der Graph-Handoff in der Status-Route ist in eine eigene Helper-Datei ausgelagert

### Was noch manuelle Sorgfalt braucht

- `apps/web/src/app/admin/review/page.tsx`
  Der Factcheck-Teil ist kapselbar, aber der Page-Top-Hunk bleibt gemischt.

- `apps/web/src/app/api/factcheck/status/[jobId]/route.ts`
  Der Graph-Pfad ist klein und isolierter als vorher, aber noch im selben Route-Modul praesent.

## Dateien/Hunks, die in den Factcheck-Commit gehoeren

Klar factcheckbezogen:

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
- `apps/web/src/app/admin/review/AdminFactcheckJobsSection.tsx`
- `apps/web/tests/factcheck-entitlement-gate.contract.test.ts`
- `apps/web/tests/factcheck-enqueue.auth.route.test.ts`
- `apps/web/tests/create-analyze-entitlement-gate.route.test.ts`
- `apps/web/tests/factcheck-job-runner.contract.test.ts`
- `apps/web/tests/account-factcheck-jobs.contract.test.tsx`
- `apps/web/tests/factcheck-status.detail.contract.test.ts`
- `apps/web/tests/factcheck-status-seal.route.test.ts`
- `apps/web/tests/review-queue.readmodel.test.ts`
- `apps/web/tests/admin-factcheck-jobs.page.test.tsx`
- `docs/E150/FACTCHECK-ENTITLEMENT-GATE-14_2026-06-06.md`
- `docs/E150/FACTCHECK-JOB-RUNNER-PRODUCTION-PATH-17_2026-06-06.md`
- `docs/E150/REVIEW-QUEUE-READMODEL-DRIFT-AUDIT-17B_2026-06-06.md`

Nur hunkgenau:

- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/api/factcheck/status/[jobId]/route.ts`

## Dateien/Hunks, die im Graph-/Editorial-Cluster bleiben

Editorial:

- `apps/web/src/app/admin/review/EditorialReviewRequestActions.tsx`
- Editorial-Hunks in `apps/web/src/app/admin/review/page.tsx`
- `apps/web/tests/admin-review.page.test.tsx` fuer Editorial-/Graph-Integration

Graph:

- `apps/web/src/app/admin/review/GraphMergeCandidateActions.tsx`
- Graph-Hunks in `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/api/factcheck/status/[jobId]/prepareGraphCandidateAction.ts`
- Graph-Branch in `apps/web/src/app/api/factcheck/status/[jobId]/route.ts`

## Tests

Ausgefuehrt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/factcheck-entitlement-gate.contract.test.ts tests/factcheck-enqueue.auth.route.test.ts tests/create-analyze-entitlement-gate.route.test.ts tests/factcheck-job-runner.contract.test.ts tests/account-factcheck-jobs.contract.test.tsx tests/factcheck-status.detail.contract.test.ts tests/factcheck-status-seal.route.test.ts tests/review-queue.readmodel.test.ts tests/admin-factcheck-jobs.page.test.tsx`

Ergebnis:

- `typecheck`: gruen
- `lint`: gruen
- `vitest`: `9/9` Testdateien, `29/29` Tests gruen

## Verbleibende Risiken

- `page.tsx` bleibt am Dateianfang ein gemeinsamer Server-Assembler fuer mehrere Cluster
- `route.ts` kennt den Graph-Patch-Aktionsnamen weiterhin
- ein spaeterer Factcheck-Commit braucht fuer diese beiden Dateien weiterhin bewusstes Hunk-Splitting

## Nicht gemacht

- nichts gestaged
- nichts committed
- `docs/E150/OpenTasks.md` nicht veraendert
- keine neue Produktlogik gebaut
