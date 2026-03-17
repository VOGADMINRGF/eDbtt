# Feed -> Anlassraum -> Output Model

## Core Rule

- `/create` is the canonical creation gate.
- `/runden` is the canonical lobby/navigation surface.
- Feed ingest is infrastructure, not the product surface.

## Product Pipeline

1. `feed_source` / external source
2. `ingest_item` (raw hit)
3. `anlassraum` (semantic container)
4. `anlassraum_structure` (claims, questions, conflict lines)
5. `output_seed` (round, dossier, embed, social, briefing, pitch)
6. editorial review + publish

## New Core Entities

- `anlassraum`:
  - `kind`, `title`, `slug`, `regionCode`, `scope`, `topicKey`, `clusterKey`
  - `sourceMode` (`manual|feed|single_source|cluster|ai_assist`)
  - `status` (`auto_ingested|auto_clustered|needs_editor_review|ready_for_round|published|archived`)
  - `relevanceScore`, `reviewMode`, `riskFlags`
- `anlassraum_source_link`:
  - links source/candidate refs to an `anlassraum`
  - role (`primary|supporting|counter|context`) + weight
- `anlassraum_structure`:
  - structured semantic payload (`claims`, `questions`, `notes`, `knots`, `segments`, `actors`)
- `output_seed`:
  - `outputType` (`round_seed|dossier_seed|embed_seed|social_seed|regional_briefing_seed|editorial_pitch_seed`)
  - status/review state and audience targeting

## Current Implementation Scope (this PR)

- Added domain types and Mongo collections for:
  - `anlassraum`
  - `anlassraum_source_links`
  - `anlassraum_structure`
  - `output_seed`
- Feed draft creation now auto-syncs:
  - draft -> `anlassraum`
  - draft/candidate -> `anlassraum_source_link`
  - analyze result -> `anlassraum_structure`
  - default output candidates -> `output_seed`
- Admin surfaces:
  - `/admin/feeds/anlassraum` (list)
  - `/admin/feeds/anlassraum/[id]` (detail)

## Phased Rollout

1. Phase 1:
   - semantic model + DB collections
   - feed-draft attachment
2. Phase 2:
   - `/create` modes extended (`manual|source|feed|cluster|ai_assist`)
   - existing analyze flow reused
3. Phase 3:
   - explicit clustering jobs (time window, region, topic, publisher spread)
4. Phase 4:
   - output-specific UX and reviewer workflows
