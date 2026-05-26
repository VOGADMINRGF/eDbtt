export type FeedRadarPublicSurface = "swipes" | "runden" | "dossier";

export type FeedRadarPublicHandoff = {
  surface: FeedRadarPublicSurface;
  href: string;
  label: string;
  description: string;
};

export function buildFeedRadarPublicHandoffs(input: {
  hasSwipeStatements: boolean;
  hasAnlassraumUpdates: boolean;
  hasDossierLinks: boolean;
}): FeedRadarPublicHandoff[] {
  const handoffs: FeedRadarPublicHandoff[] = [];

  if (input.hasSwipeStatements) {
    handoffs.push({
      surface: "swipes",
      href: "/swipes",
      label: "Zu Swipes",
      description: "Neue Aussagen aus dem Feed-Radar werden hier als Beteiligungsvorschläge sichtbar.",
    });
  }

  if (input.hasAnlassraumUpdates) {
    handoffs.push({
      surface: "runden",
      href: "/runden",
      label: "Zum Anlassraum",
      description: "Anlassräume zeigen, wo ein Update öffentlich weiterdiskutiert oder eingeordnet wird.",
    });
  }

  if (input.hasDossierLinks) {
    handoffs.push({
      surface: "dossier",
      href: "/dossier",
      label: "Zum Dossier",
      description: "Dossiers bündeln Quellenlage, offene Fragen und verschiedene Perspektiven zum Update.",
    });
  }

  return handoffs;
}
