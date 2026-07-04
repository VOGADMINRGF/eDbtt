# V3 Test Results Regression Matrix

## Was gebaut wurde

- `/admin` zeigt jetzt einen sichtbaren Abschnitt
  `V3 Test & Regression Matrix`.
- Das neue Readmodel
  `apps/web/src/features/admin/v3TestRegressionMatrix.ts`
  kartiert reale Testabdeckung fuer V3-Capabilities, Handoffs, Workflows,
  Public Routes, Guardrails und Production Validation.
- Jeder Matrix-Eintrag zeigt Coverage-Status, Kategorien, bekannte Tests,
  fehlende Tests, Endstate-Blocker, den naechsten Slice und Guardrail-Hinweise.
- `apps/web/src/features/admin/v3ControlCenterReadModel.ts` stuft
  `Test Results / Regression / E2E` nach diesem Slice auf
  `operational_basic`, ohne andere Capabilities aufzuwerten.
- Fuer `V3-CORE-AI-ORCHESTRATION-PROVENANCE-GRAPH-TRACE-01` ist die
  bestehende `/runden/new`-/`/create`-Frontend-Transparenz jetzt um eine
  getypte Provenance-Spur fuer No-AI-Draft, Create-Planner, Analyze und
  bewusst `planned_not_active` gehaltene Downstream-Pfade erweitert.
- Fuer `V3-CLAIMS-QUESTIONS-POLLS-CANDIDATE-FLOW-01` ist `/create` jetzt um
  ein typed Preview-only Readmodel fuer Claim-, Gegenpositions-, Fragen- und
  Umfrage-Kandidaten erweitert; Frontend-Transparenz und Provenance-Trace
  unterscheiden dabei sichtbar zwischen `candidate_preview` und weiterhin
  `planned_not_active`.
- Fuer `V3-CANDIDATE-REVIEW-HANDOFF-01` ist dieselbe Kandidatenvorschau jetzt
  um einen typed Review-Handoff-Envelope fuer den bestehenden
  `create_handoff_review_queue`-Kontext erweitert; fehlende Persistenz bleibt
  dabei explizit `missing_persistence_truth`, und der Provenance-Trace zeigt
  den Schritt als `candidate_review_handoff` statt als behaupteten Runtime-Write.
- Fuer `V3-CLAIM-TO-DOSSIER-PIPELINE-01` zeigt dieselbe Surface jetzt
  zusaetzlich eine typed Claim-to-Dossier-Pipeline: Claims,
  Gegenpositionen und Fragen werden auf den bestehenden
  `dossier_runtime_record`-Pfad ausgerichtet, lokal als
  Dossier-Draft-Vorschau abgeleitet und weiterhin ehrlich als
  `missing_persistence_truth` markiert; Umfragen bleiben ein geplanter
  `participation_space_runtime_record`-Folgepfad.
- Fuer `V3-PERSISTED-CANDIDATE-DOSSIER-HANDOFF-RUNTIME-01` erkennt dieselbe
  Pipeline jetzt einen real bereits vorhandenen `create_dossier`-Record im
  bestehenden `create_handoff_review_items`-Pfad und spiegelt diese
  Zwischenwahrheit sichtbar als `persisted_review_record`; ein echtes
  `dossier_runtime_record` oder `target_record_id` bleibt trotzdem offen,
  bis die bestehende Dossier-Runtime separat erzeugt wird.
- Fuer `V3-DOSSIER-RUNTIME-FROM-CANDIDATE-HANDOFF-01` liefert die bestehende
  serverseitige Handoff-Route jetzt zusaetzlich eine client-safe
  Dossier-Runtime-Zusammenfassung aus dem vorhandenen
  `dossierRuntimeServer.ts`-Pfad; `/create` zeigt daraus nur einen lesenden
  Handoff-Status mit `dossier_review_draft`,
  `persisted_dossier_runtime_record` oder ehrlichem
  `missing_dossier_runtime_truth`, ohne neue Persistenz oder einen neuen
  Write-Pfad zu behaupten.
- Fuer `V3-DOSSIER-RUNTIME-DRAFT-PERSISTENCE-01` schreibt dieselbe
  server-only Handoff-Kette fuer echte `create_dossier`-Review-Records jetzt
  einen kleinen persistierten Dossier-Runtime-Draft in die bestehende
  `dossier_runtime_records`-Persistenz. `/create` sieht dadurch eine echte
  `dossierRuntimeId` und `dossier_review_draft`, waehrend `review_required`,
  `not_published`, `planned_not_active`, No-AI-Guardrails und die Trennung zu
  Publish-/Graph-/Public-Folgeschritten unveraendert bleiben.
- Fuer `V3-FEED-ENRICHMENT-REVIEW-SUGGESTIONS-01` zeigt dieselbe Surface
  jetzt ausserdem eine typed Feed-Enrichment-Suggestion-Lesart: vorhandene
  Quellen-, Feed-, Material- und Evidenzhinweise werden nur review-first an
  Claim-, Gegenpositions- und Fragen-Kandidaten gehaengt; fehlende
  Quellwahrheit bleibt explizit `missing_source_truth` oder
  `missing_runtime_truth`, und `deepsearch_state` bleibt `planned_handoff`.

## Welche Matrix-Gruppen sichtbar sind

Capabilities:

- `admin_control_center`
- `handoff_integrity`
- `voxy_guided_experience`
- `pricing_credits_limits`
- `deepsearch_cost_governance`
- `roles_permissions_entitlements`
- `notifications_realtime_mail`
- `incident_recovery_maintenance`
- `image_assets_outputs`
- `templates_output_standards`
- `qr_sharing_public_entry`
- `live_claims_social_programm`
- `claim_to_dossier_pipeline`
- `programm_growth_approval_pipeline`
- `prompt_based_low_ops`

Handoffs / Workflows / Public:

- `create_to_review_queue`
- `review_to_dossier_runtime`
- `review_to_anlassraum_runtime`
- `review_to_participation_runtime`
- `dossier_publish_workflow`
- `anlassraum_activation_publish_workflow`
- `participation_publish_public_route`
- `public_submission_to_community_source_review`
- `community_source_review_to_admin_workbench`
- `qr_share_public_entry`
- `social_output_drafts`
- `programme_candidate_pipeline`
- `live_stream_to_followup`

Guardrails:

- `no_auto_publish`
- `no_auto_activation`
- `no_auto_factcheck`
- `no_auto_verification`
- `no_auto_graph_write`
- `no_auto_merge`
- `no_hidden_deepsearch`
- `no_hidden_cost_paths`
- `no_fake_actions`

Production:

- `production_validation_workflow`
- `external_browser_e2e`
- `monitoring_alerting_rollback`

## Statusverteilung

- `covered`: 21
- `partially_covered`: 14
- `smoke_only`: 2
- `missing`: 1
- `docs_only`: 2

Zusatzwerte:

- `blocksEndstateReadyCount`: 19
- `guardrailCoverageCount`: 9
- `e2eMissingCount`: 1

Die Matrix zeigt bewusst nur Testlage. Sie behauptet nicht, dass dadurch eine
Capability fachlich freigegeben oder `endstate_ready` ist.

## Welche bekannten Tests gemappt wurden

Wichtige V3-UI-/Readmodel-Tests:

- `apps/web/tests/v3-control-center-readmodel.contract.test.ts`
- `apps/web/tests/v3-control-center-admin.page.test.tsx`
- `apps/web/tests/v3-deepsearch-cost-governance-readmodel.contract.test.ts`
- `apps/web/tests/v3-deepsearch-cost-governance-admin.page.test.tsx`
- `apps/web/tests/v3-deepsearch-consumption-truth-readmodel.contract.test.ts`
- `apps/web/tests/v3-deepsearch-consumption-truth-admin.page.test.tsx`
- `apps/web/tests/frontend-ai-transparency.contract.test.ts`
- `apps/web/tests/ai-orchestration-provenance-trace.contract.test.ts`
- `apps/web/tests/create-candidate-preview.contract.test.ts`
- `apps/web/tests/create-claim-to-dossier-pipeline.contract.test.ts`
- `apps/web/tests/create-feed-enrichment-review-suggestions.contract.test.ts`
- `apps/web/tests/create-intelligent-followup.route.test.ts`
- `apps/web/tests/create-mode.page.test.ts`
- `apps/web/tests/create-planner-openai-happy-path.contract.test.ts`
- `apps/web/tests/create-planner-timeout.contract.test.ts`
- `apps/web/tests/create-planner-routing.contract.test.ts`
- `apps/web/tests/runden-manual-create.page.contract.test.tsx`
- `apps/web/tests/v3-handoff-linkage-map.contract.test.ts`
- `apps/web/tests/v3-handoff-linkage-admin.page.test.tsx`
- `apps/web/tests/v3-test-regression-matrix.contract.test.ts`
- `apps/web/tests/v3-test-regression-matrix-admin.page.test.tsx`

Wichtige Handoff-/Workflow-/Public-Route-Tests:

- `apps/web/tests/create-handoff.persistence.route.test.ts`
- `apps/web/tests/create-handoff-review-queue-runtime-bridge.test.ts`
- `apps/web/tests/dossier-runtime-draft-persistence.test.ts`
- `apps/web/tests/manual-anlassraum-setup.contract.test.ts`
- `apps/web/tests/manual-anlassraum-server-draft.test.ts`
- `apps/web/tests/runden-create-handoff-integrity.contract.test.ts`
- `apps/web/tests/runden-entry-canon.contract.test.ts`
- `apps/web/tests/runden-manual-create.page.contract.test.tsx`
- `apps/web/tests/dossier-runtime-creation.test.ts`
- `apps/web/tests/dossier-runtime-admin-creation.test.tsx`
- `apps/web/tests/anlassraum-runtime-creation.test.ts`
- `apps/web/tests/anlassraum-runtime-admin-creation.test.tsx`
- `apps/web/tests/participation-space-runtime-creation.test.ts`
- `apps/web/tests/participation-space-runtime-admin-creation.test.tsx`
- `apps/web/tests/dossier-publish-workflow.test.ts`
- `apps/web/tests/dossier-publish-admin.test.tsx`
- `apps/web/tests/anlassraum-activation-workflow.test.ts`
- `apps/web/tests/anlassraum-activation-admin.test.tsx`
- `apps/web/tests/participation-space-publish-workflow.test.ts`
- `apps/web/tests/participation-space-publish-admin.test.tsx`
- `apps/web/tests/dossier-public-route-runtime.test.tsx`
- `apps/web/tests/participation-space-public-detail-runtime.test.tsx`
- `apps/web/tests/community-source-review-public-submission-hardening.test.ts`
- `apps/web/tests/community-source-review-public-submission-api.test.ts`
- `apps/web/tests/community-source-review-moderation-ui.test.tsx`
- `apps/web/tests/admin-review.page.test.tsx`

Wichtige QR-/Output-/Live-/Programm-nahe Tests:

- `apps/web/tests/event-qr-entry.contract.test.tsx`
- `apps/web/tests/live-qr-entry.contract.test.tsx`
- `apps/web/tests/create-qr-swipes-drafts.contract.test.tsx`
- `apps/web/tests/share-metadata.contract.test.ts`
- `apps/web/tests/output-engine-social-distribution.test.ts`
- `apps/web/tests/social-distribution-queue-readmodel.contract.test.ts`
- `apps/web/tests/social-scheduler-review-first.contract.test.ts`
- `apps/web/tests/dossier-studio-social-queue.contract.test.tsx`
- `apps/web/tests/event-dossier-recap.contract.test.ts`
- `apps/web/tests/stream-dossier-recap-handoff.contract.test.ts`
- `apps/web/tests/live-report-handoff.contract.test.tsx`

Wichtige Pricing-/Guardrail-/Ops-Tests:

- `apps/web/tests/pricing-page.contract.test.ts`
- `apps/web/tests/admin-pricing-control-readmodel.test.ts`
- `apps/web/tests/payment-entitlement-after-checkout.contract.test.ts`
- `apps/web/tests/pricing-no-hidden-ai-costs.contract.test.ts`
- `apps/web/tests/paid-entitlements.contract.test.ts`
- `apps/web/tests/admin-entitlements.route.test.ts`
- `apps/web/tests/create-analyze-entitlement-gate.route.test.ts`
- `apps/web/tests/v3-pricing-credits-readmodel.contract.test.ts`
- `apps/web/tests/v3-pricing-credits-admin.page.test.tsx`
- `apps/web/tests/journalism-truth-guardrails.test.ts`
- `apps/web/tests/topic-graph-runtime.test.ts`
- `apps/web/tests/topic-graph-admin-approval-ui.test.tsx`
- `apps/web/tests/ai-cost-research-guardrail.contract.test.ts`
- `apps/web/tests/material-extraction-cost-guardrail.contract.test.ts`
- `apps/web/tests/admin-system-ping.route.test.ts`
- `apps/web/tests/admin-graph-health.route.test.ts`
- `apps/web/tests/admin-ai-orchestrator-smoke.route.test.ts`
- `apps/web/tests/create-analyze.route.test.ts`
- `apps/web/tests/analyze-contribution.null-hardening.test.ts`
- `apps/web/tests/status-report-health-only.contract.test.ts`

Wichtige Production-/Workflow-Belege:

- `.github/workflows/production-validation.yml`
- `apps/web/package.json#test:production-guardrails`
- `package.json#release:validate:production`
- `apps/web/tests/e2e-critical-journeys.test.ts`
- `apps/web/tests/e2e/admin.spec.ts`

## Welche kritischen Testluecken offen bleiben

- `V3-EXTERNAL-BROWSER-E2E-01`
- `V3-PROGRAMM-GROWTH-APPROVAL-PIPELINE-01`
- `V3-DOSSIER-SOCIAL-OUTPUT-DRAFTS-01`
- `V3-LIVE-FORMAT-HOST-COCKPIT-01`
- `V3-NOTIFICATIONS-REALTIME-MAIL-01`
- `V3-INCIDENT-RECOVERY-MAINTENANCE-01`
- `V3-DEEPSEARCH-DEBIT-TRUTH-05`
- `V3-DEEPSEARCH-REAL-RUNTIME-WRITER-COVERAGE-07`
- `V3-MONITORING-ALERTING-ROLLBACK-01`

Besonders sichtbar offen bleiben:

- echte External-Browser-E2E-Einbindung
- review-first Programm-Kandidatenpfad
- gemeinsame Draft-Kette fuer Social / Output
- Live-/Claims-/Follow-up-Regressionskette
- Notification-/Incident-/Recovery-End-to-End-Tests
- echte Runtime-Verknuepfung zwischen Factcheck-/Material-/Export-/Social-Pfaden und recorded usage trotz jetzt sichtbarer Analyze-/Admin-Smoke-/Create-Planner-Korrelation
- echte Debit-/Settlement-Wahrheit bleibt ohne Runtime bewusst offen
- downstream KI-Transparenz fuer Dossier-, Anlassraum- und Beteiligungsraum-Folgeflaechen bleibt eigener Folgepfad
- Source-/Evidence-/Graph-Provenance bleibt fuer spaetere Dossier-/Claim-/Feed-/Social-/Voxy-Folgepfade bewusst unvollstaendig, solange dort keine echte Runtime geschrieben wird

## Was ausdruecklich nicht gebaut wurde

- keine neue Runtime-Migration
- keine neue Testinfrastruktur
- keine behaupteten Testlaeufe, die nicht ausgefuehrt wurden
- keine Fake-Testresultate
- keine Fake-Actions
- keine Auto-Publish-Funktion
- keine Auto-Activation
- keine Auto-Factcheck- oder Auto-Verification-Logik
- keine Auto-Graph-Writes
- keine Auto-Merge-Logik
- keine hidden DeepSearch
- keine hidden Cost Paths
- keine echten Social-Posts
- keine Programm-Auto-Freigabe

## Validierung

- `git diff --check`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/v3-test-regression-matrix.contract.test.ts tests/v3-test-regression-matrix-admin.page.test.tsx tests/v3-control-center-admin.page.test.tsx tests/v3-handoff-linkage-admin.page.test.tsx`
- `pnpm -C apps/web run build`
