# Topic-Round Guardrails (PR 00)

## Purpose

This document defines the binding architecture guardrails for the productive
topic-round-companion model before feature implementation (PR 01-PR 04).

Scope of this document:

- canonical domain definitions
- productive-vs-demo boundaries
- route guidance
- reuse and extension rules
- AI boundaries
- public-vs-management split
- phase integration notes

## Non-Goals (PR 00)

- no full feature implementation yet
- no AI merge pipeline implementation yet
- no QR/embed/share implementation yet
- no broad schema rewrites without explicit need

## Binding Architecture Rules

1. Productive first, demo second.
2. Reuse before duplication.
3. No parallel demo domain for topic/round logic.
4. Manual-first baseline must work end-to-end without AI.
5. AI is assistive only and never silently publishes.
6. Public vs management concerns stay clearly separated.
7. Medium-agnostic modeling is mandatory.
8. No dead ends: each round links back to its canonical topic.

## Canonical Domain Definitions

### Topic (durable canonical object)

A Topic is the long-lived productive issue container. It accumulates progress
across multiple rounds and media.

A Topic can include:

- framing question
- claims
- sources
- objections
- open questions
- options
- roadmap / next-step items
- linked rounds
- mandate/implementation context links

A Topic is not a single event, article, stream, video, or podcast episode.

### Round (contextual productive object)

A Round is a medium-/occasion-specific discussion instance attached to exactly
one canonical Topic.

Supported round contexts include:

- article
- event
- livestream
- video
- podcast
- session
- open public round

A Round is never the durable home of the issue. It feeds into the Topic.

### Dossier

Dossier remains the structured knowledge/evidence surface.

Guardrail:

- topic-round work must inspect dossier concepts first
- extend dossier-aligned structures when they match
- only add new primitives where dossier extension is not sufficient

### Create

Create remains the canonical structured contribution entry where possible.

Guardrail:

- topic/round contribution entry should reuse create intents and routing
- no detached round-only submission architecture

### Mandate / Implementation

Mandate remains downstream and adjacent:

- responsibility
- execution
- impact
- monitoring

Guardrail:

- do not collapse mandate into round semantics
- topic/round should provide a clean bridge into mandate

### Demo

Demo is a guided wrapper over productive logic.

Guardrail:

- demo may reframe and guide
- demo must not own exclusive topic-round domain logic

## Route Guidance (Target)

Canonical productive routes:

- `/topic/[slug]` (durable issue hub)
- `/round/[slug]` (contextual round detail)

Guided demo routes:

- `/demo/...` only as wrapper/presentation over productive routes
- suggested guided entry for later phases: `/demo/runden`

## Shared Type Anchors (PR 00)

To avoid terminology drift before full feature delivery, shared placeholders are
defined in:

- `features/common/types/TopicRound.ts`

These placeholders include round types, contribution types, readiness/synthesis
statuses, roadmap categories, and canonical route patterns.

## Attachment Model

- A round must reference one canonical topic.
- A topic can aggregate many rounds over time.
- Every round page must have visible navigation back to its topic.
- Topic timelines should expose round history and open follow-ups.

## Reuse Matrix: Extend vs Wrap

Prefer extension when:

- dossier already models the needed evidence/claim/question shape
- create already models the needed contribution intent
- existing review/moderation patterns can be reused

Prefer new primitives only when:

- domain meaning is genuinely missing
- extension would overload existing concepts beyond readability
- data lifecycle differs materially and cannot be represented cleanly

If a new primitive is introduced, document why extension was insufficient.

## Public vs Management Split

Public UI includes:

- readable topic state
- round context and contributions
- roadmap visibility
- structured participation entry points

Management UI includes:

- moderation and merge decisions
- review states
- internal rationale/log details
- AI suggestion review actions

## AI Boundary (Normative)

AI may:

- suggest
- cluster
- summarize
- propose next steps

AI may not:

- silently publish
- silently mutate productive topic state
- replace human moderation/review decisions

## Medium-Agnostic Constraint

All topic-round structures must support article, video, livestream, podcast,
event, session, and open rounds without event-only assumptions in naming or
data shape.

## Explicit Answers To Required Questions

1. Canonical durable object:
   topic.
2. What is a round and what is not:
   a contextual topic-attached discussion instance, not the durable issue home.
3. How rounds attach to topics:
   each round references one canonical topic; topics aggregate many rounds.
4. Dossier extend vs wrap:
   extend dossier first; add new primitives only with explicit rationale.
5. How create stays canonical:
   reuse create intents/routing for contributions where feasible.
6. Public vs management:
   public for reading/participation, management for moderation/review/actions.
7. AI can/cannot:
   AI suggests only; humans review before any productive change.
8. Demo relation:
   demo guides productive flows; it does not own domain logic.
9. Medium support:
   round model is medium-agnostic by design and route semantics.
10. Mandate connection:
    topic outcomes can bridge to mandate/implementation without merging domains.

## Future Phase Integration Notes

### PR 01 - Topic + Round + Roadmap

- implement productive `/topic/[slug]` and `/round/[slug]`
- add manual roadmap and structured round contributions
- keep demo as wrapper only

### PR 02 - AI Merge Assist

- add optional round-to-topic merge suggestion workflow
- typed suggestions + review workspace
- no auto-publish

### PR 03 - Distribution Layer

- add productive share/QR/embed/follow-up capabilities
- enforce topic as canonical hub from external entries

### PR 04 - Governance / Export / Readiness

- add review/provenance trail, source classes, conflict modeling
- add readiness progression and export/handoff structures
- strengthen bridge to mandate/implementation
