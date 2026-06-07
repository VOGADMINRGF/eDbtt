import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { GET, POST } from "@/app/api/chat/route";

function postReq(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/chat route-bound companion", () => {
  it("rejects global chat GET access", async () => {
    const res = await GET();
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("global_chat_disabled");
  });

  it("rejects invalid payload without context", async () => {
    const res = await POST(postReq({ message: "Hallo" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("invalid_input");
  });

  it("returns standard-lane dossier companion without implicit verification", async () => {
    const res = await POST(
      postReq({
        message: "Welche Konfliktlinie ist am wichtigsten?",
        context: {
          kind: "dossier",
          title: "Bildungsdossier",
          parentStatus: {
            verificationMode: "sealed",
            researchUsed: "deep_search",
            sealEligible: true,
            sealGranted: true,
          },
        },
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.companion.lane).toBe("standard");
    expect(body.companion.journeyProfile).toBe("media");
    expect(body.companion.researchUsed).toBe("none");
    expect(body.companion.sealEligible).toBe(false);
    expect(body.companion.sealGranted).toBe(false);
    expect(body.companion.verificationLabel).not.toBe("verifiziert");
    expect(body.companion.verificationLabelDisplay).toBe("Analyse-Entwurf");
  });

  it("returns sealed factcheck companion with correct sealed defaults", async () => {
    const res = await POST(
      postReq({
        message: "Welche Quelle fehlt noch?",
        context: {
          kind: "factcheck",
          parentStatus: {
            status: "queued",
          },
        },
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.companion.lane).toBe("sealed_factcheck");
    expect(body.companion.journeyProfile).toBe("sealed_factcheck");
    expect(body.companion.verificationMode).toBe("sealed");
    expect(body.companion.researchUsed).toBe("search");
    expect(body.companion.sealEligible).toBe(true);
    expect(body.companion.sealGranted).toBe(false);
    expect(body.companion.verificationLabel).toBe("analysiert");
    expect(body.companion.verificationLabelDisplay).toBe("Quellenprüfung angefragt");
    expect(body.companion.noTruthPromotion).toBe(true);
    expect(body.companion.noAutoGraphPromotion).toBe(true);
  });

  it("runs optional presentation pass without changing verification contract", async () => {
    const res = await POST(
      postReq({
        message: "Bitte   knapp zusammenfassen!!!",
        presentationPass: true,
        context: {
          kind: "factcheck",
          parentStatus: {
            status: "in_progress",
          },
        },
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(typeof body.companion.tonePassUsed).toBe("boolean");
    expect(body.companion.presentationPass).toBeTruthy();
    expect(body.companion.lane).toBe("sealed_factcheck");
    expect(body.companion.verificationMode).toBe("sealed");
    expect(body.companion.researchUsed).toBe("search");
    expect(body.companion.sealEligible).toBe(true);
    expect(body.companion.sealGranted).toBe(false);
  });
});
