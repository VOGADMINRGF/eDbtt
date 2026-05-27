import { afterEach, describe, expect, it, vi } from "vitest";
import { buildSocialChannelConnections } from "@features/outputEngine";

describe("social-channel-connection.contract", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps internal channels internally ready and external channels disabled by policy by default", () => {
    const connections = buildSocialChannelConnections({
      channels: ["website_update", "linkedin_draft"],
      organizationId: "org-1",
      createdBy: "user-1",
      checkedAt: "2026-05-27T10:00:00.000Z",
    });

    expect(connections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          channel: "website_update",
          connectionStatus: "internal_ready",
          authMode: "internal",
        }),
        expect.objectContaining({
          channel: "linkedin_draft",
          connectionStatus: "disabled_by_policy",
          authMode: "manual_export",
        }),
      ]),
    );
  });

  it("marks optional connectors as missing_secret until explicit credentials exist", () => {
    vi.stubEnv("SOCIAL_CONNECTORS_ENABLED", "1");
    vi.stubEnv("SOCIAL_CONNECTOR_LINKEDIN_ENABLED", "1");

    const [linkedin] = buildSocialChannelConnections({
      channels: ["linkedin_draft"],
      organizationId: "org-1",
      createdBy: "user-1",
      checkedAt: "2026-05-27T10:00:00.000Z",
    });

    expect(linkedin).toMatchObject({
      channel: "linkedin_draft",
      connectionStatus: "missing_secret",
      authMode: "oauth_optional",
    });
  });

  it("only reports a connector as ready when policy and secrets are explicitly present", () => {
    vi.stubEnv("SOCIAL_CONNECTORS_ENABLED", "1");
    vi.stubEnv("SOCIAL_CONNECTOR_LINKEDIN_ENABLED", "1");
    vi.stubEnv("SOCIAL_CONNECTOR_LINKEDIN_ACCESS_TOKEN", "secret-token");

    const [linkedin] = buildSocialChannelConnections({
      channels: ["linkedin_draft"],
      organizationId: "org-1",
      createdBy: "user-1",
      checkedAt: "2026-05-27T10:00:00.000Z",
    });

    expect(linkedin).toMatchObject({
      channel: "linkedin_draft",
      connectionStatus: "connector_ready",
      authMode: "oauth_optional",
    });
  });
});
