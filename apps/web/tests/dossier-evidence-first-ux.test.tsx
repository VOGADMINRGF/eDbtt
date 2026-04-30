import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import DossierViewer from "@/components/dossier/DossierViewer";
import demoDossier from "@features/dossier/data/demoDossier";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("dossier evidence-first UX", () => {
  it("shows evidence navigation and key insight blocks near the top", () => {
    const html = renderToStaticMarkup(<DossierViewer dossier={demoDossier} />);

    expect(html).toContain("Evidenzlage &amp; Quellenintelligenz");
    expect(html).toContain("Was wir aktuell daraus mitnehmen");
    expect(html).toContain("Was offen bleibt");

    const evidenceIndex = html.indexOf("Evidenzlage &amp; Quellenintelligenz");
    const transparencyIndex = html.indexOf("Transparenz &amp; Protokoll");
    expect(evidenceIndex).toBeGreaterThan(-1);
    expect(transparencyIndex).toBeGreaterThan(-1);
    expect(evidenceIndex).toBeLessThan(transparencyIndex);
  });

  it("renders smart source cards with takeaway, caveat, status and transferability", () => {
    const html = renderToStaticMarkup(<DossierViewer dossier={demoDossier} />);

    expect(html).toContain("Quellenlage (Smart Source Cards)");
    expect(html).toContain("Nehmen wir daraus mit");
    expect(html).toContain("Nicht automatisch ableitbar");
    expect(html).toContain("Kritischer Caveat");
    expect(html).toContain("Evidenzstatus:");
    expect(html).toContain("Übertragbarkeit:");
  });

  it("renders audit context for percentage-like headline figures", () => {
    const html = renderToStaticMarkup(<DossierViewer dossier={demoDossier} />);

    expect(html).toContain("Zahlen-Audit");
    expect(html).toContain("Grundgesamtheit:");
    expect(html).toContain("Methode:");
    expect(html).toContain("Caveat:");
    expect(html).toContain("Beteiligungs-Audit");
    expect(html).toContain("Beteiligungsqualität:");
  });
});
