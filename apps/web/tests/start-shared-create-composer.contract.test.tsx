import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import LandingStart from "@/app/start/LandingStart";
import { LocaleProvider } from "@/context/LocaleContext";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/start",
}));

describe("/start shared create composer contract", () => {
  it("renders the canonical create composer system with mode and action parity", () => {
    const html = renderToStaticMarkup(
      <LocaleProvider initialLocale="de">
        <LandingStart blocks={[]} />
      </LocaleProvider>,
    );

    expect(html).toContain("Kanonischer Einstieg");
    expect(html).toContain("Beitragen");
    expect(html).toContain("Prüfen");
    expect(html).toContain("Entwerfen");
    expect(html).toContain("start-primary-intake");
    expect(html).toContain("Anhang");
    expect(html).toContain("Sprache");
    expect(html).toContain("So funktioniert&#x27;s");
    expect(html).not.toContain("Was möchtest du einreichen?");
  });
});
