export type V3CapabilityStatus =
  | "missing"
  | "docs_only"
  | "partially_built"
  | "operational_basic"
  | "endstate_ready"
  | "production_ready"
  | "live";

export const V3_CONTROL_CENTER_CAPABILITY_IDS = [
  "admin_control_center",
  "voxy_guided_experience",
  "handoff_integrity",
  "automation_suggestions",
  "deepsearch_cost_governance",
  "pricing_credits_limits",
  "roles_permissions_entitlements",
  "notifications_realtime_mail",
  "incident_recovery_maintenance",
  "database_admin_ops",
  "image_assets_outputs",
  "templates_output_standards",
  "qr_sharing_public_entry",
  "test_results_regression",
  "monitoring_alerting_rollback",
  "admin_handout_usage_guide",
  "prompt_based_low_ops",
  "live_claims_social_programm",
] as const;

export type V3CapabilityId = (typeof V3_CONTROL_CENTER_CAPABILITY_IDS)[number];

export const V3_CONTROL_CENTER_REAL_HREFS = [
  "/admin",
  "/admin/review",
  "/admin/region",
  "/admin/telemetry",
  "/admin/telemetry/ai/orchestrator",
  "/admin/telemetry/ai/usage",
  "/admin/entitlements",
  "/admin/pricing/orders",
  "/admin/errors",
  "/admin/system",
  "/admin/reports/assets",
  "/admin/themenradar",
  "/admin/newsletter",
  "/admin/graph/health",
  "/admin/create/attach-drafts/history-maintenance",
  "/admin/feeds",
  "/admin/campaigns",
  "/account/organization/dashboard",
  "/qr-studio",
] as const;

export type V3ControlCenterHref = (typeof V3_CONTROL_CENTER_REAL_HREFS)[number];

export type V3CapabilityEntry = {
  id: V3CapabilityId;
  label: string;
  status: V3CapabilityStatus;
  maturityTarget: "endstate_ready";
  currentReality: string;
  openGap: string;
  primaryAdminHref?: V3ControlCenterHref;
  primaryAdminLabel?: string;
  secondaryHref?: V3ControlCenterHref;
  secondaryLabel?: string;
  nextSliceId: string;
  guardrailNotes: string[];
  isEndstateReady: boolean;
  isBlocked: boolean;
  sortPriority: number;
};

export type V3ControlCenterStep = {
  sliceId: string;
  label: string;
  reason: string;
  priority: number;
};

export type V3ControlCenterReadModel = {
  generatedAt: string;
  capabilities: V3CapabilityEntry[];
  summary: {
    total: number;
    byStatus: Record<V3CapabilityStatus, number>;
    endstateReadyCount: number;
    openFollowUpCount: number;
  };
  guardrails: string[];
  nextRecommendedSteps: V3ControlCenterStep[];
  liveClaimsReminder: {
    title: string;
    body: string;
    bullets: string[];
  };
};

const GLOBAL_GUARDRAILS = [
  "Kein Auto-Publish",
  "Keine hidden Cost Paths",
  "Keine Auto-Activation",
  "Keine Auto-Factcheck- oder Auto-Verification-Pfade",
  "Keine Fake-Actions",
] as const;

function capability(input: Omit<V3CapabilityEntry, "maturityTarget" | "isEndstateReady">): V3CapabilityEntry {
  return {
    ...input,
    maturityTarget: "endstate_ready",
    isEndstateReady: input.status === "endstate_ready",
  };
}

function createStatusSummary() {
  return {
    missing: 0,
    docs_only: 0,
    partially_built: 0,
    operational_basic: 0,
    endstate_ready: 0,
    production_ready: 0,
    live: 0,
  } satisfies Record<V3CapabilityStatus, number>;
}

export function buildV3ControlCenterReadModel(): V3ControlCenterReadModel {
  const capabilities = [
    capability({
      id: "admin_control_center",
      label: "Admin Control Center",
      status: "operational_basic",
      currentReality:
        "Die bestehende Operator-Konsole auf /admin bündelt jetzt echte V3-Statuslagen, Links und Guardrails über vorhandene Admin-Flächen.",
      openGap:
        "Es fehlt weiterhin ein tieferes End-to-End-Steuerzentrum für Handoffs, Publish, Costs, Incidents, Assets und Reifeübergänge bis endstate_ready.",
      primaryAdminHref: "/admin",
      primaryAdminLabel: "Diese Übersicht",
      secondaryHref: "/admin/review",
      secondaryLabel: "Review Queue",
      nextSliceId: "V3-TEST-RESULTS-REGRESSION-MATRIX-01",
      guardrailNotes: [
        "Keine zweite Admin-Welt",
        "Keine Fake-Actions",
        "Nur echte Status- und Link-Bündelung",
      ],
      isBlocked: false,
      sortPriority: 100,
    }),
    capability({
      id: "voxy_guided_experience",
      label: "Voxy Guided Experience",
      status: "partially_built",
      currentReality:
        "Voxy ist real über Start, Create, Runden, Dossier und Swipes sichtbar, aber nicht als einheitliche Admin-, Review- und Publish-Führung geschlossen.",
      openGap:
        "Es fehlt eine plattformweite Guidance-Schicht mit sichtbaren Admin-Kontexten, Übergängen und konsistenter Handout-Parität.",
      nextSliceId: "V3-VOXY-GUIDED-EXPERIENCE-01",
      guardrailNotes: [
        "Keine delegierten Entscheidungen an Voxy",
        "Kein Review-Bypass",
      ],
      isBlocked: false,
      sortPriority: 84,
    }),
    capability({
      id: "handoff_integrity",
      label: "Handoff Integrity / Linkage Map",
      status: "operational_basic",
      currentReality:
        "Das V3 Control Center zeigt jetzt eine ehrliche Handoff Integrity & Linkage Map über Create, Review, Runtime, Publish, Public, QR, Social, Programm und Live-Folgepfade.",
      openGap:
        "Die Sichtbasis steht, aber die einzelnen Zielpfade bleiben offen, bis Claim-, Publish-, QR-, Social-, Live- und Programm-Folgen jeweils mindestens endstate_ready erreichen.",
      primaryAdminHref: "/admin",
      primaryAdminLabel: "Control Center",
      secondaryHref: "/admin/review",
      secondaryLabel: "Review Queue",
      nextSliceId: "V3-CLAIM-TO-DOSSIER-PIPELINE-01",
      guardrailNotes: [
        "Linkage ist Sichtbarkeit, keine Wahrheit",
        "Keine automatische Runtime-Erstellung",
        "Keine automatische Veröffentlichung",
      ],
      isBlocked: false,
      sortPriority: 98,
    }),
    capability({
      id: "automation_suggestions",
      label: "Automation Suggestion Engine",
      status: "partially_built",
      currentReality:
        "Review-first Vorschläge sind fragmentarisch vorhanden, etwa über Region-Cockpit, Assist-Runs und orchestrator-nahe Diagnostik.",
      openGap:
        "Es fehlt ein einheitlicher Suggestion-Stack mit Audit, Admin-Sicht und klaren Grenzen bis endstate_ready.",
      primaryAdminHref: "/admin/region",
      primaryAdminLabel: "Region-Cockpit",
      secondaryHref: "/admin/telemetry/ai/orchestrator",
      secondaryLabel: "AI Orchestrator",
      nextSliceId: "V3-AUTOMATION-SUGGESTION-ENGINE-01",
      guardrailNotes: [
        "Keine automatische Ausführung",
        "Keine versteckte Automatisierung",
      ],
      isBlocked: false,
      sortPriority: 72,
    }),
    capability({
      id: "deepsearch_cost_governance",
      label: "DeepSearch / Cost Governance",
      status: "operational_basic",
      currentReality:
        "Die bestehende Operator-Konsole zeigt jetzt eine kanonische V3-Sicht über Research-, Material-, AI-Usage- und Export-Cost-Gates samt ehrlichen Statusgrenzen.",
      openGap:
        "Es fehlt weiterhin eine per-run Verbrauchs-, Approval- und Nachaudit-Wahrheit statt nur sichtbarer Gate- und Warnlogik.",
      primaryAdminHref: "/admin",
      primaryAdminLabel: "Control Center",
      secondaryHref: "/admin/telemetry/ai/usage",
      secondaryLabel: "AI Usage",
      nextSliceId: "V3-DEEPSEARCH-CONSUMPTION-TRUTH-02",
      guardrailNotes: [
        "Keine hidden DeepSearch",
        "Keine hidden Cost Paths",
        "Keine erfundene Debit-Wahrheit",
      ],
      isBlocked: false,
      sortPriority: 70,
    }),
    capability({
      id: "pricing_credits_limits",
      label: "Pricing / Credits / Limits",
      status: "operational_basic",
      currentReality:
        "Pricing-, Billing-, Entitlement- und Cost-Gate-Bausteine sind jetzt als eigener V3-Admin-Slice sichtbar und über Orders, AI Usage sowie Freischaltungen anschlussfähig.",
      openGap:
        "Es fehlt weiterhin eine geschlossene V3-Verbrauchswahrheit für Research, Assets, Exporte und Suggestions mit per-run Approval, Abzug und Nachaudit.",
      primaryAdminHref: "/admin/pricing/orders",
      primaryAdminLabel: "Pricing Orders",
      secondaryHref: "/admin/telemetry/ai/usage",
      secondaryLabel: "AI Usage",
      nextSliceId: "V3-DEEPSEARCH-CONSUMPTION-TRUTH-02",
      guardrailNotes: [
        "Keine neue Checkout-Integration",
        "Keine versteckten Gebührenläufe",
      ],
      isBlocked: false,
      sortPriority: 82,
    }),
    capability({
      id: "roles_permissions_entitlements",
      label: "Roles / Permissions / Entitlements",
      status: "partially_built",
      currentReality:
        "Reale Rechte- und Freischaltungsflächen existieren über Entitlements und das Organisationsdashboard.",
      openGap:
        "Es fehlt eine harmonisierte V3-Rechtekarte über Admin, Redaktion, Organisation, Kommune und Medienpartner.",
      primaryAdminHref: "/admin/entitlements",
      primaryAdminLabel: "Freischaltungen",
      secondaryHref: "/account/organization/dashboard",
      secondaryLabel: "Organisationssicht",
      nextSliceId: "V3-ROLES-PERMISSIONS-ENTITLEMENTS-01",
      guardrailNotes: [
        "Keine implizite Freigabe durch Rolle",
        "Keine stille Kostenfreigabe",
      ],
      isBlocked: false,
      sortPriority: 80,
    }),
    capability({
      id: "notifications_realtime_mail",
      label: "Notifications / Realtime / Mail",
      status: "partially_built",
      currentReality:
        "Newsletter-, Alert- und Statusreport-Flächen sind real vorhanden, aber noch nicht als einheitliche V3-Benachrichtigungsschicht.",
      openGap:
        "Es fehlen vereinheitlichte Operator-Signale für Review, Publish, Costs, Incident und Validation.",
      primaryAdminHref: "/admin/newsletter",
      primaryAdminLabel: "Newsletter",
      secondaryHref: "/admin/telemetry",
      secondaryLabel: "Telemetry Hub",
      nextSliceId: "V3-NOTIFICATIONS-REALTIME-MAIL-01",
      guardrailNotes: [
        "Keine stille Realtime-Entscheidung",
        "Kein Review-Bypass über Benachrichtigungen",
      ],
      isBlocked: false,
      sortPriority: 64,
    }),
    capability({
      id: "incident_recovery_maintenance",
      label: "Incident / Recovery / Maintenance",
      status: "partially_built",
      currentReality:
        "Fehler-, System-, Health- und Maintenance-Flächen sind real vorhanden und verlinkbar.",
      openGap:
        "Es fehlt ein geschlossenes Incident-, Recovery- und Retry-Zielbild mit klarer Operator-Führung.",
      primaryAdminHref: "/admin/errors",
      primaryAdminLabel: "Error Logs",
      secondaryHref: "/admin/system",
      secondaryLabel: "System Hub",
      nextSliceId: "V3-INCIDENT-RECOVERY-MAINTENANCE-01",
      guardrailNotes: [
        "Keine verdeckte Reparatur-Automatik",
        "Keine automatische Veröffentlichung aus Incident-Pfaden",
      ],
      isBlocked: false,
      sortPriority: 62,
    }),
    capability({
      id: "database_admin_ops",
      label: "Database Admin Ops / Manual Creation",
      status: "partially_built",
      currentReality:
        "Manuelle Review-, Runtime-Creation- und Maintenance-Eingriffe sind real über bestehende Admin-Flächen möglich.",
      openGap:
        "Es fehlt ein vereinheitlichter auditpflichtiger V3-Admin-Ops-Pfad für Overrides, Slugs, QR und manuelle Eingriffe.",
      primaryAdminHref: "/admin/review",
      primaryAdminLabel: "Review Queue",
      secondaryHref: "/admin/create/attach-drafts/history-maintenance",
      secondaryLabel: "History Maintenance",
      nextSliceId: "V3-DATABASE-ADMIN-OPS-MANUAL-CREATION-01",
      guardrailNotes: [
        "Keine versteckten Public-Schreibwege",
        "Keine zweite Runtime-Welt",
      ],
      isBlocked: false,
      sortPriority: 60,
    }),
    capability({
      id: "image_assets_outputs",
      label: "Image / Assets / Outputs",
      status: "partially_built",
      currentReality:
        "Asset-, Report- und Share-ready-Flächen sind real vorhanden und über Admin-Assets sowie Themenradar anschlussfähig.",
      openGap:
        "Es fehlt eine geschlossene V3-Governance für generative Assets, Status, Costs und Public Safety.",
      primaryAdminHref: "/admin/reports/assets",
      primaryAdminLabel: "Report Assets",
      secondaryHref: "/admin/themenradar",
      secondaryLabel: "Themenradar",
      nextSliceId: "V3-IMAGE-GENERATION-VOXY-ASSETS-DOSSIER-OUTPUTS-01",
      guardrailNotes: [
        "Keine Bildbeweise",
        "Keine versteckten Generierungskosten",
      ],
      isBlocked: false,
      sortPriority: 58,
    }),
    capability({
      id: "templates_output_standards",
      label: "Templates / Output Standards",
      status: "partially_built",
      currentReality:
        "Template- und Output-Bausteine sind real vorhanden, aber noch nicht als einheitliche Admin-Steuerfläche sichtbar.",
      openGap:
        "Es fehlt eine V3-weite Template-Familie mit klarer Admin-, Test- und Handout-Parität.",
      nextSliceId: "V3-TEMPLATE-OUTPUT-STANDARDIZATION-01",
      guardrailNotes: [
        "Keine neue Parallelwelt für Exporte",
        "Kein Auto-Publish aus Templates",
      ],
      isBlocked: false,
      sortPriority: 52,
    }),
    capability({
      id: "qr_sharing_public_entry",
      label: "QR / Sharing / Public Entry",
      status: "partially_built",
      currentReality:
        "QR- und Public-Entry-Bausteine sind real vorhanden und über QR Studio sowie Campaign- und Public-Routen sichtbar.",
      openGap:
        "Es fehlt eine einheitliche V3-Prüf- und Safety-Schicht für Slugs, QR-Sets und Share-Preview.",
      primaryAdminHref: "/qr-studio",
      primaryAdminLabel: "QR Studio",
      secondaryHref: "/admin/campaigns",
      secondaryLabel: "Campaigns",
      nextSliceId: "V3-QR-SHARING-PUBLIC-ENTRY-01",
      guardrailNotes: [
        "Keine internen IDs im Public Entry",
        "Kein Auto-Sharing",
      ],
      isBlocked: false,
      sortPriority: 56,
    }),
    capability({
      id: "test_results_regression",
      label: "Test Results / Regression / E2E",
      status: "operational_basic",
      currentReality:
        "Die bestehende Operator-Konsole zeigt jetzt eine sichtbare V3 Test & Regression Matrix über Capabilities, Handoffs, Guardrails, Production Validation und offene E2E-Lücken.",
      openGap:
        "Die Matrix ist jetzt sichtbar, aber kritische Folgepfade wie External Browser E2E, Programm-Kandidaten, Social Drafts, Notifications und Rollback bleiben testseitig offen.",
      primaryAdminHref: "/admin/system",
      primaryAdminLabel: "System Hub",
      secondaryHref: "/admin/graph/health",
      secondaryLabel: "Graph Health",
      nextSliceId: "V3-EXTERNAL-BROWSER-E2E-01",
      guardrailNotes: [
        "Keine Testsimulation",
        "Keine ausgedachten Coverage-Zahlen",
      ],
      isBlocked: false,
      sortPriority: 90,
    }),
    capability({
      id: "monitoring_alerting_rollback",
      label: "Monitoring / Alerting / Rollback",
      status: "partially_built",
      currentReality:
        "Telemetry-, Health- und Alert-Flächen sind real vorhanden und über System sowie Graph Health verlinkbar.",
      openGap:
        "Es fehlt eine belastbare V3-Betriebsschicht mit Rollback-Parität und zusammenhängender Beobachtung.",
      primaryAdminHref: "/admin/telemetry",
      primaryAdminLabel: "Telemetry Hub",
      secondaryHref: "/admin/graph/health",
      secondaryLabel: "Graph Health",
      nextSliceId: "V3-MONITORING-ALERTING-ROLLBACK-01",
      guardrailNotes: [
        "Keine automatische Moderation",
        "Keine automatische Freigabe aus Observability",
      ],
      isBlocked: false,
      sortPriority: 54,
    }),
    capability({
      id: "admin_handout_usage_guide",
      label: "Admin Handout / Usage Guide",
      status: "docs_only",
      currentReality:
        "Das Handout ist als Zielbild dokumentiert, aber noch nicht gegen die reale Admin-UI und die V3-Flows validiert.",
      openGap:
        "Es fehlt die 1:1-Parität zwischen echter UI, Fehlerfällen, Rollback, Guardrails und Nutzungsdoku.",
      nextSliceId: "V3-ADMIN-HANDOUT-AND-USAGE-GUIDE-01",
      guardrailNotes: [
        "Keine UI-Behauptung ohne echten Pfad",
        "Keine Handout-Abnahme vor Flow-Parität",
      ],
      isBlocked: false,
      sortPriority: 40,
    }),
    capability({
      id: "prompt_based_low_ops",
      label: "Prompt-based Low-Ops",
      status: "partially_built",
      currentReality:
        "Prompt- und Companion-Bausteine sind real vorhanden, aber nicht als adminseitiger Low-Ops-Wartungspfad geschlossen.",
      openGap:
        "Es fehlen klare Rechte-, Audit-, Kosten- und Action-Grenzen für einen kanonischen Maintenance-Pfad.",
      primaryAdminHref: "/admin/telemetry/ai/orchestrator",
      primaryAdminLabel: "AI Orchestrator",
      nextSliceId: "V3-PROMPT-BASED-MAINTENANCE-AND-LOW-OPS-01",
      guardrailNotes: [
        "Keine stillen DB-Schreibwege",
        "Keine versteckten Costs",
      ],
      isBlocked: false,
      sortPriority: 46,
    }),
    capability({
      id: "live_claims_social_programm",
      label: "Live / Claims / Social / Programm",
      status: "partially_built",
      currentReality:
        "Live-, Claim-, Dossier-, Social- und Programm-Anker sind real vorhanden und als Zielbild kanonisiert, aber noch nicht als eine operatorisch steuerbare V3-Linie gebündelt.",
      openGap:
        "Es fehlen Live Sessions, Claim Queue, Dossier Updates, Social Drafts, Programm-Kandidaten, Meeting-Link-Status und Mindestbeteiligungsquote in einem gemeinsamen Bedienkontext.",
      primaryAdminHref: "/admin/review",
      primaryAdminLabel: "Review Queue",
      secondaryHref: "/admin/feeds",
      secondaryLabel: "Feeds",
      nextSliceId: "V3-LIVE-FORMAT-HOST-COCKPIT-01",
      guardrailNotes: [
        "Kein Auto-Programm",
        "Keine echten Social-Posts",
        "Keine Meeting-Connector-Pflicht",
      ],
      isBlocked: false,
      sortPriority: 88,
    }),
  ].sort((left, right) => right.sortPriority - left.sortPriority);

  const byStatus = createStatusSummary();
  for (const entry of capabilities) {
    byStatus[entry.status] += 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    capabilities,
    summary: {
      total: capabilities.length,
      byStatus,
      endstateReadyCount: capabilities.filter((entry) => entry.isEndstateReady).length,
      openFollowUpCount: capabilities.filter((entry) => !entry.isEndstateReady).length,
    },
    guardrails: [...GLOBAL_GUARDRAILS],
    nextRecommendedSteps: [
      {
        sliceId: "V3-CLAIM-TO-DOSSIER-PIPELINE-01",
        label: "Claim-to-Dossier Pipeline",
        reason: "Die sichtbare Handoff-Kette muss als nächstes Claims, Quellen, Dossier-Follow-up und Programmkandidaten sauber zusammenziehen.",
        priority: 100,
      },
      {
        sliceId: "V3-EXTERNAL-BROWSER-E2E-01",
        label: "External Browser E2E",
        reason: "Die Matrix macht sichtbar, dass belastbare Browser-E2E für die kritischen V3-Journeys weiterhin offen sind.",
        priority: 94,
      },
      {
        sliceId: "V3-QR-SHARING-PUBLIC-ENTRY-01",
        label: "QR / Sharing / Public Entry",
        reason: "QR-, Sharing- und Public-Entry-Integrität muss auf die sichtbare Linkage Map folgen.",
        priority: 90,
      },
      {
        sliceId: "V3-DOSSIER-SOCIAL-OUTPUT-DRAFTS-01",
        label: "Dossier / Social / Output Drafts",
        reason: "Dossier-, Round- und Themen-Folgen brauchen eine sichtbare Draft- und Freigabekette ohne Auto-Publish.",
        priority: 86,
      },
      {
        sliceId: "V3-VOXY-GUIDED-EXPERIENCE-01",
        label: "Voxy Guided Experience",
        reason: "Voxy ist real vorhanden, muss aber über Admin, Review, Publish und Public konsistent geführt werden.",
        priority: 82,
      },
    ],
    liveClaimsReminder: {
      title: "Live / Claims / Social / Programm nicht vergessen",
      body:
        "Das Control Center darf die spätere Live- und Programm-Linie nicht zu klein schneiden. Sichtbarkeit ist hier nur der erste Schritt.",
      bullets: [
        "Live Sessions und laufende Beteiligung sichtbar halten",
        "Claim Queue, Dossier Updates und Social Drafts später gemeinsam führen",
        "Programm-Kandidaten, Mindestbeteiligungsquote und Meeting-Link-Status mitdenken",
      ],
    },
  };
}
