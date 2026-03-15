# Topic-Round Roadmap Foundation (PR 01)

## Scope

PR 01 delivers the productive manual-first foundation for topic, round,
roadmap, and structured round contributions.

## Implemented Routes

- Productive topic route: `/topic/[slug]`
- Productive round route: `/round/[slug]`
- Guided demo wrapper: `/demo/runden`

## Productive Domain Baseline

Implemented structures:

- `Topic`
- `Round`
- `RoundContribution`
- `TopicRoadmapItem`

Source files:

- `features/topicRound/types.ts`
- `features/topicRound/data.ts`
- `features/topicRound/repository.ts`

## Manual-First Behavior

- Topic and round pages work without AI.
- Roadmap is manually editable via the seed model in `features/topicRound/data.ts`.
- Structured participation uses canonical create entry (`/create`) via
  `buildCreateHref`.

## Reuse Decisions

- Reused create intent routing (`buildCreateHref`) for participation CTAs.
- Kept topic-round logic productive and canonical.
- Demo route (`/demo/runden`) only guides to productive topic/round pages and
  does not own domain state.

## Covered PR 01 Goals

- Topic page shows framing, current state, options, claims/sources, open
  questions, linked rounds, roadmap, contribution entry.
- Round page shows type, linked topic, medium metadata, summary,
  contributions, open points, and explicit CTA back to topic.
- Multiple round media types are represented:
  article, event, livestream, video, podcast, session, open_round.

## Deferred To Next PRs

- PR 02: AI-assisted merge review (round -> topic)
- PR 03: QR/embed/share/distribution layer
- PR 04: Governance, review log, source classes, export readiness
