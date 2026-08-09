import { describe, expect, it } from "vitest";
import {
  buildVoxySmartPresenceContext,
  selectVoxyProactiveContext,
  VOXY_SMART_PRESENCE_LAYOUT_GUARD,
  type VoxySmartPresenceContext,
} from "@/features/voxy/smartPresenceContract";

function validContext(overrides: Partial<VoxySmartPresenceContext> = {}) {
  return {
    surface: "dossier",
    objectType: "source",
    objectId: "source-1",
    objectLabel: "Kommunaler Bericht",
    helpTopic: "unreviewed_source",
    status: "Ungeprüft",
    allowedActions: [],
    languageContext: {
      contentLanguage: "de",
      interfaceLanguage: "de",
      direction: "ltr",
    },
    permissionContext: {
      canRead: true,
      canNavigate: true,
      canMutate: false,
    },
    ...overrides,
  } satisfies VoxySmartPresenceContext;
}

describe("VOXY-SMART-PRESENCE-FOUNDATION-01 contract", () => {
  it("requires object, language and permission context and remains read-only", () => {
    expect(buildVoxySmartPresenceContext(validContext())).toMatchObject({
      surface: "dossier",
      objectType: "source",
      objectId: "source-1",
      permissionContext: { canMutate: false },
    });
    expect(
      buildVoxySmartPresenceContext(validContext({ objectId: " " })),
    ).toBeNull();
    expect(
      buildVoxySmartPresenceContext({
        ...validContext(),
        permissionContext: {
          canRead: true,
          canNavigate: true,
          canMutate: true,
        },
      } as unknown as VoxySmartPresenceContext),
    ).toBeNull();
  });

  it("allows no more than three real navigation actions", () => {
    const action = (index: number) => ({
      id: `action-${index}`,
      label: `Aktion ${index}`,
      kind: "navigate" as const,
      target: { view: "sources", objectType: "source" as const, objectId: `source-${index}` },
    });
    expect(
      buildVoxySmartPresenceContext(
        validContext({ allowedActions: [action(1), action(2), action(3)] }),
      ),
    ).not.toBeNull();
    expect(
      buildVoxySmartPresenceContext(
        validContext({ allowedActions: [action(1), action(2), action(3), action(4)] }),
      ),
    ).toBeNull();
  });

  it("selects at most one eligible, non-dismissed proactive context", () => {
    const context = validContext();
    expect(
      selectVoxyProactiveContext(
        [
          { id: "dismissed", reason: "contradiction", context },
          { id: "eligible", reason: "unreviewed_answer", context },
          { id: "later", reason: "real_blocker", context },
        ],
        new Set(["dismissed"]),
      )?.id,
    ).toBe("eligible");
  });

  it("publishes explicit layout and mutation guards", () => {
    expect(VOXY_SMART_PRESENCE_LAYOUT_GUARD.forbidsFullScreenOverlay).toBe(true);
    expect(VOXY_SMART_PRESENCE_LAYOUT_GUARD.forbidsMutation).toBe(true);
    expect(VOXY_SMART_PRESENCE_LAYOUT_GUARD.mobileSafeAreaClassName).toContain(
      "safe-area-inset-bottom",
    );
  });
});
