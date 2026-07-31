import { describe, expect, it } from "vitest";
import { normalizeOptionalPublicQrTarget } from "@/features/qr/security";

describe("stream agenda QR target security", () => {
  it.each([
    ["surrounding whitespace", " /dossier/demo "],
    ["raw backslash", "/\\evil.example"],
    ["encoded backslash", "/%5Cevil.example"],
    ["malformed encoding", "/%GG"],
  ])("rejects %s before persistence", (_label, candidate) => {
    expect(normalizeOptionalPublicQrTarget(candidate)).toMatchObject({ ok: false });
  });

  it("preserves an accepted target without trimming or cutting", () => {
    expect(
      normalizeOptionalPublicQrTarget("/dossier/demo?view=public#sources"),
    ).toEqual({
      ok: true,
      value: "/dossier/demo?view=public#sources",
    });
  });

  it("keeps only explicit absence as no QR target", () => {
    expect(normalizeOptionalPublicQrTarget(null)).toEqual({ ok: true, value: null });
    expect(normalizeOptionalPublicQrTarget("")).toEqual({ ok: true, value: null });
    expect(normalizeOptionalPublicQrTarget("   ")).toMatchObject({ ok: false });
  });
});
