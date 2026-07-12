# V3 Voxy Render Scheduling Policy Noop Audit

Datum: 2026-07-12  
Task: `V3-VOXY-RENDER-SCHEDULING-POLICY-NOOP-01`  
Status: done

## Ziel

Nach `#352` Upload Target Policy gibt es jetzt einen eigenen
`Scheduling Policy`-Layer.

Der Slice beschreibt nur:

- welche spaeteren Veroeffentlichungsfenster fehlen
- warum ein `schedule_candidate` nicht `scheduled` ist
- warum `publish_window` kein Scheduler-Job ist
- warum `calendar_hint` kein Kalendertermin ist
- warum `distribution_time` nicht `posted_at` ist
- welche Policy- und Runtime-Luecken fuer spaeteres Scheduling offen bleiben

Der Slice fuehrt bewusst nicht aus:

- Scheduling
- Scheduler-Job
- Kalendertermin
- Reminder
- Upload
- Storage-Write
- Render
- Re-Render
- Queue
- Worker
- Providerlauf
- Secret-Zugriff
- Social Posting
- Publish
- Kostenbuchung
- Credit-Abbuchung

## Inventory aus dem Repo

Wiederverwendete Voxy-Render-Noop-Strukturen:

- `apps/web/src/features/create/voxyRenderUploadTargetPolicyContract.ts`
- `apps/web/src/features/create/voxyRenderUploadTargetPolicyStore.ts`
- `apps/web/src/features/create/voxyRenderMediaStorageTruthContract.ts`
- `apps/web/src/features/create/voxyRenderApprovalSemanticsContract.ts`
- `apps/web/src/features/create/voxyRenderSocialDistributionHandoffContract.ts`
- `apps/web/src/features/create/voxyRenderPublishReadinessGuardContract.ts`
- `apps/web/src/features/create/voxyRenderPreviewReviewFlowContract.ts`
- `apps/web/src/features/create/voxyRenderRuntimeEnablementBacklogContract.ts`
- `apps/web/src/features/create/voxyRenderRuntimeGoNogoMatrixContract.ts`

Bereits vorhandene echte Scheduler-/Job-Strukturen ausserhalb des Voxy-Render-Pfads:

- `apps/web/src/instrumentation.ts` registriert einen echten internen Statusreport-Scheduler
- `apps/web/src/features/ops/statusReport/scheduler.ts` enthaelt reale Slot-/Tick-/Interval-Logik
- `docs/E150/V2-SOCIAL-CONNECTORS-SCHEDULER-01_2026-05-27.md` dokumentiert einen echten review-first Social-Scheduler ausserhalb dieses Slices

Bereits vorhandene Scheduling-Begriffe im Voxy-/Output-Kontext, die dieser Slice sauber getrennt haelt:

- `schedule_candidate` aus `voxyRenderSocialDistributionHandoffContract.ts`
- `blocked_by_scheduling_guard` aus dem Distribution-Handoff
- review-first Export-/Distribution-Planung im Studio ohne Live-Posting

Sauber getrennte Begriffe, die dieser Slice beibehaelt:

- `schedule_candidate` ist nicht `scheduled`
- `publish_window` ist kein Scheduler-Job
- `calendar_hint` ist kein `calendar_event`
- `distribution_time` ist nicht `posted_at`
- `upload_ready` ist nicht `scheduled`
- `publish_ready` ist nicht `scheduled`
- `approved` ist nicht `scheduled`

## Neu

Neue Artefakte:

- `apps/web/src/features/create/voxyRenderSchedulingPolicyContract.ts`
- `apps/web/src/features/create/voxyRenderSchedulingPolicyStore.ts`
- `apps/web/src/features/create/VoxyRenderSchedulingPolicyPanel.tsx`
- `apps/web/src/app/api/admin/voxy-render-scheduling-policies/route.ts`

Integrationen additiv in:

- `apps/web/src/features/create/CreateCandidatePreviewPanel.tsx`
- `apps/web/src/app/account/AccountResumeWorkbenchSection.tsx`
- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/dossier/[id]/studio/page.tsx`

## Wie die Policy uebersetzt

Deterministische Basis:

- ohne Upload-Target-Policy: `blocked_by_missing_upload_target_policy`
- ohne Approval-Semantik: `blocked_by_missing_approval_semantics`
- `keep_as_script_only`: `keep_as_script_only`
- fehlende Medien-Datei: `blocked_by_missing_media_file`
- fehlende Runtime-Wahrheit in Upstream-Layern: `blocked_by_runtime_truth`
- kein belastbarer Schedule-Kandidat: `no_schedule_candidate`
- fehlende Publish-Window-Policy: `publish_window_needed`
- fehlende Timezone-Policy: `timezone_policy_needed`
- fehlende Plattform-Timing-Policy: `platform_timing_policy_needed`
- fehlende Kalender-Policy: `calendar_policy_needed`
- fehlende Scheduler-Runtime: `scheduler_runtime_needed`

Der Layer erzeugt dabei immer:

- `scheduledAt: null`
- `scheduled: false`
- `schedulerJobCreated: false`
- `calendarEventCreated: false`
- `reminderCreated: false`
- `postedAtAvailable: false`
- `distributionTimeFinal: false`
- `published: false`
- `socialPosted: false`
- alle Execution-Flags `false`

## Warum dieser Slice kein echtes Scheduling ist

Die neue admin-only Persistenz schreibt nur Audit-Records ueber:

- Schedule-Kandidaten
- Publish-Window-Luecken
- Kalender-Hinweise
- naechste Policy-Schritte

Sie schreibt bewusst nicht:

- Scheduler-Jobs
- Kalender-Events
- Reminder
- Posting-Zeitpunkte
- Cron-/Worker-Starts
- Uploads
- Storage-Ziele
- Social-API-Calls
- Publish-Zustaende

## Spaetere Andockpunkte fuer Runtime

Ein spaeterer echter Scheduling-Pfad kann erst anschliessen, wenn getrennt und explizit vorhanden:

- belastbare Upload-Target-Policy
- echte Medien-Datei
- echte Publish-Window-Policy
- echte Timezone-Policy
- echte Plattform-Timing-Policy
- echte Kalender-Policy
- separate Scheduler-Runtime

Dieser Slice kanonisiert dafuer nur die Readmodel- und Audit-Sprache. Er baut keine Runtime vorweg.

## Tests

Gruen gelaufen:

- `pnpm -C apps/web exec vitest run tests/voxy-render-scheduling-policy.contract.test.tsx tests/voxy-render-scheduling-policy.route.test.ts tests/create-candidate-preview.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/admin-review.page.test.tsx tests/dossier-studio-server-persistence-ui.test.tsx`
