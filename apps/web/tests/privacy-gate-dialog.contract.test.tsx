import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: () => {},
    replace: () => {},
    refresh: () => {},
  }),
  usePathname: () => "/",
}));

import { PrivacyGateProvider } from "@/components/privacy/PrivacyGateProvider";

describe("privacy gate dialog contract", () => {
  it("renders a blocking trust dialog with dossier link and balanced actions", () => {
    const html = renderToStaticMarkup(
      <PrivacyGateProvider initialConsent={null} initiallyOpen>
        <button type="button">Hintergrund-CTA</button>
      </PrivacyGateProvider>,
    );

    expect(html).toContain("Bevor du startest: Datenschutz verständlich erklärt");
    expect(html).toContain("Notwendiges verstanden – weiter");
    expect(html).toContain("Freiwillige Optionen");
    expect(html).toContain("Datenschutz-Dossier öffnen");
    const source = readFileSync(resolve(process.cwd(), "src/components/privacy/PrivacyGateProvider.tsx"), "utf8");
    expect(source).toContain('router.push("/datenschutz-dossier")');
  });

  it("keeps the shell mobile-first and marks the blocked background as inert", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/privacy/PrivacyGateProvider.tsx"),
      "utf8",
    );

    expect(source).toContain('shell.setAttribute("inert", "")');
    expect(source).toContain('document.body.style.overflow = "hidden"');
    expect(source).toContain('React.useState(() => Boolean(props.initiallyOpen))');
    expect(source).toContain("a[data-requires-privacy-gate='true']");
    expect(source).toContain("setPendingNavigationHref(anchor.href)");
    expect(source).toContain('pathname !== "/datenschutz-dossier"');
    expect(source).toContain('router.push("/datenschutz-dossier")');
    expect(source).toContain('if (event.key === "Escape")');
    expect(source).toContain('if (event.key !== "Tab") return;');
    expect(source).toContain("Komfortfunktionen erlauben");
    expect(source).toContain("Anonyme Nutzungsstatistik erlauben");
    expect(source).toContain("Externe Medien erst nach Freigabe laden");
    expect(source).toContain("Produktverbesserung mit anonymisierten Signalen erlauben");
    expect(source).toContain("rounded-t-[2rem]");
    expect(source).toContain("sm:rounded-[2rem]");
    expect(source).toContain("max-w-3xl");
  });

  it("does not auto-block public reading until an active action requests the gate", () => {
    const html = renderToStaticMarkup(
      <PrivacyGateProvider initialConsent={null}>
        <button type="button">Hintergrund-CTA</button>
      </PrivacyGateProvider>,
    );

    expect(html).toContain("Hintergrund-CTA");
    expect(html).not.toContain("Bevor du startest: Datenschutz verständlich erklärt");
  });
});
