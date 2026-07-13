export type OperatorWorkbenchSurfaceKey =
  | "reviewQueue"
  | "editorialQueue"
  | "feedControl"
  | "accessCenter"
  | "entitlements"
  | "pricingOrders"
  | "organizationDashboard"
  | "systemHub"
  | "errorLogs";

export type OperatorWorkbenchSurface = {
  href: string;
  eyebrow: string;
  title: string;
  summary: string;
};

export const OPERATOR_WORKBENCH_SURFACES: Record<
  OperatorWorkbenchSurfaceKey,
  OperatorWorkbenchSurface
> = {
  reviewQueue: {
    href: "/admin/review",
    eyebrow: "Admin · Review",
    title: "Review Queue",
    summary:
      "Zentrale Betreiber-Arbeitsliste für Review, Freigabe und sichtbare nächste Schritte ohne Auto-Publish.",
  },
  editorialQueue: {
    href: "/admin/editorial/queue",
    eyebrow: "Admin · Redaktion",
    title: "Editorial Queue",
    summary:
      "Triage, Review und Freigaben bleiben ein vorbereiteter Review-first Pfad ohne automatische Veröffentlichung.",
  },
  feedControl: {
    href: "/admin/feeds",
    eyebrow: "Admin · Feeds",
    title: "Feed Control",
    summary:
      "Explizite Quellen, Snapshots und Material-Handoffs bleiben reviewpflichtig und ohne Live-Runtime-Versprechen.",
  },
  accessCenter: {
    href: "/admin/access",
    eyebrow: "Access Center",
    title: "Seitenzugriffe verwalten",
    summary:
      "Route-Policies, Rollenpfade und sichtbare Zugriffe bleiben getrennt von Membership-, Freischaltungs- und Billing-Wahrheit.",
  },
  entitlements: {
    href: "/admin/entitlements",
    eyebrow: "Admin Freischaltung",
    title: "Freischaltungen verwalten",
    summary:
      "Arbeitszugänge werden bewusst und auditierbar freigeschaltet, ohne automatische Zahlung, Veröffentlichung oder Amtlichkeit.",
  },
  pricingOrders: {
    href: "/admin/pricing/orders",
    eyebrow: "Pricing Orders",
    title: "Pricing Orders",
    summary:
      "Vertrags-, Billing- und Freischaltungsentscheidungen bleiben review-first und erzeugen keine neue Checkout- oder Publish-Runtime.",
  },
  organizationDashboard: {
    href: "/account/organization/dashboard",
    eyebrow: "Organisation",
    title: "Organisationsbereich",
    summary:
      "Der Organisationsblick zeigt denselben Arbeitsstand wie die Admin-Workbench, aber mit klar getrennten Mitgliedschafts-, Freischaltungs- und Review-Pfaden.",
  },
  systemHub: {
    href: "/admin/system",
    eyebrow: "Admin · System",
    title: "System Hub",
    summary:
      "Betriebs- und Konfigurationsflächen mit klaren Rückwegen in Review, Freischaltung und Diagnose statt isolierter Admin-Inseln.",
  },
  errorLogs: {
    href: "/admin/errors",
    eyebrow: "Admin · System",
    title: "Error Logs",
    summary:
      "Systemweite Fehler und Trace-IDs bleiben Diagnosefläche; operative Folgen werden anschließend in den bestehenden Workbenches geklärt.",
  },
};

export function getOperatorWorkbenchSurface(
  key: OperatorWorkbenchSurfaceKey,
): OperatorWorkbenchSurface {
  return OPERATOR_WORKBENCH_SURFACES[key];
}
