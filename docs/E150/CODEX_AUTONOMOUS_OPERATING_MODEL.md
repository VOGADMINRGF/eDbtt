# Codex Autonomous Operating Model

## Purpose

This document defines the controlled autonomous engineering model for eDebatte.
It extends, but does not replace, the canonical task queue in `docs/E150/OpenTasks.md`
and the repository rules in `AGENTS.md`.

The goal is continuous Slice execution, maintenance, testing, and backlog hygiene without
requiring a new manual prompt after every implementation slice.

## Canonical control hierarchy

1. `docs/E150/OpenTasks.md` is the implementation SSOT.
2. `AGENTS.md` defines repository-wide agent rules.
3. This document defines autonomy, escalation, budget, and continuous-operation rules.
4. Code, tests, CI, and repository state override stale narrative documentation.

No agent may invent an executable task outside `OpenTasks.md`.
Discovered work must first be recorded as a new task with an explicit status.

## Operating lanes

### 1. Slice Orchestrator

The Slice Orchestrator may:

- read `OpenTasks.md`, current `main`, open pull requests, and CI status;
- select the highest-priority executable `codex_ready` task whose dependencies are satisfied;
- reserve one coherent PR-sized slice;
- delegate implementation, review, and repair work;
- update task status and evidence after successful completion;
- continue with the next eligible slice after all gates pass.

The Slice Orchestrator must not:

- start a task with `needs_decision`, `blocked`, `research_only`, or `done` status;
- silently change product canon, routes, governance, pricing, role semantics, or visibility rules;
- merge public, architectural, security-sensitive, or data-migration changes without the required approval class;
- run more than two overlapping implementation slices against the same files or contracts.

### 2. Feature Lane

The Feature Lane implements one coherent slice at a time.
It must:

- work on a focused branch;
- keep code, tests, and documentation aligned;
- reuse existing architecture before creating parallel paths;
- add or update tests where an established pattern exists;
- leave a structured completion report.

### 3. Maintenance Lane

The Maintenance Lane may run independently of feature work and covers:

- CI failures and flaky-test triage;
- dependency, type, lint, build, route, and contract drift;
- dead code and duplicate-path detection;
- public debug-leak and secret scanning;
- documentation drift;
- low-risk test hardening.

Maintenance work still requires an `OpenTasks.md` task unless it is a direct repair of the
currently active slice or a failing required gate on its branch.

### 4. Product Integrity Lane

The Product Integrity Lane checks changes against established eDebatte principles, including:

- user input precedes participation-format recommendation;
- no implicit auto-publish;
- review-first for externally visible output;
- Voxy as guide and moderator rather than decorative-only UI;
- multilingual and cross-lingual behavior is not English-first;
- dossier, Anlassraum, claims, feed, poll, video, and distribution handoffs remain connected;
- public copy does not expose internal technical language.

This lane may block merge readiness but may not redefine product principles by itself.

## Autonomy classes

Every actionable task should carry or imply one autonomy class.

### Green — autonomous implementation and merge eligible

Suitable for:

- tests and test hardening;
- contract completion without semantic change;
- internal admin wiring;
- documentation synchronization;
- small refactors with proven behavioral parity;
- low-risk maintenance.

Green tasks may be auto-merged only when all required gates are green and branch protection
allows it.

### Yellow — autonomous to merge-ready

Suitable for:

- public UI changes;
- new internal data models;
- user-flow changes within an already decided canon;
- new provider abstractions;
- new persistence or queue behavior.

Yellow tasks may be fully implemented and repaired autonomously but require explicit merge approval.

### Orange — decision package only

Suitable for:

- architecture changes;
- new paid external services;
- authentication, role, entitlement, or paywall changes;
- material data migrations;
- changes that conflict with existing V3 direction.

Agents may research, inspect, and prepare options, but must stop before implementation that commits
the product to a direction.

### Red — manual operation required

Always manual:

- production secrets and privileged credentials;
- destructive migrations or bulk deletion;
- privacy-sensitive production data handling;
- automatic public publishing;
- payments, contracts, or external legal commitments;
- bypassing required branch protection or security gates.

## Required execution loop

1. Synchronize `main`, open pull requests, and CI state.
2. Validate `OpenTasks.md` against actual repository state.
3. Select one highest-priority eligible `codex_ready` task.
4. Mark or record the task as `in_progress` before implementation.
5. Implement only the declared scope.
6. Run relevant tests, type checks, lint, and build gates.
7. Run independent code, regression, security, and product-integrity review.
8. Repair actionable findings autonomously, within the retry and budget limits.
9. Update docs, task status, evidence, and remaining risks.
10. Apply the autonomy-class merge rule.
11. Continue to the next eligible task only after the current slice is closed or explicitly blocked.

## Retry and stop rules

An agent may attempt at most:

- two autonomous repair rounds for the same failing gate;
- one rebase/conflict-repair round when no product semantics are affected;
- one scope reduction when the original slice is too large but can be safely split.

After that, it must produce an escalation package and stop the affected lane.
Unrelated lanes may continue if they do not depend on the blocked work.

## Mandatory escalation conditions

Escalate when:

- acceptance criteria conflict;
- the repository and `OpenTasks.md` materially disagree;
- an architecture or product decision is missing;
- a new paid service or material recurring cost would be introduced;
- a migration could lose or expose data;
- public product behavior changes beyond a documented decision;
- two repair attempts fail;
- CI remains red for an unexplained reason;
- implementation would violate a product principle;
- task scope expands beyond a coherent PR-sized slice;
- the configured usage or cost budget is reached.

## Escalation format

```markdown
## Decision required

### Problem
...

### Evidence
...

### Option A
Impact, effort, risk

### Option B
Impact, effort, risk

### Agent recommendation
...

### Affected tasks and files
...
```

Do not ask an unstructured "What should I do?" question.

## Budget and usage guardrails

Autonomy is bounded by a configurable budget. The operating default is:

- maximum two concurrent implementation agents;
- maximum one maintenance agent in parallel;
- no repeated full-repository analysis when a scoped test or search is sufficient;
- use the least expensive adequate model for deterministic maintenance and documentation work;
- reserve higher-reasoning models for architecture, difficult debugging, and cross-cutting review;
- stop starting new slices when less than 20 percent of the configured weekly agentic allowance remains;
- allow the current active turn to complete, then emit a budget escalation;
- never purchase additional credits automatically.

Actual plan limits and credit prices are external configuration and must not be hard-coded in the repo.

## Data protection and security rules

For continuous operation:

- never place secrets, tokens, private keys, production credentials, or raw user data in prompts, logs,
  screenshots, fixtures, issues, or pull requests;
- use synthetic or anonymized fixtures for tests;
- default cloud tasks to repository code and non-production configuration only;
- require explicit approval before enabling broad browser, computer-use, or production-system access;
- apply least-privilege GitHub permissions;
- require protected branches and required CI checks;
- retain an auditable PR, commit, CI, and task-status trail;
- disable model-training use in personal workspace data controls when personal plans are used;
- prefer a managed Business or Enterprise workspace for sustained organizational operation;
- complete a controller/processor assessment, data-processing agreement review, and records-of-processing
  update before processing personal or special-category data.

This document is an engineering policy, not a legal determination of GDPR compliance.

## Initial rollout

### Phase 1 — supervised autonomy

- one Slice Orchestrator;
- one Feature Lane;
- one Maintenance/Product Integrity review pass;
- Green tasks may become merge-ready but are not auto-merged;
- Yellow, Orange, and Red remain approval-gated;
- run for at least ten completed slices and measure rework, CI failures, and false escalations.

### Phase 2 — restricted auto-merge

Only after Phase 1 evidence is acceptable:

- auto-merge Green tasks with full required gates;
- permit two non-overlapping feature slices;
- keep all public UI, architecture, data, privacy, and publishing work approval-gated.

### Phase 3 — continuous operation

Only after budget and quality thresholds are stable:

- scheduled maintenance and backlog-hygiene runs;
- continuous selection of eligible Green and Yellow tasks;
- automatic pause on budget, security, dependency, or decision thresholds;
- periodic human review of agent rules and product canon.

## Success metrics

Track at minimum:

- slices completed without manual re-prompting;
- first-pass CI success rate;
- autonomous repair success rate;
- escaped regression rate;
- reopened or reverted PR rate;
- number and quality of escalations;
- agentic usage per completed slice;
- human review time per slice;
- documentation/task drift incidents.

Autonomy is considered successful only when it reduces manual coordination without increasing
regressions, security exposure, product drift, or total cost unpredictability.
