import { NextResponse } from "next/server";
import demoDossier from "@features/dossier/data/demoDossier";

export const runtime = "nodejs";

type Body = { dossierId?: string; optionId?: string };

function getBaseMajority() {
  const note = demoDossier.analyze.notes?.find((n) => n.id === "note-inputs");
  if (!note) return [];
  try {
    const parsed = JSON.parse(note.text || "{}");
    return parsed?.vote?.majorityDemo ?? [];
  } catch {
    return [];
  }
}

function nudgeMajority(majority: { id: string; pct: number }[], optionId: string) {
  const next = majority.map((m) => ({ ...m }));
  const idx = next.findIndex((m) => m.id === optionId);
  if (idx < 0) return next;

  const bump = 2;
  next[idx].pct = Math.min(60, next[idx].pct + bump);

  const others = next
    .map((m, i) => ({ ...m, i }))
    .filter((m) => m.id !== optionId)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 2);

  for (const o of others) {
    next[o.i].pct = Math.max(0, next[o.i].pct - 1);
  }

  const sum = next.reduce((s, m) => s + m.pct, 0);
  if (sum !== 100 && next.length) {
    const delta = 100 - sum;
    const minIdx = next.reduce((best, m, i) => (m.pct < next[best].pct ? i : best), 0);
    next[minIdx].pct = Math.max(0, next[minIdx].pct + delta);
  }

  return next;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const optionId = body.optionId?.trim();
  if (!optionId) {
    return NextResponse.json({ ok: false, error: "optionId_missing" }, { status: 400 });
  }

  const base = getBaseMajority();
  const majorityDemo = nudgeMajority(base, optionId);

  return NextResponse.json(
    {
      ok: true,
      dossierId: body.dossierId ?? demoDossier.meta.id,
      updatedAt: new Date().toISOString(),
      totalVotes: (getBaseMajority().length ? 284 : 0) + 1,
      majorityDemo,
    },
    { status: 200 },
  );
}
