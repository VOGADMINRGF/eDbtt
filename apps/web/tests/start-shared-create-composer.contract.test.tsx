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
  default: ({
    fill: _fill,
    priority: _priority,
    ...props
  }: Record<string, unknown>) => <img alt="" {...props} />,
}));

describe("/start shared create composer contract", () => {
  it("uses the product landing instead of a composer-heavy start flow", () => {
    const html = renderToStaticMarkup(
      <LocaleProvider initialLocale="de">
        <LandingStart />
      </LocaleProvider>,
    );

    expect(html).not.toContain("Kanonischer Einstieg");
    expect(html).not.toContain("Anhang");
    expect(html).not.toContain("Beitrag eingeben");
    expect(html).toContain("Stimmen verbinden.");
    expect(html).toContain("Entwicklungen entdecken");
    expect(html).toContain("Beitrag starten");
    expect(html).toContain("Offene Beteiligung ansehen");
    expect(html).toContain("eDebatte veröffentlicht nichts automatisch.");
    expect(html).toContain("/create");
    expect(html).toContain("/swipes");
    expect(html).toContain("/themen");
    expect(html).toContain("/dossier");
    expect((html.match(/data-testid="home-entry-card"/g) ?? []).length).toBe(4);
  });

  it("keeps the returning-context participation path without restoring the composer", () => {
    const html = renderToStaticMarkup(
      <LocaleProvider initialLocale="de">
        <LandingStart
          experience={{
            familiarity: "organization_verified",
            eyebrow: "Organisation",
            title: "Themen, Beteiligung und Ergebnisse im Blick.",
            description:
              "Verbinde neue Signale, Quellen, Veranstaltungen und Rückmeldungen mit bestehenden Dossiers und Beteiligungsräumen.",
            helperText: "Du siehst immer, was als nächstes passiert.",
            trustText:
              "Wir veröffentlichen nichts automatisch. Sichtbarkeit und Prüfung bleiben getrennte Schritte.",
            showExtendedOrientation: false,
            workspaceHref: "/account/organization/dashboard",
            workspaceLabel: "Organisationsbereich öffnen",
            quickActionCenter: buildPublicTaskFirstQuickActionCenter({
              context: "organization_verified",
              workspaceHref: "/account/organization/dashboard",
            }),
          }}
        />
      </LocaleProvider>,
    );

    expect(html).toContain("Stimmen verbinden.");
    expect(html).toContain("Neu für dich öffnen");
    expect(html).toContain("Verstehen, was sich verändert");
    expect(html).toContain("Beitrag starten");
    expect(html).toContain("Offene Beteiligung ansehen");
    expect(html).not.toContain("Beitrag eingeben");
    expect(html).toContain('href="/create"');
    expect(html).toContain('href="/swipes"');
    expect((html.match(/data-testid="home-entry-card"/g) ?? []).length).toBe(4);
  });
});
