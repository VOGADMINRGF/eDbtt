import type { PricingLocale } from "./i18n";

export type MembershipActivationTruth = {
  membershipTitle: string;
  membershipScopeHint: string;
  packageStartBannerHint: string;
  paymentProfileHint: string;
  contractBillingHint: string;
  entitlementHint: string;
  adminOrderReviewHint: string;
  adminMembershipSupportHint: string;
  adminMembershipManualActionsHint: string;
  legacySupportSurfaceHint: string;
};

const MEMBERSHIP_ACTIVATION_TRUTH = {
  de: {
    membershipTitle: "Mitgliedschaft in der Initiative",
    membershipScopeHint:
      "Mitgliedschaft stärkt die Initiative, ersetzt aber keinen eDebatte-Paketstart, keinen Vertrag und keine Organisationsfreischaltung.",
    packageStartBannerHint:
      "Paketstart, Vertragsprüfung und Freischaltung bleiben getrennte Schritte. Zahlung oder Mitgliedschaft setzen den Arbeitszugang nicht automatisch aktiv.",
    paymentProfileHint:
      "Dieses Zahlungsprofil dient Mitgliedschaftsbeiträgen, Verifikation und Support. Es löst keinen automatischen eDebatte-Paketstart, keine automatische Abbuchung für Pakete und keine automatische Freischaltung aus.",
    contractBillingHint:
      "Vertrag, Billing und Arbeitszugang bleiben bewusst getrennt. `approved` ist nicht `active`, Billing-Texte sind keine Zahlungsausführung und produktive Freischaltungen bleiben auditierbar.",
    entitlementHint:
      "Sichtbare Freischaltungen oder Pläne zeigen vorbereitete oder bewusst gesetzte Arbeitszugänge. Sichtbar heißt nicht automatisch gewährt, bezahlt oder öffentlich freigegeben.",
    adminOrderReviewHint:
      "Admin-Prüfung bleibt manuell und review-first: Paketwahl ist nicht aktive Nutzung, `approved` ist nicht `active`, `active` ist nicht `public_official` und kein Billing-Text löst Zahlung aus.",
    adminMembershipSupportHint:
      "Initiativen-Mitgliedschaft bleibt von eDebatte-Paketstart, Vertrag und Entitlement getrennt. Support für Beiträge und Kündigungen bleibt ein eigener manueller Pfad.",
    adminMembershipManualActionsHint:
      "`mark-paid` und `cancel` bleiben manuelle Support-Schritte für Mitgliedschaftsbeiträge. Sie setzen weder eDebatte-Pakete noch Entitlements automatisch aktiv.",
    legacySupportSurfaceHint:
      "Diese Oberfläche bleibt als interner Support- oder Bestandsweg erreichbar. Paketstart und Arbeitszugänge laufen weiter über /order, /admin/pricing/orders und /admin/entitlements.",
  },
  en: {
    membershipTitle: "Membership in the initiative",
    membershipScopeHint:
      "Membership strengthens the initiative, but does not replace eDebatte package start, contract handling or organization activation.",
    packageStartBannerHint:
      "Package start, contract review and activation remain separate steps. Payment or membership do not switch workspace access on automatically.",
    paymentProfileHint:
      "This payment profile supports membership contributions, verification and support. It does not trigger automatic eDebatte package start, automatic package charging or automatic activation.",
    contractBillingHint:
      "Contract, billing and workspace access remain deliberately separate. `approved` is not `active`, billing copy is not payment execution, and production activation stays auditable.",
    entitlementHint:
      "Visible entitlements or plans show prepared or deliberately granted workspace access. Visible does not mean automatically granted, paid or publicly released.",
    adminOrderReviewHint:
      "Admin review stays manual and review-first: package selection is not active usage, `approved` is not `active`, `active` is not `public_official`, and no billing copy executes payment.",
    adminMembershipSupportHint:
      "Initiative membership remains separate from eDebatte package start, contract handling and entitlements. Contribution support and cancellation stay on a separate manual path.",
    adminMembershipManualActionsHint:
      "`mark-paid` and `cancel` remain manual support actions for membership contributions. They do not activate eDebatte packages or entitlements automatically.",
    legacySupportSurfaceHint:
      "This surface remains reachable as an internal support or legacy path. Package start and workspace access continue through /order, /admin/pricing/orders and /admin/entitlements.",
  },
} as const satisfies Record<PricingLocale, MembershipActivationTruth>;

export function getMembershipActivationTruth(locale: PricingLocale = "de"): MembershipActivationTruth {
  return MEMBERSHIP_ACTIVATION_TRUTH[locale];
}
