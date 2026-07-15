import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import LandingStart from "@/app/start/LandingStart";
import { LocaleProvider } from "@/context/LocaleContext";
import { buildPublicTaskFirstQuickActionCenter } from "@/features/quickActions/taskFirstQuickActions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/start",
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => <img alt="" {...props} />,
}));

describe("/start shared create composer contract", () => {
  it("uses the split Voxy landing instead of a composer-heavy start flow", () => {
    const html = renderToStaticMarkup(
      <LocaleProvider initialLocale="de">
        <LandingStart />
      </LocaleProvider>,
    );

    expect(html).not.toContain("Kanonischer Einstieg");
    expect(html).not.toContain("Anhang");
    expect(html).not.toContain("Beitrag eingeben");
    expect(html).toContain("Was bewegt dich?");
    expect(html).toContain("Beitrag starten");
    expect(html).toContain("Mitwirken");
    expect(html).toContain("Mitentwickeln");
    expect(html).toContain("Nichts wird automatisch veröffentlicht.");
    expect(html).toContain("/create");
    expect(html).toContain("/swipes");
    expect(html).toContain("/themen");
    expect(html).toContain("/dossier");
    expect((html.match(/data-testid="home-split-primary-card"/g) ?? []).length).toBe(2);
  });

  it("keeps a compact workspace entry for signed-in or returning context", () => {
    const html = renderToStaticMarkup(
      <LocaleProvider initialLocale="de">
        <LandingStart
          experience={{
            familiarity: "organization_verified",
            eyebrow: "Schon dabei?",
            title: "Bereite Beteiligung nachvollziehbar vor.",
            description:
              "Sammle Hinweise, kläre Fragen und starte einen Anlassraum erst dann, wenn der nächste Schritt geprüft ist.",
            helperText: "Du siehst immer, was als nächstes passiert.",
            trustText:
              "Wir veröffentlichen nichts automatisch. Sichtbarkeit und Prüfung bleiben getrennte Schritte.",
            showExtendedOrientation: false,
            workspaceHref: "/account/organization/dashboard",
            workspaceLabel: "Organisation prüfen",
            quickActionCenter: buildPublicTaskFirstQuickActionCenter({
              context: "organization_verified",
              workspaceHref: "/account/organization/dashboard",
            }),
          }}
        />
      </LocaleProvider>,
    );

    expect(html).toContain("Schon dabei?");
    expect(html).toContain("Bereite Beteiligung nachvollziehbar vor.");
    expect(html).toContain("Organisation prüfen");
    expect(html).toContain("Etwas beitragen");
    expect(html).toContain("Mitentwickeln");
    expect(html).toContain("Mitwirken");
    expect(html).toContain("Sammle Hinweise, kläre Fragen und starte einen Anlassraum erst dann, wenn der nächste Schritt geprüft ist.");
    expect(html).toContain('href="/account/organization/dashboard"');
    expect(html).toContain('href="/create"');
    expect(html).toContain('href="/swipes"');
    expect((html.match(/data-testid="home-split-primary-card"/g) ?? []).length).toBe(2);
  });
});
