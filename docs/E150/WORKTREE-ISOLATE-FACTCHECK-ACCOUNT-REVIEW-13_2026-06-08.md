# WORKTREE-ISOLATE-FACTCHECK-ACCOUNT-REVIEW-13

Datum: 2026-06-13
Geprüfter Commit-Stand: `2da0dc1b4af43e60e5b590424b9f381f5f989c0e` (`docs(e150): backfill recovered evidence files`)

## Geprüfte Dateien

Direkt geprüft:

- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/account/AccountReviewSupplementSections.tsx`
- `apps/web/src/app/account/AccountClient.tsx`
- `apps/web/src/app/api/factcheck/status/[jobId]/prepareGraphCandidateAction.ts`
- `features/account/factcheckJobTypes.ts`
- `features/account/loadAccountFactcheckJobs.ts`
- `features/account/service.ts`
- `features/account/types.ts`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/account-organization-dashboard.page.test.tsx`

Zusätzlich fachlich gegengeprüft:

- `apps/web/src/app/account/AccountFactcheckJobSection.tsx`
- `apps/web/src/app/account/AccountGraphMergeCandidateSection.tsx`
- `apps/web/src/app/account/AccountEditorialReviewSupplement.tsx`
- `apps/web/src/app/admin/review/loadAdminFactcheckJobs.ts`
- `apps/web/src/app/api/factcheck/status/[jobId]/route.ts`

## Cluster-Bewertung

### Eindeutig zum Cluster gehörend

Diese Änderungen bilden einen sauberen, review-first Kern:

- `apps/web/src/app/admin/review/page.tsx`
  - lädt Editorial-Requests und Factcheck-Jobs konsistent per `Promise.all`
  - zeigt eine zusätzliche konservative Factcheck-Zählung im Header
  - keine neue Produktlogik, nur read-/render-path
- `apps/web/tests/admin-review.page.test.tsx`
  - zieht die neuen Abhängigkeiten für Editorial-/Factcheck-/Graph-Merge-Mocks sauber nach
  - bestätigt weiter, dass kein Direktveröffentlichungs-Wording auftaucht
- `features/account/factcheckJobTypes.ts`
  - kleiner read-only Slice für `factcheckJobs`
- `features/account/loadAccountFactcheckJobs.ts`
  - read-only Loader gegen bestehendes Factcheck-Repo
- `features/account/types.ts`
  - erweitert den bestehenden Account-Overview-Typ um den Factcheck-Job-Slice
- `features/account/service.ts`
  - lädt Factcheck-Jobs für den Account-Overview parallel zu Editorial-/Graph-/Ledger-Daten
  - keine neue Schreiblogik, keine neuen Runner, keine neuen Gates
- `apps/web/src/app/account/AccountClient.tsx`
  - rendert Factcheck-Jobs als zusätzlichen read-only Arbeitsstand über den bestehenden Overview-Pfad
  - nutzt bereits vorhandene `AccountFactcheckJobSection`

Bewertung:

- guardrail-konform
- isoliert commitbar
- kein Auto-Graph
- kein Auto-Merge
- kein Auto-Publish
- keine neue produktive Quellenprüfung
- keine Create-/Planner- oder Live-Vermischung

### Bewusst draußen bleibend

- `apps/web/src/app/account/AccountReviewSupplementSections.tsx`
  - derzeit ungenutzter Parallel-Wrapper
  - dupliziert Teile des bereits genutzten `AccountCreateDraftSections`
  - wirkt aktuell wie Scratch-/Vorbereitungscode, nicht wie sauber integrierter Scope
- `apps/web/src/app/api/factcheck/status/[jobId]/prepareGraphCandidateAction.ts`
  - unverdrahteter Graph-Aktionsentwurf
  - wird von der bestehenden Status-Route aktuell nicht verwendet
  - würde ohne zusätzliche Route-/Action-Änderung nur toten Code einführen
  - liegt damit außerhalb des kleinen commitbaren Kerns
- `apps/web/tests/account-organization-dashboard.page.test.tsx`
  - enthält Account-/Produktcopy-Drift
  - gehört nicht eindeutig zum Factcheck-/Account-/Review-Isolationskern
  - bleibt als separater Restdrift draußen

## Guardrails

Der isolierte Kern bleibt innerhalb der vorhandenen Leitplanken:

- Factcheck bleibt gate-/entitlement-/confirmation-first
- kein DeepSearch ohne Bestätigung
- keine Quellenprüfung ohne Gate
- GraphCandidate nur review-first
- kein Auto-Graph
- kein Auto-Merge
- kein `sealed_verified` ohne `sealGranted`
- Account-Flächen zeigen Status statt produktive Fakten
- Admin Review bleibt review-first
- keine automatische Veröffentlichung

## Tests

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/account-factcheck-jobs.contract.test.tsx tests/factcheck-status.detail.contract.test.ts tests/factcheck-status-seal.route.test.ts tests/admin-factcheck-jobs.page.test.tsx tests/account-editorial-review.contract.test.tsx tests/admin-editorial-review.page.test.tsx tests/admin-editorial-review.route.test.ts tests/graph-merge-candidates.contract.test.ts tests/account-graph-candidate.contract.test.tsx tests/admin-review.page.test.tsx`

Ergebnis:

- Typecheck: grün
- Lint: grün
- Vitest: `10/10` Dateien, `27/27` Tests grün

Vorhandene, aber für diesen Kern nicht geänderte Tests:

- `apps/web/tests/account-organization-dashboard.page.test.tsx`
- weitere Review-/Factcheck-Suites ohne direkten Drift in diesem Slice

## Ist der Cluster commitbar?

Ja, als kleiner Kern-Scope.

## Commitbarer Kern-Scope

- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/account/AccountClient.tsx`
- `features/account/types.ts`
- `features/account/service.ts`
- `features/account/factcheckJobTypes.ts`
- `features/account/loadAccountFactcheckJobs.ts`
- `apps/web/tests/admin-review.page.test.tsx`
- `docs/E150/OpenTasks.md`
- `docs/E150/WORKTREE-ISOLATE-FACTCHECK-ACCOUNT-REVIEW-13_2026-06-08.md`

## Was bewusst draußen bleibt

- `apps/web/src/app/account/AccountReviewSupplementSections.tsx`
- `apps/web/src/app/api/factcheck/status/[jobId]/prepareGraphCandidateAction.ts`
- `apps/web/tests/account-organization-dashboard.page.test.tsx`
- alle Create-/Planner-/Followup-Dateien
- alle Multibranch-/Place-/Street-Dateien
- alle Live-/Voxy-/Telemetry-/globals.css-Dateien

## Nächster empfohlener Schritt

- `WORKTREE-COMMIT-FACTCHECK-ACCOUNT-REVIEW-13`
