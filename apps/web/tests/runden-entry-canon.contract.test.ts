import { describe, expect, it } from "vitest";
import { readRundenEntryCanonReadModel } from "@/features/surfaces/runden/rundenEntryCanon";

describe("runden entry canon contract", () => {
  it("defines the current /runden/new truth as draft-first instead of silently creating runtime objects", () => {
    const model = readRundenEntryCanonReadModel();

    expect(model.surface).toBe("/runden/new");
    expect(model.firstPersistentRecord).toMatchObject({
      kind: "manual_round_draft",
      persistence: "server_persistent",
      route: "/api/drafts/save",
      source: "runden_manual_anlassraum",
    });
    expect(model.firstPersistentRecord.runtimeTruth).toContain("noch kein Anlassraum-, Dossier- oder Beteiligungsraum-Record");
  });

  it("keeps the no-AI save path explicitly free of AI usage and deepsearch side effects", () => {
    const model = readRundenEntryCanonReadModel();
    const noAiAction = model.actions.find((action) => action.id === "without_ai_save");

    expect(noAiAction).toMatchObject({
      label: "Ohne KI speichern",
      noAiRun: true,
      noAiUsageEvent: true,
      noDeepSearch: true,
      creates: {
        kind: "manual_round_draft",
        route: "/api/drafts/save",
      },
    });
  });

  it("marks the AI path as a /create preparation step and not as direct Anlassraum or Dossier creation", () => {
    const model = readRundenEntryCanonReadModel();
    const aiAction = model.actions.find((action) => action.id === "with_ai_continue");

    expect(aiAction?.label).toBe("Mit KI in /create weiter");
    expect(aiAction?.creates).toBeNull();
    expect(aiAction?.prepares).toMatchObject({
      kind: "start_draft_context",
      route: "/create?mode=source&source=runden",
    });
    expect(aiAction?.runtimeTruth).toContain("erst auf den vorhandenen /create-Pfaden");
  });

  it("keeps later runtime records on explicit review-first handoffs", () => {
    const model = readRundenEntryCanonReadModel();

    expect(model.actions.find((action) => action.id === "anlassraum_creation")?.creates).toMatchObject({
      kind: "anlassraum_runtime_record",
      route: "/api/admin/anlassraum-runtime/[sourceHandoffId]",
    });
    expect(model.actions.find((action) => action.id === "dossier_creation")?.creates).toMatchObject({
      kind: "dossier_runtime_record",
      route: "/api/admin/dossier-runtime/[sourceHandoffId]",
    });
    expect(
      model.actions.find((action) => action.id === "participation_space_creation")?.creates,
    ).toMatchObject({
      kind: "participation_space_runtime_record",
      route: "/api/admin/participation-space-runtime/[sourceHandoffId]",
    });
  });

  it("documents which later structures carry claims, participation, outputs and unresolved video briefing truth", () => {
    const model = readRundenEntryCanonReadModel();
    const carriers = Object.fromEntries(
      model.downstreamCarriers.map((carrier) => [carrier.capability, carrier]),
    );

    expect(carriers.claims_and_open_questions?.canonicalCarrier).toBe("dossier_runtime_record");
    expect(carriers.questions_polls_public_feedback?.canonicalCarrier).toBe(
      "participation_space_runtime_record",
    );
    expect(carriers.feed_enrichment?.canonicalCarrier).toBe("anlassraum_runtime_record");
    expect(carriers.social_output_drafts?.canonicalCarrier).toBe("dossier_studio_workspace");
    expect(carriers.voxy_video_briefing?.canonicalCarrier).toBe("missing_runtime_truth");
  });

  it("describes legacy drafts as read-only resume compatibility instead of an active write world", () => {
    const model = readRundenEntryCanonReadModel();

    expect(model.driftWarnings).toContain(
      "Legacy-Drafts mit alten String-IDs bleiben ausschließlich als Read-only-Resume-Fallback erhalten; aktive Writes nutzen die kanonische user-scoped ObjectId-/Schema-Wahrheit.",
    );
    expect(model.driftWarnings).toContain(
      "/create und /runden/new nutzen unterschiedliche API-Einstiege, schreiben aber in dieselbe kanonische serverseitige Draft-Wahrheit.",
    );
    expect(model.driftWarnings).not.toContain(
      "Legacy draftStore-/api/drafts-Pfade und der neuere /api/drafts/save-Pfad verwenden weiterhin unterschiedliche ID-/Schema-Wahrheiten.",
    );
  });
});
