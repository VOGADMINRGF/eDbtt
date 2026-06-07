# WORKTREE-DECOUPLE-FACTCHECK-FROM-GRAPH-00L2

Datum: 2026-06-06
Repo: `edebatte-org`
Scope: letzte Entkopplung fuer den Factcheck-/Entitlement-/Runner-Cluster

## Urspruenglicher Commit-Blocker

Aus `WORKTREE-COMMIT-FACTCHECK-00L`:

1. `apps/web/src/app/api/factcheck/status/[jobId]/route.ts`
   - Factcheck-Aktionen und Graph-Aktion lagen im selben PATCH-Switch.
   - `git add -p` konnte den Hunk nicht sauber in Factcheck vs. Graph splitten.

2. `apps/web/src/app/admin/review/page.tsx`
   - Datenladung und Bereichsmarkup fuer Editorial, Factcheck und Graph lagen gemeinsam im Server-Assembler.

## Entkopplung der Factcheck-Statusroute

Geaendert:

- `apps/web/src/app/api/factcheck/status/[jobId]/route.ts`

Entfernt aus der Route:

- `FACTCHECK_GRAPH_PATCH_ACTION`
- `applyPrepareGraphCandidateAction`
- `prepare_graph_candidate` im `PatchSchema`
- der Graph-Branch im `PATCH`-Handler
- graphbezogene Audit-Zuordnung fuer diesen Branch
- `graphCandidateId` in der serialisierten Response

Verbleibt in der Route:

- `run`
- `retry`
- `take_review`
- `cancel`
- `queue`
- `approve_provider`
- `complete`
- `reject`
- `request_seal`
- `archive`
- Factcheck-Status-/Result-Serialisierung
- `sourceSupport`, `sourceStatus`, `truthStatus`, `verificationLabel`
- `noAutoPublish`, `noAutoGraphPromotion`, `noAutoDossier`, `noAutoAnlassraum`, `noAutoVote`

Status:

- `apps/web/src/app/api/factcheck/status/[jobId]/route.ts` enthaelt jetzt keine GraphCandidate-Imports und keinen `prepare_graph_candidate`-Branch mehr.

## Entkopplung der Admin-Review-Seite

Neue Loader:

- `apps/web/src/app/admin/review/loadAdminFactcheckJobs.ts`
- `apps/web/src/app/admin/review/loadAdminEditorialReviewRequests.ts`
- `apps/web/src/app/admin/review/loadAdminGraphMergeData.ts`

Neue Bereichskomponenten:

- `apps/web/src/app/admin/review/AdminEditorialReviewSection.tsx`
- `apps/web/src/app/admin/review/AdminGraphMergeCandidatesSection.tsx`

Bereits vorhanden und weiter genutzt:

- `apps/web/src/app/admin/review/AdminFactcheckJobsSection.tsx`

Geaendert:

- `apps/web/src/app/admin/review/page.tsx`

Neuer Zustand von `page.tsx`:

- laedt `editorialRequests`, `factcheckJobs` und `graphMergeData` ueber getrennte Loader
- rendert die drei Bereiche als getrennte Komponenten
- enthaelt nur noch kleine Glue-Hunks fuer
  - Import der Section-Komponenten
  - Import der Loader
  - Promise-all fuer die drei Datensaetze
  - Rendern der drei Bereiche

Bewertung:

- `page.tsx` ist jetzt deutlich besser hunkbar zwischen Factcheck, Editorial und Graph
- der Factcheck-Teil reduziert sich auf
  - `AdminFactcheckJobsSection`
  - `loadAdminFactcheckJobs`
  - kleinen Import-/Load-/Render-Hunk in `page.tsx`

## Tests entkoppelt

Geaendert:

- `apps/web/src/app/admin/review/FactcheckJobActions.tsx`
- `apps/web/tests/admin-factcheck-jobs.page.test.tsx`

Entkopplung:

- `FactcheckJobActions.tsx` enthaelt keine `prepare_graph_candidate`-Aktion mehr
- `admin-factcheck-jobs.page.test.tsx` erwartet keine GraphCandidate-Aktion mehr
- `admin-review.page.test.tsx` blieb fuer Editorial-/Graph-/Gesamt-Integration stabil und gruen

## Ist der Factcheck-Cluster jetzt commitbar?

Kurzantwort: ja, unter den bisherigen Isolationsregeln.

Begruendung:

- die Factcheck-Statusroute ist graphfrei
- die Factcheck-Admin-UI ist separat
- die Page-Datenladung ist in Loader zerlegt
- die Factcheck-Tests sind separat und gruen
- `admin-review.page.test.tsx` braucht keine Factcheck-spezifischen Assertions mehr

## Tests

Ausgefuehrt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/factcheck-entitlement-gate.contract.test.ts tests/factcheck-enqueue.auth.route.test.ts tests/create-analyze-entitlement-gate.route.test.ts tests/factcheck-job-runner.contract.test.ts tests/account-factcheck-jobs.contract.test.tsx tests/factcheck-status.detail.contract.test.ts tests/factcheck-status-seal.route.test.ts tests/review-queue.readmodel.test.ts tests/admin-factcheck-jobs.page.test.tsx tests/admin-review.page.test.tsx`

Ergebnis:

- `typecheck`: gruen
- `lint`: gruen
- `vitest`: `10/10` Testdateien, `30/30` Tests gruen

## Verbleibende Risiken

- `apps/web/src/app/api/factcheck/status/[jobId]/prepareGraphCandidateAction.ts` bleibt im Worktree fuer den spaeteren Graph-Cluster und muss im Factcheck-Commit draussen bleiben
- `apps/web/src/app/admin/review/page.tsx` ist zwar klarer getrennt, aber weiterhin ein gemeinsamer Einstiegspunkt fuer drei Bereiche; beim spaeteren Commit trotzdem bewusst diff-pruefen

## Nicht gemacht

- nichts gestaged
- nichts committed
- `docs/E150/OpenTasks.md` nicht veraendert
- kein neuer Feature-Ausbau
