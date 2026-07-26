import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOURCE_URL =
  "https://raw.githubusercontent.com/VOGADMINRGF/edebatte-org/docs/marketing-growth-os-foundation-01/docs/E150/OpenTasks.md";

export async function GET() {
  const response = await fetch(SOURCE_URL, {
    cache: "no-store",
    headers: {
      Accept: "text/plain; charset=utf-8",
    },
  });

  if (!response.ok) {
    return NextResponse.json(
      {
        error: "opentasks_export_unavailable",
        status: response.status,
      },
      { status: 502 },
    );
  }

  const content = await response.text();

  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
