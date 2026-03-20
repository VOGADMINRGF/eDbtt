import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  readSession: vi.fn(),
  resolveCommunityGroupSurface: vi.fn(),
  cookies: vi.fn(),
  headers: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: () => mocks.cookies(),
  headers: () => mocks.headers(),
}));

vi.mock("@/utils/session", () => ({
  readSession: (...args: unknown[]) => mocks.readSession(...args),
}));

vi.mock("@/features/community/groupSurface", () => ({
  resolveCommunityGroupSurface: (...args: unknown[]) => mocks.resolveCommunityGroupSurface(...args),
}));

import CommunityPage from "@/app/community/page";

describe("community page states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readSession.mockResolvedValue({ uid: "user-1" });
    mocks.cookies.mockReturnValue({ get: () => undefined });
    mocks.headers.mockReturnValue({ get: () => "de-DE,de;q=0.9" });
  });

  it("Scenario A: canonical productive group link renders resolver-backed group surface", async () => {
    mocks.resolveCommunityGroupSurface.mockResolvedValue({
      mode: "group",
      context: {
        key: "mobility-berlin",
        label: "Mobilitaet Berlin",
        type: "regional_group",
        scope: "regional",
      },
      members: [
        {
          id: "u2",
          displayName: "Member",
          relationshipState: "none",
          canMessage: false,
          avatarUrl: null,
          shareId: "member-one",
          tagline: null,
          locationLabel: "Berlin",
          reasonLabel: "Mobilitaet · Berlin",
        },
      ],
      statements: [],
      dossier: null,
      topicHref: "/swipes?topic=mobility",
      dossierHref: null,
      source: { unavailable: false, error: null },
    });

    const tree = await CommunityPage({
      searchParams: Promise.resolve({
        group: "mobility-berlin",
        type: "regional_group",
        scope: "regional",
        topicKey: "mobility",
      }) as any,
    });
    const html = renderToStaticMarkup(tree);
    expect(html).toContain("Mobilitaet Berlin");
    expect(html).toContain("lg:grid-cols-[1.25fr_1fr]");
    expect(html).toContain("sm:grid-cols-2");
  });

  it("Scenario B: discovery mode renders productive groups with canonical deep links", async () => {
    mocks.resolveCommunityGroupSurface.mockResolvedValue({
      mode: "discovery",
      groups: [
        {
          key: "mobility-berlin",
          title: "Mobilitaet Berlin",
          hint: "Hint",
          href: "/community?group=mobility-berlin&type=regional_group&scope=regional&topicKey=mobility&regionLabel=Berlin",
        },
      ],
      source: { unavailable: false, error: null },
    });

    const tree = await CommunityPage({ searchParams: Promise.resolve({}) as any });
    const html = renderToStaticMarkup(tree);
    expect(html).toContain("Mobilitaet Berlin");
    expect(html).toContain("md:grid-cols-2");
    expect(html).toContain("topicKey=mobility");
    expect(html).not.toContain("topic=mobility&amp;");
  });

  it("Scenario B: explicit empty state is shown for discovery with zero groups", async () => {
    mocks.resolveCommunityGroupSurface.mockResolvedValue({
      mode: "discovery",
      groups: [],
      source: { unavailable: false, error: null },
    });

    const tree = await CommunityPage({ searchParams: Promise.resolve({}) as any });
    const html = renderToStaticMarkup(tree);
    expect(html).toContain("Noch keine Community-Gruppen aus produktiven Profilsignalen vorhanden.");
  });

  it("Scenario C: explicit unavailable state is shown on source failure", async () => {
    mocks.resolveCommunityGroupSurface.mockResolvedValue({
      mode: "group",
      context: {
        key: "mobility-berlin",
        label: "Mobilitaet Berlin",
        type: "regional_group",
        scope: "regional",
      },
      members: [],
      statements: [],
      dossier: null,
      topicHref: "/swipes?topic=mobility",
      dossierHref: null,
      source: { unavailable: true, error: "community_group_source_unavailable" },
    });

    const tree = await CommunityPage({ searchParams: Promise.resolve({ group: "mobility-berlin" }) as any });
    const html = renderToStaticMarkup(tree);
    expect(html).toContain("Produktive Community-Quelle aktuell nicht verfuegbar");
    expect(html).toContain("kein statischer Demo-Fallback");
  });

  it("Scenario D: invalid deep-link params are rejected without fallback read", async () => {
    const tree = await CommunityPage({
      searchParams: Promise.resolve({ group: "mobility-berlin", scope: "invalid" }) as any,
    });
    const html = renderToStaticMarkup(tree);
    expect(html).toContain("Ungueltige Community-Deep-Link-Parameter (invalid_group_scope).");
    expect(mocks.resolveCommunityGroupSurface).not.toHaveBeenCalled();
  });

  it("Scenario D: malformed context without group is rejected without resolver fallback", async () => {
    const tree = await CommunityPage({
      searchParams: Promise.resolve({ topic: "mobility" }) as any,
    });
    const html = renderToStaticMarkup(tree);
    expect(html).toContain("Ungueltige Community-Deep-Link-Parameter (invalid_group_context).");
    expect(mocks.resolveCommunityGroupSurface).not.toHaveBeenCalled();
  });
});
