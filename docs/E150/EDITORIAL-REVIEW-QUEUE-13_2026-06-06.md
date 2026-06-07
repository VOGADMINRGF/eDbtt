# EDITORIAL-REVIEW-QUEUE-13

Datum: 2026-06-06

## Review-Modell

`features/editorialReviewQueue.ts` fuehrt ein zentrales `EditorialReviewRequest`-Modell ein fuer:

- `start_draft`
- `create_analysis`
- `factcheck_request`
- `theme_suggestion`
- `round_draft`
- `user_relevance_appeal`

Gespeichert werden unter anderem:

- `truthStatus`
- `sourceSupport`
- `sourceStatus`
- `reviewRecommended`
- `verificationLabel`
- `reason`
- `status`
- `userNote`
- `statusNote`
- `noTruthPromotion`
- `noAutoPublish`
- `noAutoGraphPromotion`
- `noAutoDossier`
- `noAutoAnlassraum`
- `noAutoVote`

Der Request bleibt explizit ein Arbeitsstand und keine Veröffentlichung, keine verifizierte Wahrheit und kein Graph-Merge.

## Angebundene Nutzer-CTAs

Angebunden wurden:

- `/start` Relevance-Gate ueber `apps/web/src/app/api/start/editorial-review/route.ts`
- `/create` ueber `manualReviewRequested` in `apps/web/src/app/api/contributions/save/route.ts`
- Factcheck ueber `apps/web/src/app/api/editorial/review-requests/route.ts`

Erfolgszustand:

- "Nicht veröffentlicht · zur manuellen Prüfung vorgemerkt"

Guardrails:

- kein Auto-Publish
- kein Graph-Write
- kein Auto-Dossier
- kein Auto-Anlassraum
- kein Auto-Vote
- kein DeepSearch ohne expliziten separaten Gate-Pfad

## Admin-/Review-Surface

`/admin/review` rendert jetzt neben der bestehenden globalen ReviewQueue eine dedizierte Sektion fuer redaktionelle Prüfbitten.

Anzeige pro Eintrag:

- Textauszug
- `sourceType`
- `truthStatus`
- `sourceSupport`
- `reason`
- `createdAt`
- Nutzerhinweis
- Guardrail-Hinweis "Noch nicht veröffentlicht"

Statusaktionen laufen ueber `apps/web/src/app/api/admin/editorial-review-requests/[requestId]/route.ts`:

- `In Prüfung nehmen`
- `Rückfrage erforderlich`
- `Zur Weiterarbeit freigeben`
- `Ablehnen`
- `Archivieren`

Nicht enthalten:

- direktes Veröffentlichen
- direkter Graph-Merge
- direktes produktives Dossier
- direkter produktiver Anlassraum-Start

## Nutzerstatus in /account

`/account` zeigt Review-Requests jetzt in einer eigenen Sektion:

- `Zur manuellen Prüfung vorgemerkt`
- `In Prüfung`
- `Rückfrage erforderlich`
- `Zur Weiterarbeit freigegeben`
- `Abgelehnt`
- `Archiviert`

Die Darstellung bleibt explizit review-first und nennt zusätzlich "Noch nicht veröffentlicht".

## Truth-Guard-Integration

Der Queue-Pfad uebernimmt Truth-Guard-Meta:

- `truthStatus`
- `sourceSupport`
- `sourceStatus`
- `reviewRecommended`
- `verificationLabel`
- `noTruthPromotion`
- `noAutoGraphPromotion`

Reason-Mapping:

- `sourceSupport none/open` -> `source_open`
- `fallbackUsed` -> `fallback_used`
- `disagreementPresent` -> `provider_disagreement`
- `insufficientIndependentSuccess` -> `insufficient_independent_success`
- `noSourceBluffingPassed=false` -> `no_source_bluffing_failed`
- `moderationRequired=true` -> `moderation_required`

## Dedupe / Spam-Schutz

Aktiv:

- Dedupe fuer gleiche `userId` + `normalizedText` + `sourceType` innerhalb kurzer Zeit
- Tageslimit fuer wiederholte Requests
- Gast-Review bleibt geschuetzt bzw. auth-pflichtig
- bestehender Start-Gate blockt `spam_suspected` und `abusive_or_empty`

## Tests und Ergebnis

Ausgefuehrt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/start-editorial-review.route.test.ts tests/create-mode.save.route.test.ts tests/admin-review.page.test.tsx tests/admin-editorial-review.route.test.ts tests/account-editorial-review.contract.test.tsx`

Ergebnis:

- gruen

Abgedeckte Punkte:

- Start-Review erzeugt keinen Publish-/Vote-/Graph-Pfad
- Create-Save mit `manualReviewRequested` erzeugt `pending_review`
- Admin-Review-Surface rendert Truth-/Reason-Felder
- Admin-Statuswechsel auf `in_review` und `needs_user_clarification`
- Account zeigt Review-Status als nicht veroeffentlichten Arbeitsstand

## Offene Punkte

- Thema-/Runden-spezifische produktive Writer (`theme_suggestion`, `round_draft`) sind im Modell vorbereitet, aber in diesem Slice noch nicht an eigene Persistenzpfade angeschlossen.
- Ein tieferer Audit-/Reporting-Readside fuer Editorial-Requests ist noch nicht separat aufgebaut; aktuell lebt der Verlauf im Request selbst.
