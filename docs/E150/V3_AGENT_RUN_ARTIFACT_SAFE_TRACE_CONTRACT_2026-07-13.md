# V3 Agent Run Artifact Safe Trace Contract 2026-07-13

## Scope

- Task: `V3-AGENT-RUN-ARTIFACT-SAFE-TRACE-CONTRACT-01`
- Batch branch: `pr/v3-agentic-safe-trace-intake-regional-research-01`
- Batch task IDs:
  - `V3-AGENT-RUN-ARTIFACT-SAFE-TRACE-CONTRACT-01`
  - `V3-INTAKE-FORMAT-AGENT-E2E-01`
  - `V3-REGIONAL-CIVIC-RADAR-AND-PARTICIPATION-DISCOVERY-01`
  - `V3-RESEARCH-SOURCE-TRANSFERABILITY-AGENT-01`
- Typ: controlled contract batch / kein Runtime-Start / keine Provider / keine Secrets / kein Auto-Publish

## Ziel

Einen kleinen, testbaren Agent-Run-/Artifact-/Safe-Trace-Contract ueber bestehende `/runden/new`- und `/create`-Artefakte legen, ohne Provider-, Prompt-, Chain-of-Thought- oder Debug-Interna in die sichtbare Spur zu leaken.

## Umgesetzte Artefakte

- Neu: `apps/web/src/features/agenticRuntime/agentRunArtifactSafeTraceContract.ts`
- Geaendert: `apps/web/src/features/agenticRuntime/agentRegistryBootstrapContract.ts`

Der neue Contract:

- mappt bestehende AI-Orchestrierungs-Trace-Schritte in user-safe Agent-Run-Schritte;
- traegt nur:
  - Rolle
  - Surface
  - Input-/Output-Artefakte
  - Confidence-Label
  - Status
  - Required Human Action
  - Evidence-Refs
- blendet bewusst aus:
  - Provider
  - Modellnamen
  - Prompts
  - Tokens
  - Debug-/Parse-Diagnostik
  - Rohlogs

## Repo-Sync

`buildAgenticBootstrapReadiness()` liest die echten Follow-up-Status jetzt aus `docs/E150/OpenTasks.md` statt nur aus den initialen Bootstrap-Defaults. Dadurch zeigt `/admin/system` nach dem Batch die tatsaechlich freien naechsten Agentic-Folgepfade.

## Testabdeckung

- `apps/web/tests/agent-run-artifact-safe-trace.contract.test.ts`
- `apps/web/tests/agent-registry-bootstrap.contract.test.ts`
- `apps/web/tests/admin-system-agentic-runtime-readiness.page.test.tsx`

Geprueft wird:

- `/runden/new` bleibt no-AI / manuell;
- `/create` bleibt user-safe und review-first;
- Rollen- und Artefaktzuordnung ist deterministisch;
- `OpenTasks`-basierte Readiness spiegelt den Batch-Fortschritt statt veralteter Bootstrap-Status.

## Guardrails

- keine Runtime-Aktivierung
- keine Parallel-Agenten
- keine externen API-Calls
- keine Fake-Agentenaktivitaet
- keine Provider-/Prompt-Leaks
- kein Auto-Publish
- kein Auto-Merge

## Validierung

- `git diff --check`
  - gruen
- `pnpm -C apps/web exec vitest run tests/agent-run-artifact-safe-trace.contract.test.ts tests/intake-format-agent-e2e.contract.test.ts tests/research-source-transferability-agent.contract.test.ts tests/regional-civic-radar-participation-discovery.contract.test.ts tests/agent-registry-bootstrap.contract.test.ts tests/admin-system-agentic-runtime-readiness.page.test.tsx`
  - `6` Dateien, `10/10` Tests gruen
- `pnpm -C apps/web run lint`
  - gruen
- `pnpm -C apps/web run build`
  - gruen
- `pnpm -C apps/web run typecheck`
  - scheitert weiterhin nur an der bekannten globalen `.next/types/**/*.ts`-Drift mit `TS6053` auf fehlende generierte Next-Dateien
  - nicht als Slice-Regression gewertet
