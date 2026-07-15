import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PersonalVoxyFirstLoginCompanion } from "@/app/account/PersonalVoxyFirstLoginCompanion";

describe("personal Voxy first-login companion runtime", () => {
  it("renders the personal welcome, consent boundary and civic impulses", () => {
    const html = renderToStaticMarkup(
      <PersonalVoxyFirstLoginCompanion welcomeNotice />,
    );

    expect(html).toContain("Dein persönlicher Voxy");
    expect(html).toContain("Schön, dass du da bist");
    expect(html).toContain("Wie soll Voxy dich begleiten?");
    expect(html).toContain("Nur auf Anfrage");
    expect(html).toContain("Relevante Hinweise");
    expect(html).toContain("Regelmäßiger Überblick");
    expect(html).toContain("Aktiv begleiten");
    expect(html).toContain("Was bewegt dich heute?");
    expect(html).toContain("Drei kurze Impulse");
    expect(html).toContain("Was könnte aus deiner Sicht dahinterstecken?");
    expect(html).toContain("ausschließlich in diesem Browser speichern");
    expect(html).toContain("keine politische Einstufung");
    expect(html).toContain("keine automatische Veröffentlichung");
    expect(html).toContain("Einen Gedanken teilen");
    expect(html).toContain("Aktuelle Themen ansehen");
  });

  it("keeps the default account view lightweight until Voxy is opened", () => {
    const html = renderToStaticMarkup(
      <PersonalVoxyFirstLoginCompanion welcomeNotice={false} />,
    );

    expect(html).toContain("Voxy einrichten");
    expect(html).toContain("Direkt etwas einbringen");
    expect(html).not.toContain("Wie soll Voxy dich begleiten?");
  });
});
