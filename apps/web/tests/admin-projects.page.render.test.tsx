import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const reactMocks = vi.hoisted(() => ({
  useState: vi.fn(),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useState: reactMocks.useState,
  };
});

import AdminProjectsPage from "@/app/admin/projects/page";

describe("admin projects page render", () => {
  beforeEach(() => {
    reactMocks.useState.mockReset();
  });

  it("renders an honest empty state when project rows are missing during prerender", () => {
    reactMocks.useState
      .mockImplementationOnce(() => [undefined, vi.fn()])
      .mockImplementationOnce(() => [false, vi.fn()])
      .mockImplementationOnce(() => [null, vi.fn()])
      .mockImplementationOnce(() => ["", vi.fn()]);

    const html = renderToStaticMarkup(<AdminProjectsPage />);

    expect(html).toContain("Projekt-Backbone");
    expect(html).toContain("Noch keine Projektdaten verfügbar.");
  });
});
