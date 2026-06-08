# BRANCH-WORKSPACE-HANDOFF-08

Status: done  
Datum: 2026-06-06

## Was wurde umgesetzt?

- Ein shared `StartDraftWorkspaceChooser` rahmt denselben Entwurf auf `/start`, `/create`, `/themen` und `/runden/new` als fünf Arbeitsmodi:
  - `Beitrag ausarbeiten`
  - `Passende Themen finden`
  - `Runde vorbereiten`
  - `Redaktionelle Prüfung anfragen`
  - `Später weiterarbeiten`
- Alle Arbeitsmodi nutzen denselben `StartDraftContext`; beim Wechsel werden nur `targetHint` oder `origin` angepasst.
- `/start` hat zusätzlich einen expliziten redaktionellen Arbeitsmodus, der den vorhandenen Review-Draft-Pfad wiederverwendet, ohne den Text neu zu verlangen.
- `/create`, `/themen` und `/runden/new` zeigen denselben Wechselpfad direkt am bestehenden `GlobalDraftStatusBar`.
- `/runden/new` bleibt ein frei editierbarer Entwurfsraum; Antwortoptionen können weiter ergänzt, entfernt oder mit `Anderer Vorschlag` offen gehalten werden.

## Was ist bewusst nicht passiert?

- Keine automatische Veröffentlichung.
- Kein produktiver Vote.
- Kein Graph-Write.
- Kein Auto-Dossier.
- Kein Auto-Anlassraum.
- Keine DeepSearch- oder Orchestrierungs-Folgeprozesse durch den Wechsel des Arbeitsmodus.

## Guardrails

- Derselbe Draft bleibt session-scoped und wird nicht still zu einem produktiven Beitrag hochgestuft.
- `Später weiterarbeiten` führt nur in den bestehenden Konto-/Resume-Pfad.
- Die redaktionelle Prüfung bleibt review-first und startet keinen öffentlichen Surface-Prozess.
- Der Rundenpfad bleibt Draft-only; es werden keine Stimmen erzeugt oder veröffentlicht.

## Verifikation

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/start-draft-context.contract.test.ts tests/start-draft-handoff-targets.contract.test.ts tests/start-create-light-entry.contract.test.tsx tests/start-shared-create-composer.contract.test.tsx tests/themen-surface-staging.contract.test.tsx tests/runden-manual-create.page.contract.test.tsx tests/manual-anlassraum-setup.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/branch-workspace-handoff.contract.test.ts`

Ergebnis:

- Typecheck grün
- Lint grün
- 9/9 Testdateien grün
- 41/41 Tests grün
