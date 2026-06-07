# WORKTREE-UNTANGLE-GRAPH-ACCOUNT-ADMIN-00N

Datum: 2026-06-06

## Ursprüngliche Blocker

- `apps/web/src/app/account/AccountClient.tsx`
  - Graph zusammen mit Resume/Create-Ledger, Editorial und Factcheck
- `features/account/service.ts`
  - gemeinsames `Promise.all` für Create, Editorial, Graph und Factcheck
- `features/account/types.ts`
  - gemeinsame Typ-Hunks für Create, Editorial, Graph und Factcheck
- `apps/web/src/app/admin/review/page.tsx`
  - Graph- und Editorial-Hunks in denselben offenen Assembler-Blöcken
- `apps/web/tests/admin-review.page.test.tsx`
  - Graph-, Editorial- und Factcheck-Erwartungen gemischt
- `apps/web/src/app/api/factcheck/status/[jobId]/prepareGraphCandidateAction.ts`
  - unreferenzierter Helper

## Vorgenommene Entkopplung

### Account

Neue Helper:

- `features/account/loadAccountGraphMergeCandidates.ts`
- `features/account/graphCandidateTypes.ts`
- `apps/web/src/app/account/AccountReviewSupplementSections.tsx`

Anpassungen:

- `features/account/service.ts`
  - Graph-Ladung läuft jetzt separat über `graphMergeCandidatesPromise`
  - kein gemeinsamer Graph-Eintrag mehr im gemischten `Promise.all`
  - Graph-Helfer wird lokal im Graph-Hunk geladen
- `features/account/types.ts`
  - Graph-Feld hängt jetzt über `AccountGraphMergeCandidateSlice`
  - Graph-Typ-Erweiterung ist nicht mehr im selben Feldblock wie früher
- `apps/web/src/app/account/AccountClient.tsx`
  - Resume/Editorial/Factcheck sind in `AccountReviewSupplementSections` gebündelt
  - Graph-Render bleibt als eigener Zeilenblock erhalten
  - Graph-Normalisierung läuft über `readAccountGraphMergeCandidateSlice`

### Admin Review

Neuer Helper:

- `apps/web/src/app/admin/review/loadAdminGraphMergeSectionProps.ts`

Anpassungen:

- `apps/web/src/app/admin/review/page.tsx`
  - Graph-Section-Props werden jetzt separat geladen
  - Editorial + Factcheck bleiben im eigenen `Promise.all`
  - Graph-Render hängt nur noch an `AdminGraphMergeCandidatesSection {...graphMergeSectionProps}`

### Tests

Neue Testdatei:

- `apps/web/tests/admin-graph-merge-candidates.page.test.tsx`

Anpassungen:

- `apps/web/tests/admin-review.page.test.tsx`
  - Graph-Erwartungen entfernt
  - Datei deckt jetzt editorial/general review behavior ab
- Graph-spezifische Assertions liegen in der neuen Graph-Page-Testdatei

## Hunk-Zuordnung nach Datei

### `apps/web/src/app/account/AccountClient.tsx`

Graph-Hunks:

- Import `AccountGraphMergeCandidateSection`
- Import `readAccountGraphMergeCandidateSlice` / `AccountGraphMergeCandidateSlice`
- `AccountOverview`-Erweiterung via Graph-Slice
- eigener Render-Zeilenblock für `AccountGraphMergeCandidateSection`
- Graph-Normalisierung über `...readAccountGraphMergeCandidateSlice(src)`

Nicht-Graph-Hunks im selben File:

- Create-Ledger-Typen / Helper
- `AccountReviewSupplementSections`
- `CreateContributionLedgerSection`

Bewertung:

- deutlich besser trennbar als vorher
- der Graph-Render ist jetzt ein eigener, kleiner Block
- der Importbereich bleibt gemischt, ist aber patchbar

### `features/account/service.ts`

Graph-Hunks:

- `graphMergeCandidatesPromise`
- separates `await graphMergeCandidatesPromise`
- Return-Feld `graphMergeCandidates`

Nicht-Graph-Hunks im selben File:

- Contribution-Draft-Lookups
- Editorial-Requests
- Factcheck-Jobs
- Create-Ledger-Mapping

Bewertung:

- jetzt hunkbar
- Graph ist nicht mehr Teil des gemischten `Promise.all`

### `features/account/types.ts`

Graph-Hunks:

- Import `AccountGraphMergeCandidateSlice`
- `AccountOverview` als Schnittmenge mit Graph-Slice

Nicht-Graph-Hunks im selben File:

- Create-/Editorial-/Factcheck-Felder im Basistyp

Bewertung:

- patchbar
- Graph ist nicht mehr als eigenes Feld mitten im gemischten Block eingebettet

### `apps/web/src/app/admin/review/page.tsx`

Graph-Hunks:

- Import `AdminGraphMergeCandidatesSection`
- Import `loadAdminGraphMergeSectionProps`
- `const graphMergeSectionProps = await loadAdminGraphMergeSectionProps();`
- Render `AdminGraphMergeCandidatesSection {...graphMergeSectionProps}`

Editorial-Hunks:

- `getEditorialReviewFilterLabel`
- `loadAdminEditorialReviewRequests`
- Editorial-Filter
- `AdminEditorialReviewSection`

Bewertung:

- jetzt hunkbar zwischen Graph und Editorial
- Graph-Datenladung ist sauber separiert

### `apps/web/tests/admin-review.page.test.tsx`

Graph-Hunks:

- keine fachlichen Graph-Erwartungen mehr

Verbleibend:

- editorial/general mocks und assertions

Bewertung:

- getrennt
- Graph-Assertions wurden ausgelagert

### `apps/web/tests/admin-graph-merge-candidates.page.test.tsx`

Status:

- neue, graph-spezifische Testdatei
- fokussiert auf Graph-Section und Merge-Gate-UI

## Entscheidung zu `prepareGraphCandidateAction.ts`

Datei:

- `apps/web/src/app/api/factcheck/status/[jobId]/prepareGraphCandidateAction.ts`

Befund:

- weiterhin unreferenziert
- nicht in die Factcheck-Route zurückintegrieren
- kein neuer produktiver Pfad in diesem Slice

Entscheidung:

- **bleibt vorerst außerhalb des Graph-Commits**
- Grund: Bridge-Datei zwischen Factcheck und Graph, aber derzeit ohne aktive Einbindung
- sie ist dokumentiert, aber kein notwendiger Bestandteil des jetzt isolierbaren Graph/Merge-Commits

## Tests

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/graph-merge-candidates.contract.test.ts tests/admin-graph-merge-candidate.route.test.ts tests/account-graph-candidate.contract.test.tsx tests/admin-review.page.test.tsx tests/admin-graph-merge-candidates.page.test.tsx`

Ergebnis:

- `typecheck` grün
- `lint` grün
- `5/5` Testdateien grün
- `21/21` Tests grün

## Ist der Graph/Merge-Cluster jetzt commitbar?

Ja, mit dieser Abgrenzung:

- `prepareGraphCandidateAction.ts` bleibt draußen
- `OpenTasks.md` bleibt draußen
- keine Factcheck-, Start-/Draft-, Runden- oder Truth-Guard-Dateien mitziehen

## Final für den Graph/Merge-Commit

Rein:

- `features/graphMergeCandidates.ts`
- `features/account/loadAccountGraphMergeCandidates.ts`
- `features/account/graphCandidateTypes.ts`
- `apps/web/src/app/api/admin/graph-merge-candidates/[candidateId]/route.ts`
- `apps/web/src/app/admin/review/GraphMergeCandidateActions.tsx`
- `apps/web/src/app/admin/review/AdminGraphMergeCandidatesSection.tsx`
- `apps/web/src/app/admin/review/loadAdminGraphMergeData.ts`
- `apps/web/src/app/admin/review/loadAdminGraphMergeSectionProps.ts`
- `apps/web/src/app/account/AccountGraphMergeCandidateSection.tsx`
- `apps/web/src/app/account/AccountClient.tsx`
  - nur Graph-Hunks
- `features/account/service.ts`
  - nur Graph-Hunks
- `features/account/types.ts`
  - nur Graph-Hunks
- `apps/web/src/app/admin/review/page.tsx`
  - nur Graph-Hunks
- `apps/web/tests/graph-merge-candidates.contract.test.ts`
- `apps/web/tests/admin-graph-merge-candidate.route.test.ts`
- `apps/web/tests/account-graph-candidate.contract.test.tsx`
- `apps/web/tests/admin-graph-merge-candidates.page.test.tsx`
- `docs/E150/REVIEWED-GRAPH-MERGE-15_2026-06-06.md`
- `docs/E150/GRAPH-CANDIDATE-STAGING-AUDIT-15B_2026-06-06.md`
- `docs/E150/PRODUCTIVE-GRAPH-MERGE-GATE-18_2026-06-06.md`
- `docs/E150/WORKTREE-ISOLATE-GRAPH-MERGE-00M_2026-06-06.md`

Draußen:

- `apps/web/src/app/api/factcheck/status/[jobId]/prepareGraphCandidateAction.ts`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/src/app/admin/review/AdminEditorialReviewSection.tsx`
- `apps/web/src/app/admin/review/loadAdminEditorialReviewRequests.ts`
- `features/editorialReviewQueue.ts`
- alle Factcheck-Dateien
- alle Runden-Dateien
- alle Start/Create/Draft-Dateien
- `docs/E150/OpenTasks.md`

## Verbleibende Risiken

- `AccountClient.tsx` bleibt ein großer Querschnittsfile; der Graph-Teil ist jetzt aber deutlich kleiner und patchbar
- `features/account/types.ts` bleibt formal ein gemeinsamer Typ-Container, auch wenn der Graph-Slice jetzt ausgelagert ist
- `prepareGraphCandidateAction.ts` bleibt als unreferenzierter Rest bewusst außerhalb des Commits
