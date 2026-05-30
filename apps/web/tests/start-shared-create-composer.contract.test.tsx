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
    expect(html).not.toContain("start-primary-intake");
    expect(html).not.toContain("Anhang");
    expect(html).not.toContain("Jetzt swipen");
    expect(html).toContain("Was Menschen bewegt, wird sichtbar.");
    expect(html).toContain("Stell dein Anliegen ein. Lass das stärkste Argument gewinnen.");
    expect(html).toContain("Anliegen einreichen");
    expect(html).toContain("Themen ansehen");
    expect(html).toContain("Anlassraum anlegen");
    expect(html).toContain("Anliegen schildern");
    expect(html).toContain("Was bewegt dich gerade?");
    expect(html).toContain("Öffne einen Dialog, statt ein Formular auszufüllen.");
    expect(html).toContain("Du entscheidest, was als Nächstes passiert.");
    expect(html).toContain("/create?intent=contribute");
    expect(html).toContain("/themen");
    expect(html).toContain("/runden/new");
    expect(html).toContain("/account/organization");
    expect(html).toContain("Hier zeigt sich, wo es gerade drückt.");
    expect(html).toContain("review-first");
    expect(html).not.toContain("task-first-primary-action");
    expect(html).toContain("kostenlos mitmachen");
    expect(html).toContain("keine versteckten KI-Kosten");
  });

  it("prioritizes direct work for signed-in or returning context without replaying the full landing flow", () => {
    const html = renderToStaticMarkup(
      <LocaleProvider initialLocale="de">
        <LandingStart
          experience={{
            familiarity: "organization_verified",
            eyebrow: "Schon dabei?",
            title: "Öffne deinen Arbeitsbereich oder erstelle einen Anlassraum.",
            description:
              "Deine Organisation ist im produktiven V1-Pfad. Arbeitsbereich, nächste Aufgaben und sichere Folgeaktionen stehen direkt vorne.",
            helperText: "Du siehst immer, was als nächstes passiert.",
            trustText:
              "Wir veröffentlichen nichts ungeprüft. Review und Sichtbarkeit bleiben getrennte Schritte.",
            showExtendedOrientation: false,
            workspaceHref: "/account/organization/dashboard",
            workspaceLabel: "Zum Organisationsbereich",
            quickActionCenter: buildPublicTaskFirstQuickActionCenter({
              context: "organization_verified",
              workspaceHref: "/account/organization/dashboard",
            }),
          }}
        />
      </LocaleProvider>,
    );

    expect(html).toContain("Schon dabei?");
    expect(html).toContain("Öffne deinen Arbeitsbereich oder erstelle einen Anlassraum.");
    expect(html).toContain("Ich öffne meinen Arbeitsbereich");
    expect(html).toContain("Arbeitsbereich");
    expect(html).toContain("Ich lege einen Anlassraum an");
    expect(html).toContain("Schon dabei? Arbeite direkt weiter.");
    expect((html.match(/data-testid="task-first-primary-action"/g) ?? []).length).toBe(1);
    expect(html).not.toContain("Nicht noch ein Feed. Nicht nur Ja oder Nein.");
    expect(html).not.toContain("Faktencheck statt Behauptung gegen Behauptung.");
  });
});
