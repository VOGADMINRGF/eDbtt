import { NextResponse } from "next/server";
import { assertStoreConfigured, ObjectId, coreCol } from "@core/db/triMongo";
import { TOPIC_CHOICES, type TopicKey } from "@features/interests/topics";
import { readSession } from "@/utils/session";
import {
  deriveMessagingCapability,
  idCandidates,
  normalizeId,
  pairFilter,
  summarizePairState,
  type SocialRelationshipState,
} from "@/lib/social/relationshipState";

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

type SocialFriendRequestDoc = {
  _id: ObjectId;
  fromUserId?: string | ObjectId | null;
  toUserId?: string | ObjectId | null;
  status?: string | null;
};

type OriginContext = {
  type: "interest_match" | "dossier" | "topic_round" | "regional_group" | "founder" | "system";
  topicKey?: string | null;
  topicLabel?: string | null;
  dossierId?: string | null;
  dossierTitle?: string | null;
  regionKey?: string | null;
  regionLabel?: string | null;
  communityKey?: string | null;
  communityLabel?: string | null;
  scope?: "regional" | "ueberregional" | null;
  reasonLabel?: string | null;
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/gi, "-")
    .replace(/^-+|-+$/g, "");
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

  const requestsCol = await coreCol<SocialFriendRequestDoc>("social_friend_requests");
  const currentUserIds = idCandidates(userId);
  const candidateIds = candidateDocs.flatMap((candidate) => idCandidates(String(candidate._id)));
  const pairDocs =
    candidateIds.length > 0
      ? await requestsCol.find(pairFilter(currentUserIds, candidateIds)).sort({ _id: -1 }).limit(220).toArray()
      : [];
  const currentUserSet = new Set(currentUserIds.map((candidate) => normalizeId(candidate)));

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
      const candidateId = String(candidate._id);
      const sharedTopicLabel = TOPIC_LABEL.get(sharedKeys[0]) ?? sharedKeys[0] ?? null;
      const regionLabel = city || region || null;
      const regionKey = regionLabel ? slugify(regionLabel) : null;
      const communityLabel = sharedTopicLabel
        ? regionLabel
          ? `${sharedTopicLabel} · ${regionLabel}`
          : `${sharedTopicLabel} überregional`
        : regionLabel
          ? `Region ${regionLabel}`
          : null;
      const originContext: OriginContext = {
        type: regionLabel ? "regional_group" : "interest_match",
        topicKey: sharedKeys[0] ?? null,
        topicLabel: sharedTopicLabel,
        dossierId: null,
        dossierTitle: null,
        regionKey,
        regionLabel,
        communityKey: communityLabel ? slugify(communityLabel) : null,
        communityLabel,
        scope: regionLabel ? "regional" : "ueberregional",
        reasonLabel: sharedTopicLabel
          ? regionLabel
            ? `Gemeinsam über ${sharedTopicLabel} in ${regionLabel}`
            : `Gemeinsames Thema ${sharedTopicLabel}`
          : "Interessenmatch",
      };
      const candidateIdSet = new Set(idCandidates(candidateId).map((entry) => normalizeId(entry)));
      const candidatePairDocs = pairDocs.filter((doc) => {
        const fromId = normalizeId(doc.fromUserId);
        const toId = normalizeId(doc.toUserId);
        const outgoing = currentUserSet.has(fromId) && candidateIdSet.has(toId);
        const incoming = candidateIdSet.has(fromId) && currentUserSet.has(toId);
        return outgoing || incoming;
      });
      const pairState = summarizePairState(candidatePairDocs, userId, candidateId);
      const relation = deriveMessagingCapability({
        pairState,
        currentUserId: userId,
        targetUserId: candidateId,
        targetKnown: true,
      });
      const incomingRequestId = pairState.incomingPending?._id ? String(pairState.incomingPending._id) : null;
      const outgoingRequestId = pairState.outgoingPending?._id ? String(pairState.outgoingPending._id) : null;

      return {
        id: candidateId,
        displayName,
        sharedTopics: sharedKeys.map((key) => TOPIC_LABEL.get(key) ?? key),
        locationLabel: city || region || null,
        score,
        avatarUrl: clean(candidate.profile?.avatarUrl) || null,
        shareId: clean(candidate.profile?.publicShareId) || null,
        relationshipState: relation.relationshipState as SocialRelationshipState,
        canMessage: relation.canMessage,
        incomingRequestId,
        outgoingRequestId,
        originContext,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  return NextResponse.json({ ok: true, matches });
}
