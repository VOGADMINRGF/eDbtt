import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  createInMemoryParticipationSignalReviewRuntimeRepo,
  getParticipationSignalReviewRuntimeRepo,
  setParticipationSignalReviewRuntimeRepoForTests,
} from "@features/region";

const mocks = vi.hoisted(() => ({
  buildRuntime: vi.fn(),
  insertOne: vi.fn(),
}));

vi.mock("@features/stream/publicRuntime", () => ({
  buildStreamPublicRuntime: (...args: unknown[]) => mocks.buildRuntime(...args),
}));

vi.mock("@features/stream/db", () => ({
  streamPublicInputsCol: async () => ({
    insertOne: (...args: unknown[]) => mocks.insertOne(...args),
  }),
}));

import { POST } from "@/app/api/stream/public-input/route";

function buildRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/stream/public-input", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("event input review-first contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setParticipationSignalReviewRuntimeRepoForTests(
      createInMemoryParticipationSignalReviewRuntimeRepo(),
    );
    mocks.insertOne.mockResolvedValue({ acknowledged: true });
    mocks.buildRuntime.mockResolvedValue({
      session: {
        id: "65f000000000000000000901",
        slugOrId: "stadtwerke-live-berlin",
        title: "Livestream Stadtwerke Berlin",
        description: "Öffentliche Energierunde",
        topicKey: "energie-berlin",
        regionCode: "berlin",
        resolvedStatus: "collecting_input",
      },
      context: {
        anlassraumId: "65f000000000000000000401",
        anlassraumTitle: "Anlassraum Energie Berlin",
        dossierId: "65f000000000000000000777",
      },
      participation: {
        openForInput: true,
      },
    });
  });

  it("stores event option inputs as review-first signals without auto-publication or silent dossier publish", async () => {
    const res = await POST(
      buildRequest({
        streamId: "65f000000000000000000901",
        kind: "option",
        text: "Bitte einen zusätzlichen Werkstatttermin nach dem Event prüfen.",
      }),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({
      ok: true,
      input: {
        kind: "option",
        reviewState: "needs_review",
        visibilityState: "internal_review",
        noAutoPublish: true,
        noAutoDossierUpdate: true,
      },
    });

    expect(mocks.insertOne).toHaveBeenCalledTimes(1);
    const inserted = mocks.insertOne.mock.calls[0]?.[0];
    expect(inserted).toMatchObject({
      origin: "stream",
      kind: "option",
      reviewState: "needs_review",
      visibilityState: "internal_review",
    });

    const record = await getParticipationSignalReviewRuntimeRepo().getParticipationSignalRecordById(
      body.input.id,
    );
    expect(record).toMatchObject({
      relatedAnlassraumIds: ["65f000000000000000000401"],
      relatedDossierIds: ["65f000000000000000000777"],
      reviewStatus: "needs_review",
      visibilityState: "internal_review",
      noAutoPublish: true,
      noAutoCreateDossier: true,
      noAutoCreateAnlassraum: true,
    });
  });
});
