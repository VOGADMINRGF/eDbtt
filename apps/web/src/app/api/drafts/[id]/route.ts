import { NextResponse } from "next/server";
import { patchDraft, getDraft } from "@/server/draftStore";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const doc = await getDraft(params.id);
  return NextResponse.json(doc ?? { error: "not_found" }, { status: doc ? 200 : 404 });
}
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const res = await patchDraft(params.id, body);
  return NextResponse.json(res);
}
