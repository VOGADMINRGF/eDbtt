# Evidence Index – V3-AGENTIC-RUNTIME-ACTIVATION-CLOSURE-01

## Status

`dependency_wait`

## Betreiberfreigabe

Am 2026-08-01 wurde der kontrollierte Rahmen freigegeben:

- ein sichtbarer Voxy;
- sieben interne Rollen;
- serieller `single-runner-multi-role`-Betrieb;
- Preview zunächst read-only beziehungsweise review-ready;
- höchstens zwei kontrollierte Provideraufrufe je Nutzeraktion;
- DE/EN/TR/AR als erster Sprachpilot;
- keine Veröffentlichung, externe Nachricht oder Production-Aktivierung;
- Production erst nach Monitoring, Incident und Rollback.

## Repo-Wahrheiten

- `.codex/agents/registry.json` – Rollen, erlaubte Artefakte, denied actions, Task-Mapping und Shared Rules.
- `.codex/agents/bootstrap.json` – Bootstrap- und Follow-up-Plan.
- `apps/web/src/features/agenticRuntime/agentRegistryBootstrapContract.ts` – typisierte Registry-/Readiness-Wahrheit.
- `apps/web/src/features/agenticRuntime/agentRunArtifactSafeTraceContract.ts` – user-safe Trace.
- `apps/web/src/features/agenticRuntime/agenticCivicE2EPilotContract.ts` – bestehender kontrollierter Pilotvertrag.
- `apps/web/src/features/voxy/voxyExperienceShellContract.ts` – sichtbare Voxy-Shell.
- `docs/E150/V3_PREVIEW_SMOKE_RESULTS_AFTER_AGENTIC_2026-07-14.md` – Contract-/Surface-Readiness und verbleibende externe Gates.

## Neue Evidence in diesem Branch

- `V3_AGENTIC_RUNTIME_ACTIVATION_CLOSURE_01_DECISIONS_2026-08-01.md`
- `V3_AGENTIC_RUNTIME_ACTIVATION_CLOSURE_01_CODEX_BRIEF.md`
- `V3_AGENTIC_RUNTIME_ACTIVATION_CLOSURE_01_OPENTASKS_HANDOFF.md`

## Nicht behauptet

- kein OpenTasks-Write;
- kein erfolgreicher Preflight;
- keine Runtime-Aktivierung;
- kein Providerlauf;
- kein Browser-Smoke;
- kein externer E2E;
- kein Monitoring-/Incident-/Rollback-Abschluss;
- kein Deployment oder Production-Gate;
- keine Realmail oder externe Nachricht.

## Nächste erlaubte Aktion

OpenTasks seriell und auf aktuellem Main-Blob aktualisieren. Danach Abhängigkeiten prüfen und erst bei realem `codex_ready` den Preflight ausführen.