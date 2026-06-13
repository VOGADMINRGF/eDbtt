# WORKTREE-EVIDENCE-BACKFILL-12

Datum: 2026-06-13
Repo: `edebatte-org`
Scope: nur untracked Evidence-/Recovery-Dokumente unter `docs/E150`

## Geprüfte untracked Evidence-Dateien

- `docs/E150/WORKTREE-COMMIT-TRUTH-GUARD-00I_2026-06-06.md`
- `docs/E150/WORKTREE-RECOVERY-ISOLATION-00_2026-06-06.md`
- `docs/E150/CREATE-BRANCH-HANDOFF-WORKBENCH-12_2026-06-04.md`
- `docs/E150/CREATE-BRANCH-LEDGER-PERSISTENCE-05_2026-06-03.md`
- `docs/E150/CREATE-EXISTING-MATCH-COUNTING-06_2026-06-04.md`
- `docs/E150/CREATE-MULTIBRANCH-ACTION-BOARD-01_2026-06-03.md`
- `docs/E150/CREATE-MULTIBRANCH-COMPLETION-COPY-07_2026-06-04.md`
- `docs/E150/CREATE-MULTIBRANCH-FRONTEND-PILOT_GREEN_2026-06-03.md`
- `docs/E150/CREATE-MULTIBRANCH-MICROCOPY-04_2026-06-03.md`
- `docs/E150/CREATE-MULTIBRANCH-PILOT-FREEZE-08_2026-06-04.md`
- `docs/E150/CREATE-MULTIBRANCH-PRODUCTION-POLISH-02_2026-06-03.md`
- `docs/E150/CREATE-MULTIBRANCH-STABILITY-FIX-06_2026-06-04.md`
- `docs/E150/CREATE-MULTIBRANCH-UX-POLISH-03_2026-06-03.md`
- `docs/E150/CREATE-PLACE-BRANCH-COPY-NORMALIZATION-11_2026-06-04.md`
- `docs/E150/CREATE-PLACE-CLARIFICATION-BRANCH-SCOPE-10_2026-06-04.md`
- `docs/E150/CREATE-PLACE-CLARIFICATION-INTAKE-09_2026-06-04.md`
- `docs/E150/CREATE-PLACE-PLANNER-UNAVAILABLE-STABILITY-11_2026-06-04.md`
- `docs/E150/CREATE-PLACE-REGISTRY-JURISDICTION-08_2026-06-04.md`
- `docs/E150/CREATE-PLACE-REGISTRY-JURISDICTION-STABILITY-10_2026-06-04.md`
- `docs/E150/CREATE-QR-SWIPES-PUBLISH-PREP-07_2026-06-04.md`
- `docs/E150/CREATE-STREET-REGISTRY-LOOKUP-12_2026-06-04.md`

## Entscheidung je Datei

### Nachziehen im docs-only Commit empfohlen

Diese Dateien wurden als echte Evidence bewertet:

- `WORKTREE-COMMIT-TRUTH-GUARD-00I_2026-06-06.md`
  - gehört zu einem bereits existierenden Commit (`21b7a51f`)
  - ist keine Scratch-Datei, sondern ein nachträglicher Commit-Bericht
  - sollte docs-only nachcommitted werden
- `WORKTREE-RECOVERY-ISOLATION-00_2026-06-06.md`
  - ist ein brauchbarer Recovery-/Isolations-Snapshot
  - dokumentiert die Ausgangslage der späteren Worktree-Zerlegung
  - sollte docs-only nachcommitted werden
- `CREATE-BRANCH-HANDOFF-WORKBENCH-12_2026-06-04.md`
- `CREATE-BRANCH-LEDGER-PERSISTENCE-05_2026-06-03.md`
- `CREATE-EXISTING-MATCH-COUNTING-06_2026-06-04.md`
- `CREATE-MULTIBRANCH-ACTION-BOARD-01_2026-06-03.md`
- `CREATE-MULTIBRANCH-COMPLETION-COPY-07_2026-06-04.md`
- `CREATE-MULTIBRANCH-FRONTEND-PILOT_GREEN_2026-06-03.md`
- `CREATE-MULTIBRANCH-MICROCOPY-04_2026-06-03.md`
- `CREATE-MULTIBRANCH-PILOT-FREEZE-08_2026-06-04.md`
- `CREATE-MULTIBRANCH-PRODUCTION-POLISH-02_2026-06-03.md`
- `CREATE-MULTIBRANCH-STABILITY-FIX-06_2026-06-04.md`
- `CREATE-MULTIBRANCH-UX-POLISH-03_2026-06-03.md`
- `CREATE-PLACE-BRANCH-COPY-NORMALIZATION-11_2026-06-04.md`
- `CREATE-PLACE-CLARIFICATION-BRANCH-SCOPE-10_2026-06-04.md`
- `CREATE-PLACE-CLARIFICATION-INTAKE-09_2026-06-04.md`
- `CREATE-PLACE-PLANNER-UNAVAILABLE-STABILITY-11_2026-06-04.md`
- `CREATE-PLACE-REGISTRY-JURISDICTION-08_2026-06-04.md`
- `CREATE-PLACE-REGISTRY-JURISDICTION-STABILITY-10_2026-06-04.md`
- `CREATE-QR-SWIPES-PUBLISH-PREP-07_2026-06-04.md`
- `CREATE-STREET-REGISTRY-LOOKUP-12_2026-06-04.md`
  - alle sind inhaltlich echte Evidence statt Scratch
  - alle korrespondieren zu bereits `done` gesetzten Tasks in `docs/E150/OpenTasks.md`
  - mehrere dieser Dateien werden dort bereits explizit als Evidenz referenziert
  - sie gehören damit zu bereits abgeschlossenen Slices und sind docs-only nachziehbar

### Bewusst draußen lassen

In diesem Slice bleiben draußen:

- alle nicht untracked Docs außerhalb der obigen Liste
- Legacy-/Hintergrunddokumente wie `CREATE-FLOW-02.md`, `CREATE-SIMPLE-CONFIRMATION-01_STATEMENT_FIRST_2026-05-17.md` oder `CREATE-ANALYZE-E2E-PRODUCTION-01_REVIEW_FIRST_CREATE_PIPELINE_2026-05-23.md`
  - sie sind nicht Teil des aktuellen untracked Backfill-Sets
  - sie sind eher Hintergrund-/Vorläuferdokumente als unmittelbar fehlende Evidence zu diesem Worktree-Drift
- alle Source-Dateien
- alle Tests

## Welche Evidence nachgezogen werden soll

Empfohlener docs-only Commit-Scope:

- `docs/E150/WORKTREE-COMMIT-TRUTH-GUARD-00I_2026-06-06.md`
- `docs/E150/WORKTREE-RECOVERY-ISOLATION-00_2026-06-06.md`
- die 19 untracked `CREATE-*`-Evidence-Dateien aus der Prüfliste oben
- `docs/E150/OpenTasks.md`
- `docs/E150/WORKTREE-EVIDENCE-BACKFILL-12_2026-06-08.md`

## OpenTasks

- `OpenTasks.md` wurde angepasst.
- `WORKTREE-EVIDENCE-BACKFILL-12` ist jetzt auf `done`.
- Als nächster `codex_ready` Task wurde `WORKTREE-ISOLATE-FACTCHECK-ACCOUNT-REVIEW-13` vorbereitet.

Begründung:

- Der verbleibende Factcheck-/Account-/Review-Cluster ist kleiner und klarer abgrenzbar als der weiterhin breite Create-/Planner-/Followup-Kern.
- Der große Create-Cluster bleibt trotz des Docs-Backfills source-seitig stark vermischt.

## Was ausdrücklich nicht verändert wurde

- keine Source-Datei
- keine Testdatei
- keine Produktlogik
- keine unklaren oder nicht-untracked Legacy-Dokumente
- keine Dateien wurden gelöscht
- kein Commit

## Docs-only-Commit-Empfehlung

- Ja, ein docs-only Commit ist empfohlen.
- Der Scope ist belastbar, weil er ausschließlich aus echter fehlender Evidence plus OpenTasks-/Backfill-Doku besteht.

## Nächster empfohlener Cluster

- `WORKTREE-ISOLATE-FACTCHECK-ACCOUNT-REVIEW-13`
