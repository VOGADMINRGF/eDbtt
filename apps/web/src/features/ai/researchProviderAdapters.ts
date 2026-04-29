import {
  buildResearchProviderRegistry,
  normalizeResearchResult,
  type ResearchProviderId,
  type ResearchProbeResult,
  type ResearchQuery,
  type ResearchReport,
  type ResearchResult,
} from "@/features/ai/researchProviderRegistry";

export async function probeResearchProvider(
  provider: Exclude<ResearchProviderId, "disabled">,
): Promise<ResearchProbeResult> {
  const registry = buildResearchProviderRegistry();
  const found = registry.activeProviders.find((entry) => entry.provider === provider);
  if (!found) {
    return {
      provider,
      ok: false,
      availability: "offline",
      reason: "provider_not_registered",
    };
  }
  return {
    provider,
    ok: found.availability === "available",
    availability: found.availability,
    reason: found.reason,
  };
}

export async function runPerplexitySearchQuery(
  query: ResearchQuery,
): Promise<{ ok: false; reason: string } | { ok: true; report: ResearchReport }> {
  const probe = await probeResearchProvider("perplexity");
  if (!probe.ok) {
    return { ok: false, reason: probe.reason ?? "provider_unavailable" };
  }

  // Deliberate scaffold only: no automatic paid research calls in this slice.
  const report: ResearchReport = {
    provider: "perplexity",
    query: query.query,
    retrievedAt: new Date().toISOString(),
    items: [],
  };
  return { ok: true, report };
}

export async function runAriDeepResearch(
  query: ResearchQuery,
): Promise<{ ok: false; reason: string } | { ok: true; report: ResearchReport }> {
  const probe = await probeResearchProvider("ari");
  if (!probe.ok) {
    return { ok: false, reason: probe.reason ?? "provider_unavailable" };
  }
  return {
    ok: true,
    report: {
      provider: "ari",
      query: query.query,
      retrievedAt: new Date().toISOString(),
      items: [],
    },
  };
}

export async function runOpenAiDeepResearch(
  query: ResearchQuery,
): Promise<{ ok: false; reason: string } | { ok: true; report: ResearchReport }> {
  const probe = await probeResearchProvider("openai_deep_research");
  if (!probe.ok) {
    return { ok: false, reason: probe.reason ?? "provider_unavailable" };
  }
  return {
    ok: true,
    report: {
      provider: "openai_deep_research",
      query: query.query,
      retrievedAt: new Date().toISOString(),
      items: [],
    },
  };
}

export function normalizeExternalResearchItems(
  provider: Exclude<ResearchProviderId, "disabled">,
  items: Array<{
    title?: string | null;
    url?: string | null;
    snippet?: string | null;
    sourceName?: string | null;
    publishedAt?: string | null;
    confidence?: number | null;
    sourceQuality?: number | null;
  }>,
): ResearchResult[] {
  return items.map((entry) => normalizeResearchResult(provider, entry));
}

