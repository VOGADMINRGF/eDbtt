// apps/web/src/app/api/errors/resolve/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@lib/connectDB";
import ErrorLogModel from "@/models/ErrorLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Body = { _id?: string; traceId?: string; resolved?: unknown };

export async function POST(req: Request) {
  try {
    await connectDB();

    const { _id, traceId, resolved }: Body = await req.json();

    if (typeof resolved !== "boolean") {
      return NextResponse.json(
        {
          ok: false,
          error: "bad_request",
          message: "`resolved` must be boolean",
        },
        { status: 400 },
      );
    }

    const filter = _id ? { _id } : traceId ? { traceId } : null;
    if (!filter) {
      return NextResponse.json(
        {
          ok: false,
          error: "bad_request",
          message: "Provide `_id` or `traceId`",
        },
        { status: 400 },
      );
    }

    const updated = await ErrorLogModel.findOneAndUpdate(
      filter,
      { $set: { resolved } },
      {
        new: true,
        projection: {
          _id: 1,
          traceId: 1,
          code: 1,
          path: 1,
          resolved: 1,
          timestamp: 1,
        },
      },
    );

    if (!updated) {
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, item: updated }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
