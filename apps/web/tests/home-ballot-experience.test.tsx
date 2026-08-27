// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HomeBallotExperience } from "@/features/home/HomeBallotExperience";

vi.mock("@/context/LocaleContext", () => ({
  useLocale: () => ({ locale: "de" }),
}));

describe("homepage ballot experience", () => {
  afterEach(() => vi.restoreAllMocks());

  it("shows an immediate honest outcome and creator CTA for the product example", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [{ id: "seed-example", title: "Seed" }] }),
    }));
    const user = userEvent.setup();

    render(<HomeBallotExperience />);
    await user.click(screen.getByRole("button", { name: "Betroffene hören" }));

    expect(screen.getByText(/Deine Position:/).textContent).toContain("Betroffene hören");
    expect(screen.getByText(/kein erfundenes Gruppenergebnis/)).not.toBeNull();
    expect(screen.queryByText(/%/)).toBeNull();
    expect(
      screen.getByRole("link", { name: "Eigene Abstimmung kostenlos starten" }).getAttribute("href"),
    ).toBe("/runden/new?gtm=1&source=homepage-ballot");
  });
});
