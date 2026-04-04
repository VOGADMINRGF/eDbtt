# GOV-CIVIC-04E - Social-Review-Queue Polish (Notes, Filter, leichte Audit-Tiefe) (2026-04-04)

## Scope

Operative Reifung der bestehenden Social-Review-Queue:
- Notiz-/Begründungsnutzung im UI
- leichte Historien-/Audit-Sicht
- bessere Status-/Filter-Lesbarkeit

Ohne Posting-Engine, ohne Plattform-Integration, ohne Autoposting.

## Umgesetzt

1. Store-Erweiterung mit leichter Historie
- `features/anlassraum/socialReviewDecisionStore.ts`
- Neue Event-Collection: `anlassraum_social_review_decision_events`
- Bei geänderter Entscheidung/Notiz wird ein Event geschrieben.
- Read-Helfer für Verlauf je `entryId` (`listSocialReviewDecisionEventsByEntryIds`).

2. Readmodel-Härtung
- `features/anlassraum/socialReviewQueueReadModel.ts`
- Queue-Items enthalten jetzt zusätzlich:
  - `decisionHistory` (letzte Entscheidungen)
- Persistierte Entscheidung + Verlauf werden beim Laden zusammengeführt.

3. Route-Response mit Verlauf
- `apps/web/src/app/api/admin/atlas/social-review-decisions/route.ts`
- `POST` liefert neben aktuellem Persistenzstand auch eine kleine Verlaufsliste zurück.

4. UI-Polish für operative Nutzung
- `apps/web/src/app/atlas/social-review/SocialReviewQueueClient.tsx`
- Neue UX-Verbesserungen:
  - Statusfilter (inkl. pending/approved/held/deferred/internal/rework)
  - Quick-Filter für Factcheck-Hinweise und Context-Hinweise
  - Notizfeld je Queue-Item inkl. persistierendem Save
  - Sichtbarer Persistenzzeitpunkt
  - Kleine Liste „Letzte Entscheidungen“
  - Ruhige Success-/Error-Rückmeldung

## Guardrails

- Kein Autoposting.
- Keine Plattformanbindung.
- Keine Wahrheits-/Prioritäts-/Reputationsaufwertung.
- Queue bleibt Review-/Freigabekontext.
- Factcheck-/Context-Hints bleiben Hinweise (non-blocking).

## Tests

- `apps/web/tests/social-review-queue-readmodel.test.ts`
  - Rehydrate-Test um Verlauf (`decisionHistory`) erweitert.
