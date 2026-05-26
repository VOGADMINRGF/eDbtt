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
    eyebrow: "Öffentliche Debatten verständlich machen",
    title: "Was Menschen bewegt, wird sichtbar.",
    description:
      "Bei eDebatte geht es nicht um laute Kommentare, sondern um echte Anliegen. Wir sammeln Hinweise, Fragen, Erfahrungen und Vorschläge, ordnen sie review-first mit Kontext und halten Arbeitsstände auditierbar fest.",
    helperText: "Neu hier? Starte mit einem Beitrag oder schau dir Themen an.",
    trustText:
      "Wir veröffentlichen nichts ungeprüft. Keine Datenverkäufe. Keine versteckten AI-Kosten.",
    showExtendedOrientation: true,
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
      title: "Öffne deinen Arbeitsbereich und geh direkt in die nächste Aufgabe.",
      description:
        "Du bist bereits im Betreiberkontext. Review, Organisationsblick und Anlassraum bleiben auf denselben produktiven V1-Pfaden erreichbar.",
      helperText: "Du siehst immer, was als nächstes passiert.",
      trustText:
        "Wir veröffentlichen nichts ungeprüft. Betreiberrechte bleiben sichtbar und auditierbar.",
      showExtendedOrientation: false,
      workspaceHref: "/account/organization/dashboard",
      workspaceLabel: "Zum Arbeitsbereich",
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
      title: "Öffne deinen Arbeitsbereich oder erstelle einen Anlassraum.",
      description:
        "Deine Organisation ist im produktiven V1-Pfad. Arbeitsbereich, nächste Aufgaben und sichere Folgeaktionen stehen direkt vorne.",
      helperText: "Du siehst immer, was als nächstes passiert.",
      trustText:
        "Wir veröffentlichen nichts ungeprüft. Review und Sichtbarkeit bleiben getrennte Schritte.",
      showExtendedOrientation: false,
      workspaceHref,
      workspaceLabel: "Zum Organisationsbereich",
      quickActionCenter,
    };
  }

  if (familiarity === "organization_blocked") {
    return {
      familiarity,
      eyebrow: "Schon dabei?",
      title: "Prüfe Status, Sperre und den nächsten sicheren Schritt.",
      description:
        "Produktive Organisationsschritte bleiben bis zur Klärung gesperrt. Du siehst hier nur sichere Wege weiter.",
      helperText: "Du siehst immer, was als nächstes passiert.",
      trustText:
        "Wir veröffentlichen nichts ungeprüft. Gesperrte Zugänge werden nicht als aktiv dargestellt.",
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
      title: "Öffne deinen Arbeitsbereich oder kläre die Freischaltung.",
      description:
        "Antrag, Nachweise und sichere nächste Schritte stehen vorne. Produktive Organisationsrechte erscheinen erst nach bewusster Freischaltung.",
      helperText: "Du siehst immer, was als nächstes passiert.",
      trustText:
        "Wir veröffentlichen nichts ungeprüft. Freischaltungen und Sichtbarkeit bleiben bewusst und review-first.",
      showExtendedOrientation: false,
      workspaceHref,
      workspaceLabel: "Antrag und Status",
      quickActionCenter,
    };
  }

  return {
    familiarity,
    eyebrow: "Schon dabei?",
    title: "Öffne deinen Arbeitsbereich oder arbeite direkt weiter.",
    description:
      "Du bist angemeldet. Die wichtigsten Wege zu Beitrag, Themen und Organisationsbereich stehen direkt vorne.",
    helperText: "Du siehst immer, was als nächstes passiert.",
    trustText:
      "Wir veröffentlichen nichts ungeprüft. Keine Datenverkäufe. Keine versteckten AI-Kosten.",
    showExtendedOrientation: false,
    workspaceHref,
    workspaceLabel: "Zum Arbeitsbereich",
    quickActionCenter,
  };
}
