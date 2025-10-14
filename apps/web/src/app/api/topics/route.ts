// apps/web/src/app/api/topics/route.ts
import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/dbWeb";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get("locale") ?? undefined;

    const now = new Date();

    const topics = await db.topic.findMany({
      where: locale ? { locale } : undefined,
      orderBy: { createdAt: "asc" },
      include: {
        statements: {
          where: {
            status: "published",
            OR: [{ publishAt: null }, { publishAt: { lte: now } }],
            AND: [{ OR: [{ expireAt: null }, { expireAt: { gt: now } }] }],
          },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          include: {
            answerOptions: { orderBy: { sortOrder: "asc" } },
            regionEffective: true,
          },
        },
      },
    });

    return NextResponse.json({
      topics,
      locale: locale ?? null,
      asOf: now.toISOString(),
    });
  } catch (err) {
    console.error("GET /api/topics error:", err);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}
