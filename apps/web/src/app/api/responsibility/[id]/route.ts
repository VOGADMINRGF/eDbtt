import { NextRequest, NextResponse } from "next/server";
import { getGraphDriver } from "@core/graph";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toProps(node: any) {
  return node?.properties ?? node ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const driver = getGraphDriver();
  if (!driver) {
    return NextResponse.json(
      { ok: false, error: "Graph backend not configured (NEO4J_* envs missing)" },
      { status: 501 },
    );
  }

  const { id } = await params;
  const responsibilityId = id?.trim();
  if (!responsibilityId) {
    return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  }

  const session = driver.session();
  try {
    const res = await session.run(
      `
      MATCH (r:Responsibility {id: $id})
      OPTIONAL MATCH (e:Eventuality)-[:RESPONSIBILITY_OF]->(r)
      OPTIONAL MATCH (src:Source)-[:ASSIGNS]->(r)
      RETURN r, collect(DISTINCT e) AS eventualities, collect(DISTINCT src) AS sources
      `,
      { id: responsibilityId },
    );
    if (!res.records.length) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    const record = res.records[0];
    const responsibility = toProps(record.get("r"));
    const eventualities = (record.get("eventualities") as any[] | undefined)?.map(toProps) ?? [];
    const sources = (record.get("sources") as any[] | undefined)?.map(toProps) ?? [];

    return NextResponse.json({ ok: true, responsibility, eventualities, sources });
  } catch (error) {
    console.error("[responsibility] lookup failed", error);
    return NextResponse.json({ ok: false, error: "lookup_failed" }, { status: 500 });
  } finally {
    await session.close();
  }
}
