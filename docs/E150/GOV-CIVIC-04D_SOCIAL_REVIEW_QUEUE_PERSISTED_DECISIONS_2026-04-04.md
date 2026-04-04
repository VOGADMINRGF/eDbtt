# GOV-CIVIC-04D - Persistente Review-Entscheidungen in der Social-Queue (2026-04-04)

## Scope

Serverseitige Persistenz der Review-Entscheidungen für `/atlas/social-review`, ohne Posting-Engine und ohne Autoposting.

## Umgesetzt

1. Persistenz-Store
- `features/anlassraum/socialReviewDecisionStore.ts`
- Neue Collection `anlassraum_social_review_decisions` mit Unique-Index auf `entryId`.
- Persistierte Status:
  - `approved_for_social`
  - `held_back`
  - `deferred`
  - `internal_only`
  - `marked_for_rework`
- Optionale Notiz (`note`) plus `updatedAt` und `updatedByUserId`.

2. Write-Route (Admin-only)
- `apps/web/src/app/api/admin/atlas/social-review-decisions/route.ts`
- `POST` validiert `entryId`, `decision`, optionale `note` und speichert per Upsert.
- Keine Plattform-Integration, kein Versand, kein Autoposting.

3. Readmodel-Rehydrate
- `features/anlassraum/socialReviewQueueReadModel.ts`
- Queue-Items werden bei Load mit persistierten Entscheidungen angereichert:
  - `persistedDecision`
  - `persistedDecisionNote`
  - `persistedDecisionUpdatedAt`
- Bei Store-Ausfall degradiert die Queue auf den bisherigen Pending-Stand.

4. UI-Anbindung
- `apps/web/src/app/atlas/social-review/SocialReviewQueueClient.tsx`
- Review-Buttons persistieren serverseitig statt nur lokal.
- Nach Reload bleibt der Status reproduzierbar.
- Fehlerzustände bleiben ruhig (kein UI-Rewrite).

## Guardrails

- Kein Autoposting.
- Keine Posting-Engine.
- Keine Wahrheits-/Prioritäts-/Reputationsaufwertung.
- Queue bleibt Review-/Freigabekontext.
- Factcheck-/Context-Hints bleiben sichtbar.

## Tests

- `apps/web/tests/social-review-queue-readmodel.test.ts`
  - Rehydrate der persistierten Entscheidung geprüft.
