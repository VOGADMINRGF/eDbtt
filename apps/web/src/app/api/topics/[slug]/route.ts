// apps/web/src/app/api/topics/[slug]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma, PublishStatus } from "@db/web";

type Params = { params: { slug: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const now = new Date();

    const topic = await prisma.topic.findUnique({
      where: { slug: params.slug },
      include: {
        items: {
          where: {
            status: PublishStatus.PUBLISHED,
            OR: [{ publishAt: null }, { publishAt: { lte: now } }],
            AND: [{ OR: [{ expireAt: null }, { expireAt: { gt: now } }] }],
          },
          orderBy: [{ publishAt: "desc" }, { createdAt: "desc" }],
          include: {
            answerOptions: { orderBy: { sortOrder: "asc" } },
            regionEffective: true,
          },
        },
      },
    });

    if (!topic) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ topic, asOf: now.toISOString() });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to load topic" },
      { status: 500 },
    );
  }
}
