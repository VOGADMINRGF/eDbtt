# OpenTasks Handoff – V3-AGENTIC-RUNTIME-ACTIVATION-CLOSURE-01

## Zweck

Dieses Dokument enthält ausschließlich den vorbereiteten serialisierten SSOT-Handoff. Es ersetzt `docs/E150/OpenTasks.md` nicht und darf nicht als zweiter operativer Statuskatalog verwendet werden.

## Aktueller Status

`dependency_wait`

## Einzutragende Task-ID

`V3-AGENTIC-RUNTIME-ACTIVATION-CLOSURE-01`

## Serialisierungsvoraussetzungen

- genau ein autorisierter OpenTasks-Schreiber;
- aktueller Main-Blob unmittelbar vor dem Write erneut gelesen;
- keine parallele Änderung an `docs/E150/OpenTasks.md`;
- offene PRs #520, #536 und #527 sowie deren SSOT-/Shell-Kollisionen berücksichtigt;
- Issue #552 und Decision-Evidence vorhanden;
- historischer Katalog unverändert;
- keine bestehende Task-ID überschreiben oder duplizieren.

## Vorgeschlagener Eintrag

| ID | Status | Prio | Abhängigkeiten | Scope / Akzeptanz |
| --- | --- | --- | --- | --- |
| `V3-AGENTIC-RUNTIME-ACTIVATION-CLOSURE-01` | `dependency_wait` | P0 | #520, #536, #527; Agent Registry; Safe Trace; Segment Contract; Voxy Experience Shell; #529; #539; Monitoring/Incident/Rollback vor Production | Bestehende sieben Rollen in einem seriellen `single-runner-multi-role`-Ablauf schließen; genau ein sichtbarer Voxy; Capability-Gates `contract_only` bis `production_enabled` statt pauschaler Runtime-Freigabe; im ersten Slice höchstens `read_only_preview` und `review_ready_artifacts`; DE/EN/TR/AR-Sprachkontext einschließlich RTL; höchstens zwei kontrollierte Provideraufrufe; Review und ausdrückliche Bestätigung vor Mutation; kein Auto-Publish, keine externe Nachricht, keine parallele Persistenz; Tests, Typecheck, Lint, Build, `git diff --check`, Preview-Smoke und externer Browser-E2E. Evidence: Issue #552 und `V3_AGENTIC_RUNTIME_ACTIVATION_CLOSURE_01_DECISIONS_2026-08-01.md`. |

## Späterer Statuswechsel

Der Eintrag darf erst dann auf `codex_ready` wechseln, wenn:

1. die relevanten Branch-/Produktkollisionen aus #520, #536 und #527 abgeschlossen oder für den ersten Slice nachweislich ausgeschlossen sind;
2. Scope, erlaubte Dateien und Nicht-Ziele gegen aktuelles `main` bestätigt sind;
3. keine offene Betreiberentscheidung aus Issue #552 verbleibt;
4. der OpenTasks-Schreibpunkt sauber serialisiert ist.

Anschließend real ausführen:

```bash
node scripts/codex-task-preflight.mjs \
  V3-AGENTIC-RUNTIME-ACTIVATION-CLOSURE-01
```

Ohne reales positives Ergebnis kein Implementierungsbranch.