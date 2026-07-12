# Codex Agent Setup for eDebatte

This directory contains reusable prompts and handoff contracts for controlled autonomous operation.

## Recommended initial topology

Start with one primary agent:

- `prompts/lean-continuous-slice-runner.md`

This single runner selects, implements, tests, self-reviews, documents, and continues through up to three eligible `codex_ready` tasks.

Do not start a separate analysis agent. The documented repository state in `OpenTasks.md`, the readiness matrix, and existing evidence is the default truth.

The other role prompts remain available as escalation tools:

- `slice-orchestrator.md` for later multi-agent coordination;
- `implementation-agent.md` for delegated implementation;
- `review-maintenance-agent.md` for risk-based independent review.

## Activation sequence

1. Merge the operating-model pull request.
2. Open the repository in Codex using the desktop app, Codex web, IDE extension, or CLI.
3. Confirm that Codex reads `AGENTS.md` and `docs/E150/OpenTasks.md`.
4. Start a supervised run using `prompts/lean-continuous-slice-runner.md`.
5. Allow up to three consecutive eligible tasks in one Draft PR.
6. Keep merge, deployment, publishing, billing, permissions, production data, and external-service decisions manual.
7. Use independent review only for the risk classes listed in the lean-runner prompt.

## Scheduling recommendation

Because Codex volume is constrained:

- start manually rather than on a frequent schedule;
- run when sufficient usage reserve is available;
- maximum one active runner;
- no parallel implementation agents during the initial phase;
- no recurring full-repository audit;
- stop when the configured usage reserve is reached.

After ten successful runs, consider a low-frequency schedule for the same single runner. Multi-agent operation is an optional later phase, not the default.

## Required repository inputs

- `AGENTS.md`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`
- `docs/E150/CODEX_AUTONOMOUS_OPERATING_MODEL.md`
- `.codex/prompts/lean-continuous-slice-runner.md`

## Human checkpoints

Human approval remains mandatory for:

- merge during the pilot;
- product or architecture decisions;
- production credentials or data;
- destructive migrations;
- new paid services;
- public publishing, deployment, billing, and entitlement changes;
- any Orange or Red autonomy-class task.

## Usage guardrail

Check the Codex usage page before starting a run. Stop starting new slices when the configured weekly reserve is reached. Never authorize automatic credit purchases from a repository instruction.
