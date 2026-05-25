import type { CreateHandoffAction, CreateHandoffDraft } from "@/features/create/createHandoff";
import type { RegionPublicationVisibilityState } from "@features/region/publicationRiskLadder";

export const B2C_V1_STATUS_LABELS = {
  submitted: "eingereicht",
  inReview: "in Prüfung",
  visibleProposal: "als Vorschlag sichtbar",
  attachedToAnlassraum: "an Anlassraum angehängt",
  inDossierContext: "im Dossier-Kontext",
  preparedForSwipes: "für Swipes vorbereitet",
  published: "veröffentlicht",
  archivedOrRejected: "archiviert / abgelehnt",
} as const;

export type B2CV1StatusKey = keyof typeof B2C_V1_STATUS_LABELS;

export type B2CV1StatusTone =
  | "neutral"
  | "review"
  | "accent"
  | "public"
  | "archived";

export type B2CV1StatusChip = {
  key: B2CV1StatusKey;
  label: string;
  tone: B2CV1StatusTone;
};

export type B2CJourneyLink = {
  href: string;
  label: string;
};

export type CreateHandoffJourneySummary = {
  statusChips: B2CV1StatusChip[];
  destinationLabel: string;
  destinationHref: string;
  destinationLead: string;
  reviewLead: string;
  nextStepTitle: string;
  nextStepBody: string;
  followupLinks: B2CJourneyLink[];
};

function buildStatusChip(
  key: B2CV1StatusKey,
  tone: B2CV1StatusTone,
): B2CV1StatusChip {
  return {
    key,
    label: B2C_V1_STATUS_LABELS[key],
    tone,
  };
}

export function toneClassForB2CStatus(tone: B2CV1StatusTone): string {
  if (tone === "review") {
    return "border-amber-300/70 bg-amber-50 text-amber-900";
  }
  if (tone === "accent") {
    return "border-cyan-300/70 bg-cyan-50 text-cyan-900";
  }
  if (tone === "public") {
    return "border-emerald-300/70 bg-emerald-50 text-emerald-900";
  }
  if (tone === "archived") {
    return "border-stone-300/80 bg-stone-100 text-stone-900";
  }
  return "border-slate-300/80 bg-slate-100 text-slate-900";
}

export function resolveVisibilityStatusChip(
  visibilityState: RegionPublicationVisibilityState | null | undefined,
): B2CV1StatusChip | null {
  switch (visibilityState) {
    case "public_unverified":
      return buildStatusChip("visibleProposal", "accent");
    case "public_reviewed":
    case "public_official":
      return buildStatusChip("published", "public");
    case "archived":
    case "blocked":
      return buildStatusChip("archivedOrRejected", "archived");
    default:
      return null;
  }
}

function destinationSummaryForAction(action: CreateHandoffAction): {
  statusChip: B2CV1StatusChip | null;
  destinationLabel: string;
  destinationHref: string;
  destinationLead: string;
  nextStepTitle: string;
  nextStepBody: string;
  followupLinks: B2CJourneyLink[];
} {
  if (action === "prepare_anlassraum") {
    return {
      statusChip: buildStatusChip("attachedToAnlassraum", "accent"),
      destinationLabel: "Anlassraum",
      destinationHref: "/runden",
      destinationLead:
        "Der Beitrag wird als Anlassraum-Kontext weitergeführt: mit Beteiligung, Review und späterer Sichtbarkeit.",
      nextStepTitle: "Im Anlassraum weiterarbeiten",
      nextStepBody:
        "Öffne den Anlassraum, bündele Rückmeldungen und entscheide dort bewusst über Sichtbarkeit, Share und QR.",
      followupLinks: [
        { href: "/runden", label: "Zum Anlassraum" },
        { href: "/dossier", label: "Im Dossier vertiefen" },
        { href: "/swipes?from=create", label: "Swipes dazu öffnen" },
      ],
    };
  }
  if (action === "append_to_dossier" || action === "create_dossier") {
    return {
      statusChip: buildStatusChip("inDossierContext", "accent"),
      destinationLabel: "Dossier",
      destinationHref: "/dossier",
      destinationLead:
        "Der Beitrag wird als Dossier-Kontext verdichtet: Quellenlage, offene Fragen und verschiedene Perspektiven bleiben nachvollziehbar.",
      nextStepTitle: "Im Dossier vertiefen",
      nextStepBody:
        "Öffne das Dossier, um Aussagen, Quellen und offene Fragen in einen nachvollziehbaren Arbeitsstand zu überführen.",
      followupLinks: [
        { href: "/dossier", label: "Zum Dossier" },
        { href: "/runden", label: "Anlassraum dazu öffnen" },
        { href: "/swipes?from=create", label: "Swipes dazu öffnen" },
      ],
    };
  }
  if (action === "prepare_vote") {
    return {
      statusChip: buildStatusChip("preparedForSwipes", "accent"),
      destinationLabel: "Swipes",
      destinationHref: "/swipes?from=create",
      destinationLead:
        "Der Beitrag wird als Beteiligungsfrage weitergeführt: Menschen können zustimmen, anders sehen oder vertiefen.",
      nextStepTitle: "Im Swipe-Deck anschließen",
      nextStepBody:
        "Öffne Swipes, um passende Aussagen zu prüfen. Der thematische Kontext bleibt über Anlassraum und Dossier nachvollziehbar.",
      followupLinks: [
        { href: "/swipes?from=create", label: "Zu Swipes" },
        { href: "/runden", label: "Zum Anlassraum" },
        { href: "/dossier", label: "Zum Dossier" },
      ],
    };
  }
  if (action === "request_factcheck") {
    return {
      statusChip: buildStatusChip("inReview", "review"),
      destinationLabel: "Prüfpfad",
      destinationHref: "/factcheck",
      destinationLead:
        "Der Beitrag geht in einen Prüfpfad. Recherche oder Deep Search starten nicht automatisch.",
      nextStepTitle: "Prüffrage bewusst wählen",
      nextStepBody:
        "Öffne den Prüfpfad und entscheide dort explizit, welche Aussage geprüft werden soll und welche Quellenlage dafür nötig ist.",
      followupLinks: [
        { href: "/factcheck", label: "Zum Prüfpfad" },
        { href: "/dossier", label: "Im Dossier vertiefen" },
      ],
    };
  }
  if (action === "request_review") {
    return {
      statusChip: buildStatusChip("inReview", "review"),
      destinationLabel: "Review",
      destinationHref: "/community/contributions",
      destinationLead:
        "Der Beitrag bleibt eingereicht und geht bewusst in Prüfung. Es gibt keine automatische Veröffentlichung.",
      nextStepTitle: "Prüfung abwarten oder weiterbearbeiten",
      nextStepBody:
        "Du kannst den Arbeitsstand erneut öffnen, ergänzen und später wieder in denselben Review-Pfad geben.",
      followupLinks: [{ href: "/community/contributions", label: "Zur Beitragsübersicht" }],
    };
  }
  return {
    statusChip: buildStatusChip("submitted", "neutral"),
    destinationLabel: "Arbeitsstand",
    destinationHref: "/community/contributions",
    destinationLead:
      "Der Beitrag bleibt als eingereichter Arbeitsstand erhalten und wird nicht automatisch sichtbar gemacht.",
    nextStepTitle: "Arbeitsstand weiterführen",
    nextStepBody:
      "Öffne den Arbeitsstand erneut, wenn du ihn schärfen, in Prüfung geben oder in Anlassraum, Dossier oder Swipes weiterführen willst.",
    followupLinks: [{ href: "/community/contributions", label: "Zur Beitragsübersicht" }],
  };
}

function dedupeLinks(links: B2CJourneyLink[]): B2CJourneyLink[] {
  const seen = new Set<string>();
  return links.filter((link) => {
    const key = `${link.href}::${link.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function resolveCreateHandoffJourneySummary(
  draft: CreateHandoffDraft,
): CreateHandoffJourneySummary {
  const destination = destinationSummaryForAction(draft.selectedAction);
  const statusChips: B2CV1StatusChip[] = [buildStatusChip("submitted", "neutral")];
  const requiresReview =
    draft.reviewState !== "ready_for_confirmation" ||
    draft.selectedAction === "request_review" ||
    draft.selectedAction === "request_factcheck";

  if (requiresReview) {
    statusChips.push(buildStatusChip("inReview", "review"));
  }
  if (destination.statusChip) {
    statusChips.push(destination.statusChip);
  }

  const visibilityChip = resolveVisibilityStatusChip(draft.visibilityState);
  if (visibilityChip) {
    statusChips.push(visibilityChip);
  }

  return {
    statusChips,
    destinationLabel: destination.destinationLabel,
    destinationHref: appendHandoffSearch(destination.destinationHref, draft.id),
    destinationLead: destination.destinationLead,
    reviewLead: requiresReview
      ? "Bevor etwas sichtbar wird, bleibt dieser Arbeitsstand in Prüfung oder wartet auf deine Bestätigung."
      : "Der Arbeitsstand ist vorbereitet, bleibt aber bis zur bewussten Freigabe privat und reviewbar.",
    nextStepTitle: destination.nextStepTitle,
    nextStepBody: destination.nextStepBody,
    followupLinks: dedupeLinks(
      destination.followupLinks.map((link) => ({
        href: appendHandoffSearch(link.href, draft.id),
        label: link.label,
      })),
    ),
  };
}

function appendHandoffSearch(baseHref: string, handoffId: string): string {
  const url = new URL(baseHref, "https://edebatte.local");
  url.searchParams.set("handoffId", handoffId);
  return `${url.pathname}${url.search}`;
}

export function resolveRundenEntryStatusChips(params: {
  isPublicVisible: boolean;
  isReviewOnly: boolean;
  isArchivedOrClosed: boolean;
  hasDossierContext: boolean;
}): B2CV1StatusChip[] {
  const chips: B2CV1StatusChip[] = [buildStatusChip("attachedToAnlassraum", "accent")];
  if (params.isArchivedOrClosed) {
    chips.push(buildStatusChip("archivedOrRejected", "archived"));
    return chips;
  }
  if (params.isPublicVisible) {
    chips.push(buildStatusChip("published", "public"));
  } else if (params.isReviewOnly) {
    chips.push(buildStatusChip("inReview", "review"));
  }
  if (params.hasDossierContext) {
    chips.push(buildStatusChip("inDossierContext", "neutral"));
  }
  return chips;
}

export function resolveDossierStatusChips(params: {
  loadState: "ready" | "review_only" | "not_found" | "load_failed" | "loading";
  handoffDraft: CreateHandoffDraft | null;
}): B2CV1StatusChip[] {
  const chips: B2CV1StatusChip[] = [buildStatusChip("inDossierContext", "accent")];
  if (params.loadState === "ready") {
    chips.push(buildStatusChip("published", "public"));
  } else if (params.loadState === "review_only") {
    chips.push(buildStatusChip("inReview", "review"));
  }
  if (params.handoffDraft) {
    chips.unshift(...resolveCreateHandoffJourneySummary(params.handoffDraft).statusChips);
  }
  const seen = new Set<string>();
  return chips.filter((chip) => {
    if (seen.has(chip.key)) return false;
    seen.add(chip.key);
    return true;
  });
}
