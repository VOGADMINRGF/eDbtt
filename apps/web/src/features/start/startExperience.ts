import { buildOrganizationDashboardReadModel } from "@features/region";
import type { TaskFirstQuickActionCenterModel, StartQuickActionContext } from "@/features/quickActions/taskFirstQuickActions";
import { buildPublicTaskFirstQuickActionCenter } from "@/features/quickActions/taskFirstQuickActions";

export type StartExperienceModel = {
  familiarity: StartQuickActionContext;
  eyebrow: string;
  title: string;
  description: string;
  helperText: string;
  trustText: string;
  showExtendedOrientation: boolean;
  workspaceHref: string | null;
  workspaceLabel: string | null;
  quickActionCenter: TaskFirstQuickActionCenterModel;
};

type StartExperienceUser = {
  _id?: { toHexString?: () => string } | null;
  roles?: string[] | null;
  sessionValid?: boolean | null;
};

function buildAnonymousExperience(): StartExperienceModel {
  const quickActionCenter = buildPublicTaskFirstQuickActionCenter({
    context: "unknown_visitor",
  });
  return {
    familiarity: "unknown_visitor",
    eyebrow: "Klarer Einstieg",
    title: "Was bewegt dich?",
    description:
      "Bring ein Thema ein oder stimme ab, wo deine Sicht gebraucht wird. Voxy hilft beim Sortieren. Veröffentlicht wird nichts ohne Prüfung.",
    helperText: "Beitrag einbringen, mitmachen oder vorhandene Themen öffnen.",
    trustText:
      "Voxy hilft beim Sortieren. Veröffentlicht wird nichts ohne Prüfung.",
    showExtendedOrientation: false,
    workspaceHref: null,
    workspaceLabel: null,
    quickActionCenter,
  };
}

export async function buildStartExperienceModel(input: {
  user: StartExperienceUser | null;
  isAdmin: boolean;
}): Promise<StartExperienceModel> {
  const userId = input.user?._id?.toHexString?.() ?? null;
  const roles = input.user?.roles ?? [];

  if (!input.user || !input.user.sessionValid || !userId) {
    return buildAnonymousExperience();
  }

  if (input.isAdmin) {
    const quickActionCenter = buildPublicTaskFirstQuickActionCenter({
      context: "operator",
      workspaceHref: "/account/organization/dashboard",
    });
    return {
      familiarity: "operator",
      eyebrow: "Schon dabei?",
      title: "Bereite Beteiligung nachvollziehbar vor.",
      description:
        "Sammle Hinweise, kläre Fragen und starte einen Anlassraum erst dann, wenn der nächste Schritt geprüft ist.",
      helperText: "Du kannst Beiträge prüfen, Entwürfe weiterführen oder eine Organisation ansehen.",
      trustText:
        "Nichts wird automatisch veröffentlicht. Prüf- und Verwaltungsrechte bleiben nachvollziehbar.",
      showExtendedOrientation: false,
      workspaceHref: "/account/organization/dashboard",
      workspaceLabel: "Organisation prüfen",
      quickActionCenter,
    };
  }

  const readModel = await buildOrganizationDashboardReadModel({
    userId,
    roles,
    isAdmin: false,
  });

  const verificationStatus = readModel.verificationStatus;
  const hasOrganizationSignal =
    Boolean(readModel.organization.primaryOrganizationId) ||
    readModel.pendingOrganizationClaims.length > 0 ||
    readModel.membershipStatus.totalMemberships > 0;
  const blocked =
    readModel.provisioningSummary.currentStatus === "suspended" ||
    readModel.contractSummary.currentContractStatus === "suspended" ||
    readModel.contractSummary.currentContractStatus === "cancelled" ||
    readModel.contractSummary.currentContractStatus === "expired" ||
    readModel.contractSummary.billingStatus === "suspended" ||
    readModel.contractSummary.billingStatus === "cancelled" ||
    readModel.contractSummary.billingStatus === "expired" ||
    readModel.entitlementSummary.currentStatus === "suspended" ||
    readModel.entitlementSummary.currentStatus === "revoked" ||
    readModel.entitlementSummary.currentStatus === "expired";
  const pending =
    verificationStatus !== "organization_verified" &&
    verificationStatus !== "unit_verified" &&
    verificationStatus !== "publication_approved"
      ? hasOrganizationSignal
      : readModel.provisioningSummary.currentStatus === "draft" ||
        readModel.provisioningSummary.currentStatus === "submitted" ||
        readModel.provisioningSummary.currentStatus === "verification_required" ||
        readModel.provisioningSummary.currentStatus === "operator_review_required" ||
        readModel.entitlementSummary.currentStatus === "limited" ||
        readModel.entitlementSummary.currentStatus === "pending_operator_decision" ||
        readModel.contractSummary.currentContractStatus === "limited" ||
        readModel.contractSummary.currentContractStatus === "draft" ||
        readModel.contractSummary.currentContractStatus === "offered" ||
        readModel.contractSummary.currentContractStatus === "accepted";

  const familiarity: StartQuickActionContext = blocked
    ? "organization_blocked"
    : hasOrganizationSignal
      ? pending
        ? "organization_pending"
        : "organization_verified"
      : "signed_in";
  const workspaceHref = familiarity === "organization_verified" ? "/account/organization/dashboard" : "/account/organization";
  const quickActionCenter = buildPublicTaskFirstQuickActionCenter({
    context: familiarity,
    workspaceHref,
  });

  if (familiarity === "organization_verified") {
    return {
      familiarity,
      eyebrow: "Schon dabei?",
      title: "Bereite Beteiligung nachvollziehbar vor.",
      description:
        "Sammle Hinweise, kläre Fragen und starte einen Anlassraum erst dann, wenn der nächste Schritt geprüft ist.",
      helperText: "Du kannst Entwürfe weiterführen, Themen ansehen oder einen Anlassraum vorbereiten.",
      trustText:
        "Nichts wird automatisch veröffentlicht. Prüfung und Sichtbarkeit bleiben getrennte Schritte.",
      showExtendedOrientation: false,
      workspaceHref,
      workspaceLabel: "Organisation prüfen",
      quickActionCenter,
    };
  }

  if (familiarity === "organization_blocked") {
    return {
      familiarity,
      eyebrow: "Schon dabei?",
      title: "Bereite Beteiligung nachvollziehbar vor.",
      description:
        "Sammle Hinweise, kläre offene Fragen und prüfe zuerst den sicheren nächsten Schritt für deine Organisation.",
      helperText: "Du kannst deinen Status prüfen und Entwürfe sicher weiterführen.",
      trustText:
        "Nichts wird automatisch veröffentlicht. Gesperrte Zugänge werden nicht als aktiv dargestellt.",
      showExtendedOrientation: false,
      workspaceHref,
      workspaceLabel: "Status prüfen",
      quickActionCenter,
    };
  }

  if (familiarity === "organization_pending") {
    return {
      familiarity,
      eyebrow: "Schon dabei?",
      title: "Bereite Beteiligung nachvollziehbar vor.",
      description:
        "Sammle Hinweise, kläre Fragen und starte einen Anlassraum erst dann, wenn der nächste Schritt geprüft ist.",
      helperText: "Du kannst deine Organisation prüfen, Entwürfe weiterführen oder Themen ansehen.",
      trustText:
        "Nichts wird automatisch veröffentlicht. Organisationsrechte und Sichtbarkeit bleiben getrennte Schritte.",
      showExtendedOrientation: false,
      workspaceHref,
      workspaceLabel: "Antrag und Status",
      quickActionCenter,
    };
  }

  return {
    familiarity,
    eyebrow: "Schon dabei?",
    title: "Mach mit deinem Anliegen weiter.",
    description:
      "Du kannst deinen Entwurf prüfen, ein Thema ansehen oder einen Anlassraum vorbereiten. Nichts wird automatisch veröffentlicht.",
    helperText: "Mach dort weiter, wo dein Anliegen gerade steht.",
    trustText:
      "Nichts wird automatisch veröffentlicht. Du entscheidest, wann dein Beitrag weitergeht.",
    showExtendedOrientation: false,
    workspaceHref,
    workspaceLabel: "Organisation prüfen",
    quickActionCenter,
  };
}
