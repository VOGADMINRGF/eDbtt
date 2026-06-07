# EDITORIAL-REVIEW-QUEUE-AUDIT-13B

Datum: 2026-06-06

## Geprüfte Routen

Geprüft und bei Bedarf gehärtet:

- `/admin/review`
- `/api/admin/editorial-review-requests/[requestId]`
- `/api/editorial/review-requests`
- `/api/start/editorial-review`
- `/api/contributions/save` für `manualReviewRequested`

## Zugriffsschutz

- Admin-Statuswechsel laufen weiterhin ausschließlich über `requireAdminOrResponse`.
- Normale Nutzer können eigene Review-Requests anlegen, aber keine Admin-Aktionen ausführen.
- Gäste bleiben auf `/api/start/editorial-review` und `/api/editorial/review-requests` auth-pflichtig.
- Test deckt den Nicht-Admin-Fall für Admin-Statuswechsel explizit ab.

## Statusmaschine

`features/editorialReviewQueue.ts` erzwingt jetzt erlaubte Statuswechsel:

- `pending_review` -> `mark_in_review`, `reject`, `archive`
- `in_review` -> `needs_user_clarification`, `accept_for_workup`, `reject`, `archive`
- `needs_user_clarification` -> zurück nach `mark_in_review`, sonst `reject` oder `archive`
- `accepted_for_workup` -> nur noch Notiz/Archiv
- `rejected` -> nur noch Notiz/Archiv
- `archived` -> nur Notiz

Zusätzlich:

- `needs_user_clarification` braucht Begründung
- `reject` braucht Begründung
- direkter Sprung `pending_review -> accepted_for_workup` ist blockiert

`accepted_for_workup` bleibt rein review-first und ist keine Veröffentlichung.

## Audit-Trail

Vorhanden und im Slice geschärft:

- `createdAt`
- `updatedAt`
- `latestAction`
- `latestActionAt`
- `latestActionByUserId`
- `history[]`
- `reviewerNote`
- `userVisibleNote`

`userVisibleNote` wird für Rückfragen und Ablehnungen separat gehalten, damit Account-UI keine interne Admin-Notiz fälschlich als Nutzerhinweis ausgibt.

## Dedupe / Spam

Geprüft:

- Dedupe bleibt auf `userId + normalizedText + sourceType` innerhalb des Zeitfensters
- Rate-Limit bleibt aktiv
- `/api/editorial/review-requests` blockt jetzt zusätzlich:
  - Linkspam
  - abusive/empty
  - zu kurze Eingaben
- dedupte Antworten geben eine nutzerfreundliche Rückmeldung zurück

`/api/start/editorial-review` behält die bestehende Relevance-Gate-Blockade für `spam_suspected` und nicht prüfbare Inputs.

## Truth-Guard-Erhalt

Review-Requests tragen weiterhin konservativ:

- `truthStatus`
- `sourceSupport`
- `sourceStatus`
- `reviewRecommended`
- `verificationLabel`
- `noTruthPromotion`
- `noAutoGraphPromotion`
- `noAutoPublish`
- `noAutoDossier`
- `noAutoAnlassraum`
- `noAutoVote`

Admin- und Account-Surfaces zeigen diese Semantik weiterhin als Review-/Arbeitsstand, nicht als veröffentlichte oder verifizierte Wahrheit.

## theme_suggestion / round_draft

Nachgeschärft:

- Admin erkennt `theme_suggestion` als Themenvorschlag
- Admin erkennt `round_draft` als Runden-Entwurf
- beide SourceTypes erhalten einen expliziten nächsten manuellen Schritt
- `/account` zeigt sie weiterhin review-first und ohne produktive Themen-/Runden-Erstellung

Es wurde bewusst keine neue automatische Themen- oder Anlassraum-Erstellung ergänzt.

## Tests und Ergebnis

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/editorial-review-requests.route.test.ts tests/admin-editorial-review.route.test.ts tests/admin-review.page.test.tsx tests/account-editorial-review.contract.test.tsx tests/start-editorial-review.route.test.ts tests/create-mode.save.route.test.ts`

Abgedeckt:

- normale Nutzer dürfen anlegen, aber keine Admin-Statuswechsel ausführen
- `pending_review -> in_review`
- `reject` ohne Begründung wird blockiert
- `accepted_for_workup` bleibt ohne Publish-/Graph-/Dossier-/Anlassraum-/Vote-Seiteffekt
- Dedupe für identischen Nutzer/Text/SourceType
- `theme_suggestion` und `round_draft` in Admin/Account
- Truth-Guard-Felder bleiben erhalten
- Account zeigt Review nicht als veröffentlicht
- Linkspam / abusive Inputs werden blockiert

Ergebnis:

- grün

## Offene Punkte

- Es gibt weiterhin noch keine Nutzerantwort-Route, die `needs_user_clarification` aktiv wieder in einen bestätigten Bearbeitungsfluss überführt; aktuell ist nur der manuelle Re-Review-Pfad abgesichert.
- Für spätere tiefere Redaktions-Workflows kann ein separates Readmodel sinnvoll werden; dieser Slice belässt die Historie bewusst am Request selbst.
