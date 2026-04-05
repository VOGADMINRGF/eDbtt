# Codex Master Run — eDebatte Core Implementation

> Hinweis (2026-04-04): Historischer Batch-/Prompt-Kontext. Operative Steuerung erfolgt über `docs/E150/OpenTasks.md` (SSOT) und den Kurzeinstieg `docs/E150/CURRENT_STATE_2026-04-04.md`.

## CONTEXT

You are working inside a Next.js monorepo:

- apps/web (Next.js app)
- features/* (domain modules)
- core/* (shared libs)
- packages/* (shared workspace)

This system is NOT a social network.

It is a governance system with the following lifecycle:

Signal -> Anlassraum -> Dossier -> Runde -> Mandat -> Umsetzung -> Impact

## HARD RULES

- Signals are NOT money
- Signals are NOT votes
- Funding NEVER influences truth or facts
- Anlassraum is NOT Dossier
- nothing is auto-published
- Publish ONLY via review + approval
- Feeds are ONLY signal sources
- Anonymous tips are allowed but NEVER directly publishable

## OBJECTIVE

Implement the system in structured PR sequence.
You MUST:
1. implement
2. run typecheck
3. fix errors
4. continue

## PHASES

### Phase 1 — Governance Core
Create foundational models and state machines:
- Entity
- Anlassraum
- Signal
- FundingIntent
- FundingCampaign
- TipSubmission

### Phase 2 — Admin Manual First
Routes:
- /admin/entities
- /admin/anlassraeume
- /admin/feed-review
- /admin/tips
- /admin/publish
- /admin/pricing/[entityId]

### Phase 3 — Feed Review
Replace passive feed with review pipeline.

### Phase 4 — Signals
Implement relevance system, no coins, no decision power.

### Phase 5 — Funding
Implement mission / project / resource / hybrid funding.
Separate from signals.

### Phase 6 — Pricing
Implement hybrid pricing and discount engine.

### Phase 7 — Anlassraum <-> Dossier
Implement mapping and dossier types.

### Phase 8 — Factcheck Assist
Implement support pipeline, never auto-publish.

## OUTPUT REQUIREMENTS

For each phase:
1. changed files
2. what was implemented
3. introduced state machines
4. verification
5. no-rule-violation confirmation

## SUCCESS CRITERIA

A single entity can be:
- created
- given an anlassraum
- reviewed
- approved
- published

Then:
- signals can be collected
- funding intent can be collected
- optional funding can start

Manual-first. One working example > 11,000 broken ones.
