import type { ThemenradarItem } from "@features/themenradar/contracts";

export type ThemenradarMembershipCtaId =
  | "participation_entry"
  | "membership_info"
  | "optional_order_entry";

export type ThemenradarMembershipCta = {
  id: ThemenradarMembershipCtaId;
  label: string;
  href: string;
  surface: "create" | "pricing" | "order";
  classification: "participation" | "membership" | "optional_purchase";
  optional: boolean;
};

export type ThemenradarMembershipEntry = {
  itemId: string;
  contextLabel: string;
  membershipSignalLevel: "low" | "medium" | "high";
  separationHint: string;
  callsToAction: [ThemenradarMembershipCta, ThemenradarMembershipCta, ThemenradarMembershipCta];
  noTrackingFields: true;
};

function resolveSignalLevel(score: number): ThemenradarMembershipEntry["membershipSignalLevel"] {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function resolveThemenradarMembershipEntry(
  item: Pick<ThemenradarItem, "id" | "title" | "membershipPotentialScore">,
): ThemenradarMembershipEntry {
  const membershipSignalLevel = resolveSignalLevel(item.membershipPotentialScore);
  const contextLabel = `${item.title} · Membership-Signal ${item.membershipPotentialScore}/100`;

  return {
    itemId: item.id,
    contextLabel,
    membershipSignalLevel,
    separationHint:
      "Thema, Mitgliedschaft und redaktionelle Freigabe bleiben getrennt: Mitmachen ueber /create, Mitgliedschaft ueber /pricing, Bestellung optional ueber /order.",
    callsToAction: [
      {
        id: "participation_entry",
        label: "Mitmach-Einstieg",
        href: "/create?entryIntent=issue_signal&entryMode=guided",
        surface: "create",
        classification: "participation",
        optional: false,
      },
      {
        id: "membership_info",
        label: "Mitgliedschaft ansehen",
        href: "/pricing",
        surface: "pricing",
        classification: "membership",
        optional: false,
      },
      {
        id: "optional_order_entry",
        label: "Paket optional bestellen",
        href: "/order",
        surface: "order",
        classification: "optional_purchase",
        optional: true,
      },
    ],
    noTrackingFields: true,
  };
}
