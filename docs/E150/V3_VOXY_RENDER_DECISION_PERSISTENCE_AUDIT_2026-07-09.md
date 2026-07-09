# V3 Voxy Render Decision Persistence Audit

Stand: 2026-07-09  
Branch: `pr/v3-voxy-render-decision-persistence-audit-01`

## Scope

Umgesetzt wurde `V3-VOXY-RENDER-DECISION-PERSISTENCE-AUDIT-01` als additiver,
server-only Decision-Persistenz- und Audit-Slice für die bestehende
review-first Voxy-Render-Entscheidung auf:

- `/create`
- `/account`
- `/admin/review`
- `/dossier/[id]/studio`
- `/api/admin/voxy-render-review-decisions`

Nicht umgesetzt wurden:

- kein Rendering
- kein Video
- kein Providerlauf
- keine HTTP- oder Provider-API-Calls zu Render-Diensten
- keine Render-Queue
- kein Worker
- keine Medien-Datei
- keine Kostenbuchung
- keine Credit-Abbuchung
- kein Upload
- kein Publish
- kein Social Posting
- kein Scheduling
- keine neue Public-Route
- keine neue Execution-Runtime

## Inventory

Gezielt geprüft und wiederverwendet wurden bestehende Persistenz- und Audit-Muster in:

- `features/reviewQueueOperations.ts`
- `features/contentReleaseWorkbench.ts`
- `features/persistenceInventory.ts`
- `apps/web/src/features/create/dossierPublishWorkflowServer.ts`
- `apps/web/src/app/api/admin/review/items/[itemId]/route.ts`
- `apps/web/src/app/api/admin/atlas/social-review-decisions/route.ts`
- `apps/web/src/app/api/admin/organization-claims/[id]/review/route.ts`

Reale vorhandene Muster:

- kleiner repo-backed Store mit Mongo-Primary und In-Memory-Fallback
- separate Audit-Collection
- explizite `persistent_primary`- vs. `in_memory_fallback`-Wahrheit
- admin-only Write-Route mit klarer Rollenprüfung
- read-only Surface-Zugriff auf letzte persistierte Review-Entscheidung

Bewusst weiterhin nicht vorhanden:

- kein render-spezifischer Approval-Workflow
- keine Provider-/Queue-/Media-Execution-Wahrheit
- keine Billing-/Credit-Write-Wahrheit
- keine Publish-/Social-/Scheduling-Wahrheit

## Neu

Neue Dateien:

- `apps/web/src/features/create/voxyRenderDecisionPersistenceContract.ts`
- `apps/web/src/features/create/voxyRenderDecisionPersistenceStore.ts`
- `apps/web/src/app/api/admin/voxy-render-review-decisions/route.ts`

Der neue Contract trennt mindestens:

- `VoxyRenderDecisionPersistenceCommand`
- `VoxyRenderPersistedDecisionRecord`
- `VoxyRenderDecisionStoreResult`
- `VoxyRenderDecisionPersistenceState`
- `VoxyRenderDecisionPersistencePanelModel`

Der server-only Store trennt zusätzlich:

- `VoxyRenderDecisionRepository`
- `VoxyRenderDecisionAuditEvent`
- `persisted_review_decision` vs. `noop_persistence`
- `stored` vs. `preview_only`

## Persistenzgrenze

Mongo-Primary:

- schreibt Decision-Record und Audit-Event dauerhaft
- markiert Records ehrlich als `persisted_review_decision`
- macht Audit über Restart und Deployment rekonstruierbar

In-Memory-Fallback:

- erlaubt denselben Codepfad für Dev/Test und sichere UI-Readbacks
- markiert Records bewusst als `noop_persistence`
- liefert nur `preview_only`
- behauptet keine Produktionswahrheit

Readmodel-Surfaces ohne server-only Write-Pfad:

- `/create` und `/account` zeigen bewusst nur `readmodel_only`
- dort bleibt die Decision-Persistenz eine ehrliche Vorschau auf den Admin-Write-Pfad

## Surface Wiring

### `/create`

- zeigt additiv `Review-Entscheidung dokumentieren`
- weist ehrlich auf `Kein Persistenz-Store im Surface` hin
- bleibt vollständig readmodel-only

### `/account`

- lokale Resume-Items und runtime-verknüpfte Workbench-Items zeigen dieselbe
  Dokumentationsschicht
- kein serverseitiger Account-Write-Pfad wird behauptet

### `/admin/review`

- nutzt die server-only Persistenzwahrheit, falls verfügbar
- zeigt letzte dokumentierte Render-Review-Entscheidung und Audit-Lesart additiv
- fällt bei fehlender Store-Erreichbarkeit sauber auf Audit-/Preview-Lesart zurück

### `/dossier/[id]/studio`

- zeigt dieselbe Dokumentationsschicht neben Briefing, Decision Gate, Handoff,
  Preflight, Registry und Adapter
- liest letzte Decision-Records read-only aus dem server-only Store

## Admin API

`/api/admin/voxy-render-review-decisions` bietet:

- `POST` für admin-only Decision-Write
- `GET` für read-only Lookup von Records und Audit-Events

Guardrails der Route:

- nur `requireAdminOrResponse`
- typed Input-Validation
- nur Review-Entscheidung, kein Execution-Trigger
- `originalPreserved: true`
- `translationIsEvidence: false`
- keine Render-, Provider-, Queue-, Media-, Cost- oder Publish-Aktion

## Guardrails

- `review_decision` bleibt ungleich `execution`
- persistierte Decision-Records bleiben ungleich `approved_render`
- `preview_only` bleibt ungleich Produktionswahrheit
- keine Fake-Provider
- keine Fake-Dateien
- keine Fake-Kosten
- keine Fake-Publish-Wahrheit
- Übersetzung bleibt Lesehilfe und nicht Evidenz

## Tests

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/voxy-render-decision-persistence.contract.test.tsx tests/voxy-render-decision-persistence.route.test.ts tests/voxy-render-review-decision-gate.contract.test.tsx tests/voxy-render-adapter-noop.contract.test.tsx tests/voxy-render-asset-provider-registry.contract.test.tsx tests/voxy-render-preflight-readiness.contract.test.tsx tests/voxy-render-provider-handoff.contract.test.tsx tests/voxy-briefing-script-candidate.contract.test.tsx tests/voxy-video-contract.test.ts tests/create-candidate-preview.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/admin-review.page.test.tsx tests/dossier-studio-server-persistence-ui.test.tsx tests/review-queue.readmodel.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`

## Nächster sinnvoller Slice

- falls echte operative Render-Freigaben später kommen, brauchen sie einen
  separaten server-only Approval-/Execution-Pfad mit klarer Trennung zu diesem
  reinen Review-Decision-Store
- solange Provider-, Queue-, Media-, Cost- und Publish-Wahrheit fehlen, bleibt
  dieser Slice bewusst Decision-Persistenz und Audit statt Ausführung
