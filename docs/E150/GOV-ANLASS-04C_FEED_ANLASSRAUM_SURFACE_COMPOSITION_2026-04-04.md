# GOV-ANLASS-04C - Feed -> Anlassraum Readmodel / Surface Composition (2026-04-04)

## Scope

Small, contract-near hardening slice on top of `GOV-ANLASS-04`:
- Feed stays signal source.
- Anlassraum stays open work/context space.
- Attach-first/no-auto-publish canon remains unchanged.

No UI rewrite, no new governance decision, no pricing/funding scope.

## Implemented

1. Shared readmodel composition contract
- `features/feeds/anlassraumSurfaceComposition.ts`
- New grouped composition output:
  - `anlass` (core context)
  - `anlassgeber` (trigger/input context)
  - `beteiligteKontexte` (association/initiative/org/editorial/expert/civic visibility)
  - `anschlussflaechen` (anlass/round/dossier/companion/results targets)
  - `andockhinweise` (attach/create/manual path hints, optional factcheck/context hints)
  - `guardrails` (no truth/priority/voting privilege, no auto publish)

2. Feed drafts route integration (product-near)
- `apps/web/src/app/api/admin/feeds/drafts/route.ts`
- Response `items[]` now carry `surfaceComposition`.
- Composition is derived from draft + anlassraum + latest round seed target (when available).

3. Share-ready/target bridge
- Composition consumes `resolveShareReadyAssetContract` for canonical/QR/context targets.
- Keeps create/runden/dossier/companion/result separation explicit.

## Guardrails kept explicit

- feed is signal source only.
- no auto publish.
- context visibility is not truth privilege.
- context visibility is not priority privilege.
- context visibility is not voting weight.
- topic and region remain separated.
- companion stays format context; dossier stays upper context.

## Tests

- `apps/web/tests/feed-anlassraum-surface-composition.test.ts`
- `apps/web/tests/feed-drafts.route.test.ts` (extended route-level contract assertion)

## Out of scope

- no broad admin surface redesign.
- no auto-merge requirement from docking hints.
- no mandatory factcheck gate for every draft.
