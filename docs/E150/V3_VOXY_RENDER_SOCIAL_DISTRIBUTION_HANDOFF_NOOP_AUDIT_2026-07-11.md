# V3 Voxy Render Social Distribution Handoff Noop Audit

Datum: 2026-07-11  
Task: `V3-VOXY-RENDER-SOCIAL-DISTRIBUTION-HANDOFF-NOOP-01`  
Status: done

## Ziel

Nach `#348` Publish Readiness gibt es jetzt einen eigenen
`Social Distribution`-Layer.

Der Slice beschreibt nur:

- wie ein spaeteres Voxy-Video fuer Distribution vorbereitet werden koennte
- welche Plattform-Kandidaten denkbar bleiben
- welche Copy-Varianten nur als Review-Drafts vorliegen
- warum ein Schedule-Kandidat nicht `scheduled` ist
- warum `distribution_handoff` kein `social_post` ist

Der Slice fuehrt bewusst nicht aus:

- Upload
- Social Posting
- Scheduling
- Publishing
- Render
- Re-Render
- Preview-Video
- Medien-Datei
- Queue-Job
- Worker
- Providerlauf
- Secret-Zugriff
- Export
- Kostenbuchung
- Credit-Abbuchung

## Inventory aus dem Repo

Wiederverwendete review-first Strukturen:

- `apps/web/src/features/create/voxyRenderPublishReadinessGuardContract.ts`
- `apps/web/src/features/create/voxyRenderPublishReadinessGuardStore.ts`
- `apps/web/src/features/create/voxyRenderPreviewOutcomeHandoffContract.ts`
- `apps/web/src/features/create/voxyRenderRuntimeEnablementBacklogContract.ts`
- `apps/web/src/features/create/voxyRenderRuntimeGoNogoMatrixContract.ts`
- `apps/web/src/features/create/outputSocialWorkbenchContract.ts`

Bereits vorhandene Social-/Distribution-/Output-Review-Konzepte:

- `Output Social Workbench` als review-first Ausgabeschicht
- Kanal- und Draft-Begriffe wie `linkedin`, `x_twitter`, `instagram`, `newsletter`
- bestehende Guardrails `noPublishAction`, `noSocialPostAction`, `noScheduleAction`
- Voxy-Readmodels fuer Preview Outcome, Publish Readiness, Runtime Backlog und Runtime Go/No-Go

Sauber getrennte Begriffe, die dieser Slice beibehält:

- `publish_ready` ist nicht `published`
- `distribution_handoff` ist kein `social_post`
- `platform_candidate` ist kein `platform_api_call`
- `schedule_candidate` ist nicht `scheduled`
- `copy_variant` ist nicht `posted`
- `upload_ready` ist nicht `uploaded`
- `social_workbench` bleibt review-first und keine Posting-Runtime

## Neu

Neue Artefakte:

- `apps/web/src/features/create/voxyRenderSocialDistributionHandoffContract.ts`
- `apps/web/src/features/create/voxyRenderSocialDistributionHandoffStore.ts`
- `apps/web/src/features/create/VoxyRenderSocialDistributionHandoffPanel.tsx`
- `apps/web/src/app/api/admin/voxy-render-social-distribution-handoffs/route.ts`

Integrationen additiv in:

- `apps/web/src/features/create/CreateCandidatePreviewPanel.tsx`
- `apps/web/src/app/account/AccountResumeWorkbenchSection.tsx`
- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/dossier/[id]/studio/page.tsx`

## Wie der Handoff uebersetzt

Deterministische Basis:

- ohne Publish Readiness Guard: `blocked_by_missing_publish_readiness_guard`
- `not_publish_ready` oder Downstream-Blockade aus dem Guard: `blocked_by_publish_guard`
- `keep_as_script_only`: `keep_as_script_only`
- fehlende Medien-Datei: `blocked_by_missing_media`
- fehlende Upload-Runtime: `blocked_by_upload_guard`
- fehlende Scheduling-Policy: `blocked_by_scheduling_guard`
- fehlende Social-Posting-Runtime: `blocked_by_social_posting_guard`
- fehlende Runtime-Wahrheit: `blocked_by_runtime_truth`
- `review_ready_only` bleibt `not_distribution_ready`

## Plattform-Kandidaten, Copy und Schedule

Plattform-Kandidaten bleiben nur review-first Kandidaten:

- `internal_review`
- `website`
- `newsletter`
- `linkedin`
- `x_twitter`
- `instagram`
- `tiktok`
- `youtube`

Fuer alle gilt:

- `candidate_only`
- `platformApiCallAllowed: false`
- `uploadAllowed: false`
- `postAllowed: false`
- `scheduleAllowed: false`

Copy-Varianten bleiben nur Drafts:

- `draft_only` oder `needs_review`
- nie `posted`
- nie `scheduled`
- nie mit Platform-API-Call

Der Schedule-Kandidat bleibt:

- `needs_policy`, `blocked` oder `no_schedule`
- nie `scheduled`
- ohne `suggestedWindow`, solange keine echte Policy-/Zeitquelle existiert

## Distributions-Semantik

Alle Distributions-Semantik-Felder bleiben hart begrenzt:

- `publishReady: false`
- `published: false`
- `uploaded: false`
- `scheduled: false`
- `socialPosted: false`
- `platformApiCalled: false`
- `autoPublishAllowed: false`

Damit bleibt ausdruecklich wahr:

- `publish_ready` ist nicht `published`
- `distribution_handoff` ist kein `social_post`
- `platform_candidate` ist kein `platform_api_call`
- `schedule_candidate` ist nicht `scheduled`

## Execution-Flags und Guard-Effects

Alle Execution-Flags bleiben `false`:

- `publishAllowed`
- `uploadAllowed`
- `schedulingAllowed`
- `socialPostAllowed`
- `autoPublishAllowed`
- `platformApiCallAllowed`
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

- `blocksUpload: true`
- `blocksScheduling: true`
- `blocksSocialPosting: true`
- `blocksPublish: true`
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

## Warum dieser Slice nichts auslöst

Der Handoff ist nur `social_distribution_handoff_only / noop_distribution`.

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

- echte Upload-Wahrheit
- echte Social-Posting-Wahrheit
- echte Scheduling-Wahrheit
- echte Publish-Wahrheit
- echte Plattform-API-Wahrheit

## UI-Lesart

Die Oberflaechen zeigen jetzt additiv:

- `Social Distribution`
- `Noch kein Posting`
- `Kein Upload`
- `Kein Scheduling`
- `Keine Veröffentlichung`
- `Keine Plattform-API`
- `Copy nur als Review-Draft`
- sichtbare Plattform-Kandidaten
- sichtbare Copy-Varianten
- sichtbaren Schedule-Kandidaten
- Top-Blocker
- naechste Aktion
- Store-Grenze

Keine Oberflaeche zeigt:

- `Jetzt posten`
- `Jetzt hochladen`
- `Jetzt planen`
- `Jetzt veröffentlichen`
- rohe Enum-Strings
- Fake-Video-URL
- Fake-Social-URL
- Fake-Schedule-Zeit

## Store / API

Neue Admin-Route:

- `/api/admin/voxy-render-social-distribution-handoffs`

Erlaubt:

- `POST` fuer audit-only Social-Distribution-Handoff-Records
- `GET` fuer Records und Audit-Events

Persistenzmodus:

- Mongo-Primary: persistenter Handoff-Record
- In-Memory-Fallback: ehrlicher Fallback ohne Produktionswahrheit

## Was fuer spaetere echte Distribution-Runtime weiterhin fehlt

Es fehlen weiterhin mindestens:

- echte Medien-Datei-/Upload-Wahrheit
- echte Social-/Connector-/Platform-API-Wahrheit
- echte Scheduling-Policy und echte Zeitquellen
- echte Publish-/Freigabe-Semantik oberhalb des Publish Guards
- echte Queue-/Worker-/Provider-/Secret-Runtime
- echte Cost-/Credit-/Metering-Wahrheit

## Nächster sinnvoller Slice

Sinnvolle Follow-ups:

- echte Upload-Runtime hinter separatem Upload-Guard
- echte Social-Posting-Runtime hinter separatem Social-Guard
- echte Scheduling-Policy und Runtime hinter separatem Scheduling-Guard
- spaetere Connector-/Platform-Configuration getrennt von diesem audit-only Handoff
