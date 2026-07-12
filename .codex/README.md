# Codex Agent Setup for eDebatte

This directory contains reusable role prompts and handoff contracts for controlled autonomous operation.

## Recommended initial topology

Start with three roles, not four concurrent agents:

1. `slice-orchestrator.md` — selects and closes one eligible slice at a time.
2. `implementation-agent.md` — implements the selected scope and updates tests/docs.
3. `review-maintenance-agent.md` — independently reviews, runs focused quality gates, and proposes or applies bounded repairs.

The Product Integrity role is initially embedded in the review agent. Split it into a fourth independent agent only after the ten-slice pilot shows stable quality and acceptable usage.

## Activation sequence

1. Merge the operating-model pull request.
2. Open the repository in Codex using the ChatGPT desktop app, Codex web, IDE extension, or CLI.
3. Confirm that Codex reads the root `AGENTS.md` and `docs/E150/OpenTasks.md`.
4. Start one supervised run with the full prompt from `prompts/slice-orchestrator.md`.
5. Let the orchestrator select exactly one `codex_ready` task and create a focused branch or worktree.
6. Run the implementation prompt in that branch/worktree.
7. Run the independent review/maintenance prompt only after implementation is complete.
8. Keep all pull requests as drafts during the ten-slice pilot.
9. After the pilot, enable a scheduled task for the orchestrator only. Do not schedule implementation and review as independent blind loops; the orchestrator must sequence them.

## Scheduling recommendation

Initial pilot:

- no schedule for the first three slices;
- then one orchestrator run each weekday morning;
- maximum one active implementation slice;
- review starts only after the implementation handoff exists;
- no automatic merge or deployment.

After ten successful slices:

- allow the orchestrator to continue immediately to the next eligible task;
- optionally allow a second implementation worktree only for non-overlapping scopes;
- keep public UI, architecture, security, data, billing, permissions, and publishing changes approval-gated.

## Required repository inputs

- `AGENTS.md`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`
- `docs/E150/CODEX_AUTONOMOUS_OPERATING_MODEL.md`
- role prompts in `.codex/prompts/`
- handoff contract in `.codex/handoffs/slice-handoff.yaml`

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

Check the Codex usage page before enabling recurring runs. Stop starting new slices when the configured weekly reserve is reached. Never authorize automatic credit purchases from a repository instruction.
