# V3 Unified Review Queue Wiring Audit

Stand: 2026-07-07  
Branch: `pr/v3-unified-review-queue-runtime-wiring-01`

Scope: additive Runtime-Wiring auf bestehende Review-/Dossier-/Output-Readmodels.
Keine neue Queue, keine neue Persistenz, kein Auto-Publish, kein Auto-Graph-Write,
kein echter Voxy-Render und keine neue Public-Runtime.

## Einordnung

- `operational_basic`: bestehende `features/reviewQueue.ts`-Items tragen jetzt additiv
  `v3ReviewContext` fuer persistierte Create-Handoffs, Dossier-Workspaces und Social-
  Distribution-Posts.
- `contract_only`: die bereits vorhandenen V3-Contracts bleiben die semantische Basis;
  das Wiring wertet keinen Contract auf `published`, `active` oder `production_ready` hoch.
- `preview_only`: es gibt weiterhin keine neue dedizierte V3-UI oder Route; die neue
  Lesart lebt vorerst im bestehenden Review-Readmodel.
- `blocked_by_provider` / `blocked_by_secret` / `blocked_by_runtime_truth`: Voxy
  Render-/Publish-Schritte bleiben bewusst in diesen Grenzen, obwohl Briefing- und
  Review-Kontexte jetzt mitverdrahtet sind.

## Abdeckung

| Bereich | Status | Datei(en) | aktueller Stand | bleibt bewusst offen |
| --- | --- | --- | --- | --- |
| Unified Review Queue | operational_basic | `features/reviewQueue.ts`, `apps/web/src/features/create/unifiedReviewQueueWiring.ts` | Bestehende `create_handoff`, `dossier_workspace` und `output_artifact`-Items tragen jetzt V3-Queue-, SourcePack-, Language- und Guardrail-Kontext auf demselben Readmodel. | Keine zweite Queue, keine neue Queue-Persistenz, keine Anlassraum-/Participation-Eigenqueue. |
| Persisted Create Handoff Wiring | operational_basic | `apps/web/src/features/create/unifiedReviewQueueWiring.ts`, `features/reviewQueue.ts` | Persistierte Create-Handoffs werden in `primaryUnifiedItem`, Participation-Kandidaten, SourcePack, Language Bridge und Trust-Hinweise projiziert. `review_ready` bleibt ungleich `approved`. | Kein neuer Write-Pfad und keine neue Handoff-Persistenz. |
| Dossier Workspace Review Surface | operational_basic | `apps/web/src/features/create/dossierWorkspaceReviewSurfaceContract.ts`, `apps/web/src/features/create/unifiedReviewQueueWiring.ts`, `features/reviewQueue.ts` | Bestehende Dossier-Workspace-Items tragen Claims, Gegenpositionen, offene Fragen, Social-Drafts, Voxy-Briefing-Kandidaten und Review-Queue-Items als additive Surface-Lesart. `publish_ready` bleibt ungleich `published`. | Keine neue Dossier-Studio-UI, keine Finalisierung, kein One-click Publish ohne passendes Review/Approval. |
| Participation / Poll Handoffs | operational_basic | `apps/web/src/features/create/participationHandoffContract.ts`, `apps/web/src/features/create/unifiedReviewQueueWiring.ts` | Create-Handoffs koennen jetzt review-first Participation-Kandidaten (`live_question_candidate`, weitere je nach Recommendation) in denselben Queue-Kontext einhaengen. | Keine Aktivierung, keine Vote-Erzeugung, keine zweite Participation-Welt. |
| Multilingual / Trust Wiring | operational_basic | `apps/web/src/features/create/multilingualStatementThreadContract.ts`, `apps/web/src/features/create/multilingualEvidenceTrustContract.ts`, `apps/web/src/features/create/unifiedReviewQueueWiring.ts` | Review-Kontexte tragen Original-/Summary-/Translation-/Trust-Hinweise; Original bleibt erhalten, Summary ersetzt keine Quelle. | Keine Uebersetzungsruntime und keine sprachuebergreifende Wahrheitsbehauptung. |
| Cross-lingual Clustering | operational_basic | `apps/web/src/features/create/crossLingualTopicClaimClusteringContract.ts`, `apps/web/src/features/create/unifiedReviewQueueWiring.ts` | Sprachabweichungen landen als Vorschlag im Review-Kontext; `possible_translation_match` und Verwandtes bleiben review-first Hinweise. | Kein Auto-Merge, kein Auto-Dedup, kein Auto-Graph-Write. |
| Social Output Draft Wiring | operational_basic | `apps/web/src/features/create/dossierSocialOutputDraftContract.ts`, `apps/web/src/features/create/unifiedReviewQueueWiring.ts`, `features/reviewQueue.ts` | Bestehende Output-Artefakte und Dossier-Workspaces tragen typed Social-Drafts mit SourcePack-/Trust-Hinweisen auf bestehender Queue-Basis. | Kein externes Posting, kein Auto-Scheduling, keine Social-API-Runtime. |
| Voxy Video Briefing Wiring | operational_basic / blocked | `apps/web/src/features/voxyVideo/contracts.ts`, `apps/web/src/features/create/unifiedReviewQueueWiring.ts`, `features/reviewQueue.ts` | Dossier-nahe Review-Items tragen jetzt Voxy-Briefing, Script-Segmente, Render-/Publish-Review-State und Provider-Blocker. | Kein echter Render, kein Publishing, keine Providerbindung, keine Secret- oder Runtime-Behauptung. |

## Guardrails, die explizit erhalten bleiben

- Auto-Prepare ist moeglich; Auto-Publish bleibt aus.
- `publish_ready` ist nicht `published`.
- `review_ready` ist nicht `approved`.
- Vorschlag bleibt Vorschlag; keine automatische Entscheidung.
- Externe Provider bleiben Adapter und nicht Produktkern.
- Preview-/Readmodel-Wiring ersetzt keine Runtime-Wahrheit.

## Tests und Checks

- `pnpm -C apps/web exec vitest run tests/review-queue.readmodel.test.ts tests/unified-review-queue-wiring.contract.test.ts`
- `pnpm -C apps/web run typecheck`

## Naechster empfohlener Slice

- Existing UI/Readmodel Touchpoints auf derselben Basis sichtbar machen:
  gezielte, additive Admin-/Dossier-Hinweise fuer `v3ReviewContext`, ohne neue Route,
  ohne neue Queue und ohne Runtime-/Publish-Hochstufung.
