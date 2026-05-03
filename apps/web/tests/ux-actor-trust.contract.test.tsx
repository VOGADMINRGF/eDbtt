import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import DossierViewer from "@/components/dossier/DossierViewer";
import VotePanel from "@/components/dossier/VotePanel";
import { FAQ_CATEGORIES } from "@/app/faq/faqContent";
import demoDossier from "@features/dossier/data/demoDossier";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("ux actor trust contract", () => {
  it("keeps FAQ language role-based instead of party-first positioning", () => {
    const corpus = FAQ_CATEGORIES.flatMap((category) =>
      category.faqs.map((faq) => `${faq.question} ${faq.answer}`),
    ).join(" ");

    expect(corpus).toContain("Menschen, Organisationen und verantwortliche Personen");
    expect(corpus).not.toContain("Bürger:innen, Initiativen, Parteien oder Kommunen");
    expect(corpus).not.toContain("Parteien, Fraktionen, Initiativen und Kommunen");
  });

  it("keeps citizen voting clearly separate from organizational positions", () => {
    const html = renderToStaticMarkup(
      <VotePanel
        options={[
          { id: "opt-a", label: "Option A" },
          { id: "opt-b", label: "Option B" },
        ]}
        selectedOptionId={null}
        savedOptionId={null}
        onSelect={() => undefined}
        onSave={() => undefined}
        saveNotice={false}
        canVote={false}
        roleLabel="Organisation (gekennzeichnet)"
      />,
    );

    expect(html).toContain("Öffentliche Bürgerabstimmungen bleiben getrennt von Organisationspositionen");
  });

  it("marks closed hosted rooms and confidential-hint boundaries in dossier view", () => {
    const html = renderToStaticMarkup(<DossierViewer dossier={demoDossier} />);
    const lower = html.toLowerCase();

    expect(html).toContain("Geschlossener Hosted Room");
    expect(lower).toContain("nicht als allgemeines öffentliches meinungsbild");
    expect(lower).toContain("nicht automatisch an die hostende organisation weitergeleitet");
    expect(html).toContain("Kein automatisches Whistleblower-Schutzversprechen");
    expect(html).toContain("Faktische Aussage ohne belastbaren Quellennachweis");
    expect(html).toContain("Antwort durch:");
  });
});
