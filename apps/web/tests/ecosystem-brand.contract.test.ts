import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ECOSYSTEM_BRANDS,
  getEcosystemBrand,
  getEcosystemHref,
} from "@/config/ecosystem";
import { VOG_SUPPORT_URL } from "@/config/links";
import { BRAND } from "@/lib/brand";

describe("ecosystem brand contract", () => {
  it("defines exactly the four canonical brands", () => {
    expect(ECOSYSTEM_BRANDS.map((brand) => brand.displayName)).toEqual([
      "eDebatte",
      "VoiceOpenGov",
      "Vote4Gov",
      "Voxy",
    ]);
  });

  it("uses unique stable IDs", () => {
    const ids = ECOSYSTEM_BRANDS.map((brand) => brand.id);
    expect(ids).toEqual(["edebatte", "voiceopengov", "vote4gov", "voxy"]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses a unique canonical role for every brand", () => {
    const roles = ECOSYSTEM_BRANDS.map((brand) => brand.canonicalRole);
    expect(new Set(roles).size).toBe(ECOSYSTEM_BRANDS.length);
    expect(roles).toEqual([
      "Offene Infrastruktur",
      "Internationale Mitgliederbewegung",
      "Gesellschaftliche Denkwerkstatt",
      "Transparente Begleitung",
    ]);
  });

  it("does not describe VoiceOpenGov as eDebatte's owner", () => {
    const relationship = getEcosystemBrand("voiceopengov").relationshipToEDebatte;
    expect(relationship).toContain("nutzt eDebatte");
    expect(relationship).toContain("besitzt eDebatte aber nicht");
  });

  it("requires every available target to be a valid internal path or HTTPS URL", () => {
    const available = ECOSYSTEM_BRANDS.filter((brand) => brand.target.status === "available");

    expect(available).toHaveLength(2);
    for (const brand of available) {
      expect(getEcosystemHref(brand)).toBe(brand.target.href);
      if (brand.target.kind === "internal") {
        expect(brand.target.href.startsWith("/")).toBe(true);
        expect(brand.target.href.startsWith("//")).toBe(false);
      } else {
        expect(new URL(brand.target.href).protocol).toBe("https:");
      }
    }
  });

  it("keeps unavailable brands non-clickable without a fallback target", () => {
    for (const id of ["vote4gov", "voxy"] as const) {
      const brand = getEcosystemBrand(id);
      expect(brand.target).toEqual({ status: "unavailable", kind: "none", href: null });
      expect(getEcosystemHref(brand)).toBeNull();
    }
  });

  it("marks cross-domain targets explicitly as external", () => {
    const voiceOpenGov = getEcosystemBrand("voiceopengov");
    expect(voiceOpenGov.target).toEqual({
      status: "available",
      kind: "external",
      href: VOG_SUPPORT_URL,
    });
  });

  it("derives the eDebatte destination from the existing BRAND contract", () => {
    const eDebatte = getEcosystemBrand("edebatte");
    expect(eDebatte.displayName).toBe(BRAND.name);
    expect(eDebatte.target).toEqual({
      status: "available",
      kind: "internal",
      href: new URL(BRAND.baseUrl).pathname,
    });
  });

  it("does not assign Voxy a standalone domain", () => {
    const voxy = getEcosystemBrand("voxy");
    const availableHrefs = ECOSYSTEM_BRANDS.flatMap((brand) =>
      brand.target.status === "available" ? [brand.target.href] : [],
    );
    expect(voxy.target.status).toBe("unavailable");
    expect(availableHrefs.some((href) => href.toLowerCase().includes("voxy"))).toBe(false);
  });

  it("does not invent a Vote4Gov destination", () => {
    const vote4Gov = getEcosystemBrand("vote4gov");
    expect(vote4Gov.target.status).toBe("unavailable");
    expect(getEcosystemHref(vote4Gov)).toBeNull();
  });

  it("keeps existing routes and visible shell components unchanged", () => {
    const layoutSource = readFileSync(resolve(process.cwd(), "src/app/layout.tsx"), "utf8");
    const headerSource = readFileSync(
      resolve(process.cwd(), "src/app/(components)/SiteHeader.tsx"),
      "utf8",
    );
    const footerSource = readFileSync(resolve(process.cwd(), "src/components/SiteFooter.tsx"), "utf8");

    expect(layoutSource).not.toContain("EcosystemChrome");
    expect(existsSync(resolve(process.cwd(), "src/components/brand/EcosystemChrome.tsx"))).toBe(false);
    expect(headerSource).toContain('href: "/create?intent=contribute"');
    expect(headerSource).toContain('href: "/themen"');
    expect(headerSource).toContain('href: "/runden?intent=create"');
    expect(footerSource).toContain('href: "/transparenzbericht"');
    expect(footerSource).toContain('href: "/datenschutz"');
    expect(footerSource).toContain('href: "/impressum"');
  });

  it("keeps eDebatte open to every canonical audience", () => {
    const relationship = getEcosystemBrand("edebatte").relationshipToEDebatte;
    for (const audience of [
      "Bürger",
      "Kommunen",
      "Unternehmen",
      "Vereine",
      "Parteien",
      "Wissenschaft",
      "Medien",
      "NGOs",
    ]) {
      expect(relationship).toContain(audience);
    }
  });

  it("keeps Voxy outside ownership, decisions, and automatic publication", () => {
    const relationship = getEcosystemBrand("voxy").relationshipToEDebatte;
    expect(relationship).toContain("weder Eigentümer");
    expect(relationship).toContain("Entscheider");
    expect(relationship).toContain("Veröffentlichungsautomatismus");
  });
});
