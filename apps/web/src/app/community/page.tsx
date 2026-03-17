import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { assertStoreConfigured, ObjectId, coreCol } from "@core/db/triMongo";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from "@/config/locales";
import { readSession } from "@/utils/session";
import { feedStatementsCol } from "@features/feeds/db";
import { dossiersCol } from "@features/dossier/db";
import {
  deriveMessagingCapability,
  idCandidates,
  normalizeId,
  pairFilter,
  summarizePairState,
  type SocialRelationshipState,
} from "@/lib/social/relationshipState";

export const metadata: Metadata = {
  title: "Community",
  description: "Raeume und Austausch für sachliche Debatten, Moderation und Themenarbeit.",
  openGraph: {
    title: "Community",
    description: "Raeume und Austausch für sachliche Debatten, Moderation und Themenarbeit.",
    url: `${BRAND.baseUrl}/community`,
    siteName: BRAND.name,
  },
  twitter: {
    title: "Community",
    description: "Raeume und Austausch für sachliche Debatten, Moderation und Themenarbeit.",
  },
};

type OriginType = "interest_match" | "dossier" | "topic_round" | "regional_group" | "founder" | "system";
type OriginScope = "regional" | "ueberregional";
type GroupContext = {
  key: string;
  label: string;
  type: OriginType;
  scope: OriginScope;
  topicKey?: string | null;
  topicLabel?: string | null;
  dossierId?: string | null;
  dossierTitle?: string | null;
  regionLabel?: string | null;
  reasonLabel?: string | null;
};

type UserDoc = {
  _id: ObjectId;
  name?: string | null;
  email?: string | null;
  profile?: {
    displayName?: string | null;
    avatarUrl?: string | null;
    publicShareId?: string | null;
    tagline?: string | null;
    topTopics?: Array<{ key?: string | null; title?: string | null }> | null;
    publicLocation?: {
      city?: string | null;
      region?: string | null;
    } | null;
  } | null;
};

type SocialFriendRequestDoc = {
  _id: ObjectId;
  fromUserId?: string | ObjectId | null;
  toUserId?: string | ObjectId | null;
  status?: string | null;
};

type FeedStatementPreview = {
  id: string;
  title: string;
  summary: string;
};

type DossierPreview = {
  dossierId: string;
  title: string;
  status: string;
} | null;

type GroupMember = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  shareId: string | null;
  tagline: string | null;
  locationLabel: string | null;
  relationshipState: SocialRelationshipState;
  canMessage: boolean;
  reasonLabel: string | null;
};

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function detectLocale(): SupportedLocale {
  const cookieStore = cookies();
  const cookieLang = cookieStore.get("lang")?.value;
  if (cookieLang && isSupportedLocale(cookieLang)) return cookieLang;
  const acceptLanguage = headers().get("accept-language");
  if (acceptLanguage) {
    const primary = acceptLanguage.split(",")[0]?.split(";")[0]?.trim();
    const candidate = primary?.slice(0, 2);
    if (candidate && isSupportedLocale(candidate)) return candidate;
  }
  return DEFAULT_LOCALE;
}

function t(entry: { de: string; en: string }, locale: SupportedLocale) {
  return locale === "en" ? entry.en : entry.de;
}

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | null {
  const value = params[key];
  if (typeof value === "string") return value.trim() || null;
  if (Array.isArray(value)) return value[0]?.trim() || null;
  return null;
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCaseFromSlug(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeTopicList(input: unknown): Array<{ key: string; label: string }> {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const list: Array<{ key: string; label: string }> = [];
  for (const entry of input) {
    const key = clean((entry as { key?: unknown } | null)?.key).toLowerCase();
    const label = clean((entry as { title?: unknown } | null)?.title) || key;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    list.push({ key, label });
  }
  return list;
}

function normalizeLocation(city?: string | null, region?: string | null): string | null {
  const cityLabel = clean(city);
  const regionLabel = clean(region);
  if (cityLabel && regionLabel && cityLabel.toLowerCase() !== regionLabel.toLowerCase()) {
    return `${cityLabel} · ${regionLabel}`;
  }
  return cityLabel || regionLabel || null;
}

function parseGroupContext(params: Record<string, string | string[] | undefined>): GroupContext | null {
  const group = readParam(params, "group");
  if (!group) return null;
  const topicKey = readParam(params, "topic") ?? readParam(params, "topicKey");
  const topicLabel = readParam(params, "topicLabel");
  const dossierId = readParam(params, "dossier") ?? readParam(params, "dossierId");
  const dossierTitle = readParam(params, "dossierTitle");
  const regionLabel = readParam(params, "region") ?? readParam(params, "regionLabel");
  const reasonLabel = readParam(params, "reason") ?? readParam(params, "reasonLabel");
  const label = readParam(params, "communityLabel") ?? titleCaseFromSlug(group);
  const typeRaw = readParam(params, "type");
  const scopeRaw = readParam(params, "scope");

  let type: OriginType = "interest_match";
  if (
    typeRaw === "interest_match" ||
    typeRaw === "dossier" ||
    typeRaw === "topic_round" ||
    typeRaw === "regional_group" ||
    typeRaw === "founder" ||
    typeRaw === "system"
  ) {
    type = typeRaw;
  } else if (group.includes("founder")) {
    type = "founder";
  } else if (group.includes("system")) {
    type = "system";
  } else if (dossierId) {
    type = "dossier";
  } else if (regionLabel) {
    type = "regional_group";
  }

  let scope: OriginScope = "ueberregional";
  if (scopeRaw === "regional" || scopeRaw === "ueberregional") {
    scope = scopeRaw;
  } else if (type === "regional_group") {
    scope = "regional";
  }

  return {
    key: group,
    label,
    type,
    scope,
    topicKey,
    topicLabel,
    dossierId,
    dossierTitle,
    regionLabel,
    reasonLabel,
  };
}

function groupTypeLabel(type: OriginType, locale: SupportedLocale): string {
  const map = {
    regional_group: { de: "Regional", en: "Regional" },
    interest_match: { de: "Überregional", en: "Cross-regional" },
    dossier: { de: "Dossier", en: "Dossier" },
    topic_round: { de: "Themenrunde", en: "Topic round" },
    founder: { de: "Founder-Kanal", en: "Founder channel" },
    system: { de: "System-Kanal", en: "System channel" },
  } as const;
  return t(map[type], locale);
}

function groupWhyLine(context: GroupContext, locale: SupportedLocale): string {
  if (context.reasonLabel) return context.reasonLabel;
  if (context.type === "regional_group" && context.topicLabel && context.regionLabel) {
    return locale === "en"
      ? `People around ${context.topicLabel} in ${context.regionLabel}.`
      : `Menschen rund um ${context.topicLabel} in ${context.regionLabel}.`;
  }
  if (context.type === "interest_match" && context.topicLabel) {
    return locale === "en"
      ? `People with shared interest ${context.topicLabel}.`
      : `Menschen mit dem gemeinsamen Thema ${context.topicLabel}.`;
  }
  if (context.type === "dossier") {
    return locale === "en"
      ? "Group around a shared dossier context."
      : "Gruppe rund um einen gemeinsamen Dossier-Kontext.";
  }
  if (context.type === "founder") {
    return locale === "en"
      ? "Product onboarding and founder guidance channel."
      : "Produkt-Onboarding und Founder-Hinweise.";
  }
  if (context.type === "system") {
    return locale === "en"
      ? "System and onboarding information channel."
      : "System- und Onboarding-Hinweise.";
  }
  return locale === "en"
    ? "Discovery area for context-based contacts."
    : "Discovery-Raum für kontextbasierte Kontakte.";
}

async function loadViewerProfile(userId: string | null): Promise<UserDoc | null> {
  if (!userId || !ObjectId.isValid(userId)) return null;
  const usersCol = await coreCol<UserDoc>("users");
  return usersCol.findOne(
    { _id: new ObjectId(userId) },
    {
      projection: {
        name: 1,
        email: 1,
        "profile.displayName": 1,
        "profile.topTopics": 1,
        "profile.publicLocation.city": 1,
        "profile.publicLocation.region": 1,
      },
    },
  );
}

async function loadGroupMembers(params: {
  context: GroupContext;
  viewerId: string | null;
}): Promise<GroupMember[]> {
  assertStoreConfigured("core", "community/page.loadGroupMembers");
  const usersCol = await coreCol<UserDoc>("users");
  const filters: Record<string, unknown>[] = [];

  if (params.context.topicKey) {
    filters.push({ "profile.topTopics.key": params.context.topicKey });
  }
  if (params.context.type === "regional_group" && params.context.regionLabel) {
    const primary = params.context.regionLabel.split("·")[0]?.trim() || params.context.regionLabel.trim();
    if (primary) {
      const expr = new RegExp(`^${escapeRegex(primary)}$`, "i");
      filters.push({
        $or: [{ "profile.publicLocation.city": expr }, { "profile.publicLocation.region": expr }],
      });
    }
  }

  const query: Record<string, unknown> = filters.length > 0 ? { $and: filters } : {};
  if (params.viewerId && ObjectId.isValid(params.viewerId)) {
    query._id = { $ne: new ObjectId(params.viewerId) };
  }

  const candidates = await usersCol
    .find(query, {
      projection: {
        name: 1,
        email: 1,
        "profile.displayName": 1,
        "profile.avatarUrl": 1,
        "profile.publicShareId": 1,
        "profile.tagline": 1,
        "profile.topTopics": 1,
        "profile.publicLocation.city": 1,
        "profile.publicLocation.region": 1,
      },
    })
    .limit(14)
    .toArray();

  if (candidates.length === 0) return [];

  const currentUserIds = params.viewerId ? idCandidates(params.viewerId) : [];
  const currentUserSet = new Set(currentUserIds.map((candidate) => normalizeId(candidate)));
  const requestsCol = await coreCol<SocialFriendRequestDoc>("social_friend_requests");
  const pairDocs =
    currentUserIds.length > 0
      ? await requestsCol
          .find(pairFilter(currentUserIds, candidates.flatMap((candidate) => idCandidates(String(candidate._id)))))
          .sort({ _id: -1 })
          .limit(260)
          .toArray()
      : [];

  return candidates.slice(0, 10).map((candidate) => {
    const id = String(candidate._id);
    const candidateIdSet = new Set(idCandidates(id).map((entry) => normalizeId(entry)));
    const relatedDocs = pairDocs.filter((doc) => {
      const fromId = normalizeId(doc.fromUserId);
      const toId = normalizeId(doc.toUserId);
      const outgoing = currentUserSet.has(fromId) && candidateIdSet.has(toId);
      const incoming = candidateIdSet.has(fromId) && currentUserSet.has(toId);
      return outgoing || incoming;
    });
    const pairState =
      params.viewerId && currentUserIds.length > 0
        ? summarizePairState(relatedDocs, params.viewerId, id)
        : { connected: false, incomingPending: null, outgoingPending: null };
    const capability =
      params.viewerId && currentUserIds.length > 0
        ? deriveMessagingCapability({
            pairState,
            currentUserId: params.viewerId,
            targetUserId: id,
            targetKnown: true,
          })
        : {
            relationshipState: "none" as SocialRelationshipState,
            canMessage: false,
          };
    const displayName =
      clean(candidate.profile?.displayName) || clean(candidate.name) || clean(candidate.email) || "Mitglied";
    const locationLabel = normalizeLocation(
      candidate.profile?.publicLocation?.city,
      candidate.profile?.publicLocation?.region,
    );
    const topicList = normalizeTopicList(candidate.profile?.topTopics);
    const reasonLabel = params.context.topicLabel
      ? topicList.some((topic) => topic.key === params.context.topicKey)
        ? `${params.context.topicLabel}${locationLabel ? ` · ${locationLabel}` : ""}`
        : params.context.topicLabel
      : locationLabel;

    return {
      id,
      displayName,
      avatarUrl: clean(candidate.profile?.avatarUrl) || null,
      shareId: clean(candidate.profile?.publicShareId) || null,
      tagline: clean(candidate.profile?.tagline) || null,
      locationLabel,
      relationshipState: capability.relationshipState,
      canMessage: capability.canMessage,
      reasonLabel: reasonLabel || null,
    };
  });
}

async function loadRelevantStatements(context: GroupContext): Promise<FeedStatementPreview[]> {
  const col = await feedStatementsCol();
  const query: Record<string, unknown> = { status: "readyForLive" };
  if (context.topicKey || context.topicLabel) {
    const tokens = [context.topicLabel, context.topicKey]
      .map((entry) => clean(entry))
      .filter(Boolean);
    if (tokens.length > 0) {
      query.$or = tokens.map((token) => {
        const expr = new RegExp(escapeRegex(token), "i");
        return { $or: [{ title: expr }, { summary: expr }] };
      });
    }
  }
  const rows = await col
    .find(query, { projection: { title: 1, summary: 1, claims: { $slice: 1 } } })
    .sort({ createdAt: -1 })
    .limit(4)
    .toArray();
  return rows.map((row: any) => ({
    id: String(row?._id),
    title: clean(row?.title) || "Debatte",
    summary: clean(row?.summary) || clean(row?.claims?.[0]?.text) || "Kurzzusammenfassung folgt.",
  }));
}

async function loadDossierPreview(context: GroupContext): Promise<DossierPreview> {
  const col = await dossiersCol();
  if (context.dossierId) {
    const byId = await col.findOne(
      { dossierId: context.dossierId },
      { projection: { dossierId: 1, title: 1, status: 1 } },
    );
    if (byId?.dossierId) {
      return {
        dossierId: byId.dossierId,
        title: clean(byId.title) || "Dossier",
        status: clean(byId.status) || "active",
      };
    }
  }
  if (context.topicLabel) {
    const byTopic = await col.findOne(
      { title: new RegExp(escapeRegex(context.topicLabel), "i") },
      { projection: { dossierId: 1, title: 1, status: 1 }, sort: { updatedAt: -1, createdAt: -1 } as any },
    );
    if (byTopic?.dossierId) {
      return {
        dossierId: byTopic.dossierId,
        title: clean(byTopic.title) || "Dossier",
        status: clean(byTopic.status) || "active",
      };
    }
  }
  return null;
}

function relationshipLabel(state: SocialRelationshipState, locale: SupportedLocale): string {
  if (state === "connected") return locale === "en" ? "Connected" : "Verbunden";
  if (state === "incoming_pending") return locale === "en" ? "Incoming request" : "Anfrage erhalten";
  if (state === "outgoing_pending") return locale === "en" ? "Request sent" : "Anfrage gesendet";
  return locale === "en" ? "No connection" : "Keine Verbindung";
}

function relationshipPrimaryCta(member: GroupMember, locale: SupportedLocale): { label: string; href: string } {
  if (member.canMessage) {
    return {
      label: locale === "en" ? "Message in inbox" : "Nachricht in Inbox",
      href: "/account#inbox",
    };
  }
  if (member.relationshipState === "incoming_pending") {
    return {
      label: locale === "en" ? "Review request" : "Anfrage prüfen",
      href: "/account#inbox",
    };
  }
  if (member.relationshipState === "outgoing_pending") {
    return {
      label: locale === "en" ? "Request running" : "Anfrage läuft",
      href: "/account#inbox",
    };
  }
  return {
    label: locale === "en" ? "Request connection" : "Verbindung anfragen",
    href: "/account#inbox",
  };
}

function buildFallbackGroups(params: {
  locale: SupportedLocale;
  viewer: UserDoc | null;
}): Array<{ key: string; title: string; hint: string; href: string }> {
  const list: Array<{ key: string; title: string; hint: string; href: string }> = [];
  const topics = normalizeTopicList(params.viewer?.profile?.topTopics).slice(0, 3);
  const regionLabel = normalizeLocation(
    params.viewer?.profile?.publicLocation?.city,
    params.viewer?.profile?.publicLocation?.region,
  );

  for (const topic of topics) {
    const regional = regionLabel ? `${topic.label} · ${regionLabel}` : `${topic.label} überregional`;
    const key = slugify(regional);
    const search = new URLSearchParams({
      group: key,
      type: regionLabel ? "regional_group" : "interest_match",
      topic: topic.key,
      topicLabel: topic.label,
      scope: regionLabel ? "regional" : "ueberregional",
      communityLabel: regional,
      reasonLabel: regionLabel
        ? `Menschen mit ähnlichen Interessen in ${regionLabel}`
        : `Menschen mit dem Schwerpunkt ${topic.label} überregional`,
    });
    if (regionLabel) {
      search.set("regionLabel", regionLabel);
    }
    list.push({
      key,
      title: regional,
      hint:
        params.locale === "en"
          ? "Derived from your interests and profile context."
          : "Abgeleitet aus deinen Interessen und Profilkontext.",
      href: `/community?${search.toString()}`,
    });
  }

  list.push({
    key: "founder-channel",
    title: params.locale === "en" ? "Founder channel" : "Founder-Kanal",
    hint:
      params.locale === "en"
        ? "Product onboarding, updates and guidance."
        : "Produkt-Onboarding, Updates und Hinweise.",
    href: "/community?group=founder-channel&type=founder&scope=ueberregional&communityLabel=Founder-Channel",
  });

  return list;
}

export default async function CommunityPage({ searchParams }: Props) {
  const locale = detectLocale();
  const params = await Promise.resolve(searchParams ?? {});
  const groupContext = parseGroupContext(params);
  const session = await readSession();
  const viewerId = clean(session?.uid) || null;
  const viewer = await loadViewerProfile(viewerId);

  if (!groupContext) {
    const groups = buildFallbackGroups({ locale, viewer });
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 md:py-12">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            {locale === "en" ? "Community" : "Community"}
          </p>
          <h1 className="text-3xl font-bold text-[rgb(var(--fg))]">
            {locale === "en" ? "Community Hub" : "Community-Hub"}
          </h1>
          <p className="text-sm text-[rgb(var(--muted))]">
            {locale === "en"
              ? "Discovery, context and contributions. Not a realtime messenger."
              : "Discovery, Kontext und Beiträge. Kein Realtime-Messenger."}
          </p>
        </header>

        <section className="grid gap-3 md:grid-cols-2">
          {groups.map((group) => (
            <Link
              key={group.key}
              href={group.href}
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                {locale === "en" ? "Group" : "Gruppe"}
              </p>
              <h2 className="mt-1 text-base font-semibold text-[rgb(var(--fg))]">{group.title}</h2>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">{group.hint}</p>
            </Link>
          ))}
        </section>

        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
            {locale === "en" ? "What community is today" : "Was Community heute ist"}
          </p>
          <p className="mt-2 text-[rgb(var(--muted))]">
            {locale === "en"
              ? "Community currently means discovery + context + contributions + connections. Messaging remains DM v1 in inbox."
              : "Community bedeutet aktuell Discovery + Kontext + Beiträge + Verbindungen. Nachrichten bleiben DM v1 in der Inbox."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Link href="/community/contributions" className="font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">
              {locale === "en" ? "Open contributions" : "Beiträge öffnen"}
            </Link>
            <Link href="/account#inbox" className="font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">
              {locale === "en" ? "Open inbox" : "Inbox öffnen"}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const [members, statements, dossier] = await Promise.all([
    loadGroupMembers({ context: groupContext, viewerId }),
    loadRelevantStatements(groupContext),
    loadDossierPreview(groupContext),
  ]);

  const topicHref = groupContext.topicKey
    ? `/swipes?topic=${encodeURIComponent(groupContext.topicKey)}`
    : "/swipes";
  const dossierHref = dossier?.dossierId
    ? `/dossier/${encodeURIComponent(dossier.dossierId)}`
    : groupContext.dossierId
      ? `/dossier/${encodeURIComponent(groupContext.dossierId)}`
      : "/dossier/demo";

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 md:py-10">
      <header className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-sky-300/60 bg-sky-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-900 dark:border-sky-400/45 dark:bg-sky-500/16 dark:text-sky-100">
            {groupTypeLabel(groupContext.type, locale)}
          </span>
          <span className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2.5 py-1 text-[10px] font-medium text-[rgb(var(--muted))]">
            {groupContext.scope === "regional"
              ? locale === "en"
                ? "Regional scope"
                : "Regionaler Scope"
              : locale === "en"
                ? "Cross-regional scope"
                : "Überregionaler Scope"}
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))] sm:text-3xl">{groupContext.label}</h1>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">{groupWhyLine(groupContext, locale)}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-[rgb(var(--muted))]">
          {groupContext.topicLabel ? (
            <span className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2.5 py-1">
              {locale === "en" ? "Topic" : "Thema"}: {groupContext.topicLabel}
            </span>
          ) : null}
          {groupContext.regionLabel ? (
            <span className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2.5 py-1">
              {locale === "en" ? "Region" : "Region"}: {groupContext.regionLabel}
            </span>
          ) : null}
          {dossier?.title || groupContext.dossierTitle ? (
            <span className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2.5 py-1">
              Dossier: {dossier?.title ?? groupContext.dossierTitle}
            </span>
          ) : null}
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
              {locale === "en" ? "Matching people" : "Passende Menschen"}
            </p>
            <span className="text-[11px] text-[rgb(var(--muted))]">{members.length}</span>
          </div>
          {members.length > 0 ? (
            <div className="space-y-2">
              {members.map((member) => {
                const primaryAction = relationshipPrimaryCta(member, locale);
                return (
                  <div key={member.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-2.5">
                    <div className="flex items-start gap-2.5">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-500/85 via-cyan-500/80 to-emerald-500/80 text-xs font-semibold text-white ring-1 ring-sky-300/40">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          member.displayName
                            .split(" ")
                            .map((part) => part.slice(0, 1))
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[rgb(var(--fg))]">{member.displayName}</p>
                        {member.tagline ? <p className="text-xs text-[rgb(var(--muted))]">{member.tagline}</p> : null}
                        {member.reasonLabel ? <p className="text-[11px] text-[rgb(var(--muted))]">{member.reasonLabel}</p> : null}
                        <p className="mt-0.5 text-[10px] font-medium text-[rgb(var(--muted))]">
                          {relationshipLabel(member.relationshipState, locale)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                      {member.shareId ? (
                        <Link
                          href={`/profile/${encodeURIComponent(member.shareId)}`}
                          className="inline-flex w-full items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1.5 text-[11px] font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
                        >
                          {locale === "en" ? "Open profile" : "Profil öffnen"}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex w-full items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1.5 text-[11px] font-semibold text-[rgb(var(--muted))] opacity-70"
                        >
                          {locale === "en" ? "Profile soon" : "Profil folgt"}
                        </button>
                      )}
                      <Link
                        href={primaryAction.href}
                        className="inline-flex w-full items-center justify-center rounded-full border border-sky-300/70 bg-gradient-to-r from-sky-500/85 to-cyan-500/85 px-3 py-1.5 text-[11px] font-semibold text-white"
                      >
                        {primaryAction.label}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-[rgb(var(--muted))]">
              {locale === "en"
                ? "No matching people yet. Save interests and region to strengthen this group."
                : "Noch keine passenden Menschen sichtbar. Interessen und Region stärken diese Gruppe."}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
              {locale === "en" ? "Relevant topics" : "Relevante Themen"}
            </p>
            {statements.length > 0 ? (
              <div className="mt-2 space-y-2">
                {statements.map((statement) => (
                  <div key={statement.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
                    <p className="text-sm font-semibold text-[rgb(var(--fg))]">{statement.title}</p>
                    <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">{statement.summary}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                {locale === "en"
                  ? "No content mapped yet for this context."
                  : "Für diesen Kontext sind noch keine Inhalte zugeordnet."}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={topicHref}
                className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1.5 text-[11px] font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
              >
                {locale === "en" ? "Open topic in swipes" : "Thema in Swipes öffnen"}
              </Link>
              <Link
                href="/community/contributions"
                className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1.5 text-[11px] font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
              >
                {locale === "en" ? "Submit contribution" : "Beitrag einreichen"}
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
              {locale === "en" ? "Dossier context" : "Dossier-Kontext"}
            </p>
            {dossier || groupContext.dossierId ? (
              <div className="mt-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">{dossier?.title ?? groupContext.dossierTitle ?? "Dossier"}</p>
                <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">
                  {locale === "en"
                    ? "Shared dossier context for this group."
                    : "Gemeinsamer Dossier-Kontext für diese Gruppe."}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                {locale === "en"
                  ? "No dossier assigned yet. Fallback opens demo dossier."
                  : "Noch kein Dossier hinterlegt. Fallback öffnet Demo-Dossier."}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={dossierHref}
                className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1.5 text-[11px] font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
              >
                {locale === "en" ? "Open dossier" : "Dossier öffnen"}
              </Link>
              <Link
                href="/account#inbox"
                className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1.5 text-[11px] font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
              >
                {locale === "en" ? "Back to inbox" : "Zur Inbox"}
              </Link>
            </div>
          </section>
        </div>
      </section>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-xs text-[rgb(var(--muted))]">
        <p className="font-semibold text-[rgb(var(--fg))]">
          {locale === "en" ? "Community scope today" : "Community-Umfang heute"}
        </p>
        <p className="mt-1">
          {locale === "en"
            ? "Discovery + context + contributions + connections. No realtime group chat and no full messenger promise."
            : "Discovery + Kontext + Beiträge + Verbindungen. Kein Realtime-Gruppenchat und kein Voll-Messenger-Versprechen."}
        </p>
      </section>
    </main>
  );
}
