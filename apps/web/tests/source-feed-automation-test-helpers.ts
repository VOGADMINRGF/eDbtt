import { vi } from "vitest";

const fixtures = vi.hoisted(() => ({
  feedConfigs: {
    de: null as any,
    global: null as any,
  },
  connections: [] as any[],
  testResults: [] as any[],
}));

vi.mock("@features/feeds/feedConfig", async () => {
  const actual = await vi.importActual<typeof import("@features/feeds/feedConfig")>(
    "@features/feeds/feedConfig",
  );
  return {
    ...actual,
    loadFeeds: vi.fn(async (scope: "de" | "global") => ({
      config: fixtures.feedConfigs[scope] ?? null,
      searched: [],
      source: `mock:${scope}`,
    })),
  };
});

vi.mock("@features/region/server/sourceConnectionRuntime", () => ({
  listRegionSourceConnections: vi.fn(async () => fixtures.connections),
  listRegionSourceTestResults: vi.fn(async () => fixtures.testResults),
}));

export function resetSourceFeedAutomationFixtures() {
  fixtures.feedConfigs.de = null;
  fixtures.feedConfigs.global = null;
  fixtures.connections = [];
  fixtures.testResults = [];
}

export function setSourceFeedAutomationFixtures(next: {
  feedConfigs?: {
    de?: any;
    global?: any;
  };
  connections?: any[];
  testResults?: any[];
}) {
  if (next.feedConfigs?.de !== undefined) fixtures.feedConfigs.de = next.feedConfigs.de;
  if (next.feedConfigs?.global !== undefined) fixtures.feedConfigs.global = next.feedConfigs.global;
  if (next.connections) fixtures.connections = next.connections;
  if (next.testResults) fixtures.testResults = next.testResults;
}

export async function loadSourceFeedAutomationModule() {
  const mod = await import("@features/feeds/sourceAutomation");
  mod.setFeedSourceAutomationRepoForTests(mod.createInMemoryFeedSourceAutomationRepo());
  return mod;
}
