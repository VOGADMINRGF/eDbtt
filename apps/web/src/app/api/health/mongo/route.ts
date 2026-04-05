import { NextResponse } from "next/server";
import { mongoPing } from "@/utils/mongoPing";
import { classifyMongoRuntimeError } from "@/lib/server/env/runtimeMongoErrors";

function runtimeStatus(kind: "srv" | "dns" | "conn_refused" | "unknown") {
  return kind === "unknown" ? 500 : 503;
}

export async function GET() {
  try {
    await mongoPing("core");
    return NextResponse.json({
      ok: true,
      service: "mongo:core",
      runtime: "connected",
    });
  } catch (error) {
    const mongoRuntime = classifyMongoRuntimeError(error);
    return NextResponse.json(
      {
        ok: false,
        error: "mongo_runtime_failure",
        service: "mongo:core",
        mongoRuntime,
      },
      { status: runtimeStatus(mongoRuntime.kind) },
    );
  }
}
