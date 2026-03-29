import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { resolveRoleFromRequest } from "@/lib/server/auth/requestRole";

describe("request role resolver", () => {
  it("prefers session cookie role over header role", () => {
    const req = new NextRequest("http://localhost/api/factcheck/status?role=owner", {
      headers: {
        cookie: "u_role=editor",
        "x-role": "admin",
      },
    });

    expect(resolveRoleFromRequest(req)).toEqual({
      role: "editor",
      source: "cookie",
    });
  });

  it("uses x-role only when no session cookie role exists", () => {
    const req = new NextRequest("http://localhost/api/factcheck/status?role=owner", {
      headers: {
        "x-role": "verified",
      },
    });

    expect(resolveRoleFromRequest(req)).toEqual({
      role: "verified",
      source: "header",
    });
  });

  it("ignores query role fallback and invalid role values", () => {
    const queryOnly = new NextRequest("http://localhost/api/factcheck/status?role=admin");
    expect(resolveRoleFromRequest(queryOnly)).toEqual({
      role: "guest",
      source: "default",
    });

    const invalidHeader = new NextRequest("http://localhost/api/factcheck/status", {
      headers: {
        "x-role": "superadmin",
      },
    });
    expect(resolveRoleFromRequest(invalidHeader)).toEqual({
      role: "guest",
      source: "default",
    });
  });
});

