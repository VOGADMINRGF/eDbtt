# V3 Feed / Source / Intake / Review Handoff Audit

Datum: 2026-07-13
Task: `V3-FEED-SOURCE-INTAKE-REVIEW-HANDOFF-01`
Cluster: Feed / Source / Material / Intake / Review-Handoff

## Ergebnis

Die aktiven Produktionssurfaces fuer Source Connection, Snapshot, Material Intake, Review Item, Create-Handoff und Publish-Vorbereitung verwenden jetzt denselben review-first Presenter statt verteilter Freitext-Semantik.

## Geaenderte Surfaces

- `/admin/region`
- `/admin/feeds`
- `/admin/review`
- `/account/organization/dashboard`

## Zentrale Harmonisierung

- `apps/web/src/features/review/feedSourceIntakeSurfaceTruth.ts` definiert die kanonischen Phasen `Source Connection`, `Snapshot`, `Material Intake`, `Create-Handoff`, `Review Item` und `Publish-Vorbereitung`.
- `apps/web/src/features/review/FeedSourceIntakeSurfaceTruthCallout.tsx` rendert dieselbe review-first Wahrheit fuer die aktiven Surfaces.
- `/admin/review` nutzt fuer persistierte Create-Handoffs zusaetzlich die bestehende menschliche Review-State-Lesart statt roher Enum-Werte.

## Guardrails

- Kein Auto-Import
- Kein verdeckter Research- oder DeepSearch-Lauf
- Kein Auto-Publish
- Kein Social Posting
- Kein Scheduling
- Keine Fake-Runtime

## Validierung

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/feed-source-intake-surface-truth.test.ts tests/admin-feeds-runtime-dashboard.contract.test.tsx tests/admin-region-page.render.test.tsx tests/admin-review.page.test.tsx tests/account-organization-dashboard.page.test.tsx`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web run typecheck`
