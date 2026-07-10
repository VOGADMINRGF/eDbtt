# V3 Voxy Render Runtime Go/No-Go Matrix Audit

Datum: 2026-07-10  
Task: `V3-VOXY-RENDER-RUNTIME-GO-NOGO-MATRIX-01`  
Status: done

## Ziel

Nach Handoff, Preflight, Registry, Adapter, Review-Decision, Decision-Persistenz, Request-Draft,
Queue-Preview, Cost-/Credit-Policy, Asset-Pack und Provider-Auswahl gibt es jetzt eine zentrale
`Runtime Go/No-Go`-Lesart:

- verdichtet Review, Provider, Assets, Queue, Kosten & Credits, Sprache & Untertitel, Runtime und Veröffentlichung
- zeigt, warum ein Voxy-Renderlauf aktuell nicht starten darf
- bleibt strikt review-first und no-execution
- startet kein Rendering, keine Queue, keinen Worker und keinen Provider
- liest keine Secrets
- erzeugt keine Medien-Datei
- bucht keine Kosten oder Credits
- lädt nichts hoch
- veröffentlicht nichts

## Umgesetzte Artefakte

- `apps/web/src/features/create/voxyRenderRuntimeGoNogoMatrixContract.ts`
- `apps/web/src/features/create/voxyRenderRuntimeGoNogoMatrixStore.ts`
- `apps/web/src/features/create/VoxyRenderRuntimeGoNogoMatrixPanel.tsx`
- `apps/web/src/app/api/admin/voxy-render-runtime-go-nogo-matrix/route.ts`

Integration additiv in:

- `apps/web/src/features/create/CreateCandidatePreviewPanel.tsx`
- `apps/web/src/app/account/AccountResumeWorkbenchSection.tsx`
- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/dossier/[id]/studio/page.tsx`

## Welche Einzel-Gates bereits existieren

Die Matrix baut nur auf bestehender Voxy-Render-Wahrheit auf:

1. Review / Decision
   - Review-Decision-Gate und Decision-Persistenz liefern sichtbare Review-Hinweise und dokumentierte
     Entscheidungen, aber keine Runtime-Freigabe.

2. Provider
   - Registry, Preflight, Adapter und Provider-Selection zeigen Requirement-, Konfigurations-, Secret-,
     Pricing- sowie Sprach-/RTL-Lücken, aber keinen echten Providerlauf.

3. Assets
   - Asset-Pack zeigt statische Repo-/Manifest-Assets, fehlende Templates und Requirement-only Bausteine,
     aber keine Datei- oder Render-Wahrheit.

4. Queue
   - Queue-Vertrag bleibt disabled Preview ohne Queue-Job, Worker oder Scheduling.

5. Kosten & Credits
   - Cost-/Credit-Policy zeigt nur Preview-/Noop-/Missing-Wahrheit und bleibt unterhalb von Billing,
     Debit und Metering.

6. Sprache / RTL
   - Cross-lingual- und RTL-Fälle bleiben explizit reviewpflichtig und werden nicht als Capability oder
     Renderfreigabe ausgegeben.

7. Veröffentlichung
   - Publish bleibt ausdrücklich blockiert; `publish_ready` oder `published` werden nicht behauptet.

## Wie die Matrix übersetzt

Die Matrix fasst diese Bausteine in acht Gate-Zeilen zusammen:

- `Review`
- `Provider`
- `Assets`
- `Queue`
- `Kosten & Credits`
- `Sprache & Untertitel`
- `Runtime`
- `Veröffentlichung`

Jedes Gate zeigt:

- `go`, `no_go`, `warning`, `unknown` oder `not_applicable`
- Severity (`none`, `info`, `warning`, `blocker`)
- sichtbare Begründung für Review und Nutzer
- nächste Aktion
- `executionAllowed: false`

Darüber liegen:

- Matrix-Status (`runtime_no_go`, `blocked_by_review`, `blocked_by_provider` usw.)
- Gesamtentscheidung (`no_go`, `review_needed`, `runtime_not_available`, `keep_as_script_only`)
- Top-Blocker
- nächste empfohlene Aktion

## Warum aktuell fast alles No-Go bleibt

Die Matrix erzeugt bewusst kein Fake-Go:

- `review green` ist nicht `publish approval`
- `provider green` ist nicht `provider called`
- `assets green` ist nicht `render safe`
- `queue green` existiert nicht
- `cost green` ist keine Buchung
- `runtime green` existiert nicht
- `publish ready` ist nicht `published`

Selbst formal vorbereitete Fälle bleiben `runtime_no_go` oder `runtime_not_available`, weil:

- Queue disabled bleibt
- Runtime fehlt
- Execution-Flags komplett `false` bleiben
- Publish bewusst blockiert bleibt

## Execution-Flags

Alle Matrix-Records halten ausdrücklich fest:

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

## Persistenzgrenze

Wie die vorherigen Voxy-Render-Slices nutzt die Matrix:

- Mongo-Primary, wenn verfügbar
- In-Memory-Fallback mit ehrlicher Kennzeichnung
- admin-only `GET`/`POST` unter `/api/admin/voxy-render-runtime-go-nogo-matrix`
- nur Preview-/Audit-Records

Damit gilt weiter:

- kein Render
- keine Queue
- kein Providerlauf
- keine Secrets
- keine Medien
- keine Kosten
- keine Veröffentlichung
- keine Public-Route

## UI-Lesart

Die Oberflächen zeigen jetzt additiv:

- `Runtime Go/No-Go`
- sichtbare Gate-Zeilen für Review, Provider, Assets, Queue, Kosten & Credits, Sprache & Untertitel,
  Runtime und Veröffentlichung
- `Noch kein Render`
- `Keine Queue`
- `Kein Providerlauf`
- `Keine Kosten`
- `Keine Veröffentlichung`
- Top-Blocker
- nächste Aktion

Keine Oberfläche zeigt:

- `Go starten`
- `Jetzt rendern`
- `Queue starten`
- `Provider aufrufen`
- `Jetzt veröffentlichen`
- Fake-Greens

## Tests

Neu:

- `apps/web/tests/voxy-render-runtime-go-nogo-matrix.contract.test.tsx`
- `apps/web/tests/voxy-render-runtime-go-nogo-matrix.route.test.ts`

Erweitert:

- `apps/web/tests/create-candidate-preview.contract.test.ts`
- `apps/web/tests/account-resume-workbench.contract.test.tsx`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/dossier-studio-server-persistence-ui.test.tsx`

## Was für echtes Runtime-Go weiterhin fehlt

Ein echter Folgeslice bräuchte mindestens:

1. belastbare Review-Freigabe-Semantik für echte Runtime-Aktivierung
2. konkrete Provider- und Secret-Wahrheit
3. belastbare Asset-/Template-Runtime
4. echte Queue-/Worker-/Render-Runtime
5. belastbare Cost-/Credit-/Metering-Runtime
6. explizite Upload-/Publish-Runtime mit separaten Guards

## Nächster sinnvoller Slice

Sinnvolle Follow-ups:

- reine Readmodel-Slice für Runtime-/Env-/Secret-Wahrheit
- separate Queue-/Worker-Runtime erst nach belastbarer Freigabelogik
- separate Pricing-/Metering-/Debit-Wahrheit
- Publish-/Upload-Runtime weiterhin klar getrennt von dieser Matrix halten
