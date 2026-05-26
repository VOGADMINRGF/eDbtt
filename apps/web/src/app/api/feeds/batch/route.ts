export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import type { FeedItemInput, StatementCandidate } from "@features/feeds/types";
import {
  buildCanonicalHash,
  buildStatementCandidate,
  normalizeLocale,
} from "@features/feeds/utils";
import { normalizeFeedUrl } from "@features/feeds/feedConfig";
import {
  findCandidateHashes,
  saveFeedItemsRaw,
  upsertStatementCandidates,
} from "@features/feeds/storage";
import { recordFeedRuntimeRun } from "@features/feeds/runtimeLog";
import { normalizeRegionCode } from "@core/regions/types";
import { requireAdminOrEditor } from "../_auth";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
} as const;

type FeedBatchBody = {
  items: FeedItemInput[];
};

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status, headers: JSON_HEADERS });
}

export async function POST(req: NextRequest): Promise<Response> {
  const gate = await requireAdminOrEditor(req);
  if (gate) return gate;
  const requestedAt = new Date();

  let body: FeedBatchBody | null = null;
  try {
    body = await req.json();
  } catch {
    await recordFeedRuntimeRun({
      runType: "batch_import",
      status: "error",
      requestedAt,
      completedAt: new Date(),
      error: "invalid_json_body",
    });
    return fail("Invalid JSON body", 400);
  }

  if (!body || !Array.isArray(body.items)) {
    await recordFeedRuntimeRun({
      runType: "batch_import",
      status: "error",
      requestedAt,
      completedAt: new Date(),
      error: "batch_body_must_contain_items_array",
    });
    return fail("Body muss { items: FeedItemInput[] } enthalten", 400);
  }

  const seenHashes = new Set<string>();
  const normalized: Array<FeedItemInput & { canonicalHash: string }> = [];
  let skippedInvalidUrl = 0;
  let skippedDuplicateInBatch = 0;

  for (const item of body.items) {
    if (!item || typeof item.url !== "string" || !item.url.trim()) {
      skippedInvalidUrl += 1;
      continue;
    }
    const validUrl = normalizeFeedUrl(item.url);
    if (!validUrl) {
      skippedInvalidUrl += 1;
      continue;
    }

    const normalizedItem = applyFeedDefaults({ ...item, url: validUrl });
    const canonicalHash = buildCanonicalHash(normalizedItem);
    if (seenHashes.has(canonicalHash)) {
      skippedDuplicateInBatch += 1;
      continue;
    }
    seenHashes.add(canonicalHash);

    normalized.push({ ...normalizedItem, canonicalHash });
  }

  const existingHashes = await findCandidateHashes(normalized.map((i) => i.canonicalHash));
  const newItems = normalized.filter((i) => !existingHashes.has(i.canonicalHash));
  const skippedExisting = normalized.length - newItems.length;
  const candidates: StatementCandidate[] = newItems.map((item) =>
    buildStatementCandidate(item, item.canonicalHash),
  );

  if (newItems.length) {
    await saveFeedItemsRaw(newItems).catch(() => {
      /* optional collection - ignore errors */
    });
    await upsertStatementCandidates(candidates);
  }

  await recordFeedRuntimeRun({
    runType: "batch_import",
    status: "success",
    requestedAt,
    completedAt: new Date(),
    counts: {
      received: body.items.length,
      normalized: normalized.length,
      inserted: candidates.length,
      skippedInvalidUrl,
      skippedDuplicateInBatch,
      skippedExisting,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      totalReceived: body.items.length,
      normalized: normalized.length,
      skippedInvalidUrl,
      skippedDuplicateInBatch,
      skippedExisting,
      inserted: candidates.length,
      results: candidates,
    },
    { headers: JSON_HEADERS },
  );
}

function applyFeedDefaults(item: FeedItemInput & { locale?: string | null }): FeedItemInput {
  const sourceLocale = normalizeLocale(item.sourceLocale ?? item.locale ?? null);
  const regionCode = normalizeRegionCode(item.regionCode ?? item.region ?? null);
  return {
    ...item,
    sourceLocale,
    regionCode,
  };
}
