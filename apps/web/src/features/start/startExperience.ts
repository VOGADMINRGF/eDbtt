import { buildOrganizationDashboardReadModel } from "@features/region";
import type { TaskFirstQuickActionCenterModel, StartQuickActionContext } from "@/features/quickActions/taskFirstQuickActions";
import { buildPublicTaskFirstQuickActionCenter } from "@/features/quickActions/taskFirstQuickActions";
import {
  isOrganizationAccessBlocked,
  isOrganizationAccessLimited,
  isOrganizationVerificationPending,
} from "@/features/access/productionEntryContract";

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
    eyebrow: "Aktuelle Themen · Quellen · Beteiligung",
    title: "Verstehen, was sich verändert. Mitreden, wo es zählt.",
    description:
      "eDebatte bündelt aktuelle Entwicklungen, Quellen, Positionen und Beteiligungsmöglichkeiten zu nachvollziehbaren Themenständen – von deiner Region bis zur Welt.",
    helperText: "Entwicklungen entdecken, mitwirken oder einen eigenen Beitrag prüfen lassen.",
    trustText:
      "Nichts wird automatisch veröffentlicht. Quellen, Prüfstatus und Beteiligung bleiben nachvollziehbar.",
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
      eyebrow: "Betreiberübersicht",
      title: "Beteiligung steuern und Wirkung sichtbar machen.",
      description:
        "Prüfe neue Signale, Quellen, Entwürfe und Freigaben. Öffentliche Schritte bleiben bewusst von interner Bearbeitung getrennt.",
      helperText:
        "Öffne die Betreiberübersicht, priorisiere neue Entwicklungen und führe freigegebene Themen nachvollziehbar weiter.",
      trustText:
        "Nichts wird automatisch veröffentlicht. Prüf- und Verwaltungsrechte bleiben nachvollziehbar.",
      showExtendedOrientation: false,
      workspaceHref: "/account/organization/dashboard",
      workspaceLabel: "Betreiberübersicht öffnen",
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
  const blocked = isOrganizationAccessBlocked({
    provisioningStatus: readModel.provisioningSummary.currentStatus,
    contractStatus: readModel.contractSummary.currentContractStatus,
    billingStatus: readModel.contractSummary.billingStatus,
    entitlementStatus: readModel.entitlementSummary.currentStatus,
  });
  const pending =
    isOrganizationVerificationPending({
      verificationStatus,
      hasOrganizationSignal,
    }) ||
    readModel.provisioningSummary.currentStatus === "draft" ||
    readModel.provisioningSummary.currentStatus === "submitted" ||
    readModel.provisioningSummary.currentStatus === "verification_required" ||
    readModel.provisioningSummary.currentStatus === "operator_review_required" ||
    isOrganizationAccessLimited({
      provisioningStatus: readModel.provisioningSummary.currentStatus,
      contractStatus: readModel.contractSummary.currentContractStatus,
      billingStatus: readModel.contractSummary.billingStatus,
      entitlementStatus: readModel.entitlementSummary.currentStatus,
    });

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
      eyebrow: "Organisation",
      title: "Themen, Beteiligung und Ergebnisse im Blick.",
      description:
        "Verbinde neue Signale, Quellen, Veranstaltungen und Rückmeldungen mit bestehenden Dossiers und Beteiligungsräumen.",
      helperText:
        "Öffne deinen Arbeitsbereich, prüfe neue Entwicklungen und führe laufende Beteiligungen oder Ergebnisse weiter.",
      trustText:
        "Nichts wird automatisch veröffentlicht. Prüfung und Sichtbarkeit bleiben getrennte Schritte.",
      showExtendedOrientation: false,
      workspaceHref,
      workspaceLabel: "Organisationsbereich öffnen",
      quickActionCenter,
    };
  }

  if (familiarity === "organization_blocked") {
    return {
      familiarity,
      eyebrow: "Organisation",
      title: "Zugang und nächsten sicheren Schritt prüfen.",
      description:
        "Dein Organisationszugang ist derzeit eingeschränkt. Persönliche Beiträge und öffentliche Themen bleiben davon getrennt nutzbar.",
      helperText:
        "Prüfe den Status deiner Organisation oder arbeite an persönlichen Entwürfen und öffentlichen Themen weiter.",
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
      eyebrow: "Organisation",
      title: "Antrag läuft – Themen können weiter vorbereitet werden.",
      description:
        "Während dein Organisationszugang geprüft wird, kannst du Quellen, Beiträge und Beteiligungsideen vorbereiten, ohne öffentliche Rechte vorwegzunehmen.",
      helperText:
        "Prüfe Antrag und Status oder arbeite an persönlichen Entwürfen und öffentlichen Themen weiter.",
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
    eyebrow: "Neu für dich",
    title: "Seit deinem letzten Besuch.",
    description:
      "Entdecke neue Quellen, Positionen, Beteiligungsmöglichkeiten und Ergebnisse. eDebatte zeigt dir, was sich wesentlich verändert hat – nicht nur, was neu veröffentlicht wurde.",
    helperText:
      "Öffne neue Entwicklungen, folge Themen oder führe einen eigenen Beitrag dort weiter, wo du aufgehört hast.",
    trustText:
      "Nichts wird automatisch veröffentlicht. Du entscheidest, welchen nächsten Schritt du gehst.",
    showExtendedOrientation: false,
    workspaceHref,
    workspaceLabel: "Konto und Organisation",
    quickActionCenter,
  };
}
