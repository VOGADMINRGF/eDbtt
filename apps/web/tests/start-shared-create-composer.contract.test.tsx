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
        <LandingStart blocks={[]} />
      </LocaleProvider>,
    );

    expect(html).not.toContain("Kanonischer Einstieg");
    expect(html).not.toContain("start-primary-intake");
    expect(html).not.toContain("Anhang");
    expect(html).not.toContain("Jetzt swipen");
    expect(html).toContain("Neu hier?");
    expect(html).toContain("Beitragen");
    expect(html).toContain("Starte mit einem Beitrag oder schau dir Themen an.");
    expect(html).toContain("Themen anschauen");
    expect(html).toContain("Ich will einen Anlassraum/Event erstellen");
    expect(html).toContain("Ich melde eine Organisation an");
    expect(html).toContain("Du musst nicht wissen, welches Modul richtig ist.");
    expect(html).toContain("Wir veröffentlichen nichts ungeprüft.");
    expect(html).toContain("/create?intent=contribute");
    expect(html).toContain("/themen");
    expect(html).toContain("/runden?intent=create");
    expect(html).toContain("/account/organization");
    expect(html).toContain("Hier zeigt sich, wo es gerade drückt.");
    expect(html).toContain("review-first");
    expect((html.match(/data-testid="task-first-primary-action"/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid="task-first-secondary-action"/g) ?? []).length).toBe(2);
    expect((html.match(/data-testid="task-first-overflow-action"/g) ?? []).length).toBe(1);
    expect(html).toContain("kein Auto-Publish");
    expect(html).toContain("Keine versteckten AI-Kosten");
  });

  it("prioritizes direct work for signed-in or returning context without replaying the full landing flow", () => {
    const html = renderToStaticMarkup(
      <LocaleProvider initialLocale="de">
        <LandingStart
          blocks={[]}
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
    expect(html).toContain("Zum Organisationsbereich");
    expect(html).toContain("Ich öffne meinen Arbeitsbereich");
    expect(html).toContain("Arbeitsbereich");
    expect(html).toContain("Schon dabei? Arbeite direkt weiter.");
    expect(html).not.toContain("Nicht noch ein Feed. Nicht nur Ja oder Nein.");
    expect(html).not.toContain("Faktencheck statt Behauptung gegen Behauptung.");
  });
});
