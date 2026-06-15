# WORKTREE-FIX-ACCOUNT-EDITORIAL-REVIEW-CLIENT-SERVER-SPLIT-21

## Ausgangslage

Nach dem lokalen Live-Split aus 19 und dem lokalen Graph-Merge-Split aus 20 scheiterte `pnpm -C apps/web run build` weiterhin im Account-Client-Pfad.

Der dritte Import-Trace lautete:

```text
mongodb
→ core/db/triMongo.ts
→ features/editorialReviewQueue.ts
→ src/app/account/AccountEditorialReviewSection.tsx
→ src/app/account/AccountEditorialReviewSupplement.tsx
→ src/app/account/AccountClient.tsx
```

Webpack brach dabei an Node-only Modulen wie `net`, `child_process`, `fs/promises` und `tls`.

## Ursache

`features/editorialReviewQueue.ts` mischte zwei Ebenen:

- serverseitige Queue-/DB-/Rate-Limit-/Reply-Logik
- clientseitig benoetigte Types sowie Status-/Reason-/Next-Step-/Filter-Helfer

`AccountEditorialReviewSection.tsx` importierte diese reinen UI-Helfer direkt aus der serverseitigen Queue-Datei. Dadurch zog `AccountClient.tsx` transitiv `triMongo` und `mongodb` in den Client-Bundle.

## Umsetzung

Neue client-sichere Datei:

- `features/editorialReviewQueueClient.ts`

Dorthin verschoben bzw. dort konzentriert:

- `EditorialReviewRequest` und zugehoerige client-sichere Types
- Status-, Reason-, SourceType- und Next-Step-Label-Helfer
- Filter-Labels und `matchesEditorialReviewFilter(...)`
- keine DB
- kein `ObjectId`
- kein `mongodb`
- kein `triMongo`

Serverseitige Datei bleibt:

- `features/editorialReviewQueue.ts`

Sie behaelt:

- Queue-Repository
- Mongo-/`triMongo`-Zugriffe
- Dedup-/Rate-Limit-Logik
- `createEditorialReviewRequest(...)`
- `listEditorialReviewRequests(...)`
- `applyEditorialReviewRequestAction(...)`
- `replyToEditorialReviewRequest(...)`

Umverdrahtete Consumer:

- `apps/web/src/app/account/AccountEditorialReviewSection.tsx`
- `apps/web/src/app/account/AccountEditorialReviewSupplement.tsx`
- `apps/web/src/app/admin/review/EditorialReviewRequestActions.tsx`
- `features/account/editorialReviewTypes.ts`

## Build-Fix-Paket

Die bereits lokalen Splits aus 19 und 20 bleiben unveraendert erhalten:

- Live: `liveCampaignEntry.ts` / `liveCampaignEntryClient.ts`
- Graph Merge: `graphMergeCandidates.ts` / `graphMergeCandidatesClient.ts`

Das Build-Fix-Paket trennt damit drei vormals gemischte Importpfade:

1. Live campaign draft helper vs. serverseitiger Campaign-DB-Lookup
2. Account graph merge view models vs. serverseitige Graph-Candidate-Logik
3. Account editorial review view models vs. serverseitige Review-Queue-Logik

## Guardrails

- Editorial Review bleibt review-first
- Account zeigt nur Status-, Hinweis- und Rueckfrage-Zustaende
- keine neuen Review-Actions
- keine neuen API-Pfade
- kein Auto-Publish
- kein Auto-Graph
- kein Auto-Merge
- kein Auto-Dossier

## Geaenderte Dateien in 21

- `features/editorialReviewQueue.ts`
- `features/editorialReviewQueueClient.ts`
- `apps/web/src/app/account/AccountEditorialReviewSection.tsx`
- `apps/web/src/app/account/AccountEditorialReviewSupplement.tsx`
- `apps/web/src/app/admin/review/EditorialReviewRequestActions.tsx`
- `features/account/editorialReviewTypes.ts`

## Verifikation

```bash
pnpm -C apps/web run typecheck
pnpm -C apps/web run lint
pnpm -C apps/web exec vitest run \
  tests/account-editorial-review.contract.test.tsx \
  tests/admin-editorial-review.page.test.tsx \
  tests/admin-editorial-review.route.test.ts \
  tests/admin-review.page.test.tsx \
  tests/account-graph-candidate.contract.test.tsx \
  tests/graph-merge-candidates.contract.test.ts \
  tests/live-campaign-entry.contract.test.tsx \
  tests/live-media-kit.contract.test.tsx
pnpm -C apps/web run build
```

Ergebnis:

- Typecheck gruen
- Lint gruen
- fokussierte Suite gruen (`8/8` Dateien, `27/27` Tests)
- `next build` gruen

## Ergebnis

`AccountClient.tsx` erreicht nach diesem Slice weder ueber Graph Merge noch ueber Editorial Review noch ueber den Live-Draft-Pfad serverseitige `mongodb`-/`triMongo`-Importe. Der Web-Build ist wieder gruen.
