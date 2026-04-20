import { describe, expect, it } from "vitest";
import { resolveCreateProductModeConfig } from "@/app/create/CreateClient";

describe("create orchestration mode mapping", () => {
  it("maps visible analyze mode to issue-signal intake defaults", () => {
    const config = resolveCreateProductModeConfig("analyze");
    expect(config.entryIntent).toBe("issue_signal");
    expect(config.entryMode).toBe("direct");
    expect(config.preferredUseCase).toBe("civic");
  });

  it("maps visible media mode to companion orchestration without leaking internal labels", () => {
    const config = resolveCreateProductModeConfig("media");
    expect(config.entryIntent).toBe("content_companion");
    expect(config.entryMode).toBe("direct");
    expect(config.preferredUseCase).toBe("journalism");
    expect(config.label).toBe("Prüfen");
  });

  it("maps visible guided mode to guided dossier-style intake", () => {
    const config = resolveCreateProductModeConfig("guided");
    expect(config.entryIntent).toBe("round_setup");
    expect(config.entryMode).toBe("guided");
    expect(config.preferredUseCase).toBe("agenda");
    expect(config.preferredCreateMode).toBe("ai");
  });
});
