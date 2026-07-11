# V3 Voxy Render Publish Readiness Guard Noop Audit

Datum: 2026-07-11  
Task: `V3-VOXY-RENDER-PUBLISH-READINESS-GUARD-NOOP-01`  
Status: done

## Ziel

Nach `#347` Preview Outcome Handoff gibt es jetzt einen eigenen
`Publish Readiness`-Layer.

Der Slice beschreibt nur:

- was fuer einen spaeteren Publish-Fall noch fehlen wuerde
- warum `review_ready` nicht `approved` ist
- warum `approved` nicht `published` ist
- warum `publish_ready` nicht `published` ist
- warum Preview Outcome Handoff kein Posting ist

Der Slice fuehrt bewusst nicht aus:

- Upload
- Posting
- Scheduling
- Auto-Publish
- Publish
- Render
- Re-Render
- Queue
- Worker
- Providerlauf
- Secret-Zugriff
- Medien-Datei
- Export
- Kostenbuchung
- Credit-Abbuchung

## Inventory aus dem Repo

Wiederverwendete Voxy-/Output-/Review-Strukturen:

- `apps/web/src/features/create/voxyRenderPreviewOutcomeHandoffContract.ts`
- `apps/web/src/features/create/voxyRenderPreviewReviewDecisionPersistenceContract.ts`
- `apps/web/src/features/create/voxyRenderPreviewReviewFlowContract.ts`
- `apps/web/src/features/create/voxyRenderRuntimeEnablementBacklogContract.ts`
- `apps/web/src/features/create/voxyRenderRuntimeGoNogoMatrixContract.ts`
- `apps/web/src/features/create/outputSocialWorkbenchContract.ts`

Sauber getrennte Begriffe, die dieser Slice beibehält:

- `review_ready` ist nicht `approved`
- `approved` ist nicht `published`
- `publish_ready` ist nicht `published`
- `preview_outcome_handoff` ist keine Publish-Aktion
- `downstream_handoff` ist kein Posting
- `social_workbench` ist kein Social API Call
- `scheduling_candidate` ist nicht `scheduled`

## Neu

Neue Artefakte:

- `apps/web/src/features/create/voxyRenderPublishReadinessGuardContract.ts`
- `apps/web/src/features/create/voxyRenderPublishReadinessGuardStore.ts`
- `apps/web/src/features/create/VoxyRenderPublishReadinessGuardPanel.tsx`
- `apps/web/src/app/api/admin/voxy-render-publish-readiness-guards/route.ts`

Integrationen additiv in:

- `apps/web/src/features/create/CreateCandidatePreviewPanel.tsx`
- `apps/web/src/app/account/AccountResumeWorkbenchSection.tsx`
- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/dossier/[id]/studio/page.tsx`

## Wie der Guard uebersetzt

Deterministische Basis:

- ohne Preview Outcome Handoff: `blocked_by_missing_preview_outcome`
- `comment_only`: `not_publish_ready`
- `request_revision`: `downstream_blocked`
- `reject_preview`: `downstream_blocked`
- `mark_review_ready`: `review_ready_only`
- `keep_as_script_only`: `keep_as_script_only`
- fehlende Runtime-Wahrheit: `blocked_by_runtime_truth`

## Publish-Gates

Der Guard zeigt nur Gate-Lesarten, nie Ausfuehrung:

- `Review Gate`
- `Approval Gate`
- `Media Gate`
- `Upload Gate`
- `Scheduling Gate`
- `Social Posting Gate`
- `Legal/Safety Gate`
- `Source Caption Gate`
- `Language/RTL Gate`
- `Accessibility Gate`
- `Runtime Gate`

Typische Guard-Aussagen:

- Review-ready ist nur Review-ready
- menschliche Freigabe fehlt weiterhin
- es gibt keine echte Medien-Datei
- es gibt keine Upload-Runtime
- es gibt keine Scheduling-Policy
- es gibt keine Social-Posting-Runtime
- Legal-/Safety-, Caption-, Sprach- und Accessibility-Pruefung bleiben menschlich
- Runtime-Wahrheit bleibt getrennt von jeder Publish-Behauptung

## Publish-Semantik

Alle Publish-Semantik-Felder bleiben hart begrenzt:

- `reviewReady`: nur aus dem Outcome ableitbar
- `approved: false`
- `publishReady: false`
- `published: false`
- `uploaded: false`
- `scheduled: false`
- `socialPosted: false`
- `autoPublishAllowed: false`

Damit bleibt ausdruecklich wahr:

- `review_ready` ist nicht `approved`
- `approved` ist nicht `published`
- `publish_ready` ist nicht `published`

## Execution-Flags und Guard-Effects

Alle Execution-Flags bleiben `false`:

- `publishAllowed`
- `uploadAllowed`
- `schedulingAllowed`
- `socialPostAllowed`
- `autoPublishAllowed`
- `previewRendered`
- `renderAllowed`
- `rerenderAllowed`
- `queueAllowed`
- `workerAllowed`
- `providerExecutionAllowed`
- `secretsAccessed`
- `mediaFileCreationAllowed`
- `previewFileAvailable`
- `costDebitAllowed`
- `creditDebitAllowed`
- `runtimeClaimAllowed`

Alle Guard-Effects bleiben no-op/blocking:

- `blocksPublish: true`
- `blocksUpload: true`
- `blocksScheduling: true`
- `blocksSocialPosting: true`
- `createsUpload: false`
- `createsSchedule: false`
- `createsSocialPost: false`
- `triggersPublish: false`
- `createsRenderJob: false`
- `triggersRerender: false`
- `triggersProvider: false`
- `createsQueueJob: false`
- `createsMediaFile: false`
- `costDebitAllowed: false`
- `creditDebitAllowed: false`
- `runtimeClaimAllowed: false`

## Warum dieser Slice nichts veroeffentlicht

Der Guard ist nur `publish_readiness_guard_only / noop_publish_guard`.

Er erzeugt nicht:

- Upload-URL
- Social-URL
- Schedule-Zeit
- Medien-Datei
- Preview-Datei
- Render-Job
- Providerlauf
- Queue-Job
- Kosten

Er behauptet nicht:

- echte Approval-Wahrheit
- echte Publish-Wahrheit
- echte Upload-Wahrheit
- echte Scheduling-Wahrheit
- echte Social-Posting-Wahrheit

## UI-Lesart

Die Oberflaechen zeigen jetzt additiv:

- `Publish Readiness`
- `Noch nicht veröffentlichungsbereit`
- `Review-ready ist nicht approved`
- `Approved ist nicht published`
- `Kein Upload`
- `Kein Social Posting`
- `Kein Scheduling`
- `Keine Veröffentlichung`
- sichtbare Gate-Zeilen
- Top-Blocker
- nächste Aktion
- Store-Grenze

Keine Oberflaeche zeigt:

- `Jetzt veröffentlichen`
- `Jetzt hochladen`
- `Jetzt posten`
- `Jetzt planen`
- rohe Enum-Strings
- Fake-Video-URL
- Fake-Social-URL
- Fake-Schedule-Zeit

## Store / API

Neue Admin-Route:

- `/api/admin/voxy-render-publish-readiness-guards`

Erlaubt:

- `POST` fuer audit-only Publish-Readiness-Guard-Records
- `GET` fuer Records und Audit-Events

Persistenzmodus:

- Mongo-Primary: persistenter Guard-Record
- In-Memory-Fallback: ehrlicher Fallback ohne Produktionswahrheit
- `/create` und `/account`: readmodel-only Vorschau
- `/admin/review` und `/dossier/[id]/studio`: letzte persistierte Guard-Lesart additiv

## Wo spaetere echte Publishing-Runtime andocken wuerde

Spaetere echte Runtime muesste getrennt nach dem Guard folgen:

- echte Medien-Datei-/Storage-Wahrheit
- echte Upload-Runtime
- echte Scheduling-Policy und Scheduling-Runtime
- echte Social-Posting-Runtime
- echte menschliche Approval-Semantik oberhalb von `review_ready`
- echte Publish-Ausfuehrung nach separatem Freigabeschritt

Der neue Guard ist genau die Trennschicht davor, nicht der Runtime-Start.

## Naechster sinnvoller Slice

Sinnvolle Follow-ups:

- explizite Human-Approval-Semantik oberhalb von `review_ready`
- echte Upload-/Storage-Wahrheit erst nach separater Runtime-Freigabe
- echte Scheduling-/Social-/Publish-Runtime weiterhin separat und hinter Guards

