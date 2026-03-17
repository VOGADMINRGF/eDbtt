import { NextResponse } from "next/server";
import { assertStoreConfigured, ObjectId, coreCol } from "@core/db/triMongo";
import { TOPIC_CHOICES, type TopicKey } from "@features/interests/topics";
import { readSession } from "@/utils/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PublicLocation = {
  city?: string | null;
  region?: string | null;
};

type UserDoc = {
  _id: ObjectId;
  name?: string | null;
  email?: string | null;
  profile?: {
    displayName?: string | null;
    avatarUrl?: string | null;
    publicShareId?: string | null;
    topTopics?: Array<{ key?: string | null }>;
    publicLocation?: PublicLocation | null;
  } | null;
};

const TOPIC_LABEL = new Map(TOPIC_CHOICES.map((topic) => [topic.key, topic.label]));

function normalizeTopicKeys(input?: Array<{ key?: string | null }> | null): TopicKey[] {
  if (!Array.isArray(input)) return [];
  const keys = input
    .map((entry) => String(entry?.key ?? "").trim().toLowerCase())
    .filter((value): value is TopicKey => TOPIC_LABEL.has(value as TopicKey));
  return Array.from(new Set(keys));
}

function clean(value?: string | null) {
  return String(value ?? "").trim();
}

export async function GET() {
  assertStoreConfigured("core", "api/account/matches");
  const session = await readSession();
  const userId = session?.uid ?? null;
  if (!userId || !ObjectId.isValid(userId)) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const usersCol = await coreCol<UserDoc>("users");
  const me = await usersCol.findOne(
    { _id: new ObjectId(userId) },
    {
      projection: {
        "profile.topTopics": 1,
        "profile.publicLocation.city": 1,
        "profile.publicLocation.region": 1,
      },
    },
  );
  if (!me?._id) {
    return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });
  }

  const myTopicKeys = normalizeTopicKeys(me.profile?.topTopics);
  if (myTopicKeys.length === 0) {
    return NextResponse.json({ ok: true, matches: [] });
  }

  const myCity = clean(me.profile?.publicLocation?.city).toLowerCase();
  const myRegion = clean(me.profile?.publicLocation?.region).toLowerCase();

  const candidateDocs = await usersCol
    .find(
      {
        _id: { $ne: new ObjectId(userId) },
        "profile.topTopics.key": { $in: myTopicKeys },
      },
      {
        projection: {
          name: 1,
          email: 1,
          "profile.displayName": 1,
          "profile.avatarUrl": 1,
          "profile.publicShareId": 1,
          "profile.topTopics": 1,
          "profile.publicLocation.city": 1,
          "profile.publicLocation.region": 1,
        },
      },
    )
    .limit(80)
    .toArray();

  const matches = candidateDocs
    .map((candidate) => {
      const topicKeys = normalizeTopicKeys(candidate.profile?.topTopics);
      const sharedKeys = topicKeys.filter((key) => myTopicKeys.includes(key));
      if (sharedKeys.length === 0) return null;

      const city = clean(candidate.profile?.publicLocation?.city);
      const region = clean(candidate.profile?.publicLocation?.region);
      const cityMatch = myCity.length > 0 && city.toLowerCase() === myCity;
      const regionMatch = myRegion.length > 0 && region.toLowerCase() === myRegion;
      const score = sharedKeys.length * 8 + (cityMatch ? 4 : 0) + (regionMatch ? 2 : 0);

      const displayName =
        clean(candidate.profile?.displayName) || clean(candidate.name) || clean(candidate.email) || "Mitglied";

      return {
        id: String(candidate._id),
        displayName,
        sharedTopics: sharedKeys.map((key) => TOPIC_LABEL.get(key) ?? key),
        locationLabel: city || region || null,
        score,
        avatarUrl: clean(candidate.profile?.avatarUrl) || null,
        shareId: clean(candidate.profile?.publicShareId) || null,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  return NextResponse.json({ ok: true, matches });
}
