import { describe, expect, it } from "vitest";
import {
  canInvokeVoxyMotionProvider,
  canPublishVoxyMotionArtifact,
  EMPTY_VOXY_MOTION_PROVIDER_APPROVAL,
  getMissingVoxyMotionPreflightGates,
  VOXY_CANONICAL_VISUAL_SOURCE,
  VOXY_MOTION_PROVIDER_STATUS,
  type VoxyMotionProviderApproval,
} from "@/features/voxyVideo/animatableMasterAsset";

const approvedPreflightFixture: VoxyMotionProviderApproval = {
  providerId: "test-provider",
  providerSelectionApproved: true,
  accountApproved: true,
  credentialsConfigured: true,
  externalDataTransferApproved: true,
  privacyRetentionApproved: true,
  budgetSpendApproved: true,
};

describe("Voxy motion provider gate contract", () => {
  it("keeps the approved Voxy visual source canonical", () => {
    expect(VOXY_CANONICAL_VISUAL_SOURCE).toEqual({
      repositoryPath: "apps/web/public/brand/voxy/voxy-podcast-stage.png",
      publicPath: "/brand/voxy/voxy-podcast-stage.png",
      status: "human_approved_reference",
    });
    expect(VOXY_MOTION_PROVIDER_STATUS).toBe("manual_gate");
  });

  it("fails closed while human provider preflight gates are unresolved", () => {
    expect(
      getMissingVoxyMotionPreflightGates(
        EMPTY_VOXY_MOTION_PROVIDER_APPROVAL,
      ),
    ).toEqual([
      "provider_selection",
      "account_credentials",
      "external_data_transfer",
      "privacy_retention",
      "budget_spend",
    ]);
    expect(
      canInvokeVoxyMotionProvider(EMPTY_VOXY_MOTION_PROVIDER_APPROVAL),
    ).toBe(false);
  });

  it("requires an explicit human provider-selection approval", () => {
    expect(
      canInvokeVoxyMotionProvider({
        ...approvedPreflightFixture,
        providerSelectionApproved: false,
      }),
    ).toBe(false);
  });

  it("does not publish a generated artifact before human visual acceptance", () => {
    const review = {
      providerId: "test-provider",
      exactHeadSha: "0123456789abcdef",
      canonicalVisualSource: VOXY_CANONICAL_VISUAL_SOURCE.repositoryPath,
      humanVisualAcceptance: "pending" as const,
    };

    expect(
      canPublishVoxyMotionArtifact({
        approval: approvedPreflightFixture,
        review,
      }),
    ).toBe(false);
    expect(
      canPublishVoxyMotionArtifact({
        approval: approvedPreflightFixture,
        review: { ...review, humanVisualAcceptance: "approved" },
      }),
    ).toBe(true);
  });

  it("rejects publication when provider provenance does not match", () => {
    expect(
      canPublishVoxyMotionArtifact({
        approval: approvedPreflightFixture,
        review: {
          providerId: "different-test-provider",
          exactHeadSha: "0123456789abcdef",
          canonicalVisualSource: VOXY_CANONICAL_VISUAL_SOURCE.repositoryPath,
          humanVisualAcceptance: "approved",
        },
      }),
    ).toBe(false);
  });
});
