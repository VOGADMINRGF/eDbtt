export const V3_HANDOFF_LINK_IDS = [
  "create_claims_to_review_queue",
  "review_queue_to_dossier_runtime",
  "review_queue_to_anlassraum_runtime",
  "review_queue_to_participation_runtime",
  "dossier_runtime_to_publish_workflow",
  "anlassraum_runtime_to_activation_workflow",
  "participation_runtime_to_publication_workflow",
  "published_dossier_to_public_route_and_share",
  "published_anlassraum_to_public_round",
  "published_participation_to_public_route",
  "public_submission_to_community_source_review",
  "community_source_review_to_admin_review",
  "runtime_entities_to_qr_and_sharing",
  "dossier_topic_round_to_social_outputs",
  "claims_and_signals_to_programm_candidates",
  "live_session_to_claim_source_dossier_follow_up",
  "meeting_link_to_live_or_anlassraum_context",
  "handoff_runtime_publish_to_control_center_visibility",
] as const;

export type V3HandoffLinkId = (typeof V3_HANDOFF_LINK_IDS)[number];

export type V3HandoffLinkStatus =
  | "wired"
  | "partially_wired"
  | "planned"
  | "blocked"
  | "docs_only";

export const V3_HANDOFF_LINK_REAL_HREFS = [
  "/admin",
  "/admin/review",
  "/admin/create/attach-drafts/history-maintenance",
  "/admin/campaigns",
  "/atlas/social-review",
  "/create",
  "/dossier",
  "/runden",
  "/beteiligung",
  "/stream",
  "/qr-studio",
] as const;

export type V3HandoffLinkHref = (typeof V3_HANDOFF_LINK_REAL_HREFS)[number];

export type V3HandoffLink = {
  id: V3HandoffLinkId;
  label: string;
  from: string;
  to: string;
  status: V3HandoffLinkStatus;
  maturityTarget: "endstate_ready";
  currentEvidence: string[];
  adminHref?: V3HandoffLinkHref;
  publicHref?: V3HandoffLinkHref;
  tests: string[];
  gap: string;
  nextSliceId: string;
  guardrails: string[];
};

export type V3HandoffLinkageMap = {
  generatedAt: string;
  links: V3HandoffLink[];
  summary: {
    total: number;
    wired: number;
    partiallyWired: number;
    planned: number;
    docsOnly: number;
    blocked: number;
    endstateReadyCount: number;
    needsAttentionCount: number;
  };
  guardrailNote: string;
  criticalNextGaps: Array<{
    label: string;
    nextSliceId: string;
    reason: string;
  }>;
};

const DEFAULT_GUARDRAILS = [
  "Kein Auto-Publish",
  "Keine Auto-Graph-Write",
  "Keine Auto-Merge",
  "Keine hidden Cost Paths",
] as const;

function link(input: Omit<V3HandoffLink, "maturityTarget">): V3HandoffLink {
  return {
    ...input,
    maturityTarget: "endstate_ready",
  };
}

export function buildV3HandoffLinkageMap(): V3HandoffLinkageMap {
  const links = [
    link({
      id: "create_claims_to_review_queue",
      label: "A. Create / Analyze / Claims -> Editorial Review Queue",
      from: "Create / Analyze / Claims",
      to: "Editorial Review Queue",
      status: "wired",
      currentEvidence: [
        "apps/web/src/features/create/createHandoffReviewQueueRuntimeBridge.ts",
        "apps/web/src/features/create/persistedHandoffReviewQueue.ts",
        "apps/web/src/app/api/create/handoffs/route.ts",
        "apps/web/src/app/admin/review/page.tsx",
      ],
      adminHref: "/admin/review",
      publicHref: "/create",
      tests: [
        "apps/web/tests/create-handoff.persistence.route.test.ts",
        "apps/web/tests/admin-review.page.test.tsx",
        "apps/web/tests/dialog-intelligence-contract.test.ts",
      ],
      gap:
        "Die Übergabe ist real verdrahtet, aber noch nicht als Ende-zu-Ende-Integritätskarte mit Drift- und Fehlermodus-Sicht im Admin gebündelt.",
      nextSliceId: "V3-CLAIM-TO-DOSSIER-PIPELINE-01",
      guardrails: [
        ...DEFAULT_GUARDRAILS,
        "Kein Review-Bypass aus Create",
      ],
    }),
    link({
      id: "review_queue_to_dossier_runtime",
      label: "B. Editorial Review Queue -> Dossier Runtime Creation",
      from: "Editorial Review Queue",
      to: "Dossier Runtime Creation",
      status: "wired",
      currentEvidence: [
        "apps/web/src/features/create/dossierRuntime.ts",
        "apps/web/src/app/admin/review/AdminDossierRuntimeCreationSection.tsx",
        "apps/web/src/app/api/admin/dossier-runtime/[sourceHandoffId]/route.ts",
      ],
      adminHref: "/admin/review",
      tests: [
        "apps/web/tests/dossier-runtime-creation.test.ts",
        "apps/web/tests/dossier-runtime-admin-creation.test.tsx",
        "apps/web/tests/admin-review.page.test.tsx",
      ],
      gap:
        "Die Runtime-Erstellung ist review-first vorhanden, aber noch nicht zusammen mit Publish-, Public- und Follow-up-Stufen als eine prüfbare Kette sichtbar.",
      nextSliceId: "V3-CLAIM-TO-DOSSIER-PIPELINE-01",
      guardrails: [
        ...DEFAULT_GUARDRAILS,
        "Keine automatische Dossier-Erstellung",
      ],
    }),
    link({
      id: "review_queue_to_anlassraum_runtime",
      label: "C. Editorial Review Queue -> Anlassraum Runtime Creation",
      from: "Editorial Review Queue",
      to: "Anlassraum Runtime Creation",
      status: "wired",
      currentEvidence: [
        "apps/web/src/features/create/anlassraumRuntime.ts",
        "apps/web/src/app/admin/review/AdminAnlassraumRuntimeCreationSection.tsx",
        "apps/web/src/app/api/admin/anlassraum-runtime/[sourceHandoffId]/route.ts",
      ],
      adminHref: "/admin/review",
      tests: [
        "apps/web/tests/anlassraum-runtime-creation.test.ts",
        "apps/web/tests/anlassraum-runtime-admin-creation.test.tsx",
        "apps/web/tests/admin-review.page.test.tsx",
      ],
      gap:
        "Create-zu-Anlassraum ist review-first wired, aber die Kette bis Aktivierung, Public-Round und Live-Follow-up ist noch nicht als gemeinsamer Integritätspfad abgeschlossen.",
      nextSliceId: "V3-LIVE-FORMAT-HOST-COCKPIT-01",
      guardrails: [
        ...DEFAULT_GUARDRAILS,
        "Keine automatische Aktivierung",
      ],
    }),
    link({
      id: "review_queue_to_participation_runtime",
      label: "D. Editorial Review Queue -> Beteiligungsraum Runtime Creation",
      from: "Editorial Review Queue",
      to: "Beteiligungsraum Runtime Creation",
      status: "wired",
      currentEvidence: [
        "apps/web/src/features/create/participationSpaceRuntime.ts",
        "apps/web/src/app/admin/review/AdminParticipationSpaceRuntimeCreationSection.tsx",
        "apps/web/src/app/api/admin/participation-space-runtime/[sourceHandoffId]/route.ts",
      ],
      adminHref: "/admin/review",
      tests: [
        "apps/web/tests/participation-space-runtime-creation.test.ts",
        "apps/web/tests/participation-space-runtime-admin-creation.test.tsx",
        "apps/web/tests/admin-review.page.test.tsx",
      ],
      gap:
        "Die Runtime-Creation steht, aber Verknüpfung zu Public-, QR- und Format-Follow-ups bleibt über mehrere Teilpfade verteilt.",
      nextSliceId: "V3-LIVE-PARTICIPATION-FORMATS-01",
      guardrails: [
        ...DEFAULT_GUARDRAILS,
        "Keine automatische Public-Sichtbarkeit",
      ],
    }),
    link({
      id: "dossier_runtime_to_publish_workflow",
      label: "E. Dossier Runtime -> Dossier Publish Workflow",
      from: "Dossier Runtime",
      to: "Dossier Publish Workflow",
      status: "wired",
      currentEvidence: [
        "apps/web/src/app/admin/review/loadAdminDossierPublishSectionProps.ts",
        "apps/web/src/app/admin/review/AdminDossierPublishSection.tsx",
        "apps/web/src/features/create/dossierPublishWorkflowServer.ts",
      ],
      adminHref: "/admin/review",
      tests: [
        "apps/web/tests/dossier-publish-workflow.test.ts",
        "apps/web/tests/dossier-public-route-runtime.test.tsx",
      ],
      gap:
        "Publish ist separat und ehrlich verdrahtet, aber Social-, QR- und Programmkandidaten hängen noch nicht sichtbar an derselben Handoff-Landkarte.",
      nextSliceId: "V3-DOSSIER-SOCIAL-OUTPUT-DRAFTS-01",
      guardrails: [
        ...DEFAULT_GUARDRAILS,
        "Keine Verifikation durch Publish-Freigabe",
      ],
    }),
    link({
      id: "anlassraum_runtime_to_activation_workflow",
      label: "F. Anlassraum Runtime -> Activation / Publish Workflow",
      from: "Anlassraum Runtime",
      to: "Activation / Publish Workflow",
      status: "wired",
      currentEvidence: [
        "apps/web/src/app/admin/review/loadAdminAnlassraumActivationSectionProps.ts",
        "apps/web/src/app/admin/review/AdminAnlassraumActivationSection.tsx",
        "apps/web/src/features/create/anlassraumActivationWorkflowServer.ts",
      ],
      adminHref: "/admin/review",
      publicHref: "/runden",
      tests: [
        "apps/web/tests/anlassraum-activation-workflow.test.ts",
        "apps/web/tests/anlassraum-activation-admin.test.tsx",
        "apps/web/tests/runden-entry.service.test.ts",
      ],
      gap:
        "Aktivierung und Public-Round sind belegt, aber QR-, Live- und Output-Nachbereitung liegen noch nicht als gemeinsame Admin-Integrity-Sicht vor.",
      nextSliceId: "V3-LIVE-FORMAT-HOST-COCKPIT-01",
      guardrails: [
        ...DEFAULT_GUARDRAILS,
        "Keine automatische Round-Erstellung außerhalb der Review-Gates",
      ],
    }),
    link({
      id: "participation_runtime_to_publication_workflow",
      label: "G. Beteiligungsraum Runtime -> Publish / Public Route",
      from: "Beteiligungsraum Runtime",
      to: "Publish / Public Route",
      status: "wired",
      currentEvidence: [
        "apps/web/src/app/admin/review/loadAdminParticipationSpacePublishSectionProps.ts",
        "apps/web/src/app/admin/review/AdminParticipationSpacePublishSection.tsx",
        "apps/web/src/features/create/participationSpaceRuntimeServer.ts",
      ],
      adminHref: "/admin/review",
      publicHref: "/beteiligung",
      tests: [
        "apps/web/tests/participation-space-publish-workflow.test.ts",
        "apps/web/tests/participation-space-public-detail-runtime.test.tsx",
      ],
      gap:
        "Public-Publish ist real belegt, aber Format-, QR- und Moderationsanschlüsse sind noch nicht als gemeinsamer Folgepfad zusammengezogen.",
      nextSliceId: "V3-LIVE-PARTICIPATION-FORMATS-01",
      guardrails: [
        ...DEFAULT_GUARDRAILS,
        "Keine automatische Aktivierung",
      ],
    }),
    link({
      id: "published_dossier_to_public_route_and_share",
      label: "H. Published Dossier -> Public Dossier Route / Share Output",
      from: "Published Dossier",
      to: "Public Dossier Route / Share Output",
      status: "partially_wired",
      currentEvidence: [
        "apps/web/src/app/dossier/[id]/page.tsx",
        "apps/web/src/app/dossier/[id]/studio/page.tsx",
        "apps/web/src/app/api/dossier/[id]/studio/workspace/route.ts",
      ],
      adminHref: "/atlas/social-review",
      publicHref: "/dossier",
      tests: [
        "apps/web/tests/dossier-public-route-runtime.test.tsx",
        "apps/web/tests/output-engine-social-distribution.test.ts",
        "apps/web/tests/dossier-studio-server-persistence-ui.test.tsx",
      ],
      gap:
        "Public-Dossier und Social-Draft-Bausteine sind real, aber noch nicht als ein gemeinsamer Share-/Output-Linkage-Hub mit Rückverweis auf Publish und Review geschlossen.",
      nextSliceId: "V3-DOSSIER-SOCIAL-OUTPUT-DRAFTS-01",
      guardrails: [
        ...DEFAULT_GUARDRAILS,
        "Keine echten Social-Posts",
      ],
    }),
    link({
      id: "published_anlassraum_to_public_round",
      label: "I. Published Anlassraum -> Public Round / Runden Route",
      from: "Published Anlassraum",
      to: "Public Round / Runden Route",
      status: "wired",
      currentEvidence: [
        "apps/web/src/app/runden/page.tsx",
        "apps/web/src/app/runden/RundenPublicSharingGuide.tsx",
        "apps/web/src/features/material/materialExtractionJobs.ts",
      ],
      adminHref: "/admin/review",
      publicHref: "/runden",
      tests: [
        "apps/web/tests/runden-entry.service.test.ts",
        "apps/web/tests/create-anlassraum-routing.contract.test.ts",
      ],
      gap:
        "Die Public-Round ist erreichbar, aber es fehlt noch die gemeinsame Integrity-Sicht mit QR-, Live- und Output-Folgepfaden.",
      nextSliceId: "V3-QR-SHARING-PUBLIC-ENTRY-01",
      guardrails: [
        ...DEFAULT_GUARDRAILS,
        "Keine automatische Folgekette in Live oder Social",
      ],
    }),
    link({
      id: "published_participation_to_public_route",
      label: "J. Published Beteiligungsraum -> /beteiligung Public Route",
      from: "Published Beteiligungsraum",
      to: "/beteiligung Public Route",
      status: "wired",
      currentEvidence: [
        "apps/web/src/app/beteiligung/[slug]/page.tsx",
        "apps/web/src/features/participation/publicParticipationSpaceRuntime.ts",
        "apps/web/src/features/participation/publicParticipationSpaceShell.tsx",
      ],
      adminHref: "/admin/review",
      publicHref: "/beteiligung",
      tests: [
        "apps/web/tests/participation-space-public-detail-runtime.test.tsx",
        "apps/web/tests/community-source-review-public-submission-hardening.test.ts",
      ],
      gap:
        "Die Public-Detailroute ist real vorhanden, aber QR-, Live- und Kandidaten-Folgepfade sind noch nicht als gemeinsames Zielbild verbunden.",
      nextSliceId: "V3-QR-SHARING-PUBLIC-ENTRY-01",
      guardrails: [
        ...DEFAULT_GUARDRAILS,
        "Keine öffentliche Wahrheit durch Sichtbarkeit",
      ],
    }),
    link({
      id: "public_submission_to_community_source_review",
      label: "K. Public Submission -> Community Source Review",
      from: "Public Submission",
      to: "Community Source Review",
      status: "wired",
      currentEvidence: [
        "apps/web/src/features/participation/PublicCommunitySourceSubmissionForm.tsx",
        "apps/web/src/app/api/community/source-review/submissions/route.ts",
        "apps/web/src/features/create/communitySourceReviewPublicSubmission.ts",
      ],
      adminHref: "/admin/review",
      publicHref: "/beteiligung",
      tests: [
        "apps/web/tests/community-source-review-public-submission-hardening.test.ts",
        "apps/web/tests/community-source-review-public-submission-api.test.ts",
      ],
      gap:
        "Public-Submission ist review-first gehärtet, aber der anschließende Claim-, Dossier- und Programm-Follow-up bleibt verteilt.",
      nextSliceId: "V3-CLAIM-TO-DOSSIER-PIPELINE-01",
      guardrails: [
        ...DEFAULT_GUARDRAILS,
        "Keine Verifikation durch öffentliche Einreichung",
      ],
    }),
    link({
      id: "community_source_review_to_admin_review",
      label: "L. Community Source Review -> Admin Review Workbench",
      from: "Community Source Review",
      to: "Admin Review Workbench",
      status: "wired",
      currentEvidence: [
        "apps/web/src/app/admin/review/AdminCommunitySourceReviewSection.tsx",
        "apps/web/src/app/admin/review/loadAdminCommunitySourceReviewSectionProps.ts",
        "apps/web/src/app/api/admin/community-source-review/[contributionId]/route.ts",
      ],
      adminHref: "/admin/review",
      tests: [
        "apps/web/tests/community-source-review-contribution.test.ts",
        "apps/web/tests/community-source-review-moderation-ui.test.tsx",
        "apps/web/tests/admin-review.page.test.tsx",
      ],
      gap:
        "Die Admin-Workbench ist real, aber der Übergang von moderiertem Hinweis zu Claim-, Dossier- oder Publish-Folgepfaden bleibt noch nicht zentral kartiert.",
      nextSliceId: "V3-CLAIM-TO-DOSSIER-PIPELINE-01",
      guardrails: [
        ...DEFAULT_GUARDRAILS,
        "Keine Wahrheit durch Moderationsannahme",
      ],
    }),
    link({
      id: "runtime_entities_to_qr_and_sharing",
      label: "M. Dossier / Anlassraum / Beteiligungsraum -> QR / Sharing",
      from: "Dossier / Anlassraum / Beteiligungsraum",
      to: "QR / Sharing",
      status: "partially_wired",
      currentEvidence: [
        "apps/web/src/app/qr-studio/page.tsx",
        "apps/web/src/app/api/qr/sets/route.ts",
        "apps/web/src/app/runden/RundenShareActions.tsx",
      ],
      adminHref: "/qr-studio",
      publicHref: "/runden",
      tests: [
        "apps/web/tests/event-qr-entry.contract.test.tsx",
        "apps/web/tests/live-qr-entry.contract.test.tsx",
        "apps/web/tests/themenradar-share-distribution.contract.test.ts",
      ],
      gap:
        "QR- und Sharing-Bausteine existieren, aber es fehlt eine saubere Linkage-Wahrheit von Runtime-Ziel über QR-Set bis Public-Entry und Moderationskontext.",
      nextSliceId: "V3-QR-SHARING-PUBLIC-ENTRY-01",
      guardrails: [
        ...DEFAULT_GUARDRAILS,
        "Keine QR-Neugenerierung als Pflicht",
      ],
    }),
    link({
      id: "dossier_topic_round_to_social_outputs",
      label: "N. Dossier / Topic / Round -> Social / Output Drafts",
      from: "Dossier / Topic / Round",
      to: "Social / Output Drafts",
      status: "partially_wired",
      currentEvidence: [
        "apps/web/src/components/outputEngine/SocialDistributionPanel.tsx",
        "apps/web/src/app/atlas/social-review/page.tsx",
        "apps/web/src/app/api/admin/feeds/anlassraum/[id]/outputs/route.ts",
      ],
      adminHref: "/atlas/social-review",
      publicHref: "/dossier",
      tests: [
        "apps/web/tests/output-engine-social-distribution.test.ts",
        "apps/web/tests/themenradar-share-distribution.contract.test.ts",
        "apps/web/tests/anlassraum-output-prep.routes.test.ts",
      ],
      gap:
        "Output- und Social-Drafts sind vorhanden, aber Dossier-, Topic- und Round-Folgen sind noch nicht als gemeinsamer Queue-/Approval-Pfad bis zur Veröffentlichungsvorbereitung harmonisiert.",
      nextSliceId: "V3-DOSSIER-SOCIAL-OUTPUT-DRAFTS-01",
      guardrails: [
        ...DEFAULT_GUARDRAILS,
        "Keine echten Social-Posts",
      ],
    }),
    link({
      id: "claims_and_signals_to_programm_candidates",
      label: "O. Claims / Dossier Signals -> Programm Candidate Pipeline",
      from: "Claims / Dossier Signals",
      to: "Programm Candidate Pipeline",
      status: "planned",
      currentEvidence: [
        "docs/E150/V3_LIVE_CLAIMS_SOCIAL_PROGRAMM_ENDSTATE_2026-07-02.md",
        "docs/E150/V3_TOTAL_SCOPE_READINESS_MAP_2026-07-01.md",
      ],
      tests: [
        "apps/web/tests/event-dossier-recap.contract.test.ts",
      ],
      gap:
        "Es gibt programmnahe Endstate- und Follow-up-Belege, aber noch keinen echten Admin-/Runtime-Pfad, der Kandidaten review-first sammelt, sichtbarmacht und begründet weiterführt.",
      nextSliceId: "V3-PROGRAMM-GROWTH-APPROVAL-PIPELINE-01",
      guardrails: [
        ...DEFAULT_GUARDRAILS,
        "Keine Programm-Auto-Freigabe",
      ],
    }),
    link({
      id: "live_session_to_claim_source_dossier_follow_up",
      label: "P. Live Session / Stream -> Claim / Source / Dossier Follow-up",
      from: "Live Session / Stream",
      to: "Claim / Source / Dossier Follow-up",
      status: "partially_wired",
      currentEvidence: [
        "apps/web/src/app/stream/[slug]/page.tsx",
        "apps/web/src/app/stream/StreamPublicInputPanel.tsx",
        "apps/web/src/app/stream/page.tsx",
      ],
      adminHref: "/admin/campaigns",
      publicHref: "/stream",
      tests: [
        "apps/web/tests/stream-dossier-recap-handoff.contract.test.ts",
        "apps/web/tests/event-dossier-recap.contract.test.ts",
        "apps/web/tests/live-campaign-entry.contract.test.ts",
      ],
      gap:
        "Stream- und Event-Follow-ups sind real vorbereitet, aber Claims, Quellen, Dossier, Social und Programm laufen noch nicht über ein gemeinsames Host-/Nachbereitungs-Cockpit.",
      nextSliceId: "V3-LIVE-FORMAT-HOST-COCKPIT-01",
      guardrails: [
        ...DEFAULT_GUARDRAILS,
        "Keine echten Social-Posts",
      ],
    }),
    link({
      id: "meeting_link_to_live_or_anlassraum_context",
      label: "Q. Meeting Link -> Live/Anlassraum Context",
      from: "Meeting Link",
      to: "Live/Anlassraum Context",
      status: "planned",
      currentEvidence: [
        "docs/E150/V3_LIVE_CLAIMS_SOCIAL_PROGRAMM_ENDSTATE_2026-07-02.md",
        "apps/web/src/features/material/materialExtractionJobs.ts",
      ],
      tests: [
        "apps/web/tests/stream-dossier-recap-handoff.contract.test.ts",
      ],
      gap:
        "Meeting-Link-Integration ist nur als optionaler Folgepfad kanonisiert; es gibt noch keinen eigenständigen Live-/Anlassraum-Kontext-Hub mit Admin-Sicht und Guardrail-Tests.",
      nextSliceId: "V3-MEETING-LINK-INTEGRATION-LIGHT-01",
      guardrails: [
        ...DEFAULT_GUARDRAILS,
        "Keine Meeting-Connectoren",
      ],
    }),
    link({
      id: "handoff_runtime_publish_to_control_center_visibility",
      label: "R. Handoff/Publish/Runtime -> V3 Control Center Visibility",
      from: "Handoff / Runtime / Publish",
      to: "V3 Control Center Visibility",
      status: "wired",
      currentEvidence: [
        "apps/web/src/app/admin/page.tsx",
        "apps/web/src/features/admin/v3ControlCenterReadModel.ts",
        "apps/web/src/features/admin/v3HandoffLinkageMap.ts",
      ],
      adminHref: "/admin",
      tests: [
        "apps/web/tests/v3-control-center-admin.page.test.tsx",
        "apps/web/tests/v3-handoff-linkage-admin.page.test.tsx",
      ],
      gap:
        "Die Sichtbarkeit ist jetzt real vorhanden, aber die einzelnen Zielpfade bleiben bewusst offen, bis ihre Fachziele mindestens endstate_ready erreichen.",
      nextSliceId: "V3-TEST-RESULTS-REGRESSION-MATRIX-01",
      guardrails: [
        ...DEFAULT_GUARDRAILS,
        "Linkage ist Sichtbarkeit, keine automatische Ausführung",
      ],
    }),
  ] satisfies V3HandoffLink[];

  const summary = {
    total: links.length,
    wired: links.filter((entry) => entry.status === "wired").length,
    partiallyWired: links.filter((entry) => entry.status === "partially_wired").length,
    planned: links.filter((entry) => entry.status === "planned").length,
    docsOnly: links.filter((entry) => entry.status === "docs_only").length,
    blocked: links.filter((entry) => entry.status === "blocked").length,
    endstateReadyCount: 0,
    needsAttentionCount: links.filter((entry) => entry.status !== "wired").length,
  };

  return {
    generatedAt: "2026-07-02T00:00:00.000Z",
    links,
    summary,
    guardrailNote:
      "Linkage zeigt Verbindungen, keine Wahrheit, keine automatische Veröffentlichung.",
    criticalNextGaps: [
      {
        label: "Programm Candidate Pipeline",
        nextSliceId: "V3-PROGRAMM-GROWTH-APPROVAL-PIPELINE-01",
        reason:
          "Claims, Dossier-Signale und Live-Folgen haben noch keinen gemeinsamen review-first Kandidatenpfad.",
      },
      {
        label: "Social / Output Drafts",
        nextSliceId: "V3-DOSSIER-SOCIAL-OUTPUT-DRAFTS-01",
        reason:
          "Output- und Social-Drafts existieren, aber Dossier-, Topic- und Round-Folgen sind noch nicht als eine Kette sichtbar.",
      },
      {
        label: "QR / Sharing Integrity",
        nextSliceId: "V3-QR-SHARING-PUBLIC-ENTRY-01",
        reason:
          "QR-, Share- und Public-Entry-Pfade sind real, aber noch nicht als gemeinsame Zielkette kartiert.",
      },
      {
        label: "Live / Claims Follow-up",
        nextSliceId: "V3-LIVE-FORMAT-HOST-COCKPIT-01",
        reason:
          "Live-, Stream- und Event-Folgen brauchen noch eine sichtbare Host- und Nachbereitungssicht.",
      },
      {
        label: "Meeting Link Integration optional",
        nextSliceId: "V3-MEETING-LINK-INTEGRATION-LIGHT-01",
        reason:
          "Meeting-Link-Kontext ist bewusst optional und bisher nur als geplanter Folgepfad kanonisiert.",
      },
    ],
  };
}
