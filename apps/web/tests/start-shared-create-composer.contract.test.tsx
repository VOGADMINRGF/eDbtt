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

describe("/start shared create composer contract", () => {
  it("does not use the shared create composer as primary start interaction", () => {
    const html = renderToStaticMarkup(
      <LocaleProvider initialLocale="de">
        <LandingStart />
      </LocaleProvider>,
    );

    expect(html).not.toContain("Kanonischer Einstieg");
    expect(html).not.toContain("Anhang");
    expect(html).not.toContain("Jetzt swipen");
    expect(html).toContain("Was soll öffentlich besser");
    expect(html).toContain("verstanden</span>, geprüft oder entschieden werden?");
    expect(html).toContain("Beitrag einordnen");
    expect(html).toContain("Beispiele ansehen");
    expect(html).toContain("Für Verwaltung / Organisation ansehen");
    expect(html).toContain("Beitrag eingeben");
    expect(html).toContain("Nichts wird automatisch veröffentlicht. Du entscheidest, wann dein Beitrag weitergeht.");
    expect(html).toContain("/pricing/institutionen");
    expect(html).toContain("/kontakt");
    expect(html).toContain("/account/organization");
    expect(html).toContain("Themen, an die dein Beitrag");
    expect(html).toContain("anknüpfen</span> kann.");
    expect(html).not.toContain("review-first");
    expect((html.match(/data-testid="task-first-primary-action"/g) ?? []).length).toBe(1);
    expect(html).toContain("Mitmachen kostenlos");
    expect(html).toContain(
      "Noch keine Veröffentlichung · keine automatische Prüfung · du bestätigst jeden nächsten Schritt",
    );
  });

  it("prioritizes direct work for signed-in or returning context without replaying the full landing flow", () => {
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
    expect(html).toContain("Anlassraum starten");
    expect(html).toContain("Beitrag prüfen");
    expect(html).toContain("Sammle Hinweise, kläre Fragen und starte einen Anlassraum erst dann, wenn der nächste Schritt geprüft ist.");
    expect((html.match(/data-testid="task-first-primary-action"/g) ?? []).length).toBe(1);
    expect(html).not.toContain("Nicht noch ein Feed. Nicht nur Ja oder Nein.");
    expect(html).not.toContain("Faktencheck statt Behauptung gegen Behauptung.");
  });
});
