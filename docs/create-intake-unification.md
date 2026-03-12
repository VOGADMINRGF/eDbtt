# Create Intake Unification (PR2 Prep)

## Purpose

Prepare one shared intake entry (`/create`) for all creation intents, without
breaking current production flows (`/contributions/new`, `/statements/new`,
`/factcheck`).

This document defines the transition model and the routing abstraction used in
code.

## Current State

Today, create-like actions are split across multiple routes:

- `/contributions/new`
- `/statements/new`
- `/factcheck`
- multiple UI CTAs linking directly to those routes

Result: duplicated entry logic and hard-coupled links.

## Target Model

Use one intent-driven entry model:

- `claim`
- `source`
- `question`
- `perspective`
- `objection`
- `option`
- `factcheck`

Canonical target: `/create?intent=...`

Optional context parameters:

- `dossierId`
- `statementId`
- `next`

## Mapping (Legacy -> Unified)

- `claim` -> `/statements/new` (legacy), `/create?intent=claim` (target)
- `source` -> `/contributions/new` (legacy), `/create?intent=source` (target)
- `question` -> `/contributions/new` (legacy), `/create?intent=question` (target)
- `perspective` -> `/contributions/new` (legacy), `/create?intent=perspective` (target)
- `objection` -> `/contributions/new` (legacy), `/create?intent=objection` (target)
- `option` -> `/contributions/new` (legacy), `/create?intent=option` (target)
- `factcheck` -> `/factcheck` (legacy), `/create?intent=factcheck` (target)

## Routing Abstraction

Single resolver in code:

- `apps/web/src/features/create/intents.ts`
- `buildCreateHref({ intent, dossierId, statementId, next })`

Behavior:

- default mode: `legacy`
- unified mode: set `NEXT_PUBLIC_CREATE_ENTRY_MODE=unified`

This keeps current routes stable and allows incremental migration by replacing
hardcoded links with the resolver.

## Migration Plan

1. Replace direct UI hrefs with `buildCreateHref` (ongoing in PR2).
2. Enable unified mode in preview (`NEXT_PUBLIC_CREATE_ENTRY_MODE=unified`).
3. Implement `/create` server/page wrapper that resolves intent and reuses
   existing internals.
4. Migrate old pages to wrappers (or redirects) after production validation.

## Out of Scope (PR2)

- Removing legacy pages now.
- Full backend workflow merge in one step.
- Breaking URL changes.

