# Topic-Round Governance Layer (PR 04)

## Scope

PR 04 strengthens productive trust/operations for topic-round:

- review provenance trail
- source classes
- conflict modeling
- readiness progression signals
- export/handoff readiness blocks
- explicit bridge to mandate/implementation

Demo can showcase this layer but does not own any governance logic.

## Productive Routes

- `/topic/[slug]` (public governance signals included)
- `/topic/manage/[slug]/governance` (management/public split details)
- `/round/[slug]` (review status on contributions)

## Implemented Governance Structures

- Shared enum anchors (`features/common/types/TopicRound.ts`):
  - `TOPIC_SOURCE_CLASSES`
  - `TOPIC_CONFLICT_KINDS`
  - `TOPIC_REVIEW_LOG_STATUSES`
- Topic domain extensions (`features/topicRound/types.ts`):
  - `TopicConflictMarker`
  - `TopicReviewLogEntry`
  - `TopicReadinessCheck`
  - `TopicExportSnapshot`
  - `TopicMandateBridge`
- Repository helper:
  - `listTopicReviewLog(topicSlug, includeManagementOnly)`

## Public vs Management Split

Public (`/topic/[slug]`):

- source class visibility through claim/source chips
- conflict markers and unresolved states
- public reviewlog snippets with public reason
- readiness decision snapshots
- export/handoff + mandate bridge overview

Management (`/topic/manage/[slug]/governance`):

- full reviewlog (including management-only entries)
- internal reasons and operational rationale (role-gated)
- structured source class + conflict view
- readiness/export/handoff view for operators

## Trust and Traceability

- Contributions expose review status on round pages.
- Topic reviewlog tracks status transitions and reason fields.
- Provenance includes source round references and applied target IDs where relevant.

## Mandate Bridge Rule

- Topic/Round remain separate from mandate domain.
- Governance surfaces expose what is clarified enough for handoff, what owner is needed, and what must remain under monitoring.

## Demo Integration

- `/demo/runden` links to the same productive governance surfaces.
- No demo-only governance entities or states were introduced.
