# V3 Voxy Render Preview Review Decision Persistence Audit

Datum: 2026-07-11  
Task: `V3-VOXY-RENDER-PREVIEW-REVIEW-DECISION-PERSISTENCE-01`  
Status: done

## Ziel

Nach dem Preview-Review-Flow aus `#345` gibt es jetzt einen eigenen,
auditierbaren Persistenz-Layer fuer menschliche Preview-Review-Entscheidungen.

Der Slice speichert nur:

- Kommentar
- Revision anfordern
- Preview ablehnen
- als review-ready markieren
- bewusst Script-only behalten

Der Slice speichert bewusst nicht:

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

Wiederverwendete Persistenz- und Audit-Muster:

- `apps/web/src/features/create/voxyRenderDecisionPersistenceContract.ts`
- `apps/web/src/features/create/voxyRenderDecisionPersistenceStore.ts`
- `apps/web/src/features/create/voxyRenderPreviewReviewFlowContract.ts`
- `apps/web/src/features/create/voxyRenderPreviewReviewFlowStore.ts`
- `apps/web/src/features/create/voxyRenderRuntimeGoNogoMatrixContract.ts`
- `apps/web/src/features/create/voxyRenderRuntimeEnablementBacklogContract.ts`
- `apps/web/src/app/api/admin/voxy-render-review-decisions/route.ts`

Vorhandene Muster, die erhalten bleiben:

- server-only Store mit Mongo-Primary und In-Memory-Fallback
- getrennte Audit-Events
- admin-only `GET`/`POST`
- readmodel-only Surfaces in `/create` und `/account`
- persistierte Lesewahrheit in `/admin/review` und `/dossier/[id]/studio`

## Neu

Neue Artefakte:

- `apps/web/src/features/create/voxyRenderPreviewReviewDecisionPersistenceContract.ts`
- `apps/web/src/features/create/voxyRenderPreviewReviewDecisionPersistenceStore.ts`
- `apps/web/src/features/create/VoxyRenderPreviewReviewDecisionPersistencePanel.tsx`
- `apps/web/src/app/api/admin/voxy-render-preview-review-decisions/route.ts`

Integrationen additiv in:

- `apps/web/src/features/create/CreateCandidatePreviewPanel.tsx`
- `apps/web/src/app/account/AccountResumeWorkbenchSection.tsx`
- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/dossier/[id]/studio/page.tsx`

## Welche Preview-Review-Entscheidungen persistiert werden

Persistierbare Decision-Typen:

- `comment_only`
- `request_revision`
- `reject_preview`
- `mark_review_ready`
- `keep_as_script_only`
- `blocked`

Mitpersistiert werden:

- Kommentar- und Begruendungsfelder
- Checklist-Resultate
- Sprach-, Caption-, Claim-, Brand-, Accessibility- und Legal-Notizen
- Referenzen auf Preview-Review-Flow, Backlog, Matrix, Request-Draft und bestehende Render-Decision
- Audit-Event mit Versionierung und vorherigem Record

## Warum diese Persistenz audit-only bleibt

Alle Decision-Effects bleiben explizit `false`:

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

Alle Execution-Flags bleiben ebenfalls `false`:

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

Darum gilt weiter:

- `review_ready` ist nicht `approved`
- `review_ready` ist nicht `published`
- `review_ready` ist nicht `render_allowed`
- `request_revision` ist kein Re-Render
- `reject_preview` ist kein Publish
- `comment_only` ist keine Runtime-Aktion
- `persistence` ist kein Workflow-Trigger

## Blocker- und Guardrail-Regeln

- Ohne Preview-Review-Flow: `blocked_by_missing_preview_review_flow`
- Bei `keep_as_script_only`: nur `comment_only` oder `keep_as_script_only`
- Bei fehlender Runtime-Wahrheit oder fehlendem Preview-Flow-Kontext: blockierter Store-Result
- Keine Fake-Preview-URL
- Keine Fake-Thumbnails
- Keine Fake-Dauer
- Keine Fake-Provider
- Keine Fake-Secrets
- Keine Fake-Kosten
- Keine Fake-Dateien

## UI-Lesart

Die Oberflaechen zeigen jetzt additiv:

- `Preview-Review-Entscheidung`
- `Audit-only`
- `Kein Render`
- `Kein Re-Render`
- `Keine Medien-Datei`
- `Kein Providerlauf`
- `Keine Kosten`
- `Keine Veröffentlichung`
- sichtbare Review-Aktionen
- Checklist-Stand
- Payload- und Audit-Hinweise
- Store-Grenze

Keine Oberflaeche zeigt:

- `Jetzt rendern`
- `Jetzt veröffentlichen`
- Fake-Preview-Datei
- Fake-Preview-URL
- rohe Enum-Strings

## Store / API

Die neue Admin-Route `/api/admin/voxy-render-preview-review-decisions` erlaubt:

- `POST` fuer Preview-Review-Decision-Records
- `GET` fuer Records und Audit-Events

Persistenzmodus:

- Mongo-Primary: `persisted_audit_only`
- In-Memory-Fallback: `preview_review_decision_only`
- readmodel-only Surfaces: keine Store-Wahrheit, nur Vorschau

## Was fuer echte Preview-Datei und spaetere Freigabe weiterhin fehlt

Es fehlen weiterhin mindestens:

- echte Preview-Datei-/Thumbnail-/Duration-Wahrheit
- echte Render-, Queue- und Worker-Runtime
- echte Provider- und Secret-Wahrheit
- echte Upload-/Storage-Wahrheit
- echte Approval-Semantik oberhalb von `review_ready`
- klare Freigabelogik zwischen Preview-Review, Runtime und Publish

## Naechster sinnvoller Slice

Sinnvolle Follow-ups:

- Kommentar-/Revision-Historie ueber mehrere Preview-Versionen
- echte Preview-Datei-Wahrheit erst nach separater Runtime-Freigabe
- spaetere Approval-/Freigabe-Semantik strikt getrennt von `review_ready`
