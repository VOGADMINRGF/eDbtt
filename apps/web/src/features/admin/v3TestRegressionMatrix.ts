export const V3_TEST_MATRIX_ITEM_IDS = [
  "admin_control_center",
  "handoff_integrity",
  "voxy_guided_experience",
  "pricing_credits_limits",
  "roles_permissions_entitlements",
  "notifications_realtime_mail",
  "incident_recovery_maintenance",
  "image_assets_outputs",
  "templates_output_standards",
  "qr_sharing_public_entry",
  "live_claims_social_programm",
  "claim_to_dossier_pipeline",
  "programm_growth_approval_pipeline",
  "prompt_based_low_ops",
  "create_to_review_queue",
  "review_to_dossier_runtime",
  "review_to_anlassraum_runtime",
  "review_to_participation_runtime",
  "dossier_publish_workflow",
  "anlassraum_activation_publish_workflow",
  "participation_publish_public_route",
  "public_submission_to_community_source_review",
  "community_source_review_to_admin_workbench",
  "qr_share_public_entry",
  "social_output_drafts",
  "programme_candidate_pipeline",
  "live_stream_to_followup",
  "no_auto_publish",
  "no_auto_activation",
  "no_auto_factcheck",
  "no_auto_verification",
  "no_auto_graph_write",
  "no_auto_merge",
  "no_hidden_deepsearch",
  "no_hidden_cost_paths",
  "no_fake_actions",
  "production_validation_workflow",
  "external_browser_e2e",
  "monitoring_alerting_rollback",
] as const;

export type V3TestMatrixItemId = (typeof V3_TEST_MATRIX_ITEM_IDS)[number];

export type V3TestCoverageStatus =
  | "covered"
  | "partially_covered"
  | "smoke_only"
  | "missing"
  | "docs_only";

export type V3TestCategory =
  | "unit"
  | "contract"
  | "render"
  | "route"
  | "guardrail"
  | "public_route"
  | "workflow"
  | "smoke"
  | "e2e"
  | "production_validation";

export type V3TestMatrixItem = {
  id: V3TestMatrixItemId;
  label: string;
  targetType: "capability" | "handoff_link" | "guardrail" | "workflow" | "public_route";
  coverageStatus: V3TestCoverageStatus;
  categories: V3TestCategory[];
  knownTests: string[];
  missingTests: string[];
  relatedCapabilityIds: string[];
  relatedHandoffLinkIds: string[];
  blocksEndstateReady: boolean;
  nextSliceId: string;
  guardrailNotes: string[];
};

export type V3TestRegressionMatrix = {
  generatedAt: string;
  items: V3TestMatrixItem[];
  summary: {
    total: number;
    covered: number;
    partiallyCovered: number;
    smokeOnly: number;
    missing: number;
    docsOnly: number;
    blocksEndstateReadyCount: number;
    guardrailCoverageCount: number;
    e2eMissingCount: number;
  };
  criticalTestGaps: Array<{
    label: string;
    nextSliceId: string;
    reason: string;
  }>;
};

function item(input: Omit<V3TestMatrixItem, "blocksEndstateReady">): V3TestMatrixItem {
  return {
    ...input,
    blocksEndstateReady: input.coverageStatus !== "covered",
  };
}

export function buildV3TestRegressionMatrix(): V3TestRegressionMatrix {
  const items = [
    item({
      id: "admin_control_center",
      label: "Capability: Admin Control Center",
      targetType: "capability",
      coverageStatus: "covered",
      categories: ["contract", "render", "guardrail"],
      knownTests: [
        "apps/web/tests/v3-control-center-readmodel.contract.test.ts",
        "apps/web/tests/v3-control-center-admin.page.test.tsx",
        "apps/web/tests/operator-console-no-fake-actions.contract.test.ts",
        "apps/web/tests/admin-dashboard-graph-repairs-link.contract.test.ts",
      ],
      missingTests: [],
      relatedCapabilityIds: ["admin_control_center"],
      relatedHandoffLinkIds: ["handoff_runtime_publish_to_control_center_visibility"],
      nextSliceId: "V3-EXTERNAL-BROWSER-E2E-01",
      guardrailNotes: [
        "Keine Fake-Testresultate",
        "Keine Fake-Actions",
      ],
    }),
    item({
      id: "handoff_integrity",
      label: "Capability: Handoff Integrity",
      targetType: "capability",
      coverageStatus: "covered",
      categories: ["contract", "render", "workflow", "guardrail"],
      knownTests: [
        "apps/web/tests/v3-handoff-linkage-map.contract.test.ts",
        "apps/web/tests/v3-handoff-linkage-admin.page.test.tsx",
        "apps/web/tests/create-handoff.persistence.route.test.ts",
        "apps/web/tests/create-handoff-review-queue-runtime-bridge.test.ts",
      ],
      missingTests: [],
      relatedCapabilityIds: ["handoff_integrity"],
      relatedHandoffLinkIds: [
        "create_claims_to_review_queue",
        "review_queue_to_dossier_runtime",
        "review_queue_to_anlassraum_runtime",
        "review_queue_to_participation_runtime",
      ],
      nextSliceId: "V3-CLAIM-TO-DOSSIER-PIPELINE-01",
      guardrailNotes: [
        "Testabdeckung ersetzt keine fachliche Freigabe",
        "Review-first bleibt Pflicht",
      ],
    }),
    item({
      id: "voxy_guided_experience",
      label: "Capability: Voxy Guided Experience",
      targetType: "capability",
      coverageStatus: "partially_covered",
      categories: ["contract", "render"],
      knownTests: [
        "apps/web/tests/voxy-access-contract.test.ts",
        "apps/web/tests/voxy-cocreation-state-contract.test.ts",
        "apps/web/tests/voxy-copy.contract.test.ts",
        "apps/web/tests/voxy-guide.render.test.tsx",
      ],
      missingTests: [
        "Admin-zu-Review-zu-Public-Guidance-Regression fuer Voxy",
        "Durchgehende V3-Browser-E2E fuer Start/Create/Review/Public mit Voxy-Hinweisen",
      ],
      relatedCapabilityIds: ["voxy_guided_experience"],
      relatedHandoffLinkIds: [],
      nextSliceId: "V3-VOXY-GUIDED-EXPERIENCE-01",
      guardrailNotes: [
        "Voxy delegiert keine Entscheidungen",
        "Teiltests ersetzen keine plattformweite Guidance-Parität",
      ],
    }),
    item({
      id: "pricing_credits_limits",
      label: "Capability: Pricing / Credits / Limits",
      targetType: "capability",
      coverageStatus: "partially_covered",
      categories: ["contract", "route", "guardrail"],
      knownTests: [
        "apps/web/tests/pricing-page.contract.test.ts",
        "apps/web/tests/admin-pricing-control-readmodel.test.ts",
        "apps/web/tests/payment-entitlement-after-checkout.contract.test.ts",
        "apps/web/tests/pricing-no-hidden-ai-costs.contract.test.ts",
        "apps/web/tests/admin-pricing-orders.route.test.ts",
        "apps/web/tests/v3-pricing-credits-readmodel.contract.test.ts",
        "apps/web/tests/v3-pricing-credits-admin.page.test.tsx",
      ],
      missingTests: [
        "Per-run Verbrauchswahrheit fuer Research, Assets und Exporte",
        "Ende-zu-Ende-Regression fuer Pricing -> Entitlement -> Kosten-Gate -> Nachaudit",
      ],
      relatedCapabilityIds: ["pricing_credits_limits"],
      relatedHandoffLinkIds: [],
      nextSliceId: "V3-DEEPSEARCH-COST-GOVERNANCE-01",
      guardrailNotes: [
        "Keine versteckten Gebührenläufe",
        "Preis-Tests sind noch keine V3-Credit-Abnahme",
      ],
    }),
    item({
      id: "roles_permissions_entitlements",
      label: "Capability: Roles / Permissions / Entitlements",
      targetType: "capability",
      coverageStatus: "partially_covered",
      categories: ["contract", "route", "render", "guardrail"],
      knownTests: [
        "apps/web/tests/paid-entitlements.contract.test.ts",
        "apps/web/tests/admin-entitlements.route.test.ts",
        "apps/web/tests/create-analyze-entitlement-gate.route.test.ts",
        "apps/web/tests/admin-region-entitlement-ui.test.tsx",
        "apps/web/tests/account-organization-dashboard.page.test.tsx",
      ],
      missingTests: [
        "V3-Rechtekarte ueber Admin, Redaktion, Organisation und Kommune",
        "Ende-zu-Ende-Regressionsfall fuer Rollenwechsel plus Freischaltungswirkung",
      ],
      relatedCapabilityIds: ["roles_permissions_entitlements"],
      relatedHandoffLinkIds: ["create_claims_to_review_queue"],
      nextSliceId: "V3-ROLES-PERMISSIONS-ENTITLEMENTS-01",
      guardrailNotes: [
        "Keine implizite Freigabe durch Teiltests",
        "Review-Gates bleiben eigenständig",
      ],
    }),
    item({
      id: "notifications_realtime_mail",
      label: "Capability: Notifications / Realtime / Mail",
      targetType: "capability",
      coverageStatus: "missing",
      categories: ["route", "workflow"],
      knownTests: [],
      missingTests: [
        "V3-Benachrichtigungspfad fuer Review, Publish, Costs und Incident",
        "Realtime-/Mail-Regression fuer Admin- und Operator-Kontexte",
      ],
      relatedCapabilityIds: ["notifications_realtime_mail"],
      relatedHandoffLinkIds: [],
      nextSliceId: "V3-NOTIFICATIONS-REALTIME-MAIL-01",
      guardrailNotes: [
        "Keine behauptete Notification-Abdeckung ohne direkten Test",
      ],
    }),
    item({
      id: "incident_recovery_maintenance",
      label: "Capability: Incident / Recovery / Maintenance",
      targetType: "capability",
      coverageStatus: "smoke_only",
      categories: ["route", "smoke", "guardrail"],
      knownTests: [
        "apps/web/tests/admin-system-ping.route.test.ts",
        "apps/web/tests/health-mongo.route.test.ts",
        "apps/web/tests/admin-graph-health.route.test.ts",
        "apps/web/tests/admin-ai-orchestrator-smoke.route.test.ts",
      ],
      missingTests: [
        "Rollback- und Recovery-Regression ueber mehrere Betriebsfaelle",
        "Incident-Operator-Flow mit Alerting, Retry und Abschluss",
      ],
      relatedCapabilityIds: ["incident_recovery_maintenance"],
      relatedHandoffLinkIds: [],
      nextSliceId: "V3-INCIDENT-RECOVERY-MAINTENANCE-01",
      guardrailNotes: [
        "Smoke ist keine End-to-End-Abnahme",
        "Kein Rollback-Beweis ohne explizite Regression",
      ],
    }),
    item({
      id: "image_assets_outputs",
      label: "Capability: Image / Assets / Outputs",
      targetType: "capability",
      coverageStatus: "partially_covered",
      categories: ["contract", "render", "workflow"],
      knownTests: [
        "apps/web/tests/share-ready-asset-contract.test.ts",
        "apps/web/tests/dossier-output-studio.page.contract.test.ts",
        "apps/web/tests/output-engine-export.test.ts",
        "apps/web/tests/output-engine-social-carousel.test.ts",
      ],
      missingTests: [
        "V3-Asset-Governance fuer generative Bilder, Status und Safety",
        "Admin-seitige Regressionskette fuer Dossier-/Voxy-/Cover-Outputs",
      ],
      relatedCapabilityIds: ["image_assets_outputs"],
      relatedHandoffLinkIds: ["dossier_topic_round_to_social_outputs"],
      nextSliceId: "V3-IMAGE-GENERATION-VOXY-ASSETS-DOSSIER-OUTPUTS-01",
      guardrailNotes: [
        "Assets sind keine Wahrheitsbelege",
        "Teilabdeckung ersetzt keine Public-Safety-Abnahme",
      ],
    }),
    item({
      id: "templates_output_standards",
      label: "Capability: Templates / Output Standards",
      targetType: "capability",
      coverageStatus: "partially_covered",
      categories: ["unit", "contract", "workflow"],
      knownTests: [
        "apps/web/tests/prompt-output-envelope.test.ts",
        "apps/web/tests/output-engine-format-mappers.test.ts",
        "apps/web/tests/output-engine-master-post.test.ts",
        "apps/web/tests/social-output-contract.test.ts",
      ],
      missingTests: [
        "V3-Template-Familie fuer Dossier, Round, Live und Programm",
        "Admin- und Public-Paritaet fuer Output-Standards",
      ],
      relatedCapabilityIds: ["templates_output_standards"],
      relatedHandoffLinkIds: ["dossier_topic_round_to_social_outputs"],
      nextSliceId: "V3-TEMPLATE-OUTPUT-STANDARDIZATION-01",
      guardrailNotes: [
        "Template-Tests sind keine Auto-Publish-Freigabe",
      ],
    }),
    item({
      id: "qr_sharing_public_entry",
      label: "Capability: QR / Sharing / Public Entry",
      targetType: "capability",
      coverageStatus: "partially_covered",
      categories: ["contract", "public_route", "render", "guardrail"],
      knownTests: [
        "apps/web/tests/event-qr-entry.contract.test.tsx",
        "apps/web/tests/live-qr-entry.contract.test.tsx",
        "apps/web/tests/create-qr-swipes-drafts.contract.test.tsx",
        "apps/web/tests/share-metadata.contract.test.ts",
        "apps/web/tests/runden-qr-participation-language.contract.test.tsx",
      ],
      missingTests: [
        "Slug-/QR-Integrity zwischen Admin, Public Entry und Share Preview",
        "Browser-E2E fuer QR -> Public Route -> Review-first Follow-up",
      ],
      relatedCapabilityIds: ["qr_sharing_public_entry"],
      relatedHandoffLinkIds: ["runtime_entities_to_qr_and_sharing"],
      nextSliceId: "V3-QR-SHARING-PUBLIC-ENTRY-01",
      guardrailNotes: [
        "Kein Auto-Sharing",
        "Keine internen IDs im Public Entry",
      ],
    }),
    item({
      id: "live_claims_social_programm",
      label: "Capability: Live / Claims / Social / Programm",
      targetType: "capability",
      coverageStatus: "partially_covered",
      categories: ["contract", "workflow", "public_route", "guardrail"],
      knownTests: [
        "apps/web/tests/event-dossier-recap.contract.test.ts",
        "apps/web/tests/stream-dossier-recap-handoff.contract.test.ts",
        "apps/web/tests/social-distribution-queue-readmodel.contract.test.ts",
        "apps/web/tests/live-report-handoff.contract.test.tsx",
      ],
      missingTests: [
        "Gemeinsame V3-Regression fuer Live Session, Claim-Follow-up, Social Drafts und Programm-Kandidaten",
        "Host-Cockpit-Browser-E2E fuer Live-/Nachbereitungs-Flows",
      ],
      relatedCapabilityIds: ["live_claims_social_programm"],
      relatedHandoffLinkIds: [
        "dossier_topic_round_to_social_outputs",
        "live_session_to_claim_source_dossier_follow_up",
      ],
      nextSliceId: "V3-LIVE-FORMAT-HOST-COCKPIT-01",
      guardrailNotes: [
        "Live-Tests ersetzen keine operatorische Endreife",
      ],
    }),
    item({
      id: "claim_to_dossier_pipeline",
      label: "Capability: Claim-to-Dossier Pipeline",
      targetType: "capability",
      coverageStatus: "partially_covered",
      categories: ["contract", "workflow", "route", "guardrail"],
      knownTests: [
        "apps/web/tests/create-claim-safety.contract.test.ts",
        "apps/web/tests/create-dossier-handoff.contract.test.ts",
        "apps/web/tests/dossier-runtime-creation.test.ts",
        "apps/web/tests/dossier-publish-workflow.test.ts",
        "apps/web/tests/create-factcheck-handoff.contract.test.ts",
      ],
      missingTests: [
        "Review-first Pipeline von Claim ueber Quellen- und Dossier-Folge bis Programm-Relevanz",
        "Browser-E2E fuer Claim -> Review -> Dossier Runtime -> Publish Review",
      ],
      relatedCapabilityIds: ["live_claims_social_programm"],
      relatedHandoffLinkIds: [
        "create_claims_to_review_queue",
        "review_queue_to_dossier_runtime",
      ],
      nextSliceId: "V3-CLAIM-TO-DOSSIER-PIPELINE-01",
      guardrailNotes: [
        "Keine automatische Verifikation",
        "Keine automatische Dossier-Erstellung aus Teiltests",
      ],
    }),
    item({
      id: "programm_growth_approval_pipeline",
      label: "Capability: Programm Growth Approval Pipeline",
      targetType: "capability",
      coverageStatus: "docs_only",
      categories: ["workflow"],
      knownTests: [],
      missingTests: [
        "Review-first Kandidatenpfad von Claim/Dossier/Live zu Programm",
        "Admin- und Browser-Regression fuer Programm-Gates und Freigaben",
      ],
      relatedCapabilityIds: ["live_claims_social_programm"],
      relatedHandoffLinkIds: ["claims_and_signals_to_programm_candidates"],
      nextSliceId: "V3-PROGRAMM-GROWTH-APPROVAL-PIPELINE-01",
      guardrailNotes: [
        "Nur kanonisiertes Zielbild, keine Testabdeckung",
      ],
    }),
    item({
      id: "prompt_based_low_ops",
      label: "Capability: Prompt-based Low-Ops",
      targetType: "capability",
      coverageStatus: "partially_covered",
      categories: ["contract", "route", "smoke", "guardrail"],
      knownTests: [
        "apps/web/tests/prompt-output-envelope.test.ts",
        "apps/web/tests/ai-provider-smoke-cli.test.ts",
        "apps/web/tests/admin-ai-orchestrator-smoke.route.test.ts",
        "apps/web/tests/journalism-companion-contract.test.ts",
        "apps/web/tests/route-bound-companion.contract.test.ts",
      ],
      missingTests: [
        "Low-Ops-Maintenance-Flow mit Rechten, Audit und Kosten-Gates",
        "Operator-Regressionspfad fuer Prompt-basierte Wartung ohne stille Side Effects",
      ],
      relatedCapabilityIds: ["prompt_based_low_ops"],
      relatedHandoffLinkIds: [],
      nextSliceId: "V3-PROMPT-BASED-MAINTENANCE-AND-LOW-OPS-01",
      guardrailNotes: [
        "Keine stillen DB-Schreibwege",
        "Keine versteckten Costs",
      ],
    }),
    item({
      id: "create_to_review_queue",
      label: "Handoff: Create -> Review Queue",
      targetType: "handoff_link",
      coverageStatus: "covered",
      categories: ["contract", "route", "workflow", "guardrail"],
      knownTests: [
        "apps/web/tests/create-handoff.persistence.route.test.ts",
        "apps/web/tests/create-handoff-review-queue-runtime-bridge.test.ts",
        "apps/web/tests/create-handoff-review-queue.test.ts",
        "apps/web/tests/admin-review.page.test.tsx",
      ],
      missingTests: [],
      relatedCapabilityIds: ["handoff_integrity"],
      relatedHandoffLinkIds: ["create_claims_to_review_queue"],
      nextSliceId: "V3-CLAIM-TO-DOSSIER-PIPELINE-01",
      guardrailNotes: [
        "Kein Review-Bypass",
      ],
    }),
    item({
      id: "review_to_dossier_runtime",
      label: "Workflow: Review -> Dossier Runtime",
      targetType: "workflow",
      coverageStatus: "covered",
      categories: ["workflow", "route", "render", "guardrail"],
      knownTests: [
        "apps/web/tests/dossier-runtime-creation.test.ts",
        "apps/web/tests/dossier-runtime-admin-creation.test.tsx",
        "apps/web/tests/admin-review.page.test.tsx",
      ],
      missingTests: [],
      relatedCapabilityIds: ["handoff_integrity"],
      relatedHandoffLinkIds: ["review_queue_to_dossier_runtime"],
      nextSliceId: "V3-CLAIM-TO-DOSSIER-PIPELINE-01",
      guardrailNotes: [
        "Keine automatische Dossier-Erstellung",
      ],
    }),
    item({
      id: "review_to_anlassraum_runtime",
      label: "Workflow: Review -> Anlassraum Runtime",
      targetType: "workflow",
      coverageStatus: "covered",
      categories: ["workflow", "route", "render", "guardrail"],
      knownTests: [
        "apps/web/tests/anlassraum-runtime-creation.test.ts",
        "apps/web/tests/anlassraum-runtime-admin-creation.test.tsx",
        "apps/web/tests/admin-review.page.test.tsx",
      ],
      missingTests: [],
      relatedCapabilityIds: ["handoff_integrity"],
      relatedHandoffLinkIds: ["review_queue_to_anlassraum_runtime"],
      nextSliceId: "V3-LIVE-FORMAT-HOST-COCKPIT-01",
      guardrailNotes: [
        "Keine automatische Aktivierung",
      ],
    }),
    item({
      id: "review_to_participation_runtime",
      label: "Workflow: Review -> Beteiligungsraum Runtime",
      targetType: "workflow",
      coverageStatus: "covered",
      categories: ["workflow", "route", "render", "guardrail"],
      knownTests: [
        "apps/web/tests/participation-space-runtime-creation.test.ts",
        "apps/web/tests/participation-space-runtime-admin-creation.test.tsx",
        "apps/web/tests/admin-review.page.test.tsx",
      ],
      missingTests: [],
      relatedCapabilityIds: ["handoff_integrity"],
      relatedHandoffLinkIds: ["review_queue_to_participation_runtime"],
      nextSliceId: "V3-LIVE-PARTICIPATION-FORMATS-01",
      guardrailNotes: [
        "Keine automatische Public-Sichtbarkeit",
      ],
    }),
    item({
      id: "dossier_publish_workflow",
      label: "Workflow: Dossier Publish Workflow",
      targetType: "workflow",
      coverageStatus: "covered",
      categories: ["workflow", "route", "public_route", "guardrail"],
      knownTests: [
        "apps/web/tests/dossier-publish-workflow.test.ts",
        "apps/web/tests/dossier-publish-admin.test.tsx",
        "apps/web/tests/dossier-public-route-runtime.test.tsx",
      ],
      missingTests: [],
      relatedCapabilityIds: ["handoff_integrity"],
      relatedHandoffLinkIds: ["dossier_runtime_to_publish_workflow"],
      nextSliceId: "V3-DOSSIER-SOCIAL-OUTPUT-DRAFTS-01",
      guardrailNotes: [
        "Keine Verifikation durch Publish",
      ],
    }),
    item({
      id: "anlassraum_activation_publish_workflow",
      label: "Workflow: Anlassraum Activation / Publish",
      targetType: "workflow",
      coverageStatus: "covered",
      categories: ["workflow", "render", "public_route", "guardrail"],
      knownTests: [
        "apps/web/tests/anlassraum-activation-workflow.test.ts",
        "apps/web/tests/anlassraum-activation-admin.test.tsx",
        "apps/web/tests/runden-entry.service.test.ts",
      ],
      missingTests: [],
      relatedCapabilityIds: ["handoff_integrity"],
      relatedHandoffLinkIds: ["anlassraum_runtime_to_activation_workflow"],
      nextSliceId: "V3-LIVE-FORMAT-HOST-COCKPIT-01",
      guardrailNotes: [
        "Keine automatische Veröffentlichung",
      ],
    }),
    item({
      id: "participation_publish_public_route",
      label: "Workflow: Beteiligungsraum Publish / Public Route",
      targetType: "public_route",
      coverageStatus: "covered",
      categories: ["workflow", "render", "public_route", "guardrail"],
      knownTests: [
        "apps/web/tests/participation-space-publish-workflow.test.ts",
        "apps/web/tests/participation-space-publish-admin.test.tsx",
        "apps/web/tests/participation-space-public-detail-runtime.test.tsx",
      ],
      missingTests: [],
      relatedCapabilityIds: ["handoff_integrity"],
      relatedHandoffLinkIds: ["participation_runtime_to_publication_workflow"],
      nextSliceId: "V3-LIVE-PARTICIPATION-FORMATS-01",
      guardrailNotes: [
        "Keine automatische Aktivierung",
      ],
    }),
    item({
      id: "public_submission_to_community_source_review",
      label: "Public Route: Submission -> Community Source Review",
      targetType: "public_route",
      coverageStatus: "covered",
      categories: ["route", "workflow", "public_route", "guardrail"],
      knownTests: [
        "apps/web/tests/community-source-review-public-submission-hardening.test.ts",
        "apps/web/tests/community-source-review-public-submission-api.test.ts",
        "apps/web/tests/admin-review.page.test.tsx",
      ],
      missingTests: [],
      relatedCapabilityIds: ["handoff_integrity"],
      relatedHandoffLinkIds: ["public_submission_to_community_source_review"],
      nextSliceId: "V3-CLAIM-TO-DOSSIER-PIPELINE-01",
      guardrailNotes: [
        "Keine Wahrheit durch Public Submission",
      ],
    }),
    item({
      id: "community_source_review_to_admin_workbench",
      label: "Workflow: Community Source Review -> Admin Workbench",
      targetType: "workflow",
      coverageStatus: "covered",
      categories: ["render", "route", "workflow", "guardrail"],
      knownTests: [
        "apps/web/tests/community-source-review-moderation-ui.test.tsx",
        "apps/web/tests/community-source-review-contribution.test.ts",
        "apps/web/tests/admin-review.page.test.tsx",
      ],
      missingTests: [],
      relatedCapabilityIds: ["handoff_integrity"],
      relatedHandoffLinkIds: ["community_source_review_to_admin_review"],
      nextSliceId: "V3-CLAIM-TO-DOSSIER-PIPELINE-01",
      guardrailNotes: [
        "Moderation ersetzt keine Verifikation",
      ],
    }),
    item({
      id: "qr_share_public_entry",
      label: "Workflow: QR / Share / Public Entry",
      targetType: "public_route",
      coverageStatus: "partially_covered",
      categories: ["contract", "render", "public_route", "guardrail"],
      knownTests: [
        "apps/web/tests/event-qr-entry.contract.test.tsx",
        "apps/web/tests/live-qr-entry.contract.test.tsx",
        "apps/web/tests/share-metadata.contract.test.ts",
        "apps/web/tests/create-qr-swipes-drafts.contract.test.tsx",
      ],
      missingTests: [
        "Gemeinsame Regression von QR Studio zu Public Entry und Review-first Zielroute",
        "Browser-E2E fuer QR/Sharing ueber mehrere Runtime-Ziele",
      ],
      relatedCapabilityIds: ["qr_sharing_public_entry"],
      relatedHandoffLinkIds: ["runtime_entities_to_qr_and_sharing"],
      nextSliceId: "V3-QR-SHARING-PUBLIC-ENTRY-01",
      guardrailNotes: [
        "Kein Auto-Sharing",
      ],
    }),
    item({
      id: "social_output_drafts",
      label: "Workflow: Social / Output Drafts",
      targetType: "workflow",
      coverageStatus: "partially_covered",
      categories: ["contract", "workflow", "guardrail"],
      knownTests: [
        "apps/web/tests/output-engine-social-distribution.test.ts",
        "apps/web/tests/social-distribution-queue-readmodel.contract.test.ts",
        "apps/web/tests/social-scheduler-review-first.contract.test.ts",
        "apps/web/tests/dossier-studio-social-queue.contract.test.tsx",
      ],
      missingTests: [
        "Durchgehende Draft-Kette fuer Dossier, Round, Topic und Newsletter",
        "Browser-E2E fuer Social/Output Drafts ohne externe Posts",
      ],
      relatedCapabilityIds: ["live_claims_social_programm", "templates_output_standards"],
      relatedHandoffLinkIds: ["dossier_topic_round_to_social_outputs"],
      nextSliceId: "V3-DOSSIER-SOCIAL-OUTPUT-DRAFTS-01",
      guardrailNotes: [
        "Keine echten Social-Posts",
      ],
    }),
    item({
      id: "programme_candidate_pipeline",
      label: "Workflow: Programme Candidate Pipeline",
      targetType: "workflow",
      coverageStatus: "docs_only",
      categories: ["workflow"],
      knownTests: [],
      missingTests: [
        "Review-first Kandidatenpfad von Claims, Dossier-Signalen und Live-Folgen",
        "Admin- und Browser-Regression fuer Programm-Gates",
      ],
      relatedCapabilityIds: ["live_claims_social_programm"],
      relatedHandoffLinkIds: ["claims_and_signals_to_programm_candidates"],
      nextSliceId: "V3-PROGRAMM-GROWTH-APPROVAL-PIPELINE-01",
      guardrailNotes: [
        "Nur Zielbild, keine Laufzeittests",
      ],
    }),
    item({
      id: "live_stream_to_followup",
      label: "Workflow: Live / Stream -> Follow-up",
      targetType: "workflow",
      coverageStatus: "partially_covered",
      categories: ["contract", "workflow", "guardrail"],
      knownTests: [
        "apps/web/tests/stream-dossier-recap-handoff.contract.test.ts",
        "apps/web/tests/event-dossier-recap.contract.test.ts",
        "apps/web/tests/live-report-handoff.contract.test.tsx",
      ],
      missingTests: [
        "Host-Cockpit-Regression mit Claim-, Quellen- und Dossier-Follow-up",
        "Durchgehende Live-Nachbereitung ueber Review, Social und Programm",
      ],
      relatedCapabilityIds: ["live_claims_social_programm"],
      relatedHandoffLinkIds: ["live_session_to_claim_source_dossier_follow_up"],
      nextSliceId: "V3-LIVE-FORMAT-HOST-COCKPIT-01",
      guardrailNotes: [
        "Keine automatische Live-Freigabe",
      ],
    }),
    item({
      id: "no_auto_publish",
      label: "Guardrail: no_auto_publish",
      targetType: "guardrail",
      coverageStatus: "covered",
      categories: ["guardrail", "contract", "workflow"],
      knownTests: [
        "apps/web/tests/dossier-publish-workflow.test.ts",
        "apps/web/tests/participation-space-publish-workflow.test.ts",
        "apps/web/tests/social-no-autopublish.contract.test.ts",
        "apps/web/tests/operator-console-no-fake-actions.contract.test.ts",
      ],
      missingTests: [],
      relatedCapabilityIds: ["handoff_integrity", "live_claims_social_programm"],
      relatedHandoffLinkIds: [
        "dossier_runtime_to_publish_workflow",
        "anlassraum_runtime_to_activation_workflow",
        "participation_runtime_to_publication_workflow",
      ],
      nextSliceId: "V3-DOSSIER-SOCIAL-OUTPUT-DRAFTS-01",
      guardrailNotes: [
        "Guardrail ist real abgesichert",
      ],
    }),
    item({
      id: "no_auto_activation",
      label: "Guardrail: no_auto_activation",
      targetType: "guardrail",
      coverageStatus: "covered",
      categories: ["guardrail", "workflow", "contract"],
      knownTests: [
        "apps/web/tests/anlassraum-activation-workflow.test.ts",
        "apps/web/tests/participation-space-publish-workflow.test.ts",
        "apps/web/tests/v3-handoff-linkage-map.contract.test.ts",
      ],
      missingTests: [],
      relatedCapabilityIds: ["handoff_integrity"],
      relatedHandoffLinkIds: [
        "anlassraum_runtime_to_activation_workflow",
        "participation_runtime_to_publication_workflow",
      ],
      nextSliceId: "V3-LIVE-FORMAT-HOST-COCKPIT-01",
      guardrailNotes: [
        "Guardrail ist real abgesichert",
      ],
    }),
    item({
      id: "no_auto_factcheck",
      label: "Guardrail: no_auto_factcheck",
      targetType: "guardrail",
      coverageStatus: "covered",
      categories: ["guardrail", "contract", "route"],
      knownTests: [
        "apps/web/tests/create-factcheck-handoff.contract.test.ts",
        "apps/web/tests/factcheck-entitlement-gate.contract.test.ts",
        "apps/web/tests/research-review-guardrails.route.test.ts",
      ],
      missingTests: [],
      relatedCapabilityIds: ["claim_to_dossier_pipeline"],
      relatedHandoffLinkIds: ["create_claims_to_review_queue"],
      nextSliceId: "V3-CLAIM-TO-DOSSIER-PIPELINE-01",
      guardrailNotes: [
        "Guardrail ist real abgesichert",
      ],
    }),
    item({
      id: "no_auto_verification",
      label: "Guardrail: no_auto_verification",
      targetType: "guardrail",
      coverageStatus: "covered",
      categories: ["guardrail", "contract", "route"],
      knownTests: [
        "apps/web/tests/journalism-truth-guardrails.test.ts",
        "apps/web/tests/chat-route.contract.test.ts",
        "apps/web/tests/create-factcheck-handoff.contract.test.ts",
        "apps/web/tests/research-review-guardrails.route.test.ts",
      ],
      missingTests: [],
      relatedCapabilityIds: ["claim_to_dossier_pipeline", "prompt_based_low_ops"],
      relatedHandoffLinkIds: [],
      nextSliceId: "V3-CLAIM-TO-DOSSIER-PIPELINE-01",
      guardrailNotes: [
        "Guardrail ist real abgesichert",
      ],
    }),
    item({
      id: "no_auto_graph_write",
      label: "Guardrail: no_auto_graph_write",
      targetType: "guardrail",
      coverageStatus: "covered",
      categories: ["guardrail", "contract", "workflow"],
      knownTests: [
        "apps/web/tests/topic-graph-runtime.test.ts",
        "apps/web/tests/topic-graph-admin-approval-ui.test.tsx",
        "apps/web/tests/dialog-intelligence-runtime-bridge.test.ts",
      ],
      missingTests: [],
      relatedCapabilityIds: ["handoff_integrity"],
      relatedHandoffLinkIds: ["create_claims_to_review_queue"],
      nextSliceId: "V3-CLAIM-TO-DOSSIER-PIPELINE-01",
      guardrailNotes: [
        "Guardrail ist real abgesichert",
      ],
    }),
    item({
      id: "no_auto_merge",
      label: "Guardrail: no_auto_merge",
      targetType: "guardrail",
      coverageStatus: "covered",
      categories: ["guardrail", "contract", "workflow"],
      knownTests: [
        "apps/web/tests/topic-graph-runtime.test.ts",
        "apps/web/tests/topic-graph-admin-approval-ui.test.tsx",
        "apps/web/tests/v3-handoff-linkage-map.contract.test.ts",
      ],
      missingTests: [],
      relatedCapabilityIds: ["handoff_integrity"],
      relatedHandoffLinkIds: ["create_claims_to_review_queue"],
      nextSliceId: "V3-CLAIM-TO-DOSSIER-PIPELINE-01",
      guardrailNotes: [
        "Guardrail ist real abgesichert",
      ],
    }),
    item({
      id: "no_hidden_deepsearch",
      label: "Guardrail: no_hidden_deepsearch",
      targetType: "guardrail",
      coverageStatus: "covered",
      categories: ["guardrail", "contract", "route"],
      knownTests: [
        "apps/web/tests/ai-cost-research-guardrail.contract.test.ts",
        "apps/web/tests/material-extraction-cost-guardrail.contract.test.ts",
        "apps/web/tests/dialog-intelligence-runtime-bridge.test.ts",
        "apps/web/tests/create-factcheck-handoff.contract.test.ts",
      ],
      missingTests: [],
      relatedCapabilityIds: ["deepsearch_cost_governance", "prompt_based_low_ops"],
      relatedHandoffLinkIds: [],
      nextSliceId: "V3-DEEPSEARCH-COST-GOVERNANCE-01",
      guardrailNotes: [
        "Guardrail ist real abgesichert",
      ],
    }),
    item({
      id: "no_hidden_cost_paths",
      label: "Guardrail: no_hidden_cost_paths",
      targetType: "guardrail",
      coverageStatus: "covered",
      categories: ["guardrail", "contract", "route"],
      knownTests: [
        "apps/web/tests/pricing-no-hidden-ai-costs.contract.test.ts",
        "apps/web/tests/ai-cost-research-guardrail.contract.test.ts",
        "apps/web/tests/material-extraction-cost-guardrail.contract.test.ts",
        "apps/web/tests/admin-ai-usage.route.test.ts",
      ],
      missingTests: [],
      relatedCapabilityIds: ["pricing_credits_limits", "deepsearch_cost_governance"],
      relatedHandoffLinkIds: [],
      nextSliceId: "V3-PRICING-CREDITS-LIMITS-01",
      guardrailNotes: [
        "Guardrail ist real abgesichert",
      ],
    }),
    item({
      id: "no_fake_actions",
      label: "Guardrail: no_fake_actions",
      targetType: "guardrail",
      coverageStatus: "covered",
      categories: ["guardrail", "contract", "render"],
      knownTests: [
        "apps/web/tests/operator-console-no-fake-actions.contract.test.ts",
        "apps/web/tests/v3-control-center-admin.page.test.tsx",
        "apps/web/tests/v3-handoff-linkage-admin.page.test.tsx",
      ],
      missingTests: [],
      relatedCapabilityIds: ["admin_control_center", "test_results_regression"],
      relatedHandoffLinkIds: ["handoff_runtime_publish_to_control_center_visibility"],
      nextSliceId: "V3-EXTERNAL-BROWSER-E2E-01",
      guardrailNotes: [
        "Guardrail ist real abgesichert",
      ],
    }),
    item({
      id: "production_validation_workflow",
      label: "Production: Validation Workflow",
      targetType: "workflow",
      coverageStatus: "covered",
      categories: ["workflow", "smoke", "production_validation", "guardrail"],
      knownTests: [
        ".github/workflows/production-validation.yml",
        "apps/web/package.json#test:production-guardrails",
        "package.json#release:validate:production",
      ],
      missingTests: [],
      relatedCapabilityIds: ["test_results_regression"],
      relatedHandoffLinkIds: [],
      nextSliceId: "V3-EXTERNAL-BROWSER-E2E-01",
      guardrailNotes: [
        "Workflow ist real vorhanden",
        "Produktions-Workflow ersetzt keine Browser-E2E-Abdeckung",
      ],
    }),
    item({
      id: "external_browser_e2e",
      label: "Production: External Browser E2E",
      targetType: "workflow",
      coverageStatus: "partially_covered",
      categories: ["e2e", "smoke"],
      knownTests: [
        "apps/web/tests/e2e-critical-journeys.test.ts",
        "apps/web/tests/e2e/admin.spec.ts",
      ],
      missingTests: [
        "Verbindliche Browser-E2E-Einbindung in den V3-Validierungspfad",
        "Dossier-, Anlassraum-, Beteiligungsraum- und Live-Journeys als echte externe Browser-Läufe",
      ],
      relatedCapabilityIds: ["test_results_regression"],
      relatedHandoffLinkIds: [],
      nextSliceId: "V3-EXTERNAL-BROWSER-E2E-01",
      guardrailNotes: [
        "Teil-E2E ersetzt keine belastbare External-Browser-Abdeckung",
      ],
    }),
    item({
      id: "monitoring_alerting_rollback",
      label: "Production: Monitoring / Alerting / Rollback",
      targetType: "capability",
      coverageStatus: "smoke_only",
      categories: ["route", "smoke", "production_validation", "guardrail"],
      knownTests: [
        "apps/web/tests/admin-system-ping.route.test.ts",
        "apps/web/tests/admin-graph-health.route.test.ts",
        "apps/web/tests/admin-ai-telemetry-events.route.test.ts",
        "apps/web/tests/admin-ai-orchestrator-smoke.route.test.ts",
        "apps/web/tests/status-report-health-only.contract.test.ts",
      ],
      missingTests: [
        "Rollback-Regression mit Operator-Schritten und Wiederherstellung",
        "Alerting-/Incident-Flow mit Abschluss, Retry und Nachaudit",
      ],
      relatedCapabilityIds: ["monitoring_alerting_rollback", "incident_recovery_maintenance"],
      relatedHandoffLinkIds: [],
      nextSliceId: "V3-MONITORING-ALERTING-ROLLBACK-01",
      guardrailNotes: [
        "Smoke ist keine Rollback-Parität",
      ],
    }),
  ] satisfies V3TestMatrixItem[];

  return {
    generatedAt: "2026-07-02T00:00:00.000Z",
    items,
    summary: {
      total: items.length,
      covered: items.filter((entry) => entry.coverageStatus === "covered").length,
      partiallyCovered: items.filter((entry) => entry.coverageStatus === "partially_covered").length,
      smokeOnly: items.filter((entry) => entry.coverageStatus === "smoke_only").length,
      missing: items.filter((entry) => entry.coverageStatus === "missing").length,
      docsOnly: items.filter((entry) => entry.coverageStatus === "docs_only").length,
      blocksEndstateReadyCount: items.filter((entry) => entry.blocksEndstateReady).length,
      guardrailCoverageCount: items.filter(
        (entry) => entry.targetType === "guardrail" && entry.coverageStatus === "covered",
      ).length,
      e2eMissingCount: items.filter(
        (entry) => entry.categories.includes("e2e") && entry.coverageStatus !== "covered",
      ).length,
    },
    criticalTestGaps: [
      {
        label: "External Browser E2E",
        nextSliceId: "V3-EXTERNAL-BROWSER-E2E-01",
        reason:
          "Es gibt einzelne E2E-Dateien, aber keine belastbare External-Browser-Abdeckung fuer die kritischen V3-Journeys.",
      },
      {
        label: "Programm Candidate Pipeline",
        nextSliceId: "V3-PROGRAMM-GROWTH-APPROVAL-PIPELINE-01",
        reason:
          "Der Programm-Kandidatenpfad ist kanonisiert, aber noch nicht als Runtime- oder Testkette gebaut.",
      },
      {
        label: "Social Output Drafts",
        nextSliceId: "V3-DOSSIER-SOCIAL-OUTPUT-DRAFTS-01",
        reason:
          "Social- und Output-Drafts haben reale Teiltests, aber keine gemeinsame V3-End-to-End-Abdeckung.",
      },
      {
        label: "Live / Claims Follow-up",
        nextSliceId: "V3-LIVE-FORMAT-HOST-COCKPIT-01",
        reason:
          "Live-, Claim- und Nachbereitungs-Flows sind nur fragmentarisch abgesichert und noch nicht als gemeinsamer Operator-Lauf getestet.",
      },
      {
        label: "Notifications / Incident / Recovery",
        nextSliceId: "V3-INCIDENT-RECOVERY-MAINTENANCE-01",
        reason:
          "Mail-, Health- und Smoke-Bausteine sind real, aber keine durchgehende Incident- und Notification-Regression.",
      },
      {
        label: "Pricing / Credit Consumption Truth",
        nextSliceId: "V3-DEEPSEARCH-COST-GOVERNANCE-01",
        reason:
          "Pricing-, Entitlement- und Cost-Gate-Basis ist jetzt sichtbar, aber eine V3-weite Credit- und Verbrauchswahrheit fehlt noch.",
      },
    ],
  };
}
