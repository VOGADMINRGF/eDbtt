import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  getReadModel: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

vi.mock("@/features/vog/publicBallotReadModel", () => ({
  getVogPublicBallotReadModel: (...args: unknown[]) =>
    mocks.getReadModel(...args),
}));

import VogPublicBallotPage from "@/app/vog/fragen/[code]/[questionId]/page";

describe("VOG public ballot page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getReadModel.mockResolvedValue(null);
  });

  it("renders a fail-closed missing state even when origin metadata looks trusted", async () => {
    const html = renderToStaticMarkup(
      await VogPublicBallotPage({
        params: Promise.resolve({
          code: "missing-set",
          questionId: "missing-question",
        }),
        searchParams: Promise.resolve({
          source: "vote4gov",
          origin: "voiceopengov",
          origin_id: "vog-question-01",
          locale: "de",
        }),
      }),
    );

    expect(html).toContain("Öffentliche Frage nicht verfügbar");
    expect(html).toContain("Herkunftsparameter können keine Freigabe erzeugen");
    expect(html).not.toContain("Stimme abgeben");
    expect(mocks.getReadModel).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "missing-set",
        questionId: "missing-question",
        locale: "de",
        guestTokenHash: null,
      }),
    );
  });

  it("renders the English missing and network-safe state", async () => {
    const html = renderToStaticMarkup(
      await VogPublicBallotPage({
        params: Promise.resolve({ code: "missing", questionId: "missing" }),
        searchParams: Promise.resolve({ locale: "en" }),
      }),
    );

    expect(html).toContain('lang="en"');
    expect(html).toContain("Public question unavailable");
    expect(html).toContain("Origin parameters cannot grant access");
  });
});
