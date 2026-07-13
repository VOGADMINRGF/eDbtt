import { describe, expect, it } from "vitest";
import {
  classifyWrapperMvpPath,
  classifyWrapperNavigationTarget,
} from "../../wrapper-android/src/mvpSurfacePolicy";

describe("wrapper android MVP surface policy", () => {
  it("allows core MVP paths", () => {
    expect(classifyWrapperMvpPath("/create")).toBe("mvp");
    expect(classifyWrapperMvpPath("/swipes?fromDraft=abc")).toBe("mvp");
    expect(classifyWrapperMvpPath("/stream/demo-session")).toBe("mvp");
    expect(classifyWrapperMvpPath("/pricing/institutionen")).toBe("mvp");
    expect(classifyWrapperMvpPath("/order?segment=organisationen")).toBe("mvp");
    expect(classifyWrapperMvpPath("/vormerken?segment=kommunen&quote=1")).toBe("mvp");
  });

  it("excludes operator and demo paths", () => {
    expect(classifyWrapperMvpPath("/admin/feeds")).toBe("excluded");
    expect(classifyWrapperMvpPath("/dashboard/usage")).toBe("excluded");
    expect(classifyWrapperMvpPath("/demo/runden")).toBe("excluded");
    expect(classifyWrapperMvpPath("/studio")).toBe("excluded");
  });

  it("marks unknown paths as unknown", () => {
    expect(classifyWrapperMvpPath("/topic/mobilitaet")).toBe("unknown");
    expect(classifyWrapperMvpPath("swipes")).toBe("unknown");
  });

  it("keeps later paths outside the MVP bucket", () => {
    expect(classifyWrapperMvpPath("/atlas")).toBe("later");
    expect(classifyWrapperMvpPath("/atlas/weekly")).toBe("later");
  });
});

describe("wrapper android runtime navigation target", () => {
  it("keeps mvp routes in-app and falls back for non-mvp internal targets", () => {
    const mvp = classifyWrapperNavigationTarget("/stream/demo-session");
    expect(mvp.kind).toBe("in_app");
    if (mvp.kind === "in_app") {
      expect(mvp.path).toBe("/stream/demo-session");
    }

    const excluded = classifyWrapperNavigationTarget("/admin/feeds");
    expect(excluded.kind).toBe("fallback");
    if (excluded.kind === "fallback") {
      expect(excluded.path).toBe("/start");
      expect(excluded.bucket).toBe("excluded");
    }

    const unknown = classifyWrapperNavigationTarget("/topic/mobilitaet");
    expect(unknown.kind).toBe("fallback");
    if (unknown.kind === "fallback") {
      expect(unknown.bucket).toBe("unknown");
    }

    const sameOrigin = classifyWrapperNavigationTarget("https://edebatte.org/swipes?fromDraft=123");
    expect(sameOrigin.kind).toBe("in_app");
    if (sameOrigin.kind === "in_app") {
      expect(sameOrigin.path).toBe("/swipes");
    }
  });

  it("separates external and invalid targets", () => {
    const external = classifyWrapperNavigationTarget("https://example.org/info");
    expect(external.kind).toBe("external");

    const mail = classifyWrapperNavigationTarget("mailto:hallo@edebatte.org");
    expect(mail.kind).toBe("external");

    const invalid = classifyWrapperNavigationTarget("javascript:alert(1)");
    expect(invalid.kind).toBe("invalid");
  });
});
