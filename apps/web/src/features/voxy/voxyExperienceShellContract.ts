import {
  getSegmentedAgentSurface,
  type SegmentedAgentExperienceSegment,
} from "@/features/agenticRuntime/segmentedAgentExperienceContract";

export const VOXY_EXPERIENCE_SHELL_TASK_ID =
  "V3-VOXY-EXPERIENCE-SHELL-MOBILE-AGENTIC-INTEGRATION-01";

export const VOXY_EXPERIENCE_SHELL_MODE_IDS = [
  "passive",
  "guided",
  "active",
] as const;

export const VOXY_EXPERIENCE_SHELL_SURFACE_IDS = [
  "home",
  "create",
  "runden",
  "dossier",
  "account",
  "account_organization",
  "account_organization_dashboard",
  "admin_system",
  "admin_review",
  "admin_region",
] as const;

export const VOXY_EXPERIENCE_LAYOUT_GUARD = {
  shellClassName: "w-full max-w-full overflow-hidden",
  avatarContainerClassName: "max-w-full overflow-hidden",
  bubbleClassName: "max-w-full overflow-hidden",
  safeHeightClassName: "max-h-[70svh]",
  noViewportOverflow: true,
  mobileSafe: true,
  noRawNavRegression: true,
} as const;

export type VoxyExperienceShellModeId =
  (typeof VOXY_EXPERIENCE_SHELL_MODE_IDS)[number];
export type VoxyExperienceShellSurfaceId =
  (typeof VOXY_EXPERIENCE_SHELL_SURFACE_IDS)[number];

export type VoxyExperienceShellModeContract = {
  id: VoxyExperienceShellModeId;
  label: string;
  explicitUserActionRequired: boolean;
  b2cPersonalCompanionConsentGated: boolean;
  availableSegments: readonly SegmentedAgentExperienceSegment[];
  forcedForInstitutionalSegments: false;
  summary: string;
};

export type VoxyExperienceShellSurfaceContract = {
  id: VoxyExperienceShellSurfaceId;
  route: string;
  title: string;
  supportedSegments: readonly SegmentedAgentExperienceSegment[];
  pageShellRole:
    | "hero_guide_status"
    | "shared_create_guide"
    | "public_reader_status"
    | "account_status_layer"
    | "institutional_workspace_shell"
    | "operator_readiness_shell";
  mobileShellPattern: "bottom_sheet" | "chat_dock" | "assist_bar";
  stickyMobile: true;
  intrusiveMobile: false;
  usesActionChips: true;
  longDialogForced: false;
  maxVisibleActionChips: 4;
  safeAreaAware: true;
  agenticFacadeSteps: readonly string[];
  providerInternalsHidden: true;
  promptInternalsHidden: true;
  chainOfThoughtHidden: true;
  fakeAgentActivityHidden: true;
  mayClaimRuntimeActive: false;
  mayAutoPublish: false;
  pageHint: string;
};

export type VoxyExperienceShellSummaryCard = {
  id: string;
  title: string;
  body: string;
};

export type VoxyExperienceShellContract = {
  taskId: typeof VOXY_EXPERIENCE_SHELL_TASK_ID;
  statusInOpenTasks: "done" | "codex_ready" | "missing";
  primaryRole: "personal_voxy";
  supportingRoles: readonly [
    "governance_compliance",
    "dossier_briefing",
    "intake_format",
  ];
  modes: VoxyExperienceShellModeContract[];
  surfaces: VoxyExperienceShellSurfaceContract[];
  integratedTaskIds: readonly string[];
  nextCodexReadyTaskId: string | null;
  b2cPersonalCompanionConsentGated: true;
  b2bB2gNoPersonalCompanionForced: true;
  pageShellVisible: true;
  mobileShellVisible: true;
  agenticFacadeVisible: true;
  noRuntimeActivation: true;
  noProviderLeaks: true;
  noPromptLeaks: true;
  noChainOfThoughtLeaks: true;
  noAutoPublish: true;
  noExternalNotification: true;
  noAutomaticEntitlementActivation: true;
  noAutomaticAdoption: true;
  noFakeAgentActivity: true;
  layoutGuard: typeof VOXY_EXPERIENCE_LAYOUT_GUARD;
};

const AGENTIC_FACADE_STEPS = [
  "Anliegen ordnen",
  "Format vorschlagen",
  "Quellen prüfen",
  "Claims erkennen",
  "Gegenargumente sichtbar machen",
  "Dossier vorbereiten",
  "Beteiligung, Handoff und Preflight erklären",
] as const;

const INTEGRATED_TASK_IDS = [
  "V3-SEGMENTED-AGENT-EXPERIENCE-CONTRACT-01",
  "V3-AGENT-RUN-ARTIFACT-SAFE-TRACE-CONTRACT-01",
  "V3-PERSONAL-VOXY-PROFILE-CONSENT-ONBOARDING-01",
  "V3-B2G-FIRST-LOGIN-JURISDICTION-COCKPIT-01",
  "V3-CIVIC-PRINCIPLES-GOV-LIGHT-MUNICIPAL-HANDOFF-DECISION-01",
  "V3-MUNICIPAL-HANDOFF-THREE-ADOPTION-TRIAL-01",
] as const;

const NEXT_CODEX_READY_TASK_ID = "V3-AGENTIC-CIVIC-E2E-PILOT-01";

function buildModes(): VoxyExperienceShellModeContract[] {
  return [
    {
      id: "passive",
      label: "Passive Voxy",
      explicitUserActionRequired: false,
      b2cPersonalCompanionConsentGated: true,
      availableSegments: ["b2c", "b2b", "b2g"],
      forcedForInstitutionalSegments: false,
      summary:
        "Voxy erklärt Seite, Status, Guardrails und öffentliche Lesbarkeit, ohne eine Nutzeraktion auszuführen.",
    },
    {
      id: "guided",
      label: "Guided Voxy",
      explicitUserActionRequired: false,
      b2cPersonalCompanionConsentGated: true,
      availableSegments: ["b2c", "b2b", "b2g"],
      forcedForInstitutionalSegments: false,
      summary:
        "Voxy schlägt sichere nächste Schritte, Action Chips und Review-Gates vor, ohne Provider- oder Runtime-Aktivität zu behaupten.",
    },
    {
      id: "active",
      label: "Active Voxy",
      explicitUserActionRequired: true,
      b2cPersonalCompanionConsentGated: true,
      availableSegments: ["b2c", "b2b", "b2g"],
      forcedForInstitutionalSegments: false,
      summary:
        "Active Voxy startet erst nach bewusster Nutzeraktion; B2C-Personal-Voxy bleibt consent-gated, B2B/B2G werden nicht in einen persönlichen Companion gezwungen.",
    },
  ];
}

function buildSurface(input: {
  id: VoxyExperienceShellSurfaceId;
  route: string;
  title: string;
  supportedSegments: readonly SegmentedAgentExperienceSegment[];
  pageShellRole: VoxyExperienceShellSurfaceContract["pageShellRole"];
  mobileShellPattern: VoxyExperienceShellSurfaceContract["mobileShellPattern"];
  pageHint: string;
}): VoxyExperienceShellSurfaceContract {
  return {
    ...input,
    stickyMobile: true,
    intrusiveMobile: false,
    usesActionChips: true,
    longDialogForced: false,
    maxVisibleActionChips: 4,
    safeAreaAware: true,
    agenticFacadeSteps: AGENTIC_FACADE_STEPS,
    providerInternalsHidden: true,
    promptInternalsHidden: true,
    chainOfThoughtHidden: true,
    fakeAgentActivityHidden: true,
    mayClaimRuntimeActive: false,
    mayAutoPublish: false,
  };
}

function buildSurfaces(): VoxyExperienceShellSurfaceContract[] {
  const createSurface = getSegmentedAgentSurface("create");
  const rundenSurface = getSegmentedAgentSurface("runden");
  const dossierSurface = getSegmentedAgentSurface("dossier");
  const accountSurface = getSegmentedAgentSurface("account");
  const accountOrganizationSurface = getSegmentedAgentSurface("account_organization");
  const organizationDashboardSurface = getSegmentedAgentSurface(
    "account_organization_dashboard",
  );
  const adminSystemSurface = getSegmentedAgentSurface("admin_system");

  return [
    buildSurface({
      id: "home",
      route: "/",
      title: "Öffentlicher Voxy-Einstieg",
      supportedSegments: ["b2c", "b2b", "b2g"],
      pageShellRole: "hero_guide_status",
      mobileShellPattern: "assist_bar",
      pageHint:
        "Voxy ist hier Hero, Guide und Status-Schicht: Einstieg, sichere Schritte und Review-Gates bleiben sichtbar, während spezialisierte Agenten im Hintergrund bleiben.",
    }),
    buildSurface({
      id: "create",
      route: createSurface.route,
      title: createSurface.title,
      supportedSegments: createSurface.supportedSegments,
      pageShellRole: "shared_create_guide",
      mobileShellPattern: "chat_dock",
      pageHint:
        "Auf /create erklärt Voxy Anliegenordnung, Format, Quellen- und Claims-Schritte als sichere Vorschläge; mobil bleibt das ein Chat-Dock mit Action Chips statt Dialogzwang.",
    }),
    buildSurface({
      id: "runden",
      route: rundenSurface.route,
      title: rundenSurface.title,
      supportedSegments: rundenSurface.supportedSegments,
      pageShellRole: "public_reader_status",
      mobileShellPattern: "assist_bar",
      pageHint:
        "Im öffentlichen Anlassraum erklärt Voxy Status, Sichtbarkeit und nächste Schritte, ohne öffentliche Lesbarkeit, Review-Grenzen oder Handoff-Gates zu verstecken.",
    }),
    buildSurface({
      id: "dossier",
      route: dossierSurface.route,
      title: dossierSurface.title,
      supportedSegments: dossierSurface.supportedSegments,
      pageShellRole: "public_reader_status",
      mobileShellPattern: "assist_bar",
      pageHint:
        "Im Dossier bleibt Voxy eine verständliche Status-Schicht für Quellenlage, offene Fragen und Review-Gates; keine Provider- oder Prompt-Interna werden sichtbar.",
    }),
    buildSurface({
      id: "account",
      route: accountSurface.route,
      title: accountSurface.title,
      supportedSegments: accountSurface.supportedSegments,
      pageShellRole: "account_status_layer",
      mobileShellPattern: "bottom_sheet",
      pageHint:
        "Im persönlichen Konto bleibt Voxy passiv oder geführt; der persönliche Companion ist nur in B2C und nur mit Consent freigegeben.",
    }),
    buildSurface({
      id: "account_organization",
      route: accountOrganizationSurface.route,
      title: accountOrganizationSurface.title,
      supportedSegments: accountOrganizationSurface.supportedSegments,
      pageShellRole: "institutional_workspace_shell",
      mobileShellPattern: "bottom_sheet",
      pageHint:
        "Im institutionellen Onboarding bleibt Voxy eine verständliche Shell für Status, Freischaltung und nächste Schritte, aber kein persönlicher Companion-Zwang für B2B oder B2G.",
    }),
    buildSurface({
      id: "account_organization_dashboard",
      route: organizationDashboardSurface.route,
      title: organizationDashboardSurface.title,
      supportedSegments: organizationDashboardSurface.supportedSegments,
      pageShellRole: "institutional_workspace_shell",
      mobileShellPattern: "bottom_sheet",
      pageHint:
        "Im Organisationsbereich erklärt Voxy Arbeitsstand, Review-Gates, B2G-Hinweise und sichere nächste Schritte; Guided Assistance bleibt optional, persönliche Begleitung bleibt getrennt.",
    }),
    buildSurface({
      id: "admin_system",
      route: adminSystemSurface.route,
      title: adminSystemSurface.title,
      supportedSegments: adminSystemSurface.supportedSegments,
      pageShellRole: "operator_readiness_shell",
      mobileShellPattern: "assist_bar",
      pageHint:
        "Im Admin-System zeigt Voxy die Experience Shell für Page, Mobile und Agentic Integration als read-only Readiness, ohne Runtime-, Provider- oder Publish-Freigabe.",
    }),
    buildSurface({
      id: "admin_review",
      route: "/admin/review",
      title: "Admin Review Queue",
      supportedSegments: ["b2b", "b2g"],
      pageShellRole: "operator_readiness_shell",
      mobileShellPattern: "assist_bar",
      pageHint:
        "In der Review Queue erklärt Voxy Status, sichere Schritte, Handoffs und Publish-Gates, führt aber selbst keine Runtime, Notification oder Veröffentlichung aus.",
    }),
    buildSurface({
      id: "admin_region",
      route: "/admin/region",
      title: "Admin Region",
      supportedSegments: ["b2g"],
      pageShellRole: "operator_readiness_shell",
      mobileShellPattern: "assist_bar",
      pageHint:
        "In der Regionssicht erklärt Voxy Quellenprüfung, reviewed topic candidates, Beteiligungsoptionen und Handoff-Status, ohne automatische Behördenaktion zu behaupten.",
    }),
  ];
}

export function buildVoxyExperienceShellContract(): VoxyExperienceShellContract {
  return {
    taskId: VOXY_EXPERIENCE_SHELL_TASK_ID,
    statusInOpenTasks: "done",
    primaryRole: "personal_voxy",
    supportingRoles: [
      "governance_compliance",
      "dossier_briefing",
      "intake_format",
    ],
    modes: buildModes(),
    surfaces: buildSurfaces(),
    integratedTaskIds: INTEGRATED_TASK_IDS,
    nextCodexReadyTaskId: NEXT_CODEX_READY_TASK_ID,
    b2cPersonalCompanionConsentGated: true,
    b2bB2gNoPersonalCompanionForced: true,
    pageShellVisible: true,
    mobileShellVisible: true,
    agenticFacadeVisible: true,
    noRuntimeActivation: true,
    noProviderLeaks: true,
    noPromptLeaks: true,
    noChainOfThoughtLeaks: true,
    noAutoPublish: true,
    noExternalNotification: true,
    noAutomaticEntitlementActivation: true,
    noAutomaticAdoption: true,
    noFakeAgentActivity: true,
    layoutGuard: VOXY_EXPERIENCE_LAYOUT_GUARD,
  };
}

export function buildVoxyExperienceShellSummaryCards(
  contract: VoxyExperienceShellContract,
): VoxyExperienceShellSummaryCard[] {
  return [
    {
      id: "page_shell",
      title: "Page Shell",
      body: `${contract.surfaces.length} Surfaces nutzen Voxy als verständliche Hero-, Guide- oder Status-Schicht statt als reine Mascot.`,
    },
    {
      id: "mobile_shell",
      title: "Mobile / PWA",
      body:
        "Mobil bleibt Voxy sticky, safe-area-aware und chip-first: Bottom-Sheet, Chat-Dock oder Assistenzleiste statt langer Dialogzwang.",
    },
    {
      id: "agentic_facade",
      title: "Agentic Fassade",
      body:
        "Voxy erklärt Anliegen, Format, Quellen, Claims, Gegenargumente, Dossier und Handoff als sichere Schritte, ohne Provider-, Prompt- oder Chain-of-Thought-Leaks.",
    },
    {
      id: "boundaries",
      title: "Grenzen",
      body:
        "Keine Runtime, keine Provider, kein Auto-Publish, keine externe Notification und kein persönlicher Companion-Zwang für B2B/B2G.",
    },
  ];
}

export function buildVoxyExperienceShellHint(
  surfaceId: VoxyExperienceShellSurfaceId,
) {
  return (
    buildVoxyExperienceShellContract().surfaces.find((surface) => surface.id === surfaceId)
      ?.pageHint ?? null
  );
}

export function buildVoxyExperienceShellModeHint() {
  return "Voxy bleibt passiv oder geführt, bis du bewusst handelst. Active Voxy startet erst nach klarer Nutzeraktion.";
}
