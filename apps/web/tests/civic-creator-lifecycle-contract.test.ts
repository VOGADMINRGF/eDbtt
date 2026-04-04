import { describe, expect, it } from "vitest";
import {
  buildCivicCreatorLifecycleBaseline,
  evaluateCivicCreatorLifecycleTransition,
  resolveCivicCreatorLifecycleContract,
} from "@features/anlassraum/civicCreatorLifecycleContract";
import { resolveCivicCreatorRepresentationContract } from "@features/anlassraum/civicCreatorRepresentationContract";

describe("civic creator lifecycle contract", () => {
  it("keeps anlassraum_host baseline on followup transitions without dossier/stream escalation", () => {
    const representation = resolveCivicCreatorRepresentationContract({
      actorRole: "community",
      ownerType: "community",
      originType: "manual",
      roomType: "community",
    });

    const lifecycle = buildCivicCreatorLifecycleBaseline({ representationContract: representation });

    expect(lifecycle.currentStatus).toBe("initiated");
    expect(lifecycle.lifecycleContextScope).toBe("anlassraum_followup");
    expect(lifecycle.allowedTransitions).toContain("open_followup");
    expect(lifecycle.allowedTransitions).toContain("accompanied");
    expect(lifecycle.allowedTransitions).not.toContain("dossier_linked");
    expect(lifecycle.allowedTransitions).not.toContain("stream_active");
  });

  it("allows editorial/publisher contexts to progress from accompanied to dossier/companion/stream", () => {
    const representation = resolveCivicCreatorRepresentationContract({
      actorRole: "editorial_actor",
      ownerType: "media",
      originType: "source_anchor",
      roomType: "editorial",
    });

    const fromAccompanied = resolveCivicCreatorLifecycleContract({
      representationContract: representation,
      currentStatus: "accompanied",
      previousStatus: "open_followup",
    });
    const transitionToDossier = evaluateCivicCreatorLifecycleTransition({
      representationContract: representation,
      fromStatus: "accompanied",
      toStatus: "dossier_linked",
    });
    const transitionToStream = evaluateCivicCreatorLifecycleTransition({
      representationContract: representation,
      fromStatus: "dossier_linked",
      toStatus: "stream_active",
    });

    expect(fromAccompanied.allowedTransitions).toContain("dossier_linked");
    expect(fromAccompanied.allowedTransitions).toContain("companion_active");
    expect(transitionToDossier.ok).toBe(true);
    expect(transitionToStream.ok).toBe(true);
  });

  it("keeps participation-only profiles out of dossier/companion/stream transitions", () => {
    const representation = resolveCivicCreatorRepresentationContract({
      actorRole: "guest",
      ownerType: "user",
      originType: "manual",
      roomType: "community",
    });

    const lifecycle = buildCivicCreatorLifecycleBaseline({ representationContract: representation });
    const transition = evaluateCivicCreatorLifecycleTransition({
      representationContract: representation,
      fromStatus: "open_followup",
      toStatus: "stream_active",
    });

    expect(representation.workProfile).toBe("civic_participant");
    expect(lifecycle.allowedTransitions).toEqual(["open_followup", "paused", "closed_context"]);
    expect(transition.ok).toBe(false);
    expect(transition.issues).toContain("transition_not_allowed_for_profile_or_capabilities");
  });

  it("blocks stream transition for institutional org context profiles", () => {
    const representation = resolveCivicCreatorRepresentationContract({
      actorRole: "admin",
      ownerType: "municipality",
      originType: "official",
      roomType: "official",
    });

    const transition = evaluateCivicCreatorLifecycleTransition({
      representationContract: representation,
      fromStatus: "accompanied",
      toStatus: "stream_active",
    });

    expect(representation.workProfile).toBe("org_context_actor");
    expect(transition.ok).toBe(false);
    expect(transition.issues).toContain("transition_not_allowed_for_profile_or_capabilities");
  });
});
