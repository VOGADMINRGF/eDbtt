# REVIEWED-GRAPH-MERGE-15

Datum: 2026-06-06

## GraphCandidate-Modell

Neu ist das zentrale Modell `GraphMergeCandidate` in `features/graphMergeCandidates.ts`.

Es trägt:

- Herkunft: `sourceType`, `sourceId`, optional `reviewRequestId`, optional `userId`
- Inhalt: `text`, `normalizedText`, `candidateKind`, `proposedTitle`, `proposedSummary`, `proposedClaims`, `proposedTopics`, `proposedSources`
- Truth-/Quellenlage: `truthStatus`, `sourceSupport`, `sourceStatus`, `verificationLabel`
- Workflow: `reviewStatus`, `mergeStatus`, `duplicateCandidates`
- Guardrails: `noTruthPromotion`, `noAutoPublish`, `noAutoGraphPromotion`, `requiresEditorialConfirmation`

Persistiert wird über ein zentrales Repository mit Mongo-Primärpfad und In-Memory-Fallback für Dev/Test.

## ReviewQueue-Anbindung

`features/editorialReviewQueue.ts` bereitet bei `accepted_for_workup` optional einen Graph-Kandidaten vor.

Wichtig:

- kein automatischer Graph-Merge
- kein Auto-Publish
- keine automatische Dossier-/Anlassraum-Erzeugung
- keine Wahrheits-Promotion durch das Erreichen von `accepted_for_workup`

Die Admin-Route `/api/admin/editorial-review-requests/[requestId]` gibt den erzeugten Kandidaten explizit zurück, damit der Anschlusszustand sichtbar und testbar bleibt.

## Dedupe- und Merge-Schutz

Die leichte Dedupe-Logik bleibt rein hinweisend und merged nichts automatisch.

Verwendet werden:

- `normalizedText`
- ähnliche vorgeschlagene Titel
- überlappende Quellen-/URL-Listen

Das Ergebnis ist nur ein Hinweis:

- `duplicate_suspected`
- `Möglicherweise bereits vorhanden`

Bestehende Knoten oder Kandidaten werden nicht still überschrieben.

## Admin-Flow

`/admin/review` hat jetzt einen eigenen Bereich `Graph-Kandidaten`.

Pro Kandidat sichtbar:

- Typ
- Titel oder Textauszug
- Truth-Status
- Source-Support
- Review-Status
- Merge-Status
- mögliche Duplikate
- Guardrails `Noch nicht veröffentlicht` und `Kein Graph-Merge ohne Freigabe`

Neue Admin-Aktionen laufen über `/api/admin/graph-merge-candidates/[candidateId]`:

- `Für Staging akzeptieren`
- `Als Duplikat markieren`
- `Zur Klärung zurückgeben`
- `Ablehnen`
- `Archivieren`

Ablehnen und Rückgabe zur Klärung verlangen eine Begründung.

## Staging vs produktiver Merge

Der Slice baut bewusst nur den review-bestätigten Candidate-/Staging-Pfad.

- `syncAnalyzeResultToGraph` bleibt im normalen Analyze-/Draft-Pfad deaktiviert
- ein Kandidat kann `accepted_for_staging` werden
- ein produktiver Merge wird nicht automatisch ausgelöst

Damit bleibt der Graph-Pfad klar getrennt von Light-Analyze, Draft-Save und normalen Review-Handoffs.

## Account-Status

`/account` zeigt Graph-Kandidaten jetzt als Arbeitsstand.

Kommuniziert werden:

- `Graph-Kandidat vorbereitet`
- `Duplikatprüfung läuft`
- `Zur Klärung zurückgegeben`
- `Nicht veröffentlicht`

Es gibt bewusst keine Sprache, die Kandidaten bereits als veröffentlicht, geprüft oder im produktiven Graph ausweist.

## Truth-Guard-Integration

Graph-Kandidaten übernehmen die bestehenden Truth-Guard-Felder unverändert.

Regeln:

- `sourceSupport` `none` oder `open` bleibt aus `merge_ready` heraus und wird `blocked`
- `reviewRecommended` hält Kandidaten bei `needs_review`
- `factcheck_passed` oder `sealed_verified` kann `merge_ready` vorbereiten, aber nie ohne redaktionellen Review-Schritt
- `sealed_verified` wird nur übernommen, nicht durch Graph-Merge erzeugt

## Tests

Neu/aktualisiert:

- `apps/web/tests/graph-merge-candidates.contract.test.ts`
- `apps/web/tests/admin-graph-merge-candidate.route.test.ts`
- `apps/web/tests/admin-editorial-review.route.test.ts`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/account-graph-candidate.contract.test.tsx`
- `apps/web/tests/account-editorial-review.contract.test.tsx`
- `apps/web/tests/create-analyze.route.test.ts`

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/graph-merge-candidates.contract.test.ts tests/admin-graph-merge-candidate.route.test.ts tests/admin-editorial-review.route.test.ts tests/admin-review.page.test.tsx tests/account-graph-candidate.contract.test.tsx tests/account-editorial-review.contract.test.tsx tests/create-analyze.route.test.ts`

## Offene Punkte

- Ein echter produktiver Graph-Merge nach Staging bleibt ein späterer, separat zu härtender Task.
- Falls spaeter region-/themenbezogene Dedupe-Signale kanonisch vorliegen, kann die Hinweislogik erweitert werden, ohne Auto-Merge einzuführen.
