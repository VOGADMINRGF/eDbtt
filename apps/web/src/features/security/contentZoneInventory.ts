export type PIIZone = "pii_possible" | "pii_not_expected";

export type ContentRiskZone =
  | "public_content"
  | "review_only"
  | "organization_private"
  | "operator_only"
  | "source_material";

export type AIProcessingZone = "ai_processing_allowed" | "ai_processing_restricted";

export type HighImpactAuditRequirement =
  | "high_impact_requires_audit"
  | "standard_audit";

export type ContentZoneSurfaceType =
  | "api_route"
  | "app_route"
  | "feature_service"
  | "readmodel";

export type ContentZoneSourceAnchor = {
  file: string;
  contains: string[];
};

export type ContentZonePublicationGuard = {
  noAutoPublish: true;
  noAutomaticPublicOfficial: true;
  noPublicPiiLeakage: true;
  reviewOnlyStaysInternal: true;
  publicLinksRequireVisibleState: boolean;
  sourceMaterialStaysReviewOnly: true;
  aiOutputsStayReviewFirst: true;
};

export type ContentZoneAiGuard = {
  deepSearchResearchExplicitOnly: boolean;
  automaticResearchCosts: false;
  processingZone: AIProcessingZone;
};

export type ContentZoneAuditCoverage = {
  requirement: HighImpactAuditRequirement;
  unifiedAuditReadsideVisible: boolean;
  unifiedAuditSources: Array<
    "create_handoff" | "review_operations" | "source_results" | "content_release" | "official_release"
  >;
  highImpactActions: string[];
};

export type ContentZoneEntry = {
  id: string;
  label: string;
  surface: string;
  surfaceType: ContentZoneSurfaceType;
  piiZone: PIIZone;
  contentZones: ContentRiskZone[];
  aiZone: AIProcessingZone;
  publicationGuard: ContentZonePublicationGuard;
  aiGuard: ContentZoneAiGuard;
  auditCoverage: ContentZoneAuditCoverage;
  notes: string;
  sourceAnchors: ContentZoneSourceAnchor[];
};

export type ContentZoneInventory = {
  id: "GOV-SEC-03";
  version: "2026-05-21";
  derivedFrom: string[];
  entries: ContentZoneEntry[];
};

const ENTRIES: ContentZoneEntry[] = [
  {
    id: "create_input_surface",
    label: "Create Eingaben / Analyze / Material",
    surface: "/api/contributions/analyze",
    surfaceType: "api_route",
    piiZone: "pii_possible",
    contentZones: ["review_only", "source_material"],
    aiZone: "ai_processing_allowed",
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      noPublicPiiLeakage: true,
      reviewOnlyStaysInternal: true,
      publicLinksRequireVisibleState: true,
      sourceMaterialStaysReviewOnly: true,
      aiOutputsStayReviewFirst: true,
    },
    aiGuard: {
      deepSearchResearchExplicitOnly: true,
      automaticResearchCosts: false,
      processingZone: "ai_processing_allowed",
    },
    auditCoverage: {
      requirement: "high_impact_requires_audit",
      unifiedAuditReadsideVisible: false,
      unifiedAuditSources: [],
      highImpactActions: [
        "ai_analyze_request",
        "pii_redaction_required",
        "deep_search_confirmation_required",
      ],
    },
    notes:
      "Create-Eingaben können personenbezogene Hinweise, Quellenmaterial und AI-Analyse enthalten, bleiben aber review-first. DeepSearch/Research bleibt explizit bestätigt und AI-Ausgaben erzeugen keine Veröffentlichung.",
    sourceAnchors: [
      {
        file: "apps/web/src/features/create/safety/createInputSafety.ts",
        contains: [
          'noAutoPublish: true;',
          'decision === "moderation_required"',
          'requiresHumanReview: boolean;',
        ],
      },
      {
        file: "apps/web/src/app/api/contributions/analyze/route.ts",
        contains: [
          "allowDeepSearch: body.allowDeepSearch",
          "requiresHumanReview = resolveMetaRequiresHumanReview({",
          "noAutoPublish: true as const",
        ],
      },
      {
        file: "apps/web/src/features/create/materialRouting.ts",
        contains: [
          "const allowDeepSearch = parseBool(input.allowDeepSearch, false);",
          'researchUsed = "deep_search";',
          "requiresHumanReview = true;",
        ],
      },
    ],
  },
  {
    id: "create_save_surface",
    label: "Create Save Draft",
    surface: "/api/contributions/save",
    surfaceType: "api_route",
    piiZone: "pii_possible",
    contentZones: ["organization_private", "review_only", "source_material"],
    aiZone: "ai_processing_restricted",
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      noPublicPiiLeakage: true,
      reviewOnlyStaysInternal: true,
      publicLinksRequireVisibleState: true,
      sourceMaterialStaysReviewOnly: true,
      aiOutputsStayReviewFirst: true,
    },
    aiGuard: {
      deepSearchResearchExplicitOnly: false,
      automaticResearchCosts: false,
      processingZone: "ai_processing_restricted",
    },
    auditCoverage: {
      requirement: "standard_audit",
      unifiedAuditReadsideVisible: false,
      unifiedAuditSources: [],
      highImpactActions: ["draft_save_requires_valid_session", "blocked_input_not_persisted_publicly"],
    },
    notes:
      "Gespeicherte Drafts bleiben privat bzw. review-only, hängen Scope nur als Kontext an und veröffentlichen weder PII noch Material automatisch.",
    sourceAnchors: [
      {
        file: "apps/web/src/app/api/contributions/save/route.ts",
        contains: [
          "const sessionUser = await getSessionUser(req);",
          'error: "create_input_blocked"',
          "const requestScope = summarizeRequestScopeContext(",
        ],
      },
    ],
  },
  {
    id: "persisted_create_handoff_surface",
    label: "Save / Handoff",
    surface: "/api/create/handoffs + create_handoff_review_items",
    surfaceType: "feature_service",
    piiZone: "pii_possible",
    contentZones: ["review_only", "organization_private", "source_material"],
    aiZone: "ai_processing_restricted",
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      noPublicPiiLeakage: true,
      reviewOnlyStaysInternal: true,
      publicLinksRequireVisibleState: true,
      sourceMaterialStaysReviewOnly: true,
      aiOutputsStayReviewFirst: true,
    },
    aiGuard: {
      deepSearchResearchExplicitOnly: false,
      automaticResearchCosts: false,
      processingZone: "ai_processing_restricted",
    },
    auditCoverage: {
      requirement: "high_impact_requires_audit",
      unifiedAuditReadsideVisible: true,
      unifiedAuditSources: ["create_handoff"],
      highImpactActions: [
        "create_handoff_persisted",
        "review_required_working_state",
        "scope_bound_handoff_context",
      ],
    },
    notes:
      "Persistierte Handoffs bleiben interne Arbeitsstände mit reviewpflichtiger Sichtbarkeit und ohne automatischen Public- oder Official-Pfad.",
    sourceAnchors: [
      {
        file: "apps/web/src/features/create/persistedHandoffReviewQueue.ts",
        contains: [
          'visibilityState: input.draft.visibilityState ?? "internal_review",',
          "reviewRequired: true,",
          "noAutoPublish: true,",
          "noPublicOfficial: true,",
        ],
      },
      {
        file: "apps/web/src/app/api/create/handoffs/route.ts",
        contains: [
          'case "graph_review_required":',
          'case "manual_review_required":',
          "allowOperatorFallback: false",
        ],
      },
    ],
  },
  {
    id: "review_queue_surface",
    label: "Review Queue / Admin Review",
    surface: "/admin/review + review queue readmodel",
    surfaceType: "readmodel",
    piiZone: "pii_possible",
    contentZones: ["review_only", "operator_only"],
    aiZone: "ai_processing_restricted",
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      noPublicPiiLeakage: true,
      reviewOnlyStaysInternal: true,
      publicLinksRequireVisibleState: true,
      sourceMaterialStaysReviewOnly: true,
      aiOutputsStayReviewFirst: true,
    },
    aiGuard: {
      deepSearchResearchExplicitOnly: false,
      automaticResearchCosts: false,
      processingZone: "ai_processing_restricted",
    },
    auditCoverage: {
      requirement: "high_impact_requires_audit",
      unifiedAuditReadsideVisible: true,
      unifiedAuditSources: [
        "create_handoff",
        "review_operations",
        "source_results",
        "content_release",
        "official_release",
      ],
      highImpactActions: [
        "review_operation_applied",
        "visibility_made_public",
        "visibility_revoked",
        "content_archived",
      ],
    },
    notes:
      "Die Queue bleibt ein interner Reviewraum. Operatorische Sammelaktionen und automatische Veröffentlichungen bleiben explizit gesperrt.",
    sourceAnchors: [
      {
        file: "features/reviewQueue.ts",
        contains: [
          "noBulkApprove: true;",
          "noAutoOfficialClaim: true;",
          "noAutoPublish: true;",
          'visibilityState: "internal_review",',
        ],
      },
    ],
  },
  {
    id: "source_result_surface",
    label: "Source Results",
    surface: "source connection runtime + review queue",
    surfaceType: "feature_service",
    piiZone: "pii_possible",
    contentZones: ["review_only", "source_material", "organization_private"],
    aiZone: "ai_processing_restricted",
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      noPublicPiiLeakage: true,
      reviewOnlyStaysInternal: true,
      publicLinksRequireVisibleState: true,
      sourceMaterialStaysReviewOnly: true,
      aiOutputsStayReviewFirst: true,
    },
    aiGuard: {
      deepSearchResearchExplicitOnly: false,
      automaticResearchCosts: false,
      processingZone: "ai_processing_restricted",
    },
    auditCoverage: {
      requirement: "high_impact_requires_audit",
      unifiedAuditReadsideVisible: true,
      unifiedAuditSources: ["source_results"],
      highImpactActions: [
        "source_result_created",
        "source_material_review_required",
        "no_auto_publish_on_dry_run",
      ],
    },
    notes:
      "Source Results und Snapshot-Material bleiben reviewpflichtige Roh- bzw. Zwischenstände und sind keine öffentliche Quelle oder Amtlichkeit.",
    sourceAnchors: [
      {
        file: "features/region/server/sourceConnectionRuntime.ts",
        contains: [
          'visibilityState: "internal_review",',
          "reviewRequired: true,",
          "noAutoPublish: true,",
          "noPublicOfficial: true,",
        ],
      },
    ],
  },
  {
    id: "content_release_workbench_surface",
    label: "Content Release",
    surface: "content release workbench",
    surfaceType: "feature_service",
    piiZone: "pii_possible",
    contentZones: ["review_only", "organization_private", "public_content"],
    aiZone: "ai_processing_restricted",
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      noPublicPiiLeakage: true,
      reviewOnlyStaysInternal: true,
      publicLinksRequireVisibleState: true,
      sourceMaterialStaysReviewOnly: true,
      aiOutputsStayReviewFirst: true,
    },
    aiGuard: {
      deepSearchResearchExplicitOnly: false,
      automaticResearchCosts: false,
      processingZone: "ai_processing_restricted",
    },
    auditCoverage: {
      requirement: "high_impact_requires_audit",
      unifiedAuditReadsideVisible: true,
      unifiedAuditSources: ["content_release", "official_release"],
      highImpactActions: [
        "content_release_prepared",
        "visibility_made_public",
        "visibility_revoked",
        "content_archived",
      ],
    },
    notes:
      "Die Workbench verbindet interne Reviewzustände mit bewusstem Sichtbarmachen. Public URLs, Share und QR werden nur aus sichtbaren Zuständen abgeleitet.",
    sourceAnchors: [
      {
        file: "features/contentReleaseWorkbench.ts",
        contains: [
          "noAutoPublish: z.literal(true),",
          "noPublicOfficial: z.literal(true),",
          "if (!publicHref || !isPublicVisibilityState(visibilityState)) return null;",
          'return "content_release.content_archived";',
        ],
      },
    ],
  },
  {
    id: "public_topic_page_surface",
    label: "Topic Pages",
    surface: "/topic/[slug]",
    surfaceType: "app_route",
    piiZone: "pii_possible",
    contentZones: ["public_content", "review_only"],
    aiZone: "ai_processing_restricted",
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      noPublicPiiLeakage: true,
      reviewOnlyStaysInternal: true,
      publicLinksRequireVisibleState: true,
      sourceMaterialStaysReviewOnly: true,
      aiOutputsStayReviewFirst: true,
    },
    aiGuard: {
      deepSearchResearchExplicitOnly: false,
      automaticResearchCosts: false,
      processingZone: "ai_processing_restricted",
    },
    auditCoverage: {
      requirement: "high_impact_requires_audit",
      unifiedAuditReadsideVisible: true,
      unifiedAuditSources: ["content_release", "official_release"],
      highImpactActions: [
        "topic_page_visibility_change",
        "topic_page_public_link_enabled",
      ],
    },
    notes:
      "Themenseiten sind nur dann öffentlich, wenn der persistierte Sichtbarkeitsstatus das erlaubt. Hidden, blocked oder archived bleiben Holding-/Review-Zustände.",
    sourceAnchors: [
      {
        file: "features/publicTopicPage.ts",
        contains: [
          "noAutoPublicOfficial: true,",
          "publicUrl: isPublicVisibilityState(record.visibilityState) ? record.publicHref : null,",
          "qrAvailable: isPublicVisibilityState(record.visibilityState),",
        ],
      },
      {
        file: "apps/web/src/app/topic/[slug]/page.tsx",
        contains: [
          "Share-Link und QR erscheinen erst nach einer bewussten sichtbaren Freigabe.",
          "Amtlich freigegeben bleibt ausschließlich der separate Official-Release-Pfad.",
        ],
      },
    ],
  },
  {
    id: "public_dossier_surface",
    label: "Dossier Public Surface",
    surface: "/dossier/[id]",
    surfaceType: "app_route",
    piiZone: "pii_possible",
    contentZones: ["public_content", "review_only"],
    aiZone: "ai_processing_restricted",
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      noPublicPiiLeakage: true,
      reviewOnlyStaysInternal: true,
      publicLinksRequireVisibleState: true,
      sourceMaterialStaysReviewOnly: true,
      aiOutputsStayReviewFirst: true,
    },
    aiGuard: {
      deepSearchResearchExplicitOnly: false,
      automaticResearchCosts: false,
      processingZone: "ai_processing_restricted",
    },
    auditCoverage: {
      requirement: "high_impact_requires_audit",
      unifiedAuditReadsideVisible: true,
      unifiedAuditSources: ["content_release", "official_release"],
      highImpactActions: ["dossier_public_visibility", "dossier_review_only_holding_state"],
    },
    notes:
      "Dossier-Public-Flächen zeigen Share-/QR-Chrome nur auf lesbaren Ständen. Review-only bleibt intern und hält die öffentliche Oberfläche ehrlich leer.",
    sourceAnchors: [
      {
        file: "apps/web/src/app/dossier/[id]/ui.tsx",
        contains: [
          'type DossierLoadState = "loading" | "ready" | "review_only" | "not_found" | "load_failed";',
          "Amtlich freigegeben bleibt ausschließlich der Official-Release-Pfad.",
          "Öffentlicher Link, Share-Fläche und QR bleiben aus, solange dieser Stand nur intern geprüft",
        ],
      },
    ],
  },
  {
    id: "public_runden_surface",
    label: "Anlassraum / Runden",
    surface: "/runden",
    surfaceType: "app_route",
    piiZone: "pii_possible",
    contentZones: ["public_content", "review_only"],
    aiZone: "ai_processing_restricted",
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      noPublicPiiLeakage: true,
      reviewOnlyStaysInternal: true,
      publicLinksRequireVisibleState: true,
      sourceMaterialStaysReviewOnly: true,
      aiOutputsStayReviewFirst: true,
    },
    aiGuard: {
      deepSearchResearchExplicitOnly: false,
      automaticResearchCosts: false,
      processingZone: "ai_processing_restricted",
    },
    auditCoverage: {
      requirement: "high_impact_requires_audit",
      unifiedAuditReadsideVisible: false,
      unifiedAuditSources: [],
      highImpactActions: ["runden_share_visibility", "public_input_review_first"],
    },
    notes:
      "Öffentliche Anlassraum- und Share-Flächen erklären Sichtbarkeit bewusst als separaten Schritt. Öffentliche Eingaben bleiben review-first und nicht amtlich.",
    sourceAnchors: [
      {
        file: "apps/web/src/app/runden/RundenShareActions.tsx",
        contains: [
          "Link, Share und QR erscheinen erst nach einer bewussten sichtbaren Freigabe.",
        ],
      },
      {
        file: "apps/web/src/app/runden/RundenPublicSharingGuide.tsx",
        contains: [
          'label: "amtlich freigegeben",',
        ],
      },
      {
        file: "apps/web/src/app/api/runden/public-input/route.ts",
        contains: [
          "noAutoPublish: record.noAutoPublish,",
        ],
      },
    ],
  },
  {
    id: "public_link_qr_share_surface",
    label: "Public URL / QR / Share",
    surface: "public link derivation",
    surfaceType: "feature_service",
    piiZone: "pii_possible",
    contentZones: ["public_content", "review_only"],
    aiZone: "ai_processing_restricted",
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      noPublicPiiLeakage: true,
      reviewOnlyStaysInternal: true,
      publicLinksRequireVisibleState: true,
      sourceMaterialStaysReviewOnly: true,
      aiOutputsStayReviewFirst: true,
    },
    aiGuard: {
      deepSearchResearchExplicitOnly: false,
      automaticResearchCosts: false,
      processingZone: "ai_processing_restricted",
    },
    auditCoverage: {
      requirement: "high_impact_requires_audit",
      unifiedAuditReadsideVisible: true,
      unifiedAuditSources: ["content_release", "official_release"],
      highImpactActions: [
        "public_url_enabled_only_after_visible_state",
        "qr_share_disabled_for_review_only",
      ],
    },
    notes:
      "Öffentliche URL, QR und Share sind keine eigenständige Datenquelle, sondern eine abgeleitete Freigabeoberfläche aus persistierten Sichtbarkeitszuständen.",
    sourceAnchors: [
      {
        file: "features/contentReleaseWorkbench.ts",
        contains: [
          "if (!publicHref || !isPublicVisibilityState(visibilityState)) return null;",
          'visibilityState !== "public_unverified" &&',
          'visibilityState !== "public_reviewed" &&',
        ],
      },
      {
        file: "features/publicTopicPage.ts",
        contains: [
          "shareUrl: isPublicVisibilityState(record.visibilityState) ? record.publicHref : null,",
          "qrAvailable: isPublicVisibilityState(record.visibilityState),",
        ],
      },
      {
        file: "apps/web/src/app/runden/RundenShareActions.tsx",
        contains: [
          "Link, Share und QR erscheinen erst nach einer bewussten sichtbaren Freigabe.",
        ],
      },
    ],
  },
  {
    id: "unified_audit_trail_surface",
    label: "Audit Trail",
    surface: "unified audit readside",
    surfaceType: "readmodel",
    piiZone: "pii_possible",
    contentZones: ["operator_only", "organization_private", "review_only"],
    aiZone: "ai_processing_restricted",
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      noPublicPiiLeakage: true,
      reviewOnlyStaysInternal: true,
      publicLinksRequireVisibleState: true,
      sourceMaterialStaysReviewOnly: true,
      aiOutputsStayReviewFirst: true,
    },
    aiGuard: {
      deepSearchResearchExplicitOnly: false,
      automaticResearchCosts: false,
      processingZone: "ai_processing_restricted",
    },
    auditCoverage: {
      requirement: "high_impact_requires_audit",
      unifiedAuditReadsideVisible: true,
      unifiedAuditSources: [
        "create_handoff",
        "review_operations",
        "source_results",
        "content_release",
        "official_release",
      ],
      highImpactActions: [
        "review_operation_applied",
        "visibility_made_public",
        "visibility_revoked",
        "content_archived",
        "official_release_granted",
        "official_release_revoked",
      ],
    },
    notes:
      "High-impact-Aktionen bleiben nachvollziehbar im gemeinsamen Audit-Trail sichtbar, ohne dabei selbst Veröffentlichung, Amtlichkeit oder fremde Pending-Daten zu erzeugen.",
    sourceAnchors: [
      {
        file: "features/unifiedAuditReadside.ts",
        contains: [
          '"visibility_made_public",',
          '"content_archived",',
          '"official_release_granted",',
          "noAutoPublicOfficial: true,",
        ],
      },
    ],
  },
];

export const CONTENT_ZONE_INVENTORY: ContentZoneInventory = {
  id: "GOV-SEC-03",
  version: "2026-05-21",
  derivedFrom: [
    "docs/E150/GOV-SEC-03A_ZONE_MATRIX_2026-03-27.md",
    "docs/E150/GOV-SEC-02_ROUTE_AUTH_AI_ROLLOUT_REFRESH_2026-05-21.md",
  ],
  entries: ENTRIES,
};

export function getContentZoneEntry(id: string): ContentZoneEntry | undefined {
  return CONTENT_ZONE_INVENTORY.entries.find((entry) => entry.id === id);
}

export function listContentZoneEntriesByContentZone(zone: ContentRiskZone): ContentZoneEntry[] {
  return CONTENT_ZONE_INVENTORY.entries.filter((entry) => entry.contentZones.includes(zone));
}

export function listContentZoneEntriesByPiiZone(zone: PIIZone): ContentZoneEntry[] {
  return CONTENT_ZONE_INVENTORY.entries.filter((entry) => entry.piiZone === zone);
}

export function listContentZoneEntriesByAiZone(zone: AIProcessingZone): ContentZoneEntry[] {
  return CONTENT_ZONE_INVENTORY.entries.filter((entry) => entry.aiZone === zone);
}

export function listHighImpactContentZoneEntries(): ContentZoneEntry[] {
  return CONTENT_ZONE_INVENTORY.entries.filter(
    (entry) => entry.auditCoverage.requirement === "high_impact_requires_audit",
  );
}
