import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import GlobalError from "@/app/global-error";

describe("global error render", () => {
  it("renders a minimal fallback without provider dependencies", () => {
    const html = renderToStaticMarkup(
      <GlobalError
        error={Object.assign(new Error("boom"), { digest: "digest-1" })}
        reset={vi.fn()}
      />,
    );

    expect(html).toContain("Diese Ansicht konnte nicht geladen werden");
    expect(html).toContain("Der Fehlerpfad bleibt absichtlich minimal");
    expect(html).toContain("Fehlerkennung: digest-1");
  });
});
