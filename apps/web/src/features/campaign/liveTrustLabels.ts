import {
  resolveVerificationPresentationView,
  type VerificationBadgeTone,
} from "@features/ai/e150/verificationPresentation";
import type {
  E150Lane,
} from "@features/ai/e150/journeyProfiles";
import type {
  SourceSupport,
  TruthStatus,
  UserFacingVerificationLabel,
  VerificationMode,
} from "@features/ai/e150/verificationContract";
import type { StartDraftOrigin } from "@/features/start/startDraftContext";

export type LiveTrustLabelTone = "neutral" | "pending" | "caution" | "verified";

export type LiveTrustLabel = {
  id: string;
  label: string;
  tone: LiveTrustLabelTone;
  description: string;
};

export type LivePublicationStatus = "draft" | "review_pending" | "published" | "closed";
export type LiveReviewStatus = "none" | "recommended" | "pending" | "accepted" | "rejected";
export type LiveContributionKind = "question" | "contribution" | "source" | "option";
export type LiveTrustOrigin = StartDraftOrigin | "start" | "create";

export type LiveTrustSignal = {
  publicationStatus?: LivePublicationStatus;
  reviewStatus?: LiveReviewStatus;
  sourceSupport?: SourceSupport;
  truthStatus?: TruthStatus;
  verificationLabel?: UserFacingVerificationLabel;
  verificationMode?: VerificationMode;
  lane?: E150Lane;
  reviewRecommended?: boolean;
  contributionKind?: LiveContributionKind;
  origin?: LiveTrustOrigin;
  sourceStatus?: string;
};

function mapBadgeTone(tone: VerificationBadgeTone): LiveTrustLabelTone {
  switch (tone) {
    case "success":
      return "verified";
    case "caution":
      return "caution";
    default:
      return "neutral";
  }
}

function pushLabel(
  labels: LiveTrustLabel[],
  next: LiveTrustLabel,
) {
  if (labels.some((label) => label.id === next.id)) return;
  labels.push(next);
}

function resolveContributionLabel(kind: LiveContributionKind): LiveTrustLabel {
  switch (kind) {
    case "question":
      return {
        id: "contribution_kind",
        label: "Offene Frage",
        tone: "neutral",
        description: "Der Einstieg sammelt zuerst Fragen und offene Punkte.",
      };
    case "source":
      return {
        id: "contribution_kind",
        label: "Quellenhinweis",
        tone: "neutral",
        description: "Der Einstieg verweist auf eine Quelle, ohne daraus eine Verifikation abzuleiten.",
      };
    case "option":
      return {
        id: "contribution_kind",
        label: "Option",
        tone: "neutral",
        description: "Der Einstieg markiert einen möglichen nächsten Schritt, nicht das fertige Ergebnis.",
      };
    default:
      return {
        id: "contribution_kind",
        label: "Community-Beitrag",
        tone: "neutral",
        description: "Der Einstieg sammelt Beiträge aus der Community, nicht bereits entschiedene Aussagen.",
      };
  }
}

export function getLiveTrustLabels(signal: LiveTrustSignal): LiveTrustLabel[] {
  const publicationStatus = signal.publicationStatus ?? "draft";
  const reviewStatus = signal.reviewStatus ?? "none";
  const presentation = resolveVerificationPresentationView({
    lane: signal.lane ?? "standard",
    verificationMode: signal.verificationMode ?? "none",
    verificationLabel: signal.verificationLabel,
    truthStatus: signal.truthStatus,
    sourceSupport: signal.sourceSupport,
    sourceStatus: signal.sourceStatus,
    reviewRecommended: signal.reviewRecommended,
  });
  const truthStatus = signal.truthStatus ?? presentation.truthStatus;
  const sourceSupport = signal.sourceSupport ?? presentation.sourceSupport;
  const reviewRecommended = signal.reviewRecommended ?? presentation.reviewRecommended;
  const labels: LiveTrustLabel[] = [];

  if (publicationStatus === "draft" || publicationStatus === "review_pending") {
    pushLabel(labels, {
      id: "draft",
      label: "Entwurf",
      tone: "pending",
      description: "Dieser Einstieg erzeugt zuerst nur einen Entwurf.",
    });
    pushLabel(labels, {
      id: "not_published",
      label: "Noch nicht veröffentlicht",
      tone: "pending",
      description: "Aus diesem Einstieg wird nichts automatisch veröffentlicht.",
    });
    pushLabel(labels, {
      id: "classification_pending",
      label: "Wird eingeordnet",
      tone: "pending",
      description: "Beiträge gehen erst durch bestehende Themen-, Review- und Prüfpfade.",
    });
  }

  if (publicationStatus === "closed") {
    pushLabel(labels, {
      id: "closed",
      label: "Kontext geschlossen",
      tone: "caution",
      description: "Dieser Kampagnenkontext ist abgeschlossen und öffnet keinen neuen produktiven Beitragspfad.",
    });
  }

  if (signal.contributionKind) {
    pushLabel(labels, resolveContributionLabel(signal.contributionKind));
  }

  if (truthStatus === "sealed_verified") {
    pushLabel(labels, {
      id: "verified",
      label: "Verifiziert",
      tone: "verified",
      description: "Dieser Status erscheint nur bei sealed_verified mit bestehendem Siegelpfad.",
    });
  } else if (truthStatus === "factcheck_passed" || presentation.verificationLabel === "geprueft") {
    pushLabel(labels, {
      id: "source_checked",
      label: "Quellen geprüft",
      tone: mapBadgeTone(presentation.badgeTone),
      description: "Es gibt eine Quellenprüfung oder einen belastbaren Quellenbezug, aber keine versiegelte Verifizierung.",
    });
  } else if (sourceSupport === "sourced" || truthStatus === "source_grounded") {
    pushLabel(labels, {
      id: "source_grounded",
      label: "Quellenbezug vorhanden",
      tone: "neutral",
      description: "Es liegt Quellenbezug vor, ohne daraus automatisch Verifikation abzuleiten.",
    });
  } else if (sourceSupport === "partial") {
    pushLabel(labels, {
      id: "source_partial",
      label: "Teilweise belegt",
      tone: "caution",
      description: "Ein Teil der Aussagen ist belegt, offene Punkte bleiben sichtbar.",
    });
  } else if (sourceSupport === "inferred") {
    pushLabel(labels, {
      id: "source_inferred",
      label: "Abgeleitet – bitte prüfen",
      tone: "caution",
      description: "Die Einordnung enthält abgeleitete Punkte und ist noch nicht belastbar.",
    });
  } else {
    pushLabel(labels, {
      id: "source_open",
      label: "Quellenlage offen",
      tone: "pending",
      description: "Ohne belastbare Quellenprüfung bleibt die Quellenlage offen.",
    });
  }

  if (reviewStatus === "pending" || publicationStatus === "review_pending") {
    pushLabel(labels, {
      id: "review_pending",
      label: "Redaktionelle Prüfung ausstehend",
      tone: "pending",
      description: "Eine redaktionelle Prüfung ist noch nicht abgeschlossen.",
    });
  } else if (
    reviewStatus === "recommended" ||
    reviewRecommended ||
    truthStatus === "review_required" ||
    truthStatus === "factcheck_requested"
  ) {
    pushLabel(labels, {
      id: "review_recommended",
      label: "Prüfung empfohlen",
      tone: "caution",
      description: "Vor belastbarer Nutzung oder Veröffentlichung ist eine Prüfung empfohlen.",
    });
  }

  return labels;
}
