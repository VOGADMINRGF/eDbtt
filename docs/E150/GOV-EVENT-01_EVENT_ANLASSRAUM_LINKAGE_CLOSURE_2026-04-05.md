# GOV-EVENT-01 - Event/Anlassraum Linkage Closure (2026-04-05)

## Scope

Small closure slice for `GOV-EVENT-01`:
- no new event product surface
- no new governance/publish logic
- no calendar architecture rewrite
- only contract hardening for event->anlassraum linking

## Real Rest Drift (before closure)

1. Existing-link validation gap  
`POST /api/events` accepted syntactically valid `anlassraumId` values even when the room did not exist.

2. Ambiguous payload gap  
`POST /api/events` accepted both:
- `anlassraumId` (attach to existing room)
- `createAnlassraum=true` (create new room)

This created an avoidable ambiguous path in the same request.

## Implemented Hardening

File:
- `apps/web/src/app/api/events/route.ts`

Changes:
1. Existing room validation for explicit `anlassraumId`
- invalid ObjectId -> `400 invalid_anlassraum_id` (unchanged baseline)
- valid but missing room -> `404 anlassraum_not_found` (new explicit guard)

2. Conflict guard for mixed attach/create payloads
- `createAnlassraum=true` + explicit existing `anlassraumId` -> `409 anlassraum_link_conflict`

3. No-auto-publish baseline kept
- Event insert remains manual-first (`protocolStatus: planned`)
- no auto-publish/auto-approval path introduced

## Tests

New:
- `apps/web/tests/events.route.test.ts`
  - invalid `anlassraumId` rejected
  - missing referenced room rejected (`anlassraum_not_found`)
  - mixed attach/create payload rejected (`anlassraum_link_conflict`)
  - explicit existing room link persisted correctly
  - create+link flow stays manual-first (`protocolStatus: planned`)

Regression reference:
- `apps/web/tests/gov-event-02.routes.test.ts`

## Result

`GOV-EVENT-01` can be closed as done:
- event linkage is stable for explicit references and create-paths
- invalid/ambiguous contexts are explicit
- no auto-publish drift introduced
