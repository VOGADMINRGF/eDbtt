import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import MandatDetailPage from "@/app/mandat/[id]/page";

async function renderMandat(id = "vog-mandat-001") {
  const element = await MandatDetailPage({
    params: Promise.resolve({ id }),
  });
  return renderToStaticMarkup(element);
}

describe("/mandat/[id] read-only public surface", () => {
  it("renders mandate identity, references and transparency blocks", async () => {
    const html = await renderMandat("vog-mandat-001");

    expect(html).toContain("VoiceOpenGov Mandatsregister");
    expect(html).toContain("Mandatsgegenstand");
    expect(html).toContain("Bezug zu Dossier / Runde / Anlassraum");
    expect(html).toContain("dossier-31");
    expect(html).toContain("round-energie-2026-01");
    expect(html).toContain("anlass-energie-2030");
    expect(html).toContain("Verantwortung");
    expect(html).toContain("Repräsentant:in");
    expect(html).toContain("Herkunft / Provenienz");
    expect(html).toContain("Letzte Aktualisierung");
    expect(html).toContain("Transparenzhinweis");
  });

  it("stays explicitly read-only without edit/auto-assign/auto-membership behavior", async () => {
    const html = await renderMandat("vog-mandat-001");
    const lower = html.toLowerCase();

    expect(lower).toContain("öffentlich lesbar und read-only");
    expect(lower).toContain("keine bearbeitungsfunktion");
    expect(lower).toContain("keine automatische zuordnung");
    expect(lower).toContain("keine automatische mitgliedschaftsübernahme");
    expect(html).toContain("supportsMembershipHandoff: false");
    expect(html).toContain("supportsAutomaticAssignment: false");
    expect(html).toContain("supportsMandateEditInPublicSurface: false");
  });

  it("avoids parties-book wording and avoids implying party representation", async () => {
    const html = await renderMandat("vog-mandat-001");
    const lower = html.toLowerCase();

    expect(lower).not.toContain("parteienbuch");
    expect(lower).not.toContain("dynamisches parteienbuch");
    expect(lower).not.toContain("spricht für eine partei");
    expect(lower).not.toContain("automatische parteizugehörigkeit");
  });
});
