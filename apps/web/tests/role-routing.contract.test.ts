import { describe, expect, it } from "vitest";
import {
  ROLE_EXPERIENCE_MATRIX,
  getRoleExperienceContract,
  resolveExperienceRoleId,
  resolvePostLoginRedirect,
  resolvePostRegistrationRedirect,
} from "@/features/auth/roleExperienceContract";

describe("role routing contract", () => {
  it("resolves expected role experiences from auth role tokens", () => {
    expect(resolveExperienceRoleId({ roles: ["user"] })).toBe("citizens");
    expect(resolveExperienceRoleId({ roles: ["journalist"] })).toBe("journalists");
    expect(resolveExperienceRoleId({ roles: ["ngo"] })).toBe("organizations");
    expect(resolveExperienceRoleId({ roles: ["politics"] })).toBe("municipalities");
    expect(resolveExperienceRoleId({ roles: ["admin"] })).toBe("admin_backoffice");
    expect(resolveExperienceRoleId({ roles: ["finance"] })).toBe("admin_backoffice");
  });

  it("keeps explicit internal next routes, but blocks admin-only routes for non-admin users", () => {
    expect(
      resolvePostLoginRedirect({
        requestedRedirect: "/pricing?segment=journalismus",
        roles: ["journalist"],
      }),
    ).toBe("/pricing?segment=journalismus");

    expect(
      resolvePostLoginRedirect({
        requestedRedirect: "/admin/pricing/orders",
        roles: ["journalist"],
      }),
    ).toBe("/account?context=journalismus");

    expect(
      resolvePostLoginRedirect({
        requestedRedirect: "/admin/pricing/orders",
        roles: ["admin"],
      }),
    ).toBe("/admin/pricing/orders");
  });

  it("falls back to role-specific default routes when no next target exists", () => {
    expect(resolvePostLoginRedirect({ roles: ["user"] })).toBe("/account");
    expect(resolvePostLoginRedirect({ roles: ["journalist"] })).toBe("/account?context=journalismus");
    expect(resolvePostLoginRedirect({ roles: ["ngo"] })).toBe("/account?context=organisationen");
    expect(resolvePostLoginRedirect({ roles: ["politics"] })).toBe("/account?context=kommunen");
    expect(resolvePostLoginRedirect({ roles: ["admin"] })).toBe("/admin");
  });

  it("keeps registration defaults deterministic and safe", () => {
    expect(resolvePostRegistrationRedirect({ roleId: "citizens" })).toBe("/account?welcome=1");
    expect(resolvePostRegistrationRedirect({ roleId: "admin_backoffice" })).toBe("/admin");
    expect(
      resolvePostRegistrationRedirect({ requestedRedirect: "/account?preorder=thanks", roleId: "journalists" }),
    ).toBe("/account?preorder=thanks");
    expect(
      resolvePostRegistrationRedirect({ requestedRedirect: "/admin", roleId: "journalists" }),
    ).toBe("/account?context=journalismus&welcome=1");
  });

  it("ships a complete matrix with modules, ctas and visibility declarations", () => {
    expect(ROLE_EXPERIENCE_MATRIX).toHaveLength(5);
    ROLE_EXPERIENCE_MATRIX.forEach((entry) => {
      expect(entry.expectedPostLoginRoute.startsWith("/")).toBe(true);
      expect(entry.expectedPostRegistrationRoute.startsWith("/")).toBe(true);
      expect(entry.primaryModules.length).toBeGreaterThan(0);
      expect(entry.primaryCtas.length).toBeGreaterThan(0);
      expect(entry.firstTask.length).toBeGreaterThan(0);
      expect(entry.reviewNotes.length).toBeGreaterThan(0);
      expect(getRoleExperienceContract(entry.id).id).toBe(entry.id);
    });
  });
});
