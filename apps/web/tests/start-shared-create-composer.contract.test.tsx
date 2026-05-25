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
  it("does not use the shared create composer as primary start interaction", () => {
    const html = renderToStaticMarkup(
      <LocaleProvider initialLocale="de">
        <LandingStart blocks={[]} />
      </LocaleProvider>,
    );

    expect(html).not.toContain("Kanonischer Einstieg");
    expect(html).not.toContain("start-primary-intake");
    expect(html).not.toContain("Anhang");
    expect(html).not.toContain("Jetzt swipen");
    expect(html).toContain("Themen");
    expect(html).toContain("Thema prüfen");
    expect(html).toContain("Hinweis geben");
    expect(html).toContain("Hier zeigt sich, wo es gerade drückt.");
    expect(html).toContain("review-first");
    expect(html).toContain("Keine versteckten AI-Kosten");
  });
});
