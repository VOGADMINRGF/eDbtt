import { NextResponse, type NextRequest } from "next/server";
import { collectFeedRefs, loadFeeds } from "@features/feeds/feedConfig";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SCOPES = ["de", "global"] as const;

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const scopes = await Promise.all(
    SCOPES.map(async (scope) => {
      const loaded = await loadFeeds(scope);
      if (!loaded.config) {
        return {
          scope,
          ok: false,
          source: loaded.source ?? null,
          searched: loaded.searched,
          error: "feeds_config_missing",
        };
      }

      const { feedRefs, invalidFeedUrls } = collectFeedRefs(loaded.config, {
        dedupeByRegion: true,
      });
      return {
        scope,
        ok: true,
        source: loaded.source ?? null,
        searched: loaded.searched,
        version: loaded.config.version ?? null,
        notes: loaded.config.notes ?? [],
        invalidFeedUrls,
        feeds: feedRefs.map((ref) => ({
          feedUrl: ref.feedUrl,
          regionCode: ref.regionCode,
          topicHints: ref.topicHints,
        })),
      };
    }),
  );

  return NextResponse.json({ ok: true, scopes });
}
