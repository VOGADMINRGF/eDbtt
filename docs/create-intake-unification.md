# Create Intake Unification (PR2 Prep)

## Purpose

Prepare one shared intake entry (`/create`) for all creation intents, without
breaking current production flows (`/contributions/new`, `/statements/new`).

This document defines the transition model and the routing abstraction used in
code.

## Current State

Today, create-like actions are split across multiple routes:

- `/contributions/new`
- `/statements/new`
- `/factcheck`
- multiple UI CTAs linking directly to those routes

Result: duplicated entry logic and hard-coupled links.

## Architecture Rule (Binding)

- `/create` is the canonical product entry for all create intents.
- `/demo/create` is a demo wrapper only (persona-sensitive showcase) and must
  reuse the same intent definitions and routing semantics.
- No parallel create architecture is allowed.

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

- Resolver always returns canonical `/create?...` URLs.
- Legacy routes remain compatibility wrappers and redirect to `/create`.
- Demo routes (including `/demo/create`) stay wrapper/showcase routes only.

## Migration Plan

1. Replace direct UI hrefs with `buildCreateHref` (ongoing in PR2).
2. Keep `/contributions/new` and `/statements/new` as compatibility wrappers
   redirecting to `/create` with intent query.
3. Keep `/demo/create` as wrapper around the same intent catalog used by
   `/create`.
4. Migrate remaining legacy redirects after production validation.

## Out of Scope (PR2)

- Removing legacy pages now.
- Full backend workflow merge in one step.
- Breaking URL changes.
