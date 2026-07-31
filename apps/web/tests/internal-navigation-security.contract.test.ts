import { describe, expect, it } from "vitest";
import {
  MAX_INTERNAL_NAVIGATION_TARGET_LENGTH,
  normalizeInternalRedirectPath,
  validateSameOriginNavigationTarget,
} from "@/lib/security/internalNavigation";
import {
  buildPublicQrTargetHref,
  buildStudioTargetHref,
  validateQrTarget,
} from "@/features/qr/security";
import {
  buildQrStudioHref,
  resolveQrStudioTarget,
} from "@features/qr";

const EXPECTED_ORIGIN = "https://www.edebatte.org";
const MAX_LENGTH_TARGET =
  `/${"a".repeat(MAX_INTERNAL_NAVIGATION_TARGET_LENGTH - 1)}`;
const OVERLONG_TARGET =
  `/${"a".repeat(MAX_INTERNAL_NAVIGATION_TARGET_LENGTH)}`;

const STRUCTURALLY_UNSAFE_TARGETS = [
  ["raw origin-escape backslash", "/\\evil.example"],
  ["raw backslash in path", "/account\\security"],
  ["encoded backslash", "/%5Cevil.example"],
  ["lowercase encoded backslash", "/%5cevil.example"],
  ["double encoded backslash", "/%255Cevil.example"],
  ["network path", "//evil.example"],
  ["encoded network path", "/%2F%2Fevil.example"],
  ["double encoded network path", "/%252F%252Fevil.example"],
  ["raw NUL", "/\u0000/evil.example"],
  ["encoded NUL", "/%00/evil.example"],
  ["double encoded NUL", "/%2500/evil.example"],
  ["raw C0 start of heading", "/\u0001/evil.example"],
  ["encoded C0 start of heading", "/%01/evil.example"],
  ["raw C0 unit separator", "/\u001f/evil.example"],
  ["encoded C0 unit separator", "/%1F/evil.example"],
  ["raw DEL", "/\u007f/evil.example"],
  ["encoded DEL", "/%7F/evil.example"],
  ["raw tab", "/\t/evil.example"],
  ["encoded tab", "/%09/evil.example"],
  ["double encoded tab", "/%2509/evil.example"],
  ["raw carriage return", "/\r/evil.example"],
  ["encoded carriage return", "/%0D/evil.example"],
  ["double encoded carriage return", "/%250D/evil.example"],
  ["raw line feed", "/\n/evil.example"],
  ["encoded line feed", "/%0A/evil.example"],
  ["double encoded line feed", "/%250A/evil.example"],
  ["lone percent", "/%"],
  ["non-hex percent G0", "/%G0"],
  ["non-hex percent GG", "/%GG"],
  ["truncated UTF-8 sequence", "/%E2%82"],
  ["invalid UTF-8 continuation", "/%C3%28"],
  ["malformed encoding after encoded backslash", "/safe%5C%"],
  ["invalid UTF-8 after encoded control", "/safe%00%C3%28"],
  ["triple encoding depth", "/%25255Cevil.example"],
  ["browser-normalized dot segment", "/safe/../admin"],
  ["surrounding whitespace", " /safe"],
  ["javascript scheme", "javascript:alert(1)"],
  ["data scheme", "data:text/html,boom"],
  ["file scheme", "file:///etc/passwd"],
  ["vbscript scheme", "vbscript:msgbox(1)"],
  [
    "embedded credentials",
    "https://user:pass@www.edebatte.org/dossier/demo",
  ],
  ["foreign HTTPS origin", "https://evil.example/dossier/demo"],
  ["overlong target", OVERLONG_TARGET],
] as const;

const QR_POLICY_BLOCKED_TARGETS = [
  ["admin path", "/admin"],
  ["admin subpath", "/admin/users"],
  ["api path", "/api/qr/resolve"],
  ["Next.js system path", "/_next/static/chunk.js"],
  ["token query", "/account?token=synthetic-placeholder"],
  ["password query", "/login?password=synthetic-placeholder"],
  ["next query", "/safe?next=/account"],
  [
    "redirect query",
    "/safe?redirect=https%3A%2F%2Fevil.example",
  ],
  ["target query", "/safe?target=/dossier/demo"],
  ["encoded next key", "/safe?%6e%65%78%74=%2Faccount"],
  [
    "double encoded next key",
    "/safe?%256e%2565%2578%2574=%252Faccount",
  ],
] as const;

const SAFE_INTERNAL_TARGETS = [
  ["/dossier/demo-1", "/dossier/demo-1"],
  [
    "/dossier/demo-1?view=public#sources",
    "/dossier/demo-1?view=public#sources",
  ],
  [
    "/search?q=region%20berlin#results",
    "/search?q=region%20berlin#results",
  ],
  [MAX_LENGTH_TARGET, MAX_LENGTH_TARGET],
] as const;

describe("shared internal navigation security matrix", () => {
  it.each(STRUCTURALLY_UNSAFE_TARGETS)(
    "blocks %s in every target resolver",
    (_label, candidate) => {
      expect(normalizeInternalRedirectPath(candidate)).toBeNull();
      expect(
        validateSameOriginNavigationTarget(candidate, {
          expectedOrigin: EXPECTED_ORIGIN,
          allowAbsolute: true,
        }),
      ).toMatchObject({ ok: false });
      expect(
        validateQrTarget(candidate, { expectedOrigin: EXPECTED_ORIGIN }),
      ).toMatchObject({ ok: false });
      expect(
        resolveQrStudioTarget({
          target: candidate,
          publicOrigin: EXPECTED_ORIGIN,
        }),
      ).toMatchObject({ status: "blocked" });
      expect(buildPublicQrTargetHref(candidate)).toBeNull();
      expect(buildStudioTargetHref(candidate)).toBeNull();
    },
  );

  it.each(QR_POLICY_BLOCKED_TARGETS)(
    "keeps generic navigation semantics but blocks QR policy target %s",
    (_label, candidate) => {
      expect(normalizeInternalRedirectPath(candidate)).toBe(candidate);
      expect(
        validateQrTarget(candidate, { expectedOrigin: EXPECTED_ORIGIN }),
      ).toMatchObject({ ok: false });
      expect(
        resolveQrStudioTarget({
          target: candidate,
          publicOrigin: EXPECTED_ORIGIN,
        }),
      ).toMatchObject({ status: "blocked" });
      expect(
        buildQrStudioHref({
          target: candidate,
          publicOrigin: EXPECTED_ORIGIN,
        }),
      ).toBe("/studio?targetState=blocked");
    },
  );

  it.each(SAFE_INTERNAL_TARGETS)(
    "preserves safe internal target %s without rewriting query or fragment",
    (candidate, expected) => {
      expect(normalizeInternalRedirectPath(candidate)).toBe(expected);

      const navigation = validateSameOriginNavigationTarget(candidate, {
        expectedOrigin: EXPECTED_ORIGIN,
        allowAbsolute: true,
      });
      expect(navigation).toMatchObject({
        ok: true,
        value: {
          relativeTarget: expected,
          resolvedOrigin: EXPECTED_ORIGIN,
        },
      });

      const validation = validateQrTarget(candidate, {
        expectedOrigin: EXPECTED_ORIGIN,
      });
      expect(validation).toMatchObject({
        ok: true,
        value: {
          kind: "internal",
          normalizedTarget: expected,
        },
      });
      if (!validation.ok) throw new Error("expected_safe_qr_target");
      expect(new URL(validation.value.absoluteTarget).origin).toBe(
        EXPECTED_ORIGIN,
      );

      const resolved = resolveQrStudioTarget({
        target: candidate,
        publicOrigin: EXPECTED_ORIGIN,
      });
      expect(resolved).toMatchObject({
        status: "ready",
        targetKind: "internal",
        normalizedTarget: expected,
        displayHref: expected,
      });
      if (resolved.status !== "ready") {
        throw new Error("expected_ready_studio_target");
      }
      expect(new URL(resolved.absoluteHref).origin).toBe(EXPECTED_ORIGIN);
    },
  );

  it("allows only a canonical absolute URL on the expected origin", () => {
    const candidate =
      "https://www.edebatte.org/dossier/demo-1?view=public#sources";
    expect(normalizeInternalRedirectPath(candidate)).toBeNull();

    const validation = validateQrTarget(candidate, {
      expectedOrigin: EXPECTED_ORIGIN,
    });
    expect(validation).toMatchObject({
      ok: true,
      value: {
        kind: "external",
        normalizedTarget: candidate,
        absoluteTarget: candidate,
      },
    });

    const resolved = resolveQrStudioTarget({
      target: candidate,
      publicOrigin: EXPECTED_ORIGIN,
    });
    expect(resolved).toMatchObject({
      status: "ready",
      targetKind: "allowed_https",
      normalizedTarget: candidate,
      absoluteHref: candidate,
      displayHref: candidate,
    });
  });

  it("never rewrites a rejected origin escape into a safe-looking target", () => {
    const candidate = "/\\evil.example";
    expect(
      buildQrStudioHref({
        target: candidate,
        publicOrigin: EXPECTED_ORIGIN,
      }),
    ).toBe("/studio?targetState=blocked");
    expect(buildPublicQrTargetHref(candidate)).toBeNull();
  });

  it.each([
    "/%",
    "/%G0",
    "/%GG",
    "/%E2%82",
    "/%C3%28",
    "/safe%5C%",
    "/safe%00%C3%28",
  ])("classifies malformed encoding %s fail-closed", (candidate) => {
    expect(
      validateSameOriginNavigationTarget(candidate, {
        expectedOrigin: EXPECTED_ORIGIN,
        allowAbsolute: true,
      }),
    ).toEqual({ ok: false, reason: "malformed_encoding" });
  });
});
