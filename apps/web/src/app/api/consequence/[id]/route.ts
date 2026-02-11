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
  const consequenceId = id?.trim();
  if (!consequenceId) {
    return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  }

  const session = driver.session();
  try {
    const res = await session.run(
      `
      MATCH (c:Consequence {id: $id})
      OPTIONAL MATCH (s:Statement)-[:HAS_CONSEQUENCE]->(c)
      RETURN c, collect(DISTINCT s) AS statements
      `,
      { id: consequenceId },
    );
    if (!res.records.length) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    const record = res.records[0];
    const consequence = toProps(record.get("c"));
    const statements = (record.get("statements") as any[] | undefined)?.map(toProps) ?? [];

    return NextResponse.json({ ok: true, consequence, statements });
  } catch (error) {
    console.error("[consequence] lookup failed", error);
    return NextResponse.json({ ok: false, error: "lookup_failed" }, { status: 500 });
  } finally {
    await session.close();
  }
}
