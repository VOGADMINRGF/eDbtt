# WORKTREE-RESTDRIFT-DECISION-09

Datum: 2026-06-13
Repo: `edebatte-org`
Scope: nur OpenTasks-/Evidence-Hygiene

## Geprüfte Doku-/OpenTasks-Dateien

- `docs/E150/OpenTasks.md`
- `docs/E150/WORKTREE-RESTDRIFT-AUDIT-08_2026-06-08.md`
- untracked `docs/E150/CREATE-*.md`
- `docs/E150/WORKTREE-COMMIT-TRUTH-GUARD-00I_2026-06-06.md`
- `docs/E150/WORKTREE-RECOVERY-ISOLATION-00_2026-06-06.md`

## Entscheidung zu `PR-AI-CREATE-01I`

- Befund: `PR-AI-CREATE-01I` stand doppelt in `OpenTasks.md`.
- Operativer Eintrag bleibt der frühere Eintrag im kanonischen Task-Katalog.
- Der spätere doppelte Eintrag im Archiv-/Legacy-Bereich wurde als reine OpenTasks-Hygiene-Drift entfernt.
- Begründung: beide Zeilen hatten denselben Task-Inhalt, dieselbe Evidence und keinen zusätzlichen Statuswert.

## Entscheidung zu untracked Evidence-Dateien

### Echte Evidence, die zu bereits `done` gesetzten Slices gehört

Diese Dateien sind keine Scratch-Notizen, sondern echte Evidence zu bereits in `OpenTasks.md` referenzierten oder inhaltlich klar belegten Slices:

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

Entscheidung:

- Diese Dateien sollten nachcommitted werden.
- Sie sind fachlich echte Evidence, aber wegen der großen noch offenen Code-Restdrift nicht in diesem Slice mit committed worden.

### Echte Worktree-/Isolations-Evidence

- `docs/E150/WORKTREE-COMMIT-TRUTH-GUARD-00I_2026-06-06.md`
- `docs/E150/WORKTREE-RECOVERY-ISOLATION-00_2026-06-06.md`

Entscheidung:

- Beide Dateien sind echte Evidence und keine Scratch-Dateien.
- `WORKTREE-COMMIT-TRUTH-GUARD-00I` dokumentiert den bereits existierenden Commit `21b7a51f` belastbar und sollte als docs-only Evidence nachcommitted werden.
- `WORKTREE-RECOVERY-ISOLATION-00` ist ein brauchbarer historischer Recovery-Snapshot und sollte ebenfalls nachcommitted werden, solange der Bericht noch als Referenz für die jetzige Restdrift-Zerlegung dient.

### Legacy-/Hintergrunddokumente ohne aktuellen Hygiene-Zwang

Diese Dateien wirken wie echte Hintergrund-/Entscheidungsdokumente, aber nicht wie akut zu bereinigende OpenTasks-Hygiene:

- `docs/E150/CREATE-ANALYZE-E2E-PRODUCTION-01_REVIEW_FIRST_CREATE_PIPELINE_2026-05-23.md`
- `docs/E150/CREATE-FLOW-02.md`
- `docs/E150/CREATE-HANDOFF-QUEUE-PERSISTENCE-01_PERSISTENT_CREATE_REVIEW_QUEUE_2026-05-19.md`
- `docs/E150/CREATE-MOBILE-UX-ROUND2_2026-05-09.md`
- `docs/E150/CREATE-SIMPLE-CONFIRMATION-01_STATEMENT_FIRST_2026-05-17.md`

Entscheidung:

- Nicht löschen.
- Nicht in diesem Slice nachziehen.
- Erst bei späterer Create-/Docs-Hygiene entscheiden, ob sie in `OpenTasks.md` expliziter referenziert oder bewusst als Hintergrunddokumente belassen werden.

## Evidence ohne Task / Task ohne Evidence

### Evidence ohne direkten kanonischen Task-Eintrag

- `WORKTREE-COMMIT-TRUTH-GUARD-00I_2026-06-06.md`
- `WORKTREE-RECOVERY-ISOLATION-00_2026-06-06.md`
- mehrere Legacy-`CREATE-*`-Dokumente aus Vorläufer-/Zwischenständen

Bewertung:

- Nicht automatisch falsch.
- Bei den beiden `WORKTREE-*`-Dateien handelt es sich um zulässige Meta-/Isolations-Evidence.
- Die Legacy-`CREATE-*`-Dokumente sind Hintergrundmaterial und müssen nicht alle als operative Tasks abgebildet werden.

### Task ohne verfügbare eingecheckte Evidence

- mehrere `done`-Create-Slices verweisen bereits in `OpenTasks.md` auf Evidence-Dateien, die aktuell noch untracked im Worktree liegen.

Bewertung:

- Das ist echte Hygiene-Drift.
- Die Status selbst werden in diesem Slice nicht zurückgedreht, weil die zugrunde liegenden Commits/Evidence inhaltlich plausibel sind.
- Die fehlende Git-Erfassung der Evidence sollte in einem späteren docs-only Commit nachgezogen werden.

## Welche Dateien in diesem Slice geändert wurden

- `docs/E150/OpenTasks.md`
- `docs/E150/WORKTREE-RESTDRIFT-DECISION-09_2026-06-08.md`

## Welche Dateien bewusst nicht angefasst wurden

- alle Source-Dateien
- alle Testdateien
- alle untracked `CREATE-*`-Evidence-Dateien
- `docs/E150/WORKTREE-COMMIT-TRUTH-GUARD-00I_2026-06-06.md`
- `docs/E150/WORKTREE-RECOVERY-ISOLATION-00_2026-06-06.md`

## OpenTasks-/Status-Entscheidungen

- `WORKTREE-RESTDRIFT-DECISION-09` wird in `OpenTasks.md` auf `done` gesetzt.
- Als nächster `codex_ready` Task wird nicht `WORKTREE-ISOLATE-VOXY-PUBLIC-STYLE-10`, sondern `WORKTREE-ISOLATE-TELEMETRY-ORCHESTRATOR-10` vorbereitet.

Begründung:

- Der Audit belegt für Voxy/Public-Style aktuell keine saubere Isolierbarkeit:
  - `globals.css` ist global.
  - `VoxyGuide.tsx` ist shared UI.
  - `voxyCopy.ts` und `voxy-copy.contract.test.ts` sind aktuell inkonsistent.
- Der Telemetry-/Orchestrator-Cluster ist klarer geschnitten und hat eine engere Testfläche.

## Docs-only-Commit-Empfehlung

- Ja, ein docs-only Commit für diesen Decision-Slice ist empfohlen.
- Inhalt des empfohlenen Folge-Commits:
  - `OpenTasks.md`
  - `WORKTREE-RESTDRIFT-DECISION-09_2026-06-08.md`
- Optional in einem separaten weiteren docs-only Nachzieh-Commit:
  - `WORKTREE-COMMIT-TRUTH-GUARD-00I_2026-06-06.md`
  - `WORKTREE-RECOVERY-ISOLATION-00_2026-06-06.md`
  - die klar zu `done` gehörenden untracked `CREATE-*`-Evidence-Dateien

## Nächster empfohlener Cluster nach F

- `WORKTREE-ISOLATE-TELEMETRY-ORCHESTRATOR-10`

Grund:

- kleiner und klarer als der große `/create`-Kern
- aktuell sauberer isolierbar als Voxy/Public-Style
- `.env.example` ist der einzige offensichtliche Mischpunkt und kann explizit draußen bleiben oder hunkgenau behandelt werden
