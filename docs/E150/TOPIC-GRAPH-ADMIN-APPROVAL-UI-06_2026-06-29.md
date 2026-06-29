# TOPIC-GRAPH-ADMIN-APPROVAL-UI-06

Datum: 2026-06-29

## Ziel

Den vorhandenen Topic-Graph-Runtime-Contract aus `TOPIC-GRAPH-RUNTIME-05` im bestehenden `/admin/review` explizit bedienbar machen, ohne neue Admin-Welt, ohne Auto-Graph, ohne Auto-Merge, ohne Auto-Publish und ohne automatische Dossier-/Anlassraum-/Beteiligungsraum-Erstellung.

## Ausgangslage

- `topicGraphRuntime.ts` und `topicGraphRuntimeServer.ts` konnten bereits auditierbare Edge-Drafts vorbereiten, persistieren und nur nach explizitem `approved_for_graph_write` schreiben.
- Der vorhandene Bedienpfad im bestehenden Review-Workbench fehlte noch.
- Guardrails aus dem Auftrag blieben bindend: keine automatische Wahrheit aus KI-/Community-/Trust-Hinweisen, keine versteckten Statuswechsel, keine zweite Queue, keine neue Review-Welt.

## Umsetzung

### Bestehende Flächen wiederverwendet

- `/admin/review` bleibt die einzige Admin-/Operator-Workbench.
- Das vorhandene Section-/Action-Muster aus der Review-Oberfläche wurde für Topic-Graph-Kandidaten wiederverwendet.
- Die bestehende Topic-Graph-Draft-/Audit-Persistenz und der vorhandene Neo4j-Write-Wrapper bleiben der einzige Runtime-Pfad.

### Ergänzte UI-/Server-Bausteine

- Neue Review-Sektion auf `/admin/review`, die Topic-Graph-Drafts als `Graph-Verknüpfung prüfen` rendert.
- Sichtbar sind Edge-Kind, Source/Target, Status, Herkunft, Confidence/Signalquelle, Blocker und Audit-Hinweise.
- Drei Guardrails werden fest gerendert:
  - `Diese Verknüpfung wird nur nach redaktioneller Freigabe in den Graph geschrieben.`
  - `KI-/Community-Hinweise sind Entscheidungshilfen, keine automatische Wahrheit.`
  - `Es wird nichts zusammengeführt, gelöscht oder veröffentlicht.`
- Neue Admin-Route `/api/admin/topic-graph-edges/[edgeId]` mit den expliziten Aktionen `approveGraphWrite`, `rejectGraphWrite` und `writeApprovedGraphEdge`.

### Freigabe- und Write-Regeln

- `approved_for_merge` allein reicht ausdrücklich nicht.
- `source_review_pending` blockiert die Freigabe.
- `moderation_pending` blockiert die Freigabe.
- Fehlende Source-/Target-Knoten oder fehlende Runtime blockieren die Freigabe.
- `approved_for_graph_write` plus Audit-Kontext erlaubt den vorbereiteten Write.
- `rejected` verhindert den Write.
- `written` zeigt den Erfolg, behauptet aber weder Merge noch Publish.
- KI-/Community-/Trust-Hinweise setzen nie automatisch `approved_for_graph_write`.

## Geänderte Dateien

- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/admin/review/AdminTopicGraphApprovalSection.tsx`
- `apps/web/src/app/admin/review/TopicGraphEdgeApprovalActions.tsx`
- `apps/web/src/app/admin/review/loadAdminTopicGraphApprovalSectionProps.ts`
- `apps/web/src/app/api/admin/topic-graph-edges/[edgeId]/route.ts`
- `apps/web/src/features/create/topicGraphRuntime.ts`
- `apps/web/src/features/create/topicGraphRuntimeServer.ts`
- `apps/web/tests/topic-graph-admin-approval-ui.test.tsx`
- `apps/web/tests/topic-graph-runtime.test.ts`
- `apps/web/tests/admin-review.page.test.tsx`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`

## Validierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/topic-graph-admin-approval-ui.test.tsx tests/topic-graph-runtime.test.ts tests/topic-deduplication-review.test.ts tests/create-handoff-review-queue-runtime-bridge.test.ts tests/community-source-review-moderation.test.ts`
- `pnpm -C apps/web run build`

## Offene Grenzen

- Keine automatische Deduplication- oder Merge-Runtime.
- Keine automatische Dossier-/Anlassraum-/Beteiligungsraum-Erstellung aus reviewten Kandidaten.
- Keine Community-Workbench- oder Abuse-/Spam-Persistenz jenseits der bereits dokumentierten Guardrails.
- Keine Graph-Freigabe aus `/create`; die explizite Entscheidung bleibt bewusst im bestehenden `/admin/review`.
