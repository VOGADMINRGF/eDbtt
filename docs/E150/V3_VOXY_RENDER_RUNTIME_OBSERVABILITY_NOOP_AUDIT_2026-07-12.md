# V3 Voxy Render Runtime Observability Noop Audit

Datum: 2026-07-12  
Task: `V3-VOXY-RENDER-RUNTIME-OBSERVABILITY-NOOP-01`  
Status: done

## Ziel

Nach `#353` Scheduling Policy gibt es jetzt einen eigenen
`Runtime Observability`-Layer.

Der Slice beschreibt nur:

- welche spaeteren Audit-Events fuer Voxy denkbar waeren
- welche spaeteren Metrics und Alert-Signale fehlen
- warum eine Runtime Trace weiter leer bleibt
- warum ein Monitoring Provider noch nicht existiert
- welche Policy- und Runtime-Luecken fuer spaetere Beobachtbarkeit offen bleiben

Der Slice fuehrt bewusst nicht aus:

- Monitoring Runtime
- Event-Emission
- Metric-Streams
- Alerting
- Trace-Erzeugung
- Render
- Upload
- Scheduling
- Publish
- Social Posting
- Queue
- Worker
- Providerlauf
- Secret-Zugriff
- Kosten- oder Credit-Buchung

## Inventory aus dem Repo

Wiederverwendete Voxy-Render-Noop-Strukturen:

- `apps/web/src/features/create/voxyRenderSchedulingPolicyContract.ts`
- `apps/web/src/features/create/voxyRenderSchedulingPolicyStore.ts`
- `apps/web/src/features/create/voxyRenderUploadTargetPolicyContract.ts`
- `apps/web/src/features/create/voxyRenderMediaStorageTruthContract.ts`
- `apps/web/src/features/create/voxyRenderApprovalSemanticsContract.ts`
- `apps/web/src/features/create/voxyRenderSocialDistributionHandoffContract.ts`
- `apps/web/src/features/create/voxyRenderPublishReadinessGuardContract.ts`
- `apps/web/src/features/create/voxyRenderPreviewOutcomeHandoffContract.ts`
- `apps/web/src/features/create/voxyRenderRuntimeEnablementBacklogContract.ts`
- `apps/web/src/features/create/voxyRenderRuntimeGoNogoMatrixContract.ts`

Bereits vorhandene echte Observability-/Telemetry-Strukturen ausserhalb dieses Slices:

- `core/observability/logger.ts` enthaelt produktive Logger-/Redaction-Logik
- `core/telemetry/aiUsage.ts` schreibt echte AI-Usage-Events und Tagesaggregate
- `apps/web/src/app/api/admin/alerts/settings/route.ts` verwaltet reale Alert-Settings
- `apps/web/src/app/api/admin/errors/trace/route.ts` arbeitet mit echten Trace-Faellen
- `apps/web/src/services/core/stream.ts` kennt reale `EVENT`-/`METRIC`-/`LOG`-Arten

Wichtige Trennung, die dieser Slice beibehaelt:

- `audit_event_candidate` ist kein emittiertes Event
- `metric_candidate` ist kein Metric-Stream
- `alert_candidate` ist kein Alert
- `runtime_trace` ist keine Execution
- `observability_plan` ist keine Monitoring Runtime

## Neu

Neue Artefakte:

- `apps/web/src/features/create/voxyRenderRuntimeObservabilityContract.ts`
- `apps/web/src/features/create/voxyRenderRuntimeObservabilityStore.ts`
- `apps/web/src/features/create/VoxyRenderRuntimeObservabilityPanel.tsx`
- `apps/web/src/app/api/admin/voxy-render-runtime-observability/route.ts`

Integration additiv in:

- `apps/web/src/features/create/CreateCandidatePreviewPanel.tsx`
- `apps/web/src/app/account/AccountResumeWorkbenchSection.tsx`
- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/dossier/[id]/studio/page.tsx`

## Wie der Layer uebersetzt

Deterministische Basis:

- ohne Scheduling-Policy: `blocked_by_missing_scheduling_policy`
- ohne Upload-Target-Policy: `blocked_by_missing_upload_target_policy`
- `keep_as_script_only`: `keep_as_script_only`
- fehlende Medien-Datei: `blocked_by_missing_media_file`
- fehlende Runtime-Wahrheit in Upstream-Layern: `blocked_by_runtime_truth`
- fehlender Monitoring Provider: `monitoring_provider_needed`

Der Layer erzeugt dabei immer:

- `traceId: null`
- `emitted: false`
- `metricStreamCreated: false`
- `metricEmitted: false`
- `alertCreated: false`
- `alertEmitted: false`
- `runtimeTraceAvailable: false`
- `auditEventsEmitted: false`
- `metricsEmitted: false`
- `alertsEmitted: false`
- `monitoringRuntimeEnabled: false`
- `runtimeEnabled: false`
- `renderExecuted: false`
- `uploadExecuted: false`
- `schedulingExecuted: false`
- `publishExecuted: false`
- `socialPostExecuted: false`
- alle Execution-Flags `false`

## Warum dieser Slice keine echte Observability ist

Die neue admin-only Persistenz schreibt nur Audit-Records ueber:

- Observability-Status
- Audit-Event-Kandidaten
- Metric-Kandidaten
- Alert-Kandidaten
- Trace-Kandidaten
- naechste Policy-Schritte

Sie schreibt bewusst nicht:

- emittierte Events
- Monitoring-Provider-Calls
- Alert-Runtime-Zustaende
- echte Trace-IDs
- Runtime-Ausfuehrungen
- Renderjobs
- Uploads
- Veroeffentlichungen

## Welche Execution-Flags weiter alles blockieren

Der Slice haelt explizit fest:

- `auditEventEmissionAllowed: false`
- `metricEmissionAllowed: false`
- `alertEmissionAllowed: false`
- `monitoringProviderCallAllowed: false`
- `traceCreationAllowed: false`
- `runtimeExecutionAllowed: false`
- `schedulingAllowed: false`
- `schedulerJobAllowed: false`
- `calendarWriteAllowed: false`
- `publishAllowed: false`
- `uploadAllowed: false`
- `storageWriteAllowed: false`
- `socialPostAllowed: false`
- `autoPublishAllowed: false`
- `createsMediaFile: false`
- `previewRendered: false`
- `renderAllowed: false`
- `rerenderAllowed: false`
- `queueAllowed: false`
- `workerAllowed: false`
- `providerExecutionAllowed: false`
- `secretsAccessed: false`
- `costDebitAllowed: false`
- `creditDebitAllowed: false`
- `runtimeClaimAllowed: false`

## UI-Lesart

Die Oberflaechen zeigen jetzt additiv:

- `Runtime Observability`
- `Noch keine Runtime`
- `Keine Events emittiert`
- `Keine Metrics gesendet`
- `Keine Alerts ausgelöst`
- `Kein Monitoring Provider`
- `Keine Ausfuehrung`
- Audit-Event-Kandidaten
- Metric-Kandidaten
- Alert-Kandidaten
- Runtime-Trace-Kandidat
- Provider-/Policy-/Media-Blocker
- naechste Aktion

Keine Oberflaeche zeigt:

- `Monitoring aktivieren`
- `Event emittieren`
- `Alert senden`
- `Runtime starten`
- `Jetzt rendern`
- `Jetzt veroeffentlichen`
- rohe Enum-Werte
- Fake-Trace-IDs

## Was fuer echte Runtime Observability weiterhin fehlt

Ein echter Folgeslice braeuchte weiterhin mindestens:

- einen explizit erlaubten Monitoring Provider
- eine Trace-Policy
- eine Metric-Policy
- eine Alert-Policy
- einen Runtime-Event-Emitter
- eine echte Render-/Worker-Runtime
- reale Media-Wahrheit fuer spaetere Preview-Dateien
- ein Runbook fuer Betrieb, Fehlerreaktion und Ownership

## Naechster Slice

Der naechste ehrliche Folgeschritt bleibt nicht Runtime, sondern Policy-/Betriebsvorbereitung:

- Monitoring Provider definieren
- Trace-/Metric-/Alert-Policies explizit machen
- Event-Schema beschreiben
- echte Runtime erst nach separatem Enablement-Gate anschliessen

## Tests

Gruen gelaufen:

- `pnpm -C apps/web exec vitest run tests/voxy-render-runtime-observability.contract.test.tsx tests/voxy-render-runtime-observability.route.test.ts tests/create-candidate-preview.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/admin-review.page.test.tsx tests/dossier-studio-server-persistence-ui.test.tsx`
