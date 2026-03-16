import { getPiiProfile } from "@core/pii/userProfileService";
import { assertStoreConfigured, ObjectId, getCol } from "@core/db/triMongo";
import { TOPIC_CHOICES, type TopicKey } from "@features/interests/topics";

export const MIN_INTEREST_COUNT = 3;

const TOPIC_KEYS = new Set(TOPIC_CHOICES.map((topic) => topic.key));
const TOPIC_LABEL_TO_KEY = new Map(
  TOPIC_CHOICES.map((topic) => [topic.label.trim().toLowerCase(), topic.key] as const),
);

export type UserPreferenceSnapshot = {
  version: 1;
  generatedAt: string;
  interests: {
    keys: TopicKey[];
    count: number;
    minimumMet: boolean;
  };
  location: {
    city: string | null;
    postalCode: string | null;
    region: string | null;
    countryCode: string | null;
    hasLocation: boolean;
  };
  display: {
    mode: "real_name" | "nickname";
    showRealName: boolean;
    showCity: boolean;
    roleHints: string[];
  };
  onboarding: {
    registered: boolean;
    founderFriendRequestSent: boolean;
    founderWelcomeMessageSent: boolean;
    interestsCompleted: boolean;
    locationCompleted: boolean;
    personalizedReady: boolean;
  };
};

export type PreferenceTransitionState = {
  interestsCompletedNow: boolean;
  locationCompletedNow: boolean;
  personalizedReadyNow: boolean;
};

type UserProfileDoc = {
  _id: ObjectId;
  role?: string | null;
  roles?: Array<string | { role?: string | null }> | null;
  profile?: {
    topTopics?: Array<{ key?: string | null; title?: string | null } | string> | null;
    publicLocation?: {
      city?: string | null;
      region?: string | null;
      countryCode?: string | null;
    } | null;
    publicFlags?: {
      showRealName?: boolean;
      showCity?: boolean;
    } | null;
    identity?: {
      displayMode?: "real_name" | "nickname" | null;
    } | null;
    onboarding?: {
      registeredAt?: string | Date | null;
      founderFriendRequestSentAt?: string | Date | null;
      founderWelcomeMessageSentAt?: string | Date | null;
      interestsCompletedAt?: string | Date | null;
      locationCompletedAt?: string | Date | null;
      firstPersonalizedFeedReadyAt?: string | Date | null;
    } | null;
    referrals?: {
      successfulInvites?: number | null;
    } | null;
    preferenceSnapshot?: UserPreferenceSnapshot | null;
  } | null;
};

export type PersonalizedContentCandidate = {
  id: string;
  topic?: string | null;
  topicTags?: string[] | null;
  level?: string | null;
  createdAt?: string | Date | null;
  importance?: number | null;
  editorialPriority?: "high" | "normal" | "low" | number | null;
  socialSignals?: {
    interactions?: number | null;
    friendsInvolved?: number | null;
  } | null;
};

export type ContentPersonalizationScore = {
  totalScore: number;
  interestMatchScore: number;
  locationMatchScore: number;
  freshnessScore: number;
  socialRelevanceScore: number;
  editorialPriorityScore: number;
  matchedInterestKeys: TopicKey[];
};

function normalizeText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeTopicKey(value: unknown): TopicKey | null {
  const raw = normalizeText(value).toLowerCase();
  if (!raw) return null;
  if (TOPIC_KEYS.has(raw as TopicKey)) return raw as TopicKey;
  if (TOPIC_LABEL_TO_KEY.has(raw)) return TOPIC_LABEL_TO_KEY.get(raw) ?? null;

  if (raw.includes("demokra") || raw.includes("wahl")) return "democracy";
  if (raw.includes("haushalt") || raw.includes("finanz")) return "budget";
  if (raw.includes("wirtschaft") || raw.includes("arbeit")) return "economy";
  if (raw.includes("sozial") || raw.includes("famil")) return "social";
  if (raw.includes("bildung") || raw.includes("forschung")) return "education";
  if (raw.includes("gesund")) return "health";
  if (raw.includes("klima") || raw.includes("umwelt")) return "climate";
  if (raw.includes("energie")) return "energy";
  if (raw.includes("mobil") || raw.includes("verkehr") || raw.includes("stadt")) return "mobility";
  if (raw.includes("inner") || raw.includes("sicherheit")) return "interior";
  if (raw.includes("justiz") || raw.includes("recht")) return "justice";
  if (raw.includes("migration") || raw.includes("integration")) return "migration";
  if (raw.includes("digital") || raw.includes("medien")) return "digital";
  if (raw.includes("europa") || raw.includes("außen")) return "europe";
  if (raw.includes("kommun") || raw.includes("lebensumfeld")) return "local";
  return null;
}

function extractInterestKeys(doc: UserProfileDoc): TopicKey[] {
  const entries = Array.isArray(doc.profile?.topTopics) ? doc.profile?.topTopics : [];
  const result: TopicKey[] = [];
  const seen = new Set<TopicKey>();
  for (const entry of entries ?? []) {
    const key =
      typeof entry === "string"
        ? normalizeTopicKey(entry)
        : normalizeTopicKey(entry?.key) ?? normalizeTopicKey(entry?.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(key);
  }
  return result;
}

function normalizeRole(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value.trim().toLowerCase();
  if (typeof value === "object" && value && "role" in (value as Record<string, unknown>)) {
    const role = (value as Record<string, unknown>).role;
    return typeof role === "string" ? role.trim().toLowerCase() : "";
  }
  return "";
}

function extractRoleHints(doc: UserProfileDoc): string[] {
  const values = [
    normalizeRole(doc.role),
    ...(Array.isArray(doc.roles) ? doc.roles.map((entry) => normalizeRole(entry)) : []),
  ].filter(Boolean);
  const out = new Set<string>();
  for (const value of values) {
    if (["journalist", "presse", "media"].includes(value)) out.add("journalist");
    else if (["admin", "superadmin", "staff", "moderator", "verwaltung"].includes(value)) out.add("administration");
    else if (["aktivist", "initiator", "organizer"].includes(value)) out.add("activist");
    else if (["creator", "author"].includes(value)) out.add("creator");
    else out.add("citizen");
  }
  if (out.size === 0) out.add("citizen");
  return Array.from(out);
}

function toIsoDate(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizedCountryCode(value: unknown) {
  const text = normalizeText(value);
  if (!text) return null;
  return text.toUpperCase().slice(0, 8);
}

export function buildUserPreferenceSnapshot(
  user: UserProfileDoc,
  piiProfile?: any | null,
): UserPreferenceSnapshot {
  const interestKeys = extractInterestKeys(user);
  const publicLocation = user.profile?.publicLocation ?? null;
  const piiAddress = piiProfile?.address ?? null;
  const location = {
    city: normalizeText(publicLocation?.city) || normalizeText(piiAddress?.city) || null,
    postalCode: normalizeText(piiAddress?.postalCode) || null,
    region: normalizeText(publicLocation?.region) || null,
    countryCode:
      normalizedCountryCode(publicLocation?.countryCode) ||
      normalizedCountryCode(piiAddress?.country),
    hasLocation: false,
  };
  location.hasLocation = Boolean(location.city || location.region || location.countryCode);

  const onboarding = user.profile?.onboarding ?? null;
  const interestsCompleted = interestKeys.length >= MIN_INTEREST_COUNT || Boolean(onboarding?.interestsCompletedAt);
  const locationCompleted = location.hasLocation || Boolean(onboarding?.locationCompletedAt);
  const personalizedReady = interestsCompleted && locationCompleted;

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    interests: {
      keys: interestKeys,
      count: interestKeys.length,
      minimumMet: interestKeys.length >= MIN_INTEREST_COUNT,
    },
    location,
    display: {
      mode: user.profile?.identity?.displayMode === "nickname" ? "nickname" : "real_name",
      showRealName: Boolean(user.profile?.publicFlags?.showRealName),
      showCity: Boolean(user.profile?.publicFlags?.showCity),
      roleHints: extractRoleHints(user),
    },
    onboarding: {
      registered: Boolean(onboarding?.registeredAt),
      founderFriendRequestSent: Boolean(onboarding?.founderFriendRequestSentAt),
      founderWelcomeMessageSent: Boolean(onboarding?.founderWelcomeMessageSentAt),
      interestsCompleted,
      locationCompleted,
      personalizedReady,
    },
  };
}

export async function getUserPreferenceSnapshot(userId: string): Promise<UserPreferenceSnapshot | null> {
  assertStoreConfigured("core", "onboarding/preferenceSnapshot.getUserPreferenceSnapshot");
  if (!ObjectId.isValid(userId)) return null;
  const users = await getCol<UserProfileDoc>("users");
  const user = await users.findOne(
    { _id: new ObjectId(userId) },
    {
      projection: {
        role: 1,
        roles: 1,
        profile: 1,
      },
    },
  );
  if (!user) return null;
  const existing = user.profile?.preferenceSnapshot;
  if (existing?.version === 1) return existing;
  const pii = await getPiiProfile(user._id);
  return buildUserPreferenceSnapshot(user, pii);
}

export async function refreshUserPreferenceSnapshot(userId: string | ObjectId) {
  assertStoreConfigured("core", "onboarding/preferenceSnapshot.refreshUserPreferenceSnapshot");
  const oid =
    typeof userId === "string"
      ? ObjectId.isValid(userId)
        ? new ObjectId(userId)
        : null
      : userId;
  if (!oid) {
    return {
      snapshot: null,
      transitions: {
        interestsCompletedNow: false,
        locationCompletedNow: false,
        personalizedReadyNow: false,
      } satisfies PreferenceTransitionState,
    };
  }

  const users = await getCol<UserProfileDoc>("users");
  const user = await users.findOne(
    { _id: oid },
    {
      projection: {
        role: 1,
        roles: 1,
        profile: 1,
      },
    },
  );
  if (!user) {
    return {
      snapshot: null,
      transitions: {
        interestsCompletedNow: false,
        locationCompletedNow: false,
        personalizedReadyNow: false,
      } satisfies PreferenceTransitionState,
    };
  }

  const pii = await getPiiProfile(oid);
  const snapshot = buildUserPreferenceSnapshot(user, pii);
  const now = new Date();
  const setOps: Record<string, unknown> = {
    "profile.preferenceSnapshot": snapshot,
    updatedAt: now,
  };
  const transitions: PreferenceTransitionState = {
    interestsCompletedNow: false,
    locationCompletedNow: false,
    personalizedReadyNow: false,
  };
  const onboarding = user.profile?.onboarding ?? null;

  if (snapshot.onboarding.interestsCompleted && !toIsoDate(onboarding?.interestsCompletedAt)) {
    setOps["profile.onboarding.interestsCompletedAt"] = now;
    transitions.interestsCompletedNow = true;
  }
  if (snapshot.onboarding.locationCompleted && !toIsoDate(onboarding?.locationCompletedAt)) {
    setOps["profile.onboarding.locationCompletedAt"] = now;
    transitions.locationCompletedNow = true;
  }
  if (snapshot.onboarding.personalizedReady && !toIsoDate(onboarding?.firstPersonalizedFeedReadyAt)) {
    setOps["profile.onboarding.firstPersonalizedFeedReadyAt"] = now;
    transitions.personalizedReadyNow = true;
  }

  await users.updateOne({ _id: oid }, { $set: setOps });

  return { snapshot, transitions };
}

function clampScore(value: number) {
  return Math.max(0, Math.min(1, value));
}

function normalizeLevel(level?: string | null) {
  const value = normalizeText(level).toLowerCase();
  if (!value) return "bund";
  if (value.includes("kommune") || value.includes("stadt") || value.includes("gemeinde")) return "kommune";
  if (value.includes("land")) return "land";
  if (value.includes("eu")) return "eu";
  return "bund";
}

function toDate(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function scoreContentForUser(
  preferences: UserPreferenceSnapshot,
  item: PersonalizedContentCandidate,
): ContentPersonalizationScore {
  const userInterestSet = new Set(preferences.interests.keys);
  const candidateRawTopics = new Set<string>();
  if (item.topic) candidateRawTopics.add(item.topic);
  for (const tag of item.topicTags ?? []) {
    if (typeof tag === "string" && tag.trim()) candidateRawTopics.add(tag);
  }
  const matchedInterestKeys = Array.from(candidateRawTopics)
    .map((value) => normalizeTopicKey(value))
    .filter((value): value is TopicKey => Boolean(value))
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .filter((value) => userInterestSet.has(value));

  let interestMatchScore = 0.1;
  if (userInterestSet.size === 0) interestMatchScore = 0.35;
  else if (matchedInterestKeys.length > 0) {
    interestMatchScore = clampScore(0.65 + (matchedInterestKeys.length - 1) * 0.15);
  }

  const level = normalizeLevel(item.level);
  let locationMatchScore = 0.25;
  if (preferences.location.hasLocation) {
    if (level === "kommune") locationMatchScore = preferences.location.city ? 1 : 0.45;
    else if (level === "land") locationMatchScore = preferences.location.region ? 0.85 : 0.45;
    else if (level === "bund") locationMatchScore = preferences.location.countryCode ? 0.72 : 0.4;
    else if (level === "eu") locationMatchScore = 0.58;
  }

  const createdAt = toDate(item.createdAt);
  const ageMs = createdAt ? Math.max(0, Date.now() - createdAt.getTime()) : null;
  const ageDays = ageMs === null ? null : ageMs / (1000 * 60 * 60 * 24);
  let freshnessScore = 0.35;
  if (ageDays !== null) {
    if (ageDays <= 1) freshnessScore = 1;
    else if (ageDays <= 3) freshnessScore = 0.9;
    else if (ageDays <= 7) freshnessScore = 0.75;
    else if (ageDays <= 14) freshnessScore = 0.58;
    else if (ageDays <= 30) freshnessScore = 0.38;
    else freshnessScore = 0.2;
  }

  let socialRelevanceScore = preferences.onboarding.founderWelcomeMessageSent ? 0.42 : 0.25;
  const interactions = Number(item.socialSignals?.interactions ?? 0) || 0;
  const friendsInvolved = Number(item.socialSignals?.friendsInvolved ?? 0) || 0;
  if (interactions > 0 || friendsInvolved > 0) {
    socialRelevanceScore = clampScore(socialRelevanceScore + Math.min(0.4, interactions * 0.03 + friendsInvolved * 0.1));
  }

  let editorialPriorityScore = 0.55;
  if (typeof item.editorialPriority === "number") {
    editorialPriorityScore = clampScore(item.editorialPriority);
  } else if (item.editorialPriority === "high") {
    editorialPriorityScore = 1;
  } else if (item.editorialPriority === "low") {
    editorialPriorityScore = 0.3;
  } else if (typeof item.importance === "number") {
    editorialPriorityScore = clampScore(item.importance / 5);
  }

  const totalScore = clampScore(
    interestMatchScore * 0.38 +
      locationMatchScore * 0.22 +
      freshnessScore * 0.2 +
      socialRelevanceScore * 0.1 +
      editorialPriorityScore * 0.1,
  );

  return {
    totalScore,
    interestMatchScore,
    locationMatchScore,
    freshnessScore,
    socialRelevanceScore,
    editorialPriorityScore,
    matchedInterestKeys,
  };
}

export function getPersonalizedStartItems<T extends PersonalizedContentCandidate>(
  preferences: UserPreferenceSnapshot,
  items: T[],
  limit = items.length,
) {
  const ranked = items
    .map((item) => ({ item, score: scoreContentForUser(preferences, item) }))
    .sort((a, b) => b.score.totalScore - a.score.totalScore);
  return ranked.slice(0, Math.max(1, limit));
}
