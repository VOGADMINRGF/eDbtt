# V3 Voxy Render Runtime Enablement Backlog Audit

Datum: 2026-07-11  
Task: `V3-VOXY-RENDER-RUNTIME-ENABLEMENT-BACKLOG-01`  
Status: done

## Ziel

Nach der zentralen `Runtime Go/No-Go`-Matrix aus `#343` gibt es jetzt einen zweiten, rein planerischen
Layer:

- übersetzt die bestehenden Go/No-Go-Gates in konkrete Enablement-Aufgaben
- bleibt strikt review-first
- aktiviert keine Runtime
- startet kein Rendering
- startet keine Queue und keinen Worker
- ruft keinen Provider auf
- liest keine Secrets
- erzeugt keine Medien-Datei
- bucht keine Kosten oder Credits
- lädt nichts hoch
- veröffentlicht nichts

Der Slice ist bewusst `enablement_backlog_only` / `runtime_planning_only` / `blocked_by_runtime_truth`,
nicht Runtime.

## Umgesetzte Artefakte

- `apps/web/src/features/create/voxyRenderRuntimeEnablementBacklogContract.ts`
- `apps/web/src/features/create/voxyRenderRuntimeEnablementBacklogStore.ts`
- `apps/web/src/features/create/VoxyRenderRuntimeEnablementBacklogPanel.tsx`
- `apps/web/src/app/api/admin/voxy-render-runtime-enablement-backlogs/route.ts`

Integration additiv in:

- `apps/web/src/features/create/CreateCandidatePreviewPanel.tsx`
- `apps/web/src/app/account/AccountResumeWorkbenchSection.tsx`
- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/dossier/[id]/studio/page.tsx`

## Welche Gates aus #343 abgeleitet werden

Der Backlog baut nur auf vorhandener Matrix- und Noop-Wahrheit auf:

1. `Review`
   - offene Review-, Script-, Quellen- und Preview-Gates
2. `Provider`
   - fehlende Provider-Strategie, Adapter- und Secret-Pfade
3. `Assets`
   - fehlende Templates, Voice-, Subtitle-, Lower-Third-, Source-Caption- und Export-Bausteine
4. `Queue`
   - disabled Queue-Vertrag ohne Worker- oder Job-Runtime
5. `Kosten & Credits`
   - fehlende Pricing-, Credit-, Limit- und Metering-Wahrheit
6. `Sprache & Untertitel`
   - fehlende multilingual-/RTL-fähige Capability-Wahrheit
7. `Runtime`
   - fehlendes Admin-Gate, Security-, Observability- und Betriebsmodell
8. `Veröffentlichung`
   - fehlender Preview-Review- und Publish-Guard-Folgepfad

## Welche konkreten Enablement-Aufgaben daraus entstehen

Der Backlog erzeugt typed Items in diesen Kategorien:

- `Provider & Adapter`
- `Secrets & Konfiguration`
- `Assets & Templates`
- `Voice & Untertitel`
- `Kosten, Credits & Metering`
- `Queue & Worker`
- `Admin-Gates`
- `Preview Review`
- `Security & Observability`

Die Items bleiben ausdrücklich:

- `implemented: false`
- `executionAllowed: false`

## P0 / P1 / P2 / P3

### P0

- Provider-Strategie für Avatar-, Voice- und Preview-Render definieren
- Secret- und Konfigurationspfad für spätere Provider-Freigabe definieren
- Asset-Paket und Template-Inventar konkretisieren
- Pricing-Modell definieren
- Queue-Architektur definieren
- Admin-Enablement-Gate definieren
- Preview-Review-Flow definieren
- RTL-/mehrsprachige Regeln definieren, wenn der Sprachfall es verlangt

### P1

- Adapter-Vertrag konkretisieren
- Voice-, Subtitle- und Worker-Folgeaufgaben vorbereiten
- Credit-/Limit-Policy definieren
- Metering-Folgepfad beschreiben
- Publish-Guard konkretisieren
- Security-Folgepfad definieren

### P2

- Lower-Third-, Source-Caption- und Export-Preset-Vorlagen beschreiben
- Observability-Signale beschreiben
- Runtime-Runbook und Nicht-Ziele dokumentieren

### P3

- Dieser Slice erzeugt bewusst keine P3-„schon erledigt“-Marker und keine Fake-Fortschritte.

## Welche Aufgaben echte Runtime brauchen

Diese Kategorien bleiben strukturell ausserhalb dieses Slices:

- `secrets`
- `queue`
- `worker`
- `metering`
- alle echten Provider-Ausführungspfade
- alle Medien-Datei-, Upload- oder Publish-Pfade

Hier gilt weiter:

- `provider_task` ist nicht `provider_configured`
- `secret_task` ist kein Secret-Zugriff
- `queue_task` ist keine Queue-Ausführung
- `worker_task` ist kein Worker
- `preview_review` ist kein Render
- `publish_guard` ist keine Veröffentlichung

## Welche Aufgaben Produkt-/Review-Entscheidungen brauchen

Der Backlog macht sichtbar, wo noch echte Entscheidungspunkte fehlen:

- Provider-Strategie und erlaubte Scope-Grenzen
- Credit-/Limit-Policy für spätere Preview-Läufe
- Admin-Enablement-Gate und Freigabezuständigkeit
- Preview-Review-Flow vor jeder denkbaren Runtime
- Publish-Guard zwischen Preview und Veröffentlichung

Diese Entscheidungen werden nicht still im Code „harmonisiert“.

## Warum dieser Slice nichts aktiviert

Der Backlog ist absichtlich eine Planungs- und Audit-Schicht:

- store/API speichern nur Preview-/Audit-Records
- keine öffentliche Route
- keine Queue
- kein Worker
- kein Provider
- keine Secrets
- keine Medien
- keine Kosten
- kein Upload
- kein Publishing

## Execution-Flags

Alle Backlog-Records halten ausdrücklich fest:

- `runtimeEnabled: false`
- `renderAllowed: false`
- `queueAllowed: false`
- `workerAllowed: false`
- `providerExecutionAllowed: false`
- `secretsAccessed: false`
- `mediaFileCreationAllowed: false`
- `costDebitAllowed: false`
- `creditDebitAllowed: false`
- `uploadAllowed: false`
- `publishAllowed: false`
- `socialPostAllowed: false`
- `schedulingAllowed: false`
- `runtimeClaimAllowed: false`

## UI-Lesart

Die Oberflächen zeigen jetzt additiv:

- `Runtime Enablement Backlog`
- `Noch keine Runtime`
- `Kein Render`
- `Keine Queue`
- `Kein Providerlauf`
- `Keine Kosten`
- konkrete Enablement-Kategorien
- `Top-P0`
- nächste Aktion
- Store-Grenze

Keine Oberfläche zeigt:

- `Jetzt aktivieren`
- `Jetzt rendern`
- `Queue starten`
- `Provider ausführen`
- `Secrets laden`
- `Jetzt veröffentlichen`
- Fake-`implemented`

## Tests

Neu:

- `apps/web/tests/voxy-render-runtime-enablement-backlog.contract.test.tsx`
- `apps/web/tests/voxy-render-runtime-enablement-backlog.route.test.ts`

Erweitert:

- `apps/web/tests/create-candidate-preview.contract.test.ts`
- `apps/web/tests/account-resume-workbench.contract.test.tsx`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/dossier-studio-server-persistence-ui.test.tsx`

## Was für erstes echtes Preview-Rendering weiterhin fehlt

Ein echter Folgeslice bräuchte weiterhin mindestens:

1. belastbare Provider- und Secret-Wahrheit
2. echte Voice-/Subtitle-/Template-Runtime
3. Queue-/Worker-/Retry-Betriebsmodell
4. Pricing-, Credit-, Limit- und Metering-Wahrheit
5. Admin-Gate und Preview-Review-Freigabelogik
6. klare Trennung zwischen Preview, Upload und Publish

## Nächster sinnvoller Slice

Sinnvolle Follow-ups:

- getrennte Readmodel-Slice für echte Runtime-/Secret-/Env-Wahrheit
- getrennte Queue-/Worker-Architektur-Slice
- getrennte Pricing-/Metering-Slice
- Admin-Enablement-Gate und Preview-Review als eigener Freigabepfad

Solange diese Folgeslices fehlen, bleibt der Backlog nur ein review-first Planungslayer.
