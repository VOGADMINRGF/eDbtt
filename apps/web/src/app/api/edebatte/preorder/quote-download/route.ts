import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function firstString(value: string | null) {
  return (value || "").trim();
}

function sanitizeFilename(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!normalized) return "edebatte-kostenvoranschlag.txt";
  return normalized.endsWith(".txt") ? normalized : `${normalized}.txt`;
}

export async function GET(req: NextRequest) {
  const encodedQuote = firstString(req.nextUrl.searchParams.get("quote"));
  if (!encodedQuote) {
    return NextResponse.json({ ok: false, error: "missing_quote" }, { status: 400 });
  }

  let decoded = "";
  try {
    decoded = Buffer.from(encodedQuote, "base64url").toString("utf8");
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_quote" }, { status: 400 });
  }

  if (!decoded || decoded.length > 30_000) {
    return NextResponse.json({ ok: false, error: "invalid_quote" }, { status: 400 });
  }

  const filename = sanitizeFilename(firstString(req.nextUrl.searchParams.get("name")));

  return new Response(decoded, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
