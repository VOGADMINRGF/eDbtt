import { prisma } from "@db-core";

export async function getDomain(url: string): Promise<string> {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export async function getTrust(domain: string): Promise<{ score: number; flagged: boolean }> {
  const row = await prisma.sourceTrust.findUnique({ where: { domain } });
  if (!row) return { score: 50, flagged: false };
  return { score: row.bayesScore, flagged: row.flagged };
}

// Exponentially Weighted Moving Average-Update (stabiler als hartes Überschreiben)
export async function ewmaTrustUpdate(domain: string, observed: number, alpha = 0.2) {
  const existing = await prisma.sourceTrust.findUnique({ where: { domain } });
  if (!existing) {
    await prisma.sourceTrust.create({
      data: { domain, bayesScore: observed, flagged: observed < 30 }
    });
    return;
  }
  const next = Math.max(0, Math.min(100, (1 - alpha) * existing.bayesScore + alpha * observed));
  await prisma.sourceTrust.update({
    where: { domain },
    data: { bayesScore: next, flagged: next < 30 }
  });
}
