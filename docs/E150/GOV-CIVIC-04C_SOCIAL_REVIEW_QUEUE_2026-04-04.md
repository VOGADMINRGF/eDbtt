# GOV-CIVIC-04C - Erste Social-Review-Queue (2026-04-04)

## Scope

Erste reviewbare Freigabe-/Qualifizierungsflaeche fuer Social-Kandidaten auf bestehender Share-ready Basis.

Kein Auto-Posting, keine Social-API-Integration, keine Posting-Engine.

## Umgesetzt

1. Queue-Readmodel
- `features/anlassraum/socialReviewQueueReadModel.ts`
- Liefert:
  - Kandidaten aus bestehendem `/runden` Share-Kontext
  - Status-Logik: `candidate`, `review_required`, `qualified_context`
  - Factcheck-Hinweisstatus (`factcheck_optional` / `factcheck_suggested`)
  - Guardrails und Summaries

2. Social-Review Surface
- `apps/web/src/app/atlas/social-review/page.tsx`
- `apps/web/src/app/atlas/social-review/SocialReviewQueueClient.tsx`
- Read-only Review-Queue mit:
  - canonical target / qr target / share summary
  - Kontext-/Factcheck-/Existing-Context-Hinweisen
  - lokalen Review-Entscheidungen:
    - freigeben
    - zurückstellen
    - später
    - intern lassen
    - überarbeiten markieren

3. Share-Kontext-Anreicherung
- `features/topicRound/entrySource.ts`
- `shareActions` um optionale Felder erweitert:
  - `socialQualification`
  - `factcheckSuggested`
  - `existingContextHint`

4. Navigation
- Atlas- und Weekly-Surface verlinken zur Queue:
  - `apps/web/src/app/atlas/AtlasClient.tsx`
  - `apps/web/src/app/atlas/weekly/WeeklySnapshotSurface.tsx`

## Guardrails

- Auto-Posting bleibt aus.
- Social-Candidate erzeugt kein Wahrheits-/Prioritaetsprivileg.
- Queue ist Review-Instrument, kein Publish-Automat.
- Factcheck-/Andockhinweise sind sichtbar und non-blocking.

## Tests

- `apps/web/tests/social-review-queue-readmodel.test.ts`
