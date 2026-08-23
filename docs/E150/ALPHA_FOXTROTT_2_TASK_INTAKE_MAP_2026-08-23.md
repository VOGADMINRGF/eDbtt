# Alpha-Foxtrott 2.0 — Task Intake Map

Stand: 2026-08-23
Status: intake scaffold for `docs/E150/OpenTasks.md`

## Purpose

This document is a temporary mapping aid for Issue #632 and Draft-PR #631. It is not an operational task source of truth. `docs/E150/OpenTasks.md` remains canonical.

Before any ALPHA2 implementation starts, existing Alpha/autopilot/orchestrator tasks must be mapped here and either reused, superseded or explicitly kept separate.

## Candidate new tasks

| New ID | Intended role | Existing task mapping | Intake decision |
| --- | --- | --- | --- |
| `ALPHA2-RUN-CONTRACT-01` | Durable job/run schema | pending audit | pending |
| `ALPHA2-AGENT-REGISTRY-01` | machine-readable agent roles/capabilities | pending audit | pending |
| `ALPHA2-RISK-GATE-CONTRACT-01` | action risk and human/auto gates | pending audit | pending |
| `ALPHA2-OPENTASKS-ADAPTER-01` | machine-readable OpenTasks eligibility | pending audit | pending |
| `ALPHA2-GITHUB-STATE-ADAPTER-01` | PR/branch/CI/review evidence | pending audit | pending |
| `ALPHA2-PERSISTENT-RUN-LEDGER-01` | durable run persistence | pending audit | pending |
| `ALPHA2-ORCHESTRATOR-LOOP-01` | continuous bounded dispatch | pending audit | pending |
| `ALPHA2-DIRECT-ENGINEERING-WORKER-01` | direct provider-agnostic code worker | pending audit | pending |
| `ALPHA2-CODEX-VS-DIRECT-EVAL-01` | empirical Codex replacement decision | pending audit | pending |
| `ALPHA2-MEMORY-LAYERS-01` | canonical/episodic/semantic/performance memory | pending audit | pending |
| `ALPHA2-EVAL-HARNESS-01` | repeatable agent/model evaluations | pending audit | pending |
| `ALPHA2-SUPPORT-TRIAGE-01` | IT/customer support classification | pending audit | pending |
| `ALPHA2-INCIDENT-LOOP-01` | SRE/incident automation | pending audit | pending |
| `ALPHA2-CONTENT-PIPELINE-01` | marketing/social agent pipeline | pending audit | pending |
| `ALPHA2-SOCIAL-CONNECTORS-01` | approved scheduling/distribution | pending audit | pending |
| `ALPHA2-MEMBERSHIP-LIFECYCLE-01` | VOG member funnel and activation | pending audit | pending |
| `ALPHA2-COMMUNITY-LEARNING-01` | feedback/community learning loop | pending audit | pending |
| `ALPHA2-FUNDING-PIPELINE-01` | grants/partners opportunity pipeline | pending audit | pending |
| `ALPHA2-PARTNER-CRM-01` | controlled partner/member follow-up | pending audit | pending |
| `ALPHA2-GLOBAL-GOVERNANCE-SCANNER-01` | Vote4Gov global structure research | pending audit | pending |
| `ALPHA2-SYSTEM-CHALLENGER-01` | adversarial structural alternatives | pending audit | pending |
| `ALPHA2-MISSION-CONTROL-01` | unified operations UI | pending audit | pending |

## Audit queries

Audit at least the following terms in `docs/E150/OpenTasks.md`, active PRs and current branches:

- `Alpha-Foxtrott`
- `alpha foxtrott`
- `autopilot`
- `orchestrator`
- `continuous`
- `runner`
- `agent`
- `OpenTasks adapter`
- `run ledger`
- `mission control`
- `support triage`
- `marketing`
- `membership`
- `funding`
- `Voxy publish`

For each relevant existing task record:

1. capture existing task ID and state;
2. record existing owner branch/PR if any;
3. compare acceptance criteria against the ALPHA2 candidate;
4. prefer reuse/extension over duplicate task creation;
5. mark supersession only when the new foundation architecture genuinely changes the contract;
6. preserve completed evidence instead of reopening solved work.

## Completion rule

This map is complete only when every proposed ALPHA2 task has one of:

- `reuse <existing-id>`;
- `extend <existing-id>`;
- `new`;
- `drop`.

Only `new` and explicitly `extend` entries should result in OpenTasks edits.
