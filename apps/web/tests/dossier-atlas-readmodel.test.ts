import { describe, expect, it } from "vitest";
import { ObjectId } from "@core/db/triMongo";
import { mapAtlasSourceRecords } from "@features/anlassraum/dossierAtlasReadModel";

describe("dossier atlas readmodel mapper", () => {
  it("maps round seeds to atlas source records with lifecycle, work state and context groups", () => {
    const roomId = new ObjectId();
    const roundId = new ObjectId();

    const records = mapAtlasSourceRecords({
      roundSeeds: [
        {
          _id: roundId,
          anlassraumId: roomId,
          status: "review",
          targetAudience: "Lokale Mobilität",
          publishTarget: "/companion/verkehrs-check",
        },
      ],
      roomById: new Map([
        [
          roomId.toHexString(),
          {
            _id: roomId,
            title: "Sichere Schulwege",
            topicKey: "mobilitaet",
            regionKey: "berlin",
            regionCode: "DE-BE",
            status: "active",
            ownerType: "media",
            roomType: "editorial",
            sourceMode: "single_source",
          },
        ],
      ]),
    });

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      title: "Sichere Schulwege",
      topicKey: "mobilitaet",
      topicLabel: "Mobilitaet",
      regionKey: "berlin",
      regionCode: "DE-BE",
      anlassId: roomId.toHexString(),
      roundId: roundId.toHexString(),
      lifecycle: "active",
      activityBand: "medium",
      workState: "review",
      companionId: "verkehrs-check",
    });
    expect(records[0]?.contextGroups).toEqual(["editorial_publisher", "expert_voice"]);
  });

  it("keeps degraded values non-crashing and derives fallback result IDs for completed states", () => {
    const publishedRoundId = new ObjectId();

    const records = mapAtlasSourceRecords({
      roundSeeds: [
        {
          _id: publishedRoundId,
          status: "published",
          targetAudience: "Wärmenetz",
        },
        {
          status: "draft",
          targetAudience: "",
        },
      ],
      roomById: new Map(),
    });

    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      title: "Wärmenetz",
      lifecycle: "unknown",
      activityBand: "high",
      workState: "completed",
    });
    expect(records[0]?.resultId).toContain(`result-${publishedRoundId.toHexString()}`);

    expect(records[1]).toMatchObject({
      title: "Anlass 2",
      lifecycle: "unknown",
      activityBand: "low",
      workState: "monitoring",
      resultId: null,
    });
  });

  it("keeps dossier linkage stable when one dossier references multiple anlassraeume", () => {
    const dossierId = new ObjectId();
    const roomA = new ObjectId();
    const roomB = new ObjectId();

    const records = mapAtlasSourceRecords({
      roundSeeds: [
        { _id: new ObjectId(), anlassraumId: roomA, status: "ready" },
        { _id: new ObjectId(), anlassraumId: roomB, status: "review" },
      ],
      roomById: new Map([
        [
          roomA.toHexString(),
          {
            _id: roomA,
            title: "Anlass A",
            topicKey: "mobilitaet",
            dossierId,
            status: "active",
          },
        ],
        [
          roomB.toHexString(),
          {
            _id: roomB,
            title: "Anlass B",
            topicKey: "mobilitaet",
            dossierId,
            status: "active",
          },
        ],
      ]),
    });

    expect(records).toHaveLength(2);
    expect(records[0]?.dossierId).toBe(dossierId.toHexString());
    expect(records[1]?.dossierId).toBe(dossierId.toHexString());
    expect(records[0]?.anlassId).not.toBe(records[1]?.anlassId);
  });
});
