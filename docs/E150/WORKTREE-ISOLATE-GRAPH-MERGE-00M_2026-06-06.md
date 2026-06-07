# WORKTREE-ISOLATE-GRAPH-MERGE-00M

Datum: 2026-06-06

## Ziel

Prüfen, ob der GraphCandidate-/Staging-/Merge-Gate-Cluster aus

- `REVIEWED-GRAPH-MERGE-15`
- `GRAPH-CANDIDATE-STAGING-AUDIT-15B`
- `PRODUCTIVE-GRAPH-MERGE-GATE-18`

im aktuellen dirty Worktree eigenständig isoliert und separat committed werden kann.

## Bereits erledigter Vorpunkt

`WORKTREE-COMMIT-FACTCHECK-00L-DOCS` war bereits abgeschlossen:

- Commit: `93963265 docs(e150): document factcheck worktree isolation`

## Eindeutig zum Graph/Merge-Cluster gehörende Dateien

Sauber graphspezifisch und ohne offensichtliche Fremdcluster-Logik:

- `features/graphMergeCandidates.ts`
- `apps/web/src/app/api/admin/graph-merge-candidates/[candidateId]/route.ts`
- `apps/web/src/app/api/factcheck/status/[jobId]/prepareGraphCandidateAction.ts`
- `apps/web/src/app/admin/review/GraphMergeCandidateActions.tsx`
- `apps/web/src/app/admin/review/AdminGraphMergeCandidatesSection.tsx`
- `apps/web/src/app/admin/review/loadAdminGraphMergeData.ts`
- `apps/web/src/app/account/AccountGraphMergeCandidateSection.tsx`
- `apps/web/tests/graph-merge-candidates.contract.test.ts`
- `apps/web/tests/admin-graph-merge-candidate.route.test.ts`
- `apps/web/tests/account-graph-candidate.contract.test.tsx`
- `docs/E150/REVIEWED-GRAPH-MERGE-15_2026-06-06.md`
- `docs/E150/GRAPH-CANDIDATE-STAGING-AUDIT-15B_2026-06-06.md`
- `docs/E150/PRODUCTIVE-GRAPH-MERGE-GATE-18_2026-06-06.md`

## Ausdrücklich ausgeschlossen

Nicht zum Graph/Merge-Commit ziehen:

- alle bereits committed Factcheck-Dateien
- `docs/E150/OpenTasks.md`
- `apps/web/src/app/globals.css`
- Start-/Create-/Draft-Dateien
- Runden-Dateien
- Truth-Guard-Dateien
- Editorial-Statusmaschinen außerhalb klarer Graph-Anbindung

## Hunk-Zuordnung Querschnittsdateien

### `features/account/service.ts`

Status: gemischt, nicht sauber graph-exklusiv

Enthält im selben Diff-Block:

- Create-Ledger-Imports und Draft-Lookups
- Editorial-Request-Lookups
- Graph-Kandidaten-Lookups
- Factcheck-Job-Lookups
- gemeinsames `Promise.all`
- gemeinsamer Return-Hunk mit `createContributionLedger`, `editorialReviewRequests`, `graphMergeCandidates`, `factcheckJobs`

Befund:

- Graph-Hunks sind fachlich erkennbar
- git-seitig aber nicht sauber graph-exklusiv
- für einen isolierten Graph-Commit riskant

### `features/account/types.ts`

Status: gemischt, nicht sauber graph-exklusiv

Ein einzelner Hunk führt gleichzeitig ein:

- `CreateContributionLedgerEntry`
- `EditorialReviewRequest`
- `GraphMergeCandidate`
- `FactcheckJobDoc`

und die zugehörigen Felder im `AccountOverview`.

Befund:

- der Graph-Typ ist nur ein Teil eines gemischten Querschnitts-Hunks
- ohne separates Entmischen nicht sauber commitbar

### `apps/web/src/app/account/AccountClient.tsx`

Status: stark gemischt

Der Diff enthält gleichzeitig:

- Resume-Workbench / Create-Ledger
- Editorial-Section
- Factcheck-Section
- Graph-Section
- große Ledger-UI-Funktionen
- gemeinsame `normalizeOverview`-Erweiterung

Befund:

- `AccountGraphMergeCandidateSection` selbst ist sauber
- die Einbindung in `AccountClient.tsx` ist aktuell nicht graph-isoliert

### `apps/web/src/app/admin/review/page.tsx`

Status: gemischt, hunkbar nur eingeschränkt

Seit `4a7e7cc7` ist die Factcheck-Minimalversion bereits committed. Der aktuelle offene Diff ergänzt:

- `AdminEditorialReviewSection`
- `AdminGraphMergeCandidatesSection`
- `getEditorialReviewFilterLabel`
- `loadAdminEditorialReviewRequests`
- `loadAdminGraphMergeData`
- gemeinsames `Promise.all([editorialRequests, factcheckJobs, graphMergeData])`
- Editorial-Filter
- Zählchips für Redaktion und Factchecks
- Render von Editorial- und Graph-Section

Befund:

- die Graph-Section ist fachlich klar
- die Datenladung am Dateikopf ist aber mit Editorial zusammen eingeführt
- damit nicht sauber graph-only commitbar, solange nicht weiter entmischt

### `apps/web/tests/admin-review.page.test.tsx`

Status: stark gemischt

Der Diff erweitert dieselbe Testdatei gleichzeitig um:

- Editorial-Mocks
- Graph-Mocks
- Factcheck-Mock (`factcheckList`)
- Editorial-Fixtures und Assertions
- Graph-Fixtures und Assertions

Befund:

- Graph-Assertions sind vorhanden
- die Datei ist nicht graph-exklusiv
- für einen isolierten Graph-Commit riskant

## Sonderfall `prepareGraphCandidateAction.ts`

`apps/web/src/app/api/factcheck/status/[jobId]/prepareGraphCandidateAction.ts`

Befund:

- fachlich klar Graph-Handoff aus Factcheck
- aktuell im Codebestand nicht referenziert
- `rg` findet nur die Definitionen, keine Verwendung

Risiko:

- als unreferenzierter Helper graphseitig plausibel
- aber kein belastbarer Beweis, dass die aktuelle Produktintegration vollständig abgeschlossen ist

## Commitbarkeit

### Graph-Kern

Der Graph-Kern ist weitgehend isolierbar:

- `features/graphMergeCandidates.ts`
- Graph-Admin-Route
- Graph-Admin-UI-Komponenten
- Graph-Account-Section-Komponente
- Graph-spezifische Tests
- Graph-Evidence

### Gesamtcluster 15 / 15B / 18

Nicht sauber commitbar als vollständiger Cluster in der aktuellen Form.

Blocker:

1. `features/account/service.ts`
   - gemischt mit Create, Editorial und Factcheck
2. `features/account/types.ts`
   - gemischter Querschnittshunk
3. `apps/web/src/app/account/AccountClient.tsx`
   - Graph-Section zusammen mit Resume/Editorial/Factcheck/Ledger
4. `apps/web/src/app/admin/review/page.tsx`
   - Graph und Editorial in denselben offenen Assembler-Hunks
5. `apps/web/tests/admin-review.page.test.tsx`
   - Graph- und Editorial-Erwartungen in derselben Datei
6. `prepareGraphCandidateAction.ts`
   - fachlich passend, aber derzeit unreferenziert

## Tests

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/graph-merge-candidates.contract.test.ts tests/admin-graph-merge-candidate.route.test.ts tests/account-graph-candidate.contract.test.tsx tests/admin-review.page.test.tsx`

Ergebnis:

- `typecheck` grün
- `lint` grün
- `4/4` Testdateien grün
- `20/20` Tests grün

## Verbleibender Drift

Der Worktree bleibt breit dirty, u. a. in:

- Start-/Create-/Draft-Kosmos
- Editorial Review
- Account-Querschnitt
- Landing/Create
- `docs/E150/OpenTasks.md`

## Nächster empfohlener Schritt

Kein Staging in diesem Slice.

Vor einem Graph-Commit zuerst entmischen:

1. `apps/web/src/app/admin/review/page.tsx`
   - Graph-Loader/Section gegen Editorial sauber trennen
2. `apps/web/tests/admin-review.page.test.tsx`
   - Graph-Assertions in eigene Testdatei oder klar separaten Hunk verschieben
3. `apps/web/src/app/account/AccountClient.tsx`
   - Graph-Section von Resume/Editorial/Factcheck/Ledger abkoppeln
4. `features/account/service.ts`
   - Graph-Lookup aus gemischtem `Promise.all` herauslösen
5. `features/account/types.ts`
   - Graph-Feld-Erweiterung von Create/Editorial/Factcheck entkoppeln

Danach ist ein eigener Commit mit

- `fix(graph): gate reviewed graph merge candidates`

realistisch.
