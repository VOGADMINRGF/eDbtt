import { NextResponse } from "next/server";
import { createContentHash } from "@features/dossier/infra/snapshot";
import { verifyPayload } from "@features/dossier/infra/signer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VerifyBody = {
  content?: unknown;
  contentHash?: string;
  signature?: string;
  publicKey?: string;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as VerifyBody;
  const signature = body.signature?.trim();
  const publicKey = body.publicKey?.trim();
  if (!signature || !publicKey) {
    return NextResponse.json({ ok: false, error: "missing_signature_or_key" }, { status: 400 });
  }

  const payloadHash = body.contentHash ?? (body.content ? createContentHash(body.content) : null);
  if (!payloadHash) {
    return NextResponse.json({ ok: false, error: "missing_content" }, { status: 400 });
  }

  const valid = verifyPayload(payloadHash, signature, publicKey);
  return NextResponse.json(
    {
      ok: true,
      valid,
      contentHash: payloadHash,
    },
    { status: 200 },
  );
}
