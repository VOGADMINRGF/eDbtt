import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as postDemoVote } from "@/app/api/demo/vote/route";
import { POST as postDossierVote } from "@/app/api/dossier/[id]/vote/route";

describe("dossier vote route isolation", () => {
  it("accepts explicit demo votes only inside the demo runtime context", async () => {
    const response = await postDemoVote(
      new NextRequest("http://localhost/api/demo/vote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          dossierId: "demo-innencity-2026",
          optionId: "option-a",
          runtimeContext: "demo",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      dossierId: "demo-innencity-2026",
    });
  });

  it("rejects demo vote calls without an explicit demo dossier id", async () => {
    const response = await postDemoVote(
      new NextRequest("http://localhost/api/demo/vote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          optionId: "option-a",
          runtimeContext: "demo",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "dossierId_missing",
    });
  });

  it("rejects real dossiers on the demo vote route", async () => {
    const response = await postDemoVote(
      new NextRequest("http://localhost/api/demo/vote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          dossierId: "dossier-42",
          optionId: "option-a",
          runtimeContext: "demo",
        }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "demo_context_required",
    });
  });

  it("fails closed for real dossier votes while preserving retry information", async () => {
    const response = await postDossierVote(
      new NextRequest("http://localhost/api/dossier/dossier-42/vote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ optionId: "option-b" }),
      }),
      { params: Promise.resolve({ id: "dossier-42" }) },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "vote_runtime_unavailable",
      dossierId: "dossier-42",
      retryable: true,
    });
  });

  it("keeps explicit demo dossiers off the real vote route", async () => {
    const response = await postDossierVote(
      new NextRequest("http://localhost/api/dossier/demo-innencity-2026/vote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ optionId: "option-b" }),
      }),
      { params: Promise.resolve({ id: "demo-innencity-2026" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "use_demo_vote_route",
    });
  });
});
