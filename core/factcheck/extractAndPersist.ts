// core/factcheck/extractAndPersist.ts
import { prisma } from "@db-core";
import { extractUnits } from "./classify";
import { canonicalKey, normalizeText } from "./canonical";
import { shouldWatchlist } from "./triage";

export async function persistStatementWithUnits({
  statementId,
  text,
  defaultScope,
  defaultTimeframe
}: {
  statementId: string;
  text: string;
  defaultScope?: string;
  defaultTimeframe?: string;
}) {
  const units = extractUnits(text);
  const results = [] as { unitId: string; claimId?: string }[];

  for (const u of units) {
    const scope = u.scope || defaultScope;
    const timeframe = u.timeframe || defaultTimeframe;
    const ck = canonicalKey({ text: u.text, scope, timeframe });

    let claimId: string | undefined;
    if (u.kind === "claim") {
      const title = makeNeutralTitle(u.text, scope, timeframe);
      const claim = await prisma.factcheckClaim.upsert({
        where: { canonicalKey: ck },
        create: { canonicalKey: ck, scope, timeframe, status: "OPEN", /* title? falls vorhanden */ },
        update: { updatedAt: new Date() }
      });
      claimId = claim.id;
    }

    const created = await prisma.extractedUnit.create({
      data: {
        statementId,
        kind: u.kind as any,
        text: u.text,
        spanStart: u.span[0],
        spanEnd: u.span[1],
        confidence: u.confidence,
        canonicalKey: ck,
        scope,
        timeframe,
        claimId,
        triage: shouldWatchlist(u) ? "watchlist" : "none"
      }
    });

    results.push({ unitId: created.id, claimId });
  }
  return results;
}

function makeNeutralTitle(text: string, scope?: string, timeframe?: string) {
  const base = normalizeText(text).slice(0, 120);
  const parts = [base];
  if (scope) parts.push(`[${scope}]`);
  if (timeframe) parts.push(`(${timeframe})`);
  return parts.join(" ");
}
