import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/chat/route";

describe("route-bound companion AI transparency", () => {
  it("returns a machine-readable unreviewed AI classification without provider or prompt data", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: "Ordne die offenen Fragen ein.",
          context: {
            kind: "dossier",
            title: "Kommunaler Wärmeplan",
            routePath: "/dossier/demo",
          },
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.companion.aiTransparency).toMatchObject({
      status: "ai_generated_unreviewed",
      contentKind: "text",
      visibleLabelKey: "ai_generated_unreviewed",
      humanReviewed: false,
      editoriallyApproved: false,
      publishable: false,
      machineReadableProvenance: {
        safeTrace: "supported",
        c2pa: "unsupported",
        iptc: "unsupported",
        xmp: "unsupported",
      },
    });
    const serialized = JSON.stringify(body.companion.aiTransparency);
    expect(serialized).not.toMatch(/provider|prompt|secret|token|chain.of.thought/i);
  });
});
