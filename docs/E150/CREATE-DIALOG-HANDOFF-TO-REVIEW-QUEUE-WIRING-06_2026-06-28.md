# Create Dialog Handoff to Review Queue Wiring 06

## Ausgangslage nach #248

- Branch: `pr/create-dialog-handoff-review-queue-wiring`
- Datum: `2026-06-28`
- Ziel war nicht, eine neue Review Queue oder Admin-Oberflaeche zu bauen.
- Ziel war, die sichtbaren lokalen `CreateHandoffReviewQueueItem`s aus dem neuen Create-/Dialog-Follow-up auf die bereits vorhandene Runtime anzuschliessen, falls der bestehende Contract semantisch passt.

Vorheriger Stand:

- `createHandoffReviewQueue.ts` modellierte nur lokale Review-Items und Audit-Trail.
- `CreateVisualFollowup.tsx` konnte nach `Zur Prüfung vormerken` nur lokale Preview-State setzen.
- Gleichzeitig existierten bereits:
  - `/api/create/handoffs`
  - `persistedHandoffReviewQueue.ts`
  - `features/reviewQueue.ts`
  - `/admin/review`

## Gefundene vorhandene Review-Queue-/Admin-/Backend-Strukturen

### Contract

- `apps/web/src/features/create/createHandoffReviewQueue.ts`
  - lokaler typed Review-Queue-Item-Contract fuer sichtbare Follow-up-Handoffs
- `apps/web/src/features/create/createHandoff.ts`
  - bestehender produktiver Create-Handoff-Contract fuer `/api/create/handoffs`

### Repository / Persistence

- `apps/web/src/features/create/persistedHandoffReviewQueue.ts`
  - speichert produktive `CreateHandoffDraft`s in `create_handoff_review_items`

### Backend / Route

- `apps/web/src/app/api/create/handoffs/route.ts`
  - serverseitige Persistenz mit Scope-, Membership-, Entitlement- und Contract-Gates

### Admin UI / Workbench / Readmodel

- `features/reviewQueue.ts`
  - liest persistierte Create-Handoffs als Domain `create_handoff`
- `apps/web/src/app/admin/review/page.tsx`
  - zentrale Betreiber-Queue
- `apps/web/src/features/admin/operatorConsoleReadModel.ts`
  - Operator-Konsole nutzt dieselbe Review-Queue

### Tests

- `apps/web/tests/create-handoff.persistence.route.test.ts`
- `apps/web/tests/review-queue.readmodel.test.ts`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/account-organization-dashboard.page.test.tsx`

## Genutzte Struktur

Die Wiring nutzt bewusst keinen neuen lokalen Submit-Contract und keine neue Route.

Genutzter Pfad:

1. `CreateVisualFollowup.tsx`
2. `createHandoffReviewQueueRuntimeBridge.ts`
3. `buildCreateHandoffDraft(...)`
4. `POST /api/create/handoffs`
5. `persistedHandoffReviewQueue.ts`
6. `features/reviewQueue.ts`
7. `/admin/review` und Org-Dashboard

## Mapping `CreateHandoffReviewQueueItem` -> bestehende Review Queue

Neue Bridge:

- `apps/web/src/features/create/createHandoffReviewQueueRuntimeBridge.ts`

Wesentliche Regeln:

- `dossier_candidate` -> `create_dossier`
- `anlassraum_candidate` -> `prepare_anlassraum`
- `factcheck_request` -> `request_factcheck`
- `opinion_count` -> `request_review`
- `existing_branch_connection` -> `request_review`
- `new_branch` -> `request_review`
- `participation_space_candidate` -> `request_review`
- `editorial_review` -> `request_review`

Damit wird nichts final erstellt. Die Bridge baut nur den bestehenden review-first `CreateHandoffDraft` fuer die vorhandene Persistenz-Route.

## War echte Runtime-Submission moeglich?

Ja.

Begruendung:

- der vorhandene produktive Persistenz-Contract war bereits vorhanden
- der Contract passt semantisch zu review-first Handoffs
- `features/reviewQueue.ts` liest dieselben Records schon als `create_handoff`
- `/admin/review` zeigt diese Items bereits in der zentralen Workbench

Die Bridge blockiert trotzdem ehrlich, wenn:

- `planner` fehlt
- `graphMatch` fehlt
- `autoCreate !== false`
- `autoPublish !== false`

In diesen Faellen gibt es bewusst kein Fake-Success.

## Sichtbare UI-Aenderung

Betroffene Dateien:

- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/features/create/CreateHandoffDraftSummary.tsx`

Neuer sichtbarer Zustand nach erfolgreicher Uebergabe:

- Titel: `Zur redaktionellen Prüfung übergeben`
- Copy:
  - `Der Entwurf wurde an die Review Queue übergeben. Noch wurde nichts veröffentlicht, zusammengeführt oder als Dossier/Anlassraum/Beteiligungsraum erstellt.`

Bei Blockern oder Fehlern bleibt die UI ehrlich und zeigt eine Meldung statt eines lokalen Fake-Queue-Erfolgs.

## Guardrails, die explizit bleiben

- kein Auto-Publish
- kein Auto-Create
- kein Auto-Merge
- kein Auto-Graph
- keine finale Dossier-Erstellung
- keine finale Anlassraum-Erstellung
- keine finale Beteiligungsraum-Erstellung
- kein Source-Adapter-/DeepSearch-Pfad
- kein Payment-/Membership-Neubau
- keine AI-Runtime-Erweiterung
- keine neue Review Queue
- keine neue Admin-Seite

## Tests und Build

Neu oder angepasst:

- `apps/web/tests/create-handoff-review-queue-runtime-bridge.test.ts`
- `apps/web/tests/create-handoff-review-queue-panel.test.tsx`
- `apps/web/tests/create-curated-dialog-workspace.contract.test.tsx`
- `apps/web/tests/create-handoff-drafts-panel.test.tsx`

Ausgefuehrt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-handoff-review-queue-runtime-bridge.test.ts tests/create-handoff-review-queue.test.ts tests/create-handoff-review-queue-panel.test.tsx tests/create-curated-dialog-workspace.contract.test.tsx`
- `pnpm -C apps/web run build`

## Bewusst nicht erledigt

- finale Dossier-Erstellung
- finale Anlassraum-Erstellung
- finale Beteiligungsraum-Erstellung
- Auto-Publish
- Graph Merge
- Source Adapter
- DeepSearch
- Payment/Membership
- AI Runtime
