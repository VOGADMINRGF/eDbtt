import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import AdminUsersPage from "@/app/admin/users/page";

describe("admin users page contract", () => {
  it("renders a real create CTA and no longer advertises the old institution-only gate", () => {
    const html = renderToStaticMarkup(<AdminUsersPage />);
    const source = readFileSync(resolve(process.cwd(), "src/app/admin/users/page.tsx"), "utf8");

    expect(html).toContain("+ Nutzer anlegen");
    expect(html).toContain("Import (folgt separat)");
    expect(source).toContain("Verifikationsmail senden");
    expect(source).toContain("Danger Zone");
    expect(source).toContain("Nur Admins dürfen Nutzer anlegen");
    expect(source).toContain("const trimmedPassword = createForm.password.trim();");
    expect(source).toContain("if (trimmedPassword) {");
    expect(source).toContain("body: JSON.stringify(payload)");
    expect(source).not.toContain("body: JSON.stringify(createForm)");
    expect(source).not.toContain("example.org");
    expect(source).not.toContain("Nur B2B/B2G dürfen Nutzer hinzufügen");
    expect(source).not.toContain("Import ist vorbereitet – Endpoint folgt.");
  });
});
