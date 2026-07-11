# V3 Voxy Render Preview Outcome Handoff Noop Audit

Datum: 2026-07-11  
Task: `V3-VOXY-RENDER-PREVIEW-OUTCOME-HANDOFF-NOOP-01`  
Status: done

## Ziel

Nach der persistierten Preview-Review-Entscheidung aus `#346` gibt es jetzt einen
eigenen, auditierbaren Outcome-Handoff-Layer.

Der Slice ueberfuehrt persistierte Preview-Review-Entscheidungen nur in Downstream-Lesarten:

- `comment_only` -> Review-Kontext
- `request_revision` -> Script-/Asset-/Runtime-Backlog-Kandidat
- `reject_preview` -> Downstream blockiert
- `mark_review_ready` -> nur review-ready
- `keep_as_script_only` -> Video-Flow pausiert

Der Slice fuehrt bewusst nicht aus:

- Render
- Re-Render
- Preview-Video
- Medien-Datei
- Queue-Job
- Worker
- Providerlauf
- Secret-Zugriff
- Upload
- Kostenbuchung
- Credit-Abbuchung
- Publish
- Social Posting
- Scheduling

## Inventory aus dem Repo

Wiederverwendete Muster und Wahrheiten:

- `apps/web/src/features/create/voxyRenderPreviewReviewDecisionPersistenceContract.ts`
- `apps/web/src/features/create/voxyRenderPreviewReviewDecisionPersistenceStore.ts`
- `apps/web/src/features/create/voxyRenderPreviewReviewFlowContract.ts`
- `apps/web/src/features/create/voxyRenderRuntimeEnablementBacklogContract.ts`
- `apps/web/src/features/create/voxyRenderRuntimeGoNogoMatrixContract.ts`
- `apps/web/src/features/create/voxyRenderRequestDraftContract.ts`
- `apps/web/src/features/create/voxyRenderReviewDecisionGateContract.ts`

Beibehaltene Architektur:

- server-only Store mit Mongo-Primary und In-Memory-Fallback
- getrennte Audit-Events
- admin-only `GET`/`POST`
- readmodel-only Surfaces in `/create` und `/account`
- persistierte Lesewahrheit in `/admin/review` und `/dossier/[id]/studio`

## Neu

Neue Artefakte:

- `apps/web/src/features/create/voxyRenderPreviewOutcomeHandoffContract.ts`
- `apps/web/src/features/create/voxyRenderPreviewOutcomeHandoffStore.ts`
- `apps/web/src/features/create/VoxyRenderPreviewOutcomeHandoffPanel.tsx`
- `apps/web/src/app/api/admin/voxy-render-preview-outcome-handoffs/route.ts`

Integrationen additiv in:

- `apps/web/src/features/create/CreateCandidatePreviewPanel.tsx`
- `apps/web/src/app/account/AccountResumeWorkbenchSection.tsx`
- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/dossier/[id]/studio/page.tsx`

## Welche Preview-Outcomes gemappt werden

Deterministische Mapping-Regeln:

- `comment_only` bleibt `review_context_only` mit Ziel `review_context`
- `request_revision` bleibt `revision_backlog_candidate` mit Ziel:
  - `script_revision`
  - `asset_revision`
  - `runtime_enablement_backlog`
- `reject_preview` bleibt `downstream_blocked` mit Ziel `blocked_downstream`
- `mark_review_ready` bleibt `review_ready_only` mit Ziel `publish_guard`
- `keep_as_script_only` bleibt `script_only_pause` mit Ziel `script_only_archive`

Blocker:

- ohne persistierte Preview-Review-Entscheidung: `blocked_by_missing_preview_review_decision`
- nur wenn die persistierte Decision selbst `blocked_by_runtime_truth` ist: `blocked_by_runtime_truth`

## Warum dieser Handoff keine Runtime ausloest

Alle Execution-Flags bleiben explizit `false`:

- `previewRendered`
- `renderAllowed`
- `rerenderAllowed`
- `queueAllowed`
- `workerAllowed`
- `providerExecutionAllowed`
- `secretsAccessed`
- `mediaFileCreationAllowed`
- `previewFileAvailable`
- `uploadAllowed`
- `publishAllowed`
- `socialPostAllowed`
- `schedulingAllowed`
- `runtimeClaimAllowed`

Alle echten Ausfuehrungs-Effects bleiben ebenfalls `false`:

- `createsRenderJob`
- `triggersRerender`
- `triggersProvider`
- `createsQueueJob`
- `createsMediaFile`
- `createsUpload`
- `triggersPublish`
- `costDebitAllowed`
- `creditDebitAllowed`
- `runtimeClaimAllowed`

Damit gilt weiter:

- `review_ready` ist nicht `approved`
- `review_ready` ist nicht `published`
- `review_ready` ist nicht `render_allowed`
- `request_revision` ist kein Re-Render
- `reject_preview` loescht keine Medien
- `outcome_handoff` ist kein Workflow-Trigger

## Was die neuen Handoff-Effects bedeuten

Die neuen semantischen Effects zeigen nur den beabsichtigten Downstream-Typ, nicht die Ausfuehrung:

- `createsScriptRevisionTask`
- `createsAssetRevisionTask`
- `createsRuntimeBacklogTask`
- `blocksDownstream`
- `marksReviewReadyOnly`
- `pausesVideoFlow`

Sie sind nur eine auditierbare Lesart fuer spaetere Handoffs.
Dieser Slice erzeugt keine echten Folgejobs und keine echten Backlog-Writes.

## UI-Lesart

Die Oberflaechen zeigen jetzt additiv:

- `Preview Outcome Handoff`
- `Audit-only`
- `Kein Render`
- `Kein Re-Render`
- `Keine Medien-Datei`
- `Kein Providerlauf`
- `Keine Kosten`
- `Keine Veröffentlichung`
- sichtbares Outcome-Mapping
- sichtbare Downstream-Wirkung ohne Ausfuehrung
- Payload- und Audit-Hinweise
- Store-Grenze

Keine Oberflaeche zeigt:

- `Jetzt rendern`
- `Jetzt re-rendern`
- `Jetzt veröffentlichen`
- Fake-Preview-Datei
- Fake-Preview-URL
- Fake-Thumbnails
- rohe Enum-Strings

## Store / API

Die neue Admin-Route `/api/admin/voxy-render-preview-outcome-handoffs` erlaubt:

- `POST` fuer Outcome-Handoff-Records
- `GET` fuer Records und Audit-Events

Persistenzmodus:

- Mongo-Primary: `persisted`
- In-Memory-Fallback: `preview_only` oder `noop`
- readmodel-only Surfaces: keine Store-Wahrheit, nur Vorschau

## Was fuer spaetere echte Runtime-Handoffs weiterhin fehlt

Es fehlen weiterhin mindestens:

- echte Downstream-Backlog-Writes fuer Script-/Asset-/Runtime-Folgearbeit
- echte Runtime-/Queue-/Worker-Wahrheit
- echte Provider- und Secret-Wahrheit
- echte Upload-/Storage-Wahrheit
- echte Approval-Semantik oberhalb von `review_ready`
- echte Publish-Freigabelogik

## Naechster sinnvoller Slice

Sinnvolle Follow-ups:

- echte revision-task / backlog-task Persistenz getrennt vom Outcome-Handoff
- echte Approval-/Publish-Guards oberhalb von `review_ready`
- spaetere Runtime-Handoffs erst nach separater Runtime-Freigabe
