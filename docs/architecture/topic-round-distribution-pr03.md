# Topic-Round Distribution Layer (PR 03)

## Scope

PR 03 adds productive distribution for topic/round:

- share panel
- QR entry context
- embed routes
- entry-aware framing
- public follow-up actions

## Productive Routes

- `/topic/[slug]`
- `/round/[slug]`
- `/embed/topic/[slug]`
- `/embed/round/[slug]`

## Implemented Distribution Behavior

- Share panel on productive topic/round pages:
  - copy public link
  - copy canonical topic link
  - QR rendering
  - copy embed snippet
  - copy follow-up link
  - share preview block
- Query context support:
  - `?entry=qr`
  - `?source=article|video|podcast|session|event|livestream`
  - `?persona=...`
- Entry-aware framing on topic/round/embed pages.
- Public follow-up block with canonical create-intent actions.

## Canonical Hub Rule

- Round remains contextual.
- Follow-up links from round and embed point to canonical topic hub.
- Topic remains durable home for latest rounds, roadmap and contribution entry.

## Metadata / Share Readiness

- Topic and round pages expose `generateMetadata` with canonical URLs and
  open graph fields.
- UI share preview is available in share panel.
- Embed routes are explicitly marked noindex for crawler safety.

## Demo Integration

- `/demo/runden` showcases QR/embed/share entry patterns by linking to the same
  productive routes.
- Demo layer does not own distribution logic.
