## GRAPH-CANDIDATE-STAGING-AUDIT-15B

### Geprüfte Routen

- `/admin/review`
- `/api/admin/graph-merge-candidates/[candidateId]`
- `GraphMergeCandidateActions.tsx`
- `/account` Graph-Kandidaten-Sektion
- `/api/contributions/analyze` Graph-Sync-Guard

### Zugriffsschutz

- Admin-Aktionen für Graph-Kandidaten bleiben ausschließlich über
  `requireAdminOrResponse` erreichbar.
- Normale Nutzer sehen Graph-Kandidaten nur in `/account`.
- Neue Route-Tests sichern, dass Nicht-Admins keine Staging-Aktionen auslösen
  können.

### Statusmaschine

- Action-Transitions sind jetzt review-statusbasiert eingeschränkt.
- `reject` und `return_to_clarification` verlangen weiterhin eine Begründung.
- `accept_for_staging` ist nur ein Staging-Schritt und kein produktiver Merge.
- Bereits akzeptierte, archivierte, abgelehnte oder gemergte Kandidaten können
  nicht erneut `accept_for_staging` auslösen.
- `sourceSupport` `none`/`open` blockt `accept_for_staging` explizit.

### Dedupe-Guardrails

- Dedupe bleibt hinweisend über `duplicateCandidates`.
- Wording bleibt `Möglicherweise bereits vorhanden`.
- `mark_duplicate` setzt nur `duplicate_suspected` und erzeugt keinen Merge.
- Es gibt weiterhin keine automatische Zusammenführung.

### Truth-Guard-Erhalt

- Kandidaten tragen durchgängig:
  `truthStatus`, `sourceSupport`, `sourceStatus`, `verificationLabel`,
  `noTruthPromotion=true`, `noAutoGraphPromotion=true`, `noAutoPublish=true`,
  `requiresEditorialConfirmation=true`.
- Admin- und Account-Surfaces zeigen diese Felder weiter konservativ an.

### Account- und Admin-Wording

- `/account` nutzt jetzt konservative Arbeitsstand-Sprache:
  `Noch nicht veröffentlicht`, `Noch nicht zusammengeführt`,
  `Nur nach redaktioneller Bestätigung`.
- `/admin/review` trennt weiter sichtbar zwischen Staging-Arbeitsstand und
  produktivem Merge.
- Begriffe wie direkte Veröffentlichung, direkte Verifizierung oder direkter
  produktiver Merge werden in diesem Slice vermieden.

### Analyze-Route-Absicherung

- `syncAnalyzeResultToGraph` bleibt im normalen Analyze-/Draft-Pfad deaktiviert.
- `graphSync.mode` bleibt `disabled`.
- Die bestehende Analyze-Regression-Suite bestätigt weiter, dass kein
  produktiver Graph-Sync ausgelöst wird.

### Tests und Ergebnis

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/graph-merge-candidates.contract.test.ts tests/admin-graph-merge-candidate.route.test.ts tests/admin-review.page.test.tsx tests/account-graph-candidate.contract.test.tsx tests/create-analyze.route.test.ts`

Alle genannten Checks sind grün.

### Offene Punkte

- Es existiert weiterhin kein produktiver Merge-Pfad; `merged` bleibt in diesem
  Slice absichtlich kein aktiv auslösbarer operativer Zielzustand.
- Eine weitergehende, cross-user Candidate-Kanonisierung über reine
  Hinweis-Dedupe hinaus wäre ein eigener Produktslice und wurde hier bewusst
  nicht eingeführt.
