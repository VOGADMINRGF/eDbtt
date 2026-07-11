# V3 Voxy Render Preview Review Flow Noop Audit

Datum: 2026-07-11  
Task: `V3-VOXY-RENDER-PREVIEW-REVIEW-FLOW-NOOP-01`  
Status: done

## Ziel

Nach Request-, Queue-, Cost-/Credit-, Asset-, Provider-, Runtime-Matrix- und Enablement-Backlog-Layern
gibt es jetzt einen eigenen review-first `Preview Review`-Layer.

Der Slice beantwortet nur:

- wie ein spaeteres Voxy-Preview geprueft wuerde
- wie Kommentare, Revisionen, Ablehnung und `review_ready` dokumentiert wuerden
- welche Checklist- und Guardrail-Punkte sichtbar bleiben

Der Slice beantwortet bewusst nicht:

- wie heute ein Preview gerendert wird
- wie eine Medien-Datei entsteht
- wie Queue, Worker oder Provider laufen
- wie Upload, Debit oder Publish passieren

## Inventory aus dem Repo

Vorhandene Review-/Decision-Strukturen, an die der Slice anschliesst:

- `voxyRenderReviewDecisionGateContract.ts`
  - Review-/Decision-Gates vor jeder spaeteren Render-Freigabe
- `voxyRenderDecisionPersistenceContract.ts`
  - auditierbare Review-Entscheidungen ohne Render-Ausfuehrung
- `voxyRenderRequestDraftContract.ts`
  - typed Render-Request-Draft als spaetere Handoff-Schicht
- `voxyRenderQueueContract.ts`
  - disabled Queue-/Worker-Vertrag
- `voxyRenderCostCreditPolicyContract.ts`
  - ehrliche Cost-/Credit-Grenzen ohne Debit-Wahrheit
- `voxyRenderAssetPackDraftContract.ts`
  - Asset-/Template- und Subtitle-/Export-Vorbereitung
- `voxyRenderProviderSelectionDraftContract.ts`
  - spaetere Provider-/Secret-/Pricing-/Language-Gates
- `voxyRenderRuntimeGoNogoMatrixContract.ts`
  - uebergeordnete Runtime-Go/No-Go-Wahrheit
- `voxyRenderRuntimeEnablementBacklogContract.ts`
  - spaetere Enablement-Aufgaben inklusive `Preview Review`
- `outputSocialWorkbenchContract.ts`
  - bestehender review-first Wortschatz fuer Draft, Preview, Guardrails und no-op Folgepfade

## Was der neue Slice baut

Neue Artefakte:

- `apps/web/src/features/create/voxyRenderPreviewReviewFlowContract.ts`
- `apps/web/src/features/create/voxyRenderPreviewReviewFlowStore.ts`
- `apps/web/src/features/create/VoxyRenderPreviewReviewFlowPanel.tsx`
- `apps/web/src/app/api/admin/voxy-render-preview-review-flows/route.ts`

Integrationen additiv in:

- `apps/web/src/features/create/CreateCandidatePreviewPanel.tsx`
- `apps/web/src/app/account/AccountResumeWorkbenchSection.tsx`
- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/dossier/[id]/studio/page.tsx`

## Warum dieser Slice kein Preview rendert

Der Slice bleibt strikt no-op:

- kein Renderjob
- keine Queue
- kein Worker
- kein Providerlauf
- keine HTTP- oder Secret-Nutzung
- keine Medien-Datei
- kein Thumbnail
- keine Laufzeitangabe
- kein Upload
- keine Kostenbuchung
- keine Credit-Abbuchung
- kein Publish
- kein Social Posting
- kein Scheduling

`preview_review` bleibt deshalb immer ungleich:

- `rendered_preview`
- `media_file`
- `approved`
- `published`

## Medien- und Preview-Wahrheit, die weiterhin fehlt

Der Slice bleibt ehrlich ueber fehlende Wahrheiten:

- Es gibt kein gerendertes Preview.
- Es gibt keine Preview-Datei.
- Es gibt keine Preview-URL.
- Es gibt kein Thumbnail.
- Es gibt keine belastbare Dauer.
- Es gibt keine Provider-/Queue-/Worker-/Runtime-Wahrheit.
- `review_ready` bleibt nur Flow-Zustand, nicht Approval oder Publish.
- `revision_requested` bleibt Review-Signal, kein Re-Render.

## Status-, Candidate- und Action-Semantik

Der Contract unterscheidet mindestens:

- `blocked_by_missing_backlog`
- `blocked_by_missing_matrix`
- `needs_render_runtime`
- `blocked_by_runtime_truth`
- `needs_preview_asset`
- `no_preview_available`
- `keep_as_script_only`

Preview-Kandidat bleibt in diesem Slice typischerweise:

- `no_media`
- `requirement_only`
- `missing`
- `blocked`

Review-Aktionen bleiben rein dokumentarisch:

- `comment_only`
- `request_revision`
- `reject_preview`
- `mark_review_ready`
- `keep_as_script_only`
- `blocked`

Alle Actions behalten:

- `executionAllowed: false`
- `createsRenderJob: false`
- `triggersProvider: false`
- `triggersPublish: false`

## Checklist

Die spaetere Preview-Pruefung bleibt jetzt sichtbar als typed Checklist:

- Script-Genauigkeit
- Quellen-/Caption-Treue
- Claim-Sicherheit
- Sprachqualitaet
- Untertitel-Lesbarkeit
- RTL-Layout
- Brand-Fit
- Voxy-Praesenz
- Audio-/Voice-Fit
- rechtliche Sicherheit
- Publikationssicherheit
- Barrierefreiheit

Je nach Lage bleibt ein Punkt:

- `needs_review`
- `blocked`
- `not_applicable`

## Execution-Flags

Alle Execution-Flags bleiben explizit `false`:

- `previewRendered`
- `renderAllowed`
- `queueAllowed`
- `workerAllowed`
- `providerExecutionAllowed`
- `secretsAccessed`
- `mediaFileCreationAllowed`
- `previewFileAvailable`
- `costDebitAllowed`
- `creditDebitAllowed`
- `uploadAllowed`
- `publishAllowed`
- `socialPostAllowed`
- `schedulingAllowed`
- `runtimeClaimAllowed`

## UI-Lesart

Die Oberflaechen zeigen jetzt additiv:

- `Preview Review`
- `Noch kein Preview-Video`
- `Keine Medien-Datei`
- `Kein Render`
- `Kein Providerlauf`
- `Keine Kosten`
- `Keine Veroeffentlichung`
- Preview-Status
- Review-Aktionen
- Checklist
- Sprache / Untertitel / RTL
- Top-Blocker
- naechste Aktion
- Store-Grenze

Keine Oberflaeche zeigt:

- `Jetzt rendern`
- `Jetzt veroeffentlichen`
- Fake-Preview-URL
- Fake-Thumbnail
- Fake-Dauer
- rohe Enum-Strings

## Store / API

Der Slice nutzt denselben sicheren Admin-Pfad wie die vorherigen Voxy-Noop-Slices:

- admin-only `GET`/`POST`
- persistierte oder In-Memory-Audit-Records
- keine Public-Route
- keine Medien- oder Render-Nebenwirkung

Persistiert wird nur:

- Preview-Review-Flow-Status
- Checklist-/Action-Lesart
- Audit-Spur

## Tests

Neu:

- `apps/web/tests/voxy-render-preview-review-flow.contract.test.tsx`
- `apps/web/tests/voxy-render-preview-review-flow.route.test.ts`

Erweitert:

- `apps/web/tests/create-candidate-preview.contract.test.ts`
- `apps/web/tests/account-resume-workbench.contract.test.tsx`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/dossier-studio-server-persistence-ui.test.tsx`

## Was fuer echte Preview-Pruefung weiterhin fehlt

Ein echter Folgepfad braeuchte mindestens:

- echte Preview-Render-Runtime
- echte Queue-/Worker-Wahrheit
- echte Provider-Freigabe
- echte Preview-Datei-/Thumbnail-/Duration-Wahrheit
- echte Upload-/Storage-Wahrheit
- saubere Trennung zwischen `review_ready`, `approved` und `published`
- spaetere Re-Render-/Versionierungsregeln

## Naechster sinnvoller Slice

Sinnvoll anschliessend:

- echte Preview-Asset-/Datei-Wahrheit erst nach Runtime-Freigabe
- spaetere Kommentar-/Revision-Historie ueber mehrere Preview-Versionen
- erst danach echte Preview-Review-Freigabe mit klarer Trennung zu Publish
