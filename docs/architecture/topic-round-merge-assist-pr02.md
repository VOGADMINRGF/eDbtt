# Topic-Round Merge Assist (PR 02)

## Scope

PR 02 adds optional assistive merge review for round-to-topic synthesis.

## Productive Route

- Management workspace: `/round/manage/[slug]/merge`

## Demo Visibility

- Demo wrapper surfaces the same productive workflow via `/demo/runden` links.
- Demo does not own merge state or apply logic.

## Added Structures

- `RoundAssistRun`
- `RoundAssistSuggestion`
- `TopicMergeReviewState`

Source files:

- `features/topicRound/assistTypes.ts`
- `features/topicRound/assistSchemas.ts`
- `features/topicRound/assistService.ts`

## Safety Boundaries

- Assist output is schema-validated before becoming review suggestions.
- Suggestions are always marked pending until explicit review actions.
- Review decisions are explicit: accept, reject, defer, edit_accept,
  link_existing, mark_duplicate.
- No auto-publish and no silent productive topic mutation.

## API Endpoints

- `GET/POST /api/rounds/[slug]/assist-runs`
- `PATCH /api/rounds/[slug]/assist-runs/[runId]/suggestions/[suggestionId]`

## Manual-First Guarantee

- Topic/round participation remains fully usable without any assist run.
- If assist generation fails schema validation, run status becomes `failed`
  and no suggestion is applied.
