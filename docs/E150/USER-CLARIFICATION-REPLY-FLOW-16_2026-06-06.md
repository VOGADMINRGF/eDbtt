## USER-CLARIFICATION-REPLY-FLOW-16

### Ziel

Den fehlenden Nutzerantwort-Pfad für `EditorialReviewRequest` mit Status
`needs_user_clarification` im bestehenden Review-Queue-System schließen.

### Umgesetzter Slice

- `features/editorialReviewQueue.ts` speichert jetzt `userReplies`,
  `lastUserReplyAt`, `clarificationResolvedAt` sowie `lastAction=user_replied`
  direkt am bestehenden Request.
- Neue geschützte Route
  `/api/editorial/review-requests/[requestId]/reply` nimmt Antworten nur von
  eingeloggten Eigentümern an, blockt zu kurze Antworten sowie Spam/Linkspam und
  erzeugt keinen zweiten Request.
- `/account` zeigt bei `needs_user_clarification` sichtbar:
  `Rückfrage erforderlich`, `Rückfrage der Redaktion`, den ursprünglichen
  Beitrag, ein Antwortfeld mit `Antwort senden` und den Hinweis
  `Noch nicht veröffentlicht`.
- `/admin/review` zeigt nach einer Nutzerantwort `Nutzer hat geantwortet` und
  die letzte Antwort direkt am bestehenden Request.

### Guardrails

- Keine Veröffentlichung
- Kein Graph-Merge
- Kein automatischer Factcheck
- Kein Auto-Dossier
- Kein Auto-Anlassraum
- Kein Vote
- Kein neuer ReviewRequest durch die Antwort

### Statuslogik

- Antwort auf unzugewiesene Rückfrage: `needs_user_clarification -> pending_review`
- Antwort auf zugewiesene Rückfrage: `needs_user_clarification -> in_review`

### Verifikation

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/account-editorial-review.contract.test.tsx tests/admin-review.page.test.tsx tests/editorial-review-reply.route.test.ts tests/admin-editorial-review.route.test.ts tests/editorial-review-requests.route.test.ts`
