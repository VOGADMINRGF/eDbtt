export type RouteSecurityClassification =
  | "public"
  | "authenticated"
  | "organization_scoped"
  | "operator_only"
  | "internal_system"
  | "preview_review_only";

export type RouteSecuritySurfaceType = "api_route" | "app_route";

export type RouteSecurityOperatorFallback = "forbidden" | "explicit_only" | "not_applicable";

export type RouteSecurityOrgIsolation = "enforced" | "read_scoped" | "not_applicable";

export type RouteSecuritySourceAnchor = {
  file: string;
  contains: string[];
};

export type RouteSecurityAiGuard = {
  deepSearch: "none" | "explicit_opt_in" | "operator_diagnostics_only";
  automaticResearchCosts: false;
  reviewFirst: boolean;
};

export type RouteSecurityPublicationGuard = {
  noAutoPublish: boolean;
  noAutomaticPublicOfficial: boolean;
  publicLinksRequireVisibleState: boolean;
  reviewOnlyStaysInternal: boolean;
};

export type RouteSecurityAuditCoverage = {
  securityActionsAuditierbar: boolean;
  unifiedAuditReadsideVisible: boolean;
  unifiedAuditSources: Array<
    "review_operations" | "content_release" | "official_release" | "source_results"
  >;
};

export type RouteSecurityEntry = {
  id: string;
  label: string;
  path: string;
  surfaceType: RouteSecuritySurfaceType;
  primaryClassification: RouteSecurityClassification;
  effectiveAccessClasses: RouteSecurityClassification[];
  usesRequestScopeContext: boolean;
  requiresValidSession: boolean;
  operatorFallback: RouteSecurityOperatorFallback;
  orgIsolation: RouteSecurityOrgIsolation;
  pendingOrUnverifiedModerationBlocked: boolean;
  operatorModeExplicit: boolean;
  aiGuard: RouteSecurityAiGuard;
  publicationGuard: RouteSecurityPublicationGuard;
  auditCoverage: RouteSecurityAuditCoverage;
  notes: string;
  sourceAnchors: RouteSecuritySourceAnchor[];
};

export type RouteSecurityInventory = {
  id: "GOV-SEC-02";
  version: "2026-05-21";
  entries: RouteSecurityEntry[];
};

const ENTRIES: RouteSecurityEntry[] = [
  {
    id: "public_contribution_analyze",
    label: "Create / Analyze",
    path: "/api/contributions/analyze",
    surfaceType: "api_route",
    primaryClassification: "public",
    effectiveAccessClasses: ["public"],
    usesRequestScopeContext: false,
    requiresValidSession: false,
    operatorFallback: "not_applicable",
    orgIsolation: "not_applicable",
    pendingOrUnverifiedModerationBlocked: false,
    operatorModeExplicit: false,
    aiGuard: {
      deepSearch: "explicit_opt_in",
      automaticResearchCosts: false,
      reviewFirst: true,
    },
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      publicLinksRequireVisibleState: true,
      reviewOnlyStaysInternal: true,
    },
    auditCoverage: {
      securityActionsAuditierbar: false,
      unifiedAuditReadsideVisible: false,
      unifiedAuditSources: [],
    },
    notes:
      "Öffentlicher Analyze-Pfad bleibt review-first. DeepSearch wird nur auf expliziten Material-/Research-Pfaden aktiviert und erzeugt keine stillen Auto-Kosten.",
    sourceAnchors: [
      {
        file: "apps/web/src/app/api/contributions/analyze/route.ts",
        contains: [
          "allowDeepSearch: body.allowDeepSearch",
          "noAutoPublish: true as const",
          "noSilentMerge: true as const",
          "requiresHumanReview",
        ],
      },
      {
        file: "apps/web/src/features/create/materialRouting.ts",
        contains: [
          "const allowDeepSearch = parseBool(input.allowDeepSearch, false);",
          "researchUsed = \"deep_search\";",
          "requiresHumanReview = true;",
        ],
      },
    ],
  },
  {
    id: "authenticated_contribution_save",
    label: "Create / Save Draft",
    path: "/api/contributions/save",
    surfaceType: "api_route",
    primaryClassification: "authenticated",
    effectiveAccessClasses: ["authenticated"],
    usesRequestScopeContext: true,
    requiresValidSession: true,
    operatorFallback: "not_applicable",
    orgIsolation: "not_applicable",
    pendingOrUnverifiedModerationBlocked: false,
    operatorModeExplicit: false,
    aiGuard: {
      deepSearch: "none",
      automaticResearchCosts: false,
      reviewFirst: true,
    },
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      publicLinksRequireVisibleState: true,
      reviewOnlyStaysInternal: true,
    },
    auditCoverage: {
      securityActionsAuditierbar: false,
      unifiedAuditReadsideVisible: false,
      unifiedAuditSources: [],
    },
    notes:
      "Speichern verlangt jetzt eine valide Session statt bloß `u_id` und hängt vorhandenen Org-/Regionscope nur als Kontextzusammenfassung an den Draft.",
    sourceAnchors: [
      {
        file: "apps/web/src/app/api/contributions/save/route.ts",
        contains: [
          "const sessionUser = await getSessionUser(req);",
          "if (!sessionUser || !sessionUser.sessionValid || !userId)",
          "summarizeRequestScopeContext(",
          "create_input_blocked",
        ],
      },
    ],
  },
  {
    id: "authenticated_contribution_finalize",
    label: "Create / Finalize",
    path: "/api/contributions/finalize",
    surfaceType: "api_route",
    primaryClassification: "authenticated",
    effectiveAccessClasses: ["authenticated"],
    usesRequestScopeContext: false,
    requiresValidSession: true,
    operatorFallback: "not_applicable",
    orgIsolation: "not_applicable",
    pendingOrUnverifiedModerationBlocked: false,
    operatorModeExplicit: false,
    aiGuard: {
      deepSearch: "none",
      automaticResearchCosts: false,
      reviewFirst: true,
    },
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      publicLinksRequireVisibleState: true,
      reviewOnlyStaysInternal: true,
    },
    auditCoverage: {
      securityActionsAuditierbar: true,
      unifiedAuditReadsideVisible: false,
      unifiedAuditSources: [],
    },
    notes:
      "Finalize verlangt jetzt eine valide Session. Der Pfad bleibt claim-auswahlgebunden, erzeugt Vorschläge statt Veröffentlichung und hält Redirects servergeführt.",
    sourceAnchors: [
      {
        file: "apps/web/src/app/api/contributions/finalize/route.ts",
        contains: [
          "const sessionUser = await getSessionUser(req);",
          "if (!sessionUser || !sessionUser.sessionValid || !userId)",
          "error: \"no_claims_selected\"",
          "status: \"proposed\"",
        ],
      },
    ],
  },
  {
    id: "scoped_create_handoff_persist",
    label: "Create / Handoff Persist",
    path: "/api/create/handoffs",
    surfaceType: "api_route",
    primaryClassification: "organization_scoped",
    effectiveAccessClasses: [
      "authenticated",
      "organization_scoped",
      "preview_review_only",
    ],
    usesRequestScopeContext: true,
    requiresValidSession: true,
    operatorFallback: "forbidden",
    orgIsolation: "enforced",
    pendingOrUnverifiedModerationBlocked: false,
    operatorModeExplicit: false,
    aiGuard: {
      deepSearch: "none",
      automaticResearchCosts: false,
      reviewFirst: true,
    },
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      publicLinksRequireVisibleState: true,
      reviewOnlyStaysInternal: true,
    },
    auditCoverage: {
      securityActionsAuditierbar: true,
      unifiedAuditReadsideVisible: true,
      unifiedAuditSources: ["source_results"],
    },
    notes:
      "Persistierte Handoffs sind reviewpflichtige Arbeitsstände. Org-/Regionscope wird über RequestScope plus Region-Guards durchgesetzt; Operator-Fallback ist auf dieser Route explizit gesperrt.",
    sourceAnchors: [
      {
        file: "apps/web/src/app/api/create/handoffs/route.ts",
        contains: [
          "allowOperatorFallback: false",
          "create_handoff_scope_forbidden",
          "canViewRegionResource",
          "canEditOrganizationResource",
        ],
      },
      {
        file: "apps/web/tests/create-handoff.persistence.route.test.ts",
        contains: [
          "reviewRequired: true,",
          "noAutoPublish: true,",
          "noPublicOfficial: true,",
        ],
      },
    ],
  },
  {
    id: "review_only_create_handoff_resume",
    label: "Create / Handoff Resume",
    path: "/api/create/handoffs/[handoffId]",
    surfaceType: "api_route",
    primaryClassification: "preview_review_only",
    effectiveAccessClasses: [
      "authenticated",
      "organization_scoped",
      "operator_only",
      "preview_review_only",
    ],
    usesRequestScopeContext: false,
    requiresValidSession: true,
    operatorFallback: "explicit_only",
    orgIsolation: "read_scoped",
    pendingOrUnverifiedModerationBlocked: false,
    operatorModeExplicit: false,
    aiGuard: {
      deepSearch: "none",
      automaticResearchCosts: false,
      reviewFirst: true,
    },
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      publicLinksRequireVisibleState: true,
      reviewOnlyStaysInternal: true,
    },
    auditCoverage: {
      securityActionsAuditierbar: false,
      unifiedAuditReadsideVisible: false,
      unifiedAuditSources: [],
    },
    notes:
      "Persistierte Handoffs lassen sich nur durch Eigentümer, scoped Organisationen oder expliziten Betreiberkontext wieder laden.",
    sourceAnchors: [
      {
        file: "apps/web/src/app/api/create/handoffs/[handoffId]/route.ts",
        contains: [
          "if (!user || !user.sessionValid || !userId) return unauthorized();",
          "const isOwner = record.createdByUserId === userId;",
          "canViewOrganizationResource",
          "canViewRegionResource",
        ],
      },
    ],
  },
  {
    id: "organization_review_item_ops",
    label: "Org Review Operations",
    path: "/api/account/organization/review/items/[itemId]",
    surfaceType: "api_route",
    primaryClassification: "organization_scoped",
    effectiveAccessClasses: [
      "authenticated",
      "organization_scoped",
      "preview_review_only",
    ],
    usesRequestScopeContext: true,
    requiresValidSession: true,
    operatorFallback: "forbidden",
    orgIsolation: "enforced",
    pendingOrUnverifiedModerationBlocked: true,
    operatorModeExplicit: false,
    aiGuard: {
      deepSearch: "none",
      automaticResearchCosts: false,
      reviewFirst: true,
    },
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      publicLinksRequireVisibleState: true,
      reviewOnlyStaysInternal: true,
    },
    auditCoverage: {
      securityActionsAuditierbar: true,
      unifiedAuditReadsideVisible: true,
      unifiedAuditSources: ["review_operations"],
    },
    notes:
      "Org-Moderation läuft ohne stillen Betreiber-Fallback. Fremde Items bleiben unsichtbar; pending/unverified-Kontexte erhalten keine Moderationsrechte.",
    sourceAnchors: [
      {
        file: "apps/web/src/app/api/account/organization/review/items/[itemId]/route.ts",
        contains: [
          "allowOperatorFallback: false",
          "organization_review_operation_forbidden",
          "allowedActions.includes(body.action)",
          "auditEvent: result.auditEvent",
        ],
      },
      {
        file: "apps/web/tests/org-review-item-ops.route.test.ts",
        contains: [
          "keeps foreign items out of the organization-scoped route",
          "keeps pending or evidence-required contexts out of moderation actions",
        ],
      },
    ],
  },
  {
    id: "organization_content_release_ops",
    label: "Org Content Release",
    path: "/api/account/organization/review/content-release",
    surfaceType: "api_route",
    primaryClassification: "organization_scoped",
    effectiveAccessClasses: [
      "authenticated",
      "organization_scoped",
      "preview_review_only",
    ],
    usesRequestScopeContext: true,
    requiresValidSession: true,
    operatorFallback: "forbidden",
    orgIsolation: "enforced",
    pendingOrUnverifiedModerationBlocked: true,
    operatorModeExplicit: false,
    aiGuard: {
      deepSearch: "none",
      automaticResearchCosts: false,
      reviewFirst: true,
    },
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      publicLinksRequireVisibleState: true,
      reviewOnlyStaysInternal: true,
    },
    auditCoverage: {
      securityActionsAuditierbar: true,
      unifiedAuditReadsideVisible: true,
      unifiedAuditSources: ["content_release"],
    },
    notes:
      "Sichtbarkeit darf organisationsseitig nur mit publication-Approval laufen. `public_official` bleibt außerhalb dieses Pfads.",
    sourceAnchors: [
      {
        file: "apps/web/src/app/api/account/organization/review/content-release/route.ts",
        contains: [
          "allowOperatorFallback: false",
          "content_release_prepare_forbidden",
          "content_release_visibility_forbidden",
          "public_official_requires_official_release",
        ],
      },
      {
        file: "apps/web/tests/org-content-release.route.test.ts",
        contains: [
          "without setting public_official",
          "blocks visibility changes when the organization lacks publication permission",
        ],
      },
    ],
  },
  {
    id: "operator_review_item_ops",
    label: "Operator Review Operations",
    path: "/api/admin/review/items/[itemId]",
    surfaceType: "api_route",
    primaryClassification: "operator_only",
    effectiveAccessClasses: ["operator_only", "preview_review_only"],
    usesRequestScopeContext: true,
    requiresValidSession: true,
    operatorFallback: "explicit_only",
    orgIsolation: "not_applicable",
    pendingOrUnverifiedModerationBlocked: false,
    operatorModeExplicit: true,
    aiGuard: {
      deepSearch: "none",
      automaticResearchCosts: false,
      reviewFirst: true,
    },
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      publicLinksRequireVisibleState: true,
      reviewOnlyStaysInternal: true,
    },
    auditCoverage: {
      securityActionsAuditierbar: true,
      unifiedAuditReadsideVisible: true,
      unifiedAuditSources: ["review_operations"],
    },
    notes:
      "Globale Review-Operationen verlangen expliziten Betreiberkontext mit 2FA und tragen Betreiber-Modus im RequestScope nach außen.",
    sourceAnchors: [
      {
        file: "apps/web/src/app/api/admin/review/items/[itemId]/route.ts",
        contains: [
          "const gate = await requireAdminOrResponse(req);",
          "mode: \"global_operator\"",
          "operatorModeLabel",
          "auditEvent: result.auditEvent",
        ],
      },
      {
        file: "apps/web/tests/admin-review-item-ops.route.test.ts",
        contains: [
          "operatorModeLabel: \"Betreiber-Modus\"",
          "assigns and audits a review queue item without changing product state",
        ],
      },
    ],
  },
  {
    id: "review_only_admin_content_release",
    label: "Scoped / Operator Content Release",
    path: "/api/admin/review/content-release",
    surfaceType: "api_route",
    primaryClassification: "preview_review_only",
    effectiveAccessClasses: [
      "organization_scoped",
      "operator_only",
      "preview_review_only",
    ],
    usesRequestScopeContext: true,
    requiresValidSession: true,
    operatorFallback: "explicit_only",
    orgIsolation: "enforced",
    pendingOrUnverifiedModerationBlocked: true,
    operatorModeExplicit: true,
    aiGuard: {
      deepSearch: "none",
      automaticResearchCosts: false,
      reviewFirst: true,
    },
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      publicLinksRequireVisibleState: true,
      reviewOnlyStaysInternal: true,
    },
    auditCoverage: {
      securityActionsAuditierbar: true,
      unifiedAuditReadsideVisible: true,
      unifiedAuditSources: ["content_release"],
    },
    notes:
      "Der Admin-Review-Content-Release-Pfad erlaubt scoped Publication-Arbeit oder Betreiberbetrieb, bleibt aber ein review-only Surface mit expliziten Publication-Guards.",
    sourceAnchors: [
      {
        file: "apps/web/src/app/api/admin/review/content-release/route.ts",
        contains: [
          "const gate = await requireGovernanceActorOrResponse(input.req, {",
          "canApprovePublication",
          "content_release_visibility_forbidden",
          "content_release_publication_forbidden",
        ],
      },
    ],
  },
  {
    id: "scoped_region_source_connections",
    label: "Region Source Connections",
    path: "/api/admin/region/source-connections",
    surfaceType: "api_route",
    primaryClassification: "organization_scoped",
    effectiveAccessClasses: ["organization_scoped", "operator_only", "preview_review_only"],
    usesRequestScopeContext: true,
    requiresValidSession: true,
    operatorFallback: "explicit_only",
    orgIsolation: "read_scoped",
    pendingOrUnverifiedModerationBlocked: true,
    operatorModeExplicit: true,
    aiGuard: {
      deepSearch: "none",
      automaticResearchCosts: false,
      reviewFirst: true,
    },
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      publicLinksRequireVisibleState: true,
      reviewOnlyStaysInternal: true,
    },
    auditCoverage: {
      securityActionsAuditierbar: true,
      unifiedAuditReadsideVisible: true,
      unifiedAuditSources: ["source_results"],
    },
    notes:
      "Trotz `/admin`-Pfad ist die effektive Freigabe region-/org-scoped. Betreiber sehen global, Organisationen nur gefilterte Verbindungen und Ergebnisse ihres Scopes.",
    sourceAnchors: [
      {
        file: "apps/web/src/app/api/admin/region/source-connections/route.ts",
        contains: [
          "const gate = await requireGovernanceActorOrResponse(req, { regionId: region?.id ?? null });",
          "region_source_forbidden",
          "filteredConnections",
          "operatorModeLabel",
        ],
      },
    ],
  },
  {
    id: "review_only_region_official_release",
    label: "Region Official Release Decisions",
    path: "/api/admin/region/participation-signals/[id]/review",
    surfaceType: "api_route",
    primaryClassification: "preview_review_only",
    effectiveAccessClasses: [
      "organization_scoped",
      "operator_only",
      "preview_review_only",
    ],
    usesRequestScopeContext: true,
    requiresValidSession: true,
    operatorFallback: "explicit_only",
    orgIsolation: "read_scoped",
    pendingOrUnverifiedModerationBlocked: true,
    operatorModeExplicit: true,
    aiGuard: {
      deepSearch: "none",
      automaticResearchCosts: false,
      reviewFirst: true,
    },
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      publicLinksRequireVisibleState: true,
      reviewOnlyStaysInternal: true,
    },
    auditCoverage: {
      securityActionsAuditierbar: true,
      unifiedAuditReadsideVisible: true,
      unifiedAuditSources: ["official_release"],
    },
    notes:
      "Official Release ist ein expliziter Review-Pfad. Scoped Publication-Approvers oder Betreiber dürfen freigeben bzw. widerrufen; automatische Amtlichkeit ist ausgeschlossen.",
    sourceAnchors: [
      {
        file: "apps/web/src/app/api/admin/region/participation-signals/[id]/review/route.ts",
        contains: [
          "\"approve_official\"",
          "\"revoke_official\"",
          "canApprovePublication",
          "operatorModeLabel",
        ],
      },
      {
        file: "apps/web/tests/unified-audit-readside.test.ts",
        contains: [
          "official_release_granted",
          "never sets public_official while reading unified audit state",
        ],
      },
    ],
  },
  {
    id: "public_dossier_read",
    label: "Public Dossier Read",
    path: "/api/dossier/[id]",
    surfaceType: "api_route",
    primaryClassification: "public",
    effectiveAccessClasses: ["public", "preview_review_only"],
    usesRequestScopeContext: false,
    requiresValidSession: false,
    operatorFallback: "not_applicable",
    orgIsolation: "not_applicable",
    pendingOrUnverifiedModerationBlocked: false,
    operatorModeExplicit: false,
    aiGuard: {
      deepSearch: "none",
      automaticResearchCosts: false,
      reviewFirst: true,
    },
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      publicLinksRequireVisibleState: true,
      reviewOnlyStaysInternal: true,
    },
    auditCoverage: {
      securityActionsAuditierbar: false,
      unifiedAuditReadsideVisible: false,
      unifiedAuditSources: [],
    },
    notes:
      "Öffentliche Dossier-Leserouten bleiben lesbar, aber review-only Arbeitsstände geben nur den internen Status zurück und zeigen keine Public-/Share-/QR-Flächen.",
    sourceAnchors: [
      {
        file: "apps/web/src/app/api/dossier/[id]/route.ts",
        contains: [
          "error: \"dossier_review_only\"",
          "error: \"dossier_not_found\"",
        ],
      },
      {
        file: "apps/web/src/app/dossier/[id]/ui.tsx",
        contains: [
          "Öffentlicher Link, Share-Fläche und QR bleiben aus",
        ],
      },
    ],
  },
  {
    id: "public_topic_surface",
    label: "Public Topic Page",
    path: "/topic/[slug]",
    surfaceType: "app_route",
    primaryClassification: "public",
    effectiveAccessClasses: ["public", "organization_scoped", "operator_only", "preview_review_only"],
    usesRequestScopeContext: false,
    requiresValidSession: false,
    operatorFallback: "explicit_only",
    orgIsolation: "read_scoped",
    pendingOrUnverifiedModerationBlocked: false,
    operatorModeExplicit: false,
    aiGuard: {
      deepSearch: "none",
      automaticResearchCosts: false,
      reviewFirst: true,
    },
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      publicLinksRequireVisibleState: true,
      reviewOnlyStaysInternal: true,
    },
    auditCoverage: {
      securityActionsAuditierbar: false,
      unifiedAuditReadsideVisible: false,
      unifiedAuditSources: [],
    },
    notes:
      "Topic Pages bauen visible-only Public Surfaces; versteckte Stände lassen sich nur scoped previewen und teilen Public-/QR-Hinweise erst nach sichtbarer Freigabe.",
    sourceAnchors: [
      {
        file: "apps/web/src/app/topic/[slug]/page.tsx",
        contains: [
          "buildVisiblePublicTopicPageBySlug",
          "canPreviewHiddenTopicPage",
          "Share-Link und QR erscheinen erst nach einer bewussten sichtbaren Freigabe.",
          "Amtlich freigegeben bleibt ausschließlich der separate Official-Release-Pfad.",
        ],
      },
    ],
  },
  {
    id: "public_runden_surface",
    label: "Public Runden Surface",
    path: "/runden",
    surfaceType: "app_route",
    primaryClassification: "public",
    effectiveAccessClasses: ["public", "authenticated"],
    usesRequestScopeContext: false,
    requiresValidSession: false,
    operatorFallback: "not_applicable",
    orgIsolation: "not_applicable",
    pendingOrUnverifiedModerationBlocked: false,
    operatorModeExplicit: false,
    aiGuard: {
      deepSearch: "none",
      automaticResearchCosts: false,
      reviewFirst: true,
    },
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      publicLinksRequireVisibleState: true,
      reviewOnlyStaysInternal: true,
    },
    auditCoverage: {
      securityActionsAuditierbar: false,
      unifiedAuditReadsideVisible: false,
      unifiedAuditSources: [],
    },
    notes:
      "Der öffentliche Anlassraum bleibt teilnahmeorientiert. Link/QR erscheinen nur bei sichtbaren Konstellationen und nicht als stiller Publish-Kanal.",
    sourceAnchors: [
      {
        file: "apps/web/src/app/runden/page.tsx",
        contains: [
          "Teilnahmelink und QR erscheinen, sobald der laufende Anlass im passenden Verteilkontext verfügbar ist.",
          "QR und Verteilung stehen für berechtigte Rollen im laufenden Anlass zur Verfügung.",
        ],
      },
      {
        file: "apps/web/src/app/runden/RundenShareActions.tsx",
        contains: [
          "Link, Share und QR erscheinen erst nach einer bewussten sichtbaren Freigabe.",
          "Wird Sichtbarkeit zurückgenommen, pausiert, geschlossen oder archiviert, verschwindet auch dieser öffentliche Link- und QR-Pfad wieder.",
        ],
      },
    ],
  },
  {
    id: "public_runden_input",
    label: "Public Anlassraum Input",
    path: "/api/runden/public-input",
    surfaceType: "api_route",
    primaryClassification: "public",
    effectiveAccessClasses: ["public", "preview_review_only"],
    usesRequestScopeContext: false,
    requiresValidSession: false,
    operatorFallback: "not_applicable",
    orgIsolation: "not_applicable",
    pendingOrUnverifiedModerationBlocked: false,
    operatorModeExplicit: false,
    aiGuard: {
      deepSearch: "none",
      automaticResearchCosts: false,
      reviewFirst: true,
    },
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      publicLinksRequireVisibleState: true,
      reviewOnlyStaysInternal: true,
    },
    auditCoverage: {
      securityActionsAuditierbar: true,
      unifiedAuditReadsideVisible: true,
      unifiedAuditSources: ["source_results"],
    },
    notes:
      "Öffentliche Anlassraum-Eingaben laufen als review-gated Participation Signals ein. Optionen bleiben intern reviewpflichtig, Fragen/Hinweise werden nicht amtlich oder automatisch weiterveröffentlicht.",
    sourceAnchors: [
      {
        file: "apps/web/src/app/api/runden/public-input/route.ts",
        contains: [
          "public_anlassraum_not_found",
          "noAutoPublish: record.noAutoPublish",
          "noAutoCreateDossier: record.noAutoCreateDossier",
          "noAutoCreateAnlassraum: record.noAutoCreateAnlassraum",
        ],
      },
      {
        file: "apps/web/tests/runden-public-input.route.test.ts",
        contains: [
          "creates a direct public question as review-gated participation signal",
          "keeps options in internal review instead of auto-publishing or auto-official state",
        ],
      },
    ],
  },
  {
    id: "operator_review_surface",
    label: "Admin Review Surface",
    path: "/admin/review",
    surfaceType: "app_route",
    primaryClassification: "operator_only",
    effectiveAccessClasses: ["operator_only", "preview_review_only"],
    usesRequestScopeContext: true,
    requiresValidSession: true,
    operatorFallback: "explicit_only",
    orgIsolation: "not_applicable",
    pendingOrUnverifiedModerationBlocked: false,
    operatorModeExplicit: true,
    aiGuard: {
      deepSearch: "none",
      automaticResearchCosts: false,
      reviewFirst: true,
    },
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      publicLinksRequireVisibleState: true,
      reviewOnlyStaysInternal: true,
    },
    auditCoverage: {
      securityActionsAuditierbar: true,
      unifiedAuditReadsideVisible: true,
      unifiedAuditSources: [
        "review_operations",
        "content_release",
        "official_release",
        "source_results",
      ],
    },
    notes:
      "Die globale Betreiber-Arbeitsliste zeigt denselben persistierten Unified Audit Trail für Review, Content Release, Source Results und Official Release.",
    sourceAnchors: [
      {
        file: "features/reviewQueue.ts",
        contains: [
          "listUnifiedAuditEvents(",
          "unifiedAuditTrail",
        ],
      },
      {
        file: "apps/web/src/app/admin/review/page.tsx",
        contains: [
          "Keine Sammelentscheidung, kein Auto-Publish, kein automatisches public_official",
          "Public URL, QR und Share",
        ],
      },
      {
        file: "features/unifiedAuditReadside.ts",
        contains: [
          "\"review_operation_applied\"",
          "\"source_result_created\"",
          "\"visibility_made_public\"",
          "\"official_release_granted\"",
        ],
      },
    ],
  },
  {
    id: "organization_dashboard_review_surface",
    label: "Organization Dashboard Review Surface",
    path: "/account/organization/dashboard",
    surfaceType: "app_route",
    primaryClassification: "organization_scoped",
    effectiveAccessClasses: [
      "authenticated",
      "organization_scoped",
      "preview_review_only",
    ],
    usesRequestScopeContext: true,
    requiresValidSession: true,
    operatorFallback: "forbidden",
    orgIsolation: "read_scoped",
    pendingOrUnverifiedModerationBlocked: true,
    operatorModeExplicit: true,
    aiGuard: {
      deepSearch: "none",
      automaticResearchCosts: false,
      reviewFirst: true,
    },
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      publicLinksRequireVisibleState: true,
      reviewOnlyStaysInternal: true,
    },
    auditCoverage: {
      securityActionsAuditierbar: true,
      unifiedAuditReadsideVisible: true,
      unifiedAuditSources: [
        "review_operations",
        "content_release",
        "official_release",
        "source_results",
      ],
    },
    notes:
      "Das Organisationsdashboard zeigt nur den eigenen Scope, die eigenen Moderationsrechte und denselben Unified Audit Trail; `/admin` bleibt klar davon getrennt.",
    sourceAnchors: [
      {
        file: "features/region/organizationDashboard.ts",
        contains: [
          "listUnifiedAuditEvents(",
          "reviewQueue.items.flatMap((item) => item.unifiedAuditTrail ?? [])",
        ],
      },
      {
        file: "apps/web/src/app/account/organization/dashboard/page.tsx",
        contains: [
          "Betreiber-Modus aktiv. `/admin` bleibt Betreiberbereich;",
          "Meine Review-Aufgaben",
        ],
      },
    ],
  },
  {
    id: "operator_ai_orchestrator_smoke",
    label: "Admin AI Orchestrator Smoke",
    path: "/api/admin/ai/orchestrator-smoke",
    surfaceType: "api_route",
    primaryClassification: "operator_only",
    effectiveAccessClasses: ["operator_only"],
    usesRequestScopeContext: true,
    requiresValidSession: true,
    operatorFallback: "explicit_only",
    orgIsolation: "not_applicable",
    pendingOrUnverifiedModerationBlocked: false,
    operatorModeExplicit: true,
    aiGuard: {
      deepSearch: "operator_diagnostics_only",
      automaticResearchCosts: false,
      reviewFirst: true,
    },
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      publicLinksRequireVisibleState: true,
      reviewOnlyStaysInternal: true,
    },
    auditCoverage: {
      securityActionsAuditierbar: true,
      unifiedAuditReadsideVisible: false,
      unifiedAuditSources: [],
    },
    notes:
      "Der AI-Smoke-Pfad ist eine Betreiberdiagnose. Er ist kein öffentlicher Produktpfad und darf nur mit explizitem Admin-Gate laufen.",
    sourceAnchors: [
      {
        file: "apps/web/src/app/api/admin/ai/orchestrator-smoke/route.ts",
        contains: [
          "const { requireAdminOrResponse } = await import(\"@/lib/server/auth/admin\");",
          "const gate = await requireAdminOrResponse(req);",
        ],
      },
    ],
  },
  {
    id: "internal_status_report_scheduler",
    label: "Internal Scheduled Status Report Trigger",
    path: "/api/internal/ops/status-report/scheduled",
    surfaceType: "api_route",
    primaryClassification: "internal_system",
    effectiveAccessClasses: ["internal_system"],
    usesRequestScopeContext: false,
    requiresValidSession: false,
    operatorFallback: "not_applicable",
    orgIsolation: "not_applicable",
    pendingOrUnverifiedModerationBlocked: false,
    operatorModeExplicit: false,
    aiGuard: {
      deepSearch: "none",
      automaticResearchCosts: false,
      reviewFirst: true,
    },
    publicationGuard: {
      noAutoPublish: true,
      noAutomaticPublicOfficial: true,
      publicLinksRequireVisibleState: true,
      reviewOnlyStaysInternal: true,
    },
    auditCoverage: {
      securityActionsAuditierbar: true,
      unifiedAuditReadsideVisible: false,
      unifiedAuditSources: [],
    },
    notes:
      "Interner Scheduler-Trigger ist über Secret-Header getrennt und gehört nicht zum Nutzer- oder Betreiber-Loginmodell.",
    sourceAnchors: [
      {
        file: "apps/web/src/app/api/internal/ops/status-report/scheduled/route.ts",
        contains: [
          "const INTERNAL_TRIGGER_SECRET_HEADER = \"x-status-report-trigger-secret\";",
          "unauthorized_internal_trigger",
          "isScheduledStatusReportSlot",
        ],
      },
    ],
  },
];

export const ROUTE_SECURITY_INVENTORY: RouteSecurityInventory = {
  id: "GOV-SEC-02",
  version: "2026-05-21",
  entries: ENTRIES,
};

export function listRouteSecurityInventory(): RouteSecurityEntry[] {
  return [...ROUTE_SECURITY_INVENTORY.entries];
}

export function listRouteSecurityEntriesByClassification(
  classification: RouteSecurityClassification,
): RouteSecurityEntry[] {
  return ROUTE_SECURITY_INVENTORY.entries.filter((entry) =>
    entry.effectiveAccessClasses.includes(classification),
  );
}

export function getRouteSecurityEntry(id: string): RouteSecurityEntry | null {
  return ROUTE_SECURITY_INVENTORY.entries.find((entry) => entry.id === id) ?? null;
}
