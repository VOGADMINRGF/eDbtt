import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import FactcheckPage from "@/app/api/factcheck/page";

describe("api factcheck page render", () => {
  it("renders without result data and keeps the start action disabled for short input", () => {
    const html = renderToStaticMarkup(<FactcheckPage />);

    expect(html).toContain("Factcheck");
    expect(html).toContain("Text hier einfügen");
    expect(html).toContain("Factcheck starten");
    expect(html).not.toContain("Verdict:");
  });
});
