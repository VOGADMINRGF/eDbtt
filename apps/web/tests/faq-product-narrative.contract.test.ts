import { describe, expect, it } from "vitest";
import { FAQ_CATEGORIES } from "@/app/faq/faqContent";

function buildFaqCorpus() {
  return FAQ_CATEGORIES.flatMap((category) => category.faqs).map(
    (entry) => `${entry.question}\n${entry.answer}`,
  );
}

describe("faq product narrative contract", () => {
  it("explains the ai-orchestrated regional starting point", () => {
    const corpus = buildFaqCorpus().join("\n\n");
    expect(corpus).toContain("Was meint eDebatte mit einer regionalen Startlage?");
    expect(corpus).toContain("keine Demo-Strecke, sondern eine kuratierte regionale Startlage");
    expect(corpus).toContain("nicht automatisch amtlich oder verbindlich");
  });

  it("anchors create as statement-first with a confirmation prompt", () => {
    const corpus = buildFaqCorpus().join("\n\n");
    expect(corpus).toContain("Was passiert zuerst in /create?");
    expect(corpus).toContain("Haben wir dich richtig verstanden?");
    expect(corpus).toContain("Einreichen, sichtbar machen oder veröffentlichen");
  });

  it("explains the production maturity path beyond a permanent pilot state", () => {
    const corpus = buildFaqCorpus().join("\n\n");
    expect(corpus).toContain("Ist eDebatte nur ein Pilot?");
    expect(corpus).toContain("Was bedeutet pilotfähig?");
    expect(corpus).toContain("Wann ist ein Bereich produktionsfähig?");
    expect(corpus).toContain("Grundlage vorhanden, pilotfähig, produktionsnah, produktionsfähig und live");
    expect(corpus).toContain("kontrollierten Rahmen mit klaren Guardrails");
    expect(corpus).toContain("keine stillen Demo- oder Seed-Abhängigkeiten");
  });

  it("describes public anlassraum sharing and the publication risk ladder", () => {
    const corpus = buildFaqCorpus().join("\n\n");
    expect(corpus).toContain("Ist ein Anlassraum nur ein Admin-Container?");
    expect(corpus).toContain("Ein Anlassraum ist ein öffentlicher Themenraum");
    expect(corpus).toContain("QR-Code");
    expect(corpus).toContain("Wie funktioniert die Veröffentlichungslogik?");
    expect(corpus).toContain("public_unverified");
    expect(corpus).toContain("public_official");
    expect(corpus).toContain("Doxxing, Drohungen und sensible Daten werden blockiert");
  });

  it("documents data source strategy and the organization dashboard target", () => {
    const corpus = buildFaqCorpus().join("\n\n");
    expect(corpus).toContain("Woher kommen Regionen, Verwaltungsdaten und Geobezüge?");
    expect(corpus).toContain("Destatis GV-ISys / Gemeindeverzeichnis");
    expect(corpus).toContain("XLSX, CSV und APIs sind dabei Importquellen, keine Runtime-Abhängigkeit");
    expect(corpus).toContain("Was braucht eine Verwaltung oder Organisation im Dashboard?");
    expect(corpus).toContain("Was sieht eine Verwaltung oder Organisation?");
    expect(corpus).toContain("Was sieht die Öffentlichkeit?");
    expect(corpus).toContain("offene Reviews");
    expect(corpus).toContain("KI-vorqualifizierte Themenlage");
    expect(corpus).toContain("Interne Reviews, Freischaltungen und Verwaltungsentwürfe sind nicht automatisch öffentlich");
  });

  it("integrates the core claim about arguments winning", () => {
    const corpus = buildFaqCorpus().join("\n\n");
    expect(corpus).toContain("Lass das beste Argument gewinnen.");
  });
});
