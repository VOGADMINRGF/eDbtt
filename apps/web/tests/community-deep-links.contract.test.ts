import { describe, expect, it } from "vitest";
import {
  buildCommunityHref,
  normalizeCommunityDeepLinkParams,
} from "@/features/community/deepLinkContract";

describe("community deep-link contract", () => {
  it("Scenario A: canonical link resolves with canonical fields", () => {
    const result = normalizeCommunityDeepLinkParams({
      group: "mobility-berlin",
      type: "regional_group",
      scope: "regional",
      topicKey: "mobility",
      topicLabel: "Mobilitaet",
      dossierId: "dossier-1",
      dossierTitle: "Mobilitaet Berlin",
      regionLabel: "Berlin",
      reasonLabel: "Gemeinsam vor Ort",
      communityLabel: "Mobilitaet Berlin",
    });

    expect(result.ok).toBe(true);
    if (!result.ok || result.value.mode !== "group") return;
    expect(result.value.params).toMatchObject({
      group: "mobility-berlin",
      type: "regional_group",
      scope: "regional",
      topicKey: "mobility",
      dossierId: "dossier-1",
      regionLabel: "Berlin",
      reasonLabel: "Gemeinsam vor Ort",
    });
  });

  it("Scenario B: legacy aliases normalize safely into canonical fields", () => {
    const result = normalizeCommunityDeepLinkParams({
      communityKey: "mobility-berlin",
      topic: "mobility",
      dossier: "dossier-legacy",
      region: "Berlin",
      reason: "Alt-Link",
      scope: "regional",
    });

    expect(result.ok).toBe(true);
    if (!result.ok || result.value.mode !== "group") return;
    expect(result.value.params.group).toBe("mobility-berlin");
    expect(result.value.params.topicKey).toBe("mobility");
    expect(result.value.params.dossierId).toBe("dossier-legacy");
    expect(result.value.params.regionLabel).toBe("Berlin");
    expect(result.value.params.reasonLabel).toBe("Alt-Link");
  });

  it("Scenario C: invalid params return stable validation errors", () => {
    expect(normalizeCommunityDeepLinkParams({ group: "g1", type: "invalid" })).toMatchObject({
      ok: false,
      error: "invalid_group_type",
    });
    expect(normalizeCommunityDeepLinkParams({ group: "g1", scope: "invalid" })).toMatchObject({
      ok: false,
      error: "invalid_group_scope",
    });
    expect(normalizeCommunityDeepLinkParams({ topic: "mobility" })).toMatchObject({
      ok: false,
      error: "invalid_group_context",
    });
  });

  it("Scenario D: canonical href builder emits canonical params only", () => {
    const href = buildCommunityHref({
      communityKey: "mobility-berlin",
      type: "regional_group",
      scope: "regional",
      topic: "mobility",
      topicLabel: "Mobilitaet",
      dossier: "dossier-1",
      region: "Berlin",
      reason: "Gemeinsam vor Ort",
      communityLabel: "Mobilitaet Berlin",
    });
    const url = new URL(href, "http://localhost");
    expect(url.pathname).toBe("/community");
    expect(url.searchParams.get("topicKey")).toBe("mobility");
    expect(url.searchParams.get("dossierId")).toBe("dossier-1");
    expect(url.searchParams.get("regionLabel")).toBe("Berlin");
    expect(url.searchParams.get("reasonLabel")).toBe("Gemeinsam vor Ort");
    expect(url.searchParams.get("topic")).toBeNull();
    expect(url.searchParams.get("dossier")).toBeNull();
    expect(url.searchParams.get("region")).toBeNull();
    expect(url.searchParams.get("reason")).toBeNull();
  });
});
