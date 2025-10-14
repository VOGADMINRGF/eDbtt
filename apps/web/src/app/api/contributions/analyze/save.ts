import { NextRequest } from "next/server";
import { connectDB } from "@/lib/connectDB";
import ContributionModel from "@/models/Contribution";
import { formatError } from "@/core/utils/errors";
import ErrorLogModel from "@/models/ErrorLog";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.text || !body.statements?.length) {
      throw new Error("INVALID_PAYLOAD");
    }

    const saved = await ContributionModel.create({
      ...body,
      createdAt: new Date(),
      status: "confirmed",
    });

    return new Response(JSON.stringify({ success: true, id: saved._id }), {
      status: 200,
    });
  } catch (error: any) {
    const formattedError = formatError({
      message: "Speichern fehlgeschlagen",
      code: "SAVE_ERROR",
      cause: error.message || error,
    });

    await ErrorLogModel.create({
      message: typeof formattedError === "string" ? formattedError : ((formattedError as any)?.message ?? "[error]"),
      level: "error",
      ...(typeof formattedError==="object" && formattedError ? formattedError : { formattedError }),
      path: "/api/contribution/save",
      payload: req.body,
    });

    return new Response(JSON.stringify(formattedError), { status: 500 });
  }
}
