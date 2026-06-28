# REVIEW-QUEUE-HANDOFF-PERSISTENCE-04

Datum: 2026-06-28
Repo: `edebatte-org`
Bezug: baut direkt auf `DOSSIER-ANLASSRAUM-RUNTIME-HANDOFF-03` bzw. PR #245 auf

## Ziel

Die in #245 eingeführten lokalen Create-Handoff-Drafts sollen im bestehenden
Create-Follow-up als lokale Review-/Intake-Items vormerkbar werden.

Der Slice bleibt bewusst klein:

- kein Auto-Publish
- kein Auto-Dossier
- kein Auto-Anlassraum
- kein Auto-Beteiligungsraum
- keine Graph-Runtime
- keine Source-Adapter- oder DeepSearch-Integration
- keine DB-Persistenz
- keine neue Route

## Was ein ReviewQueueItem hier ist

`CreateHandoffReviewQueueItem` ist in diesem Slice ein rein lokales, typisiertes
Prüf-/Intake-Objekt aus einem vorhandenen `CreateHandoffDraft`.

Es enthält:

- Zieltyp und Review-Kind
- Review-Status
- offene Fragen
- Review-/Factcheck-Hinweise
- Audit-Trail
- harte Guardrails `autoCreate=false` und `autoPublish=false`

## Unterschied HandoffDraft vs ReviewQueueItem vs finale Runtime-Entität

- `CreateHandoffDraft`:
  vorbereitetes lokales Anschlussobjekt direkt aus Dialog-/Topic-Match-CTAs
- `CreateHandoffReviewQueueItem`:
  lokales Review-/Intake-Preview auf Basis dieses Drafts mit Queue-Status und
  Audit-Trail
- finale Runtime-Entität:
  bewusst nicht Teil dieses Slices; weder Dossier, Anlassraum,
  Beteiligungsraum noch Veröffentlichung werden hier erzeugt

## Warum review-first

Der Flow soll sichtbar zeigen:

Beitrag -> Draft vorbereiten -> zur Prüfung vormerken

und nicht den Eindruck erzeugen, dass aus UI-Auswahl bereits ein produktiver
Merge, eine Veröffentlichung oder eine finale Einrichtung entsteht.

## Warum `approved_for_setup` nicht erstellt/veröffentlicht bedeutet

Der neue Queue-Contract modelliert `approved_for_setup` nur als Status eines
Review-Items. Dieser Status dokumentiert eine mögliche spätere manuelle
Weitergabe in einen Setup-/Runtime-Pfad, erzeugt aber in diesem Slice keine
Runtime-Entität, keine API-Aktion und keine Sichtbarkeitsänderung.

## Guardrails

- `blocksReviewQueueAutoRuntimeSideEffects(...)` bleibt immer `true`
- `autoCreate` bleibt immer `false`
- `autoPublish` bleibt immer `false`
- Dossier-, Anlassraum- und Beteiligungsraum-Kandidaten bleiben
  `requiresEditorialReview=true`
- Factcheck bleibt `requiresFactcheck=true`
- Existing-branch-connection bleibt Anschlussprüfung, kein Merge
- Opinion-count bleibt Erfassungsprüfung, keine repräsentative Statistik

## Umsetzung

Code:

- `apps/web/src/features/create/createHandoffReviewQueue.ts`
- `apps/web/src/features/create/CreateHandoffDraftSummary.tsx`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`

UI:

- neue lokale CTA `Zur Prüfung vormerken`
- nach lokaler Vormerkung sichtbarer Status `Zur Prüfung vorgemerkt`
- Queue-spezifische Copy:
  `Der Entwurf wurde als Review-Item vorbereitet. Noch wurde nichts veröffentlicht, zusammengeführt oder als Dossier/Anlassraum/Beteiligungsraum erstellt.`

## Tests / Build

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-handoff-review-queue.test.ts tests/create-handoff-review-queue-panel.test.tsx tests/create-handoff-drafts.test.ts tests/create-handoff-drafts-panel.test.tsx tests/create-curated-dialog-workspace.contract.test.tsx`
- `pnpm -C apps/web run build`

## Bewusst nicht erledigt

- echte DB-Persistenz der neuen Review-Queue-Items
- echte Review-Queue-Backend-API für diese lokalen Create-Items
- echte Admin-/Operator-Workbench für diese Create-Items
- echte Dossier-Erstellung
- echte Anlassraum-Erstellung
- echte Beteiligungsraum-Erstellung
- Graph-Runtime
- Source-Adapter-/Factcheck-Automation
