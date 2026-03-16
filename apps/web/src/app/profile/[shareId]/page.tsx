import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { coreCol } from "@core/db/triMongo";
import { getEngagementLevel } from "@features/user/engagement";

export const dynamic = "force-dynamic";

type UserDoc = {
  name?: string | null;
  createdAt?: Date | string | null;
  profile?: {
    displayName?: string | null;
    headline?: string | null;
    bio?: string | null;
    tagline?: string | null;
    avatarUrl?: string | null;
    coverUrl?: string | null;
    publicLocation?: {
      city?: string | null;
      region?: string | null;
      countryCode?: string | null;
    };
    topTopics?: Array<{ key?: string; title?: string; statement?: string | null }>;
    publicFlags?: {
      showRealName?: boolean;
      showCity?: boolean;
      showJoinDate?: boolean;
      showEngagementLevel?: boolean;
      showStats?: boolean;
      showMembership?: boolean;
    };
  };
  publicFlags?: {
    showRealName?: boolean;
    showCity?: boolean;
    showJoinDate?: boolean;
    showEngagementLevel?: boolean;
    showStats?: boolean;
    showMembership?: boolean;
  };
  usage?: {
    xp?: number;
    swipeCountTotal?: number;
  };
  stats?: {
    xp?: number;
    swipeCountTotal?: number;
  };
};

type PublicFlags = {
  showRealName?: boolean;
  showCity?: boolean;
  showJoinDate?: boolean;
  showEngagementLevel?: boolean;
  showStats?: boolean;
  showMembership?: boolean;
};

async function fetchPublicProfile(shareId: string) {
  const Users = await coreCol<UserDoc>("users");
  return Users.findOne(
    { "profile.publicShareId": shareId },
    {
      projection: {
        name: 1,
        createdAt: 1,
        profile: 1,
        publicFlags: 1,
        usage: 1,
        stats: 1,
      },
    },
  );
}

function resolveFlags(user: UserDoc): PublicFlags {
  return (user.profile?.publicFlags ?? user.publicFlags ?? {}) as PublicFlags;
}

function resolveDisplayName(user: UserDoc, flags: PublicFlags) {
  if (flags.showRealName) {
    return user.profile?.displayName?.trim() || user.name?.trim() || "Mitglied bei eDebatte";
  }
  return "Mitglied bei eDebatte";
}

function resolveProfileSummary(user: UserDoc, flags: PublicFlags) {
  const displayName = resolveDisplayName(user, flags);
  const headline = user.profile?.headline?.trim() || null;
  const tagline = user.profile?.tagline?.trim() || null;
  const bio = user.profile?.bio?.trim() || null;
  const description =
    headline ||
    tagline ||
    bio ||
    "Profil einer verifizierten Person in der eDebatte-Community.";
  return { displayName, headline, tagline, bio, description };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareId: string }>;
}): Promise<Metadata> {
  const { shareId } = await params;
  const user = await fetchPublicProfile(shareId);
  if (!user) {
    return {
      title: "Profil nicht gefunden",
      description: "Dieses Profil ist nicht vorhanden oder nicht freigegeben.",
      robots: { index: false },
    };
  }

  const flags = resolveFlags(user);
  if (!flags.showMembership) {
    return {
      title: "Profil nicht verfügbar",
      description: "Dieses Profil ist derzeit nicht öffentlich sichtbar.",
      robots: { index: false },
    };
  }

  const { displayName, description } = resolveProfileSummary(user, flags);
  return {
    title: `${displayName} · Profil`,
    description,
    openGraph: {
      title: `${displayName} · Profil`,
      description,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${displayName} · Profil`,
      description,
    },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const user = await fetchPublicProfile(shareId);

  if (!user) {
    notFound();
  }

  const flags = resolveFlags(user);
  if (!flags.showMembership) {
    notFound();
  }

  const { displayName, headline, tagline, bio } = resolveProfileSummary(user, flags);
  const avatarUrl = user.profile?.avatarUrl ?? null;
  const coverUrl = user.profile?.coverUrl ?? null;
  const location = user.profile?.publicLocation
    ? [user.profile.publicLocation.city, user.profile.publicLocation.region, user.profile.publicLocation.countryCode]
        .filter(Boolean)
        .join(" · ")
    : null;
  const topTopics = Array.isArray(user.profile?.topTopics)
    ? user.profile.topTopics
        .map((topic) => ({
          title: topic.title || topic.key || "Thema",
          statement: topic.statement ?? null,
        }))
        .filter((topic) => Boolean(topic.title))
        .slice(0, 3)
    : [];

  const xp = user.usage?.xp ?? user.stats?.xp ?? 0;
  const swipesTotal = user.usage?.swipeCountTotal ?? user.stats?.swipeCountTotal ?? 0;
  const engagementLevel = getEngagementLevel(Number(xp));
  const joinedAt =
    user.createdAt instanceof Date
      ? user.createdAt
      : user.createdAt
        ? new Date(user.createdAt)
        : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white py-10">
      <div className="mx-auto max-w-3xl space-y-6 px-4">
        <section className="overflow-hidden rounded-3xl bg-[rgb(var(--card))] shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-[rgb(var(--border))]">
          <div className="relative h-28 w-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500">
            {coverUrl && (
              <img src={coverUrl} alt="Cover" className="h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />
          </div>
          <div className="flex flex-wrap items-center gap-4 px-6 pb-6 pt-0 -mt-8">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-slate-900 text-2xl font-semibold text-white shadow">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-full w-full rounded-full object-cover" />
              ) : (
                getInitials(displayName)
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Öffentliches Profil</p>
              <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">{displayName}</h1>
              {tagline && <p className="text-sm text-[rgb(var(--muted))]">{tagline}</p>}
              {flags.showCity && location && <p className="text-xs text-[rgb(var(--muted))]">{location}</p>}
            </div>
            <div className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
              Mitglied
            </div>
          </div>

          {(headline || bio) && (
            <div className="px-6 pb-6 space-y-2">
              {headline && <p className="text-lg font-semibold text-[rgb(var(--fg))]">{headline}</p>}
              {bio && <p className="text-sm leading-relaxed text-[rgb(var(--muted))]">{bio}</p>}
            </div>
          )}
        </section>

        {(flags.showStats || flags.showEngagementLevel || flags.showJoinDate) && (
          <section className="grid gap-3 rounded-3xl bg-[rgb(var(--card))] p-6 shadow-sm ring-1 ring-[rgb(var(--border))] sm:grid-cols-3">
            {flags.showEngagementLevel && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">Engagement</p>
                <p className="text-lg font-semibold text-[rgb(var(--fg))]">{engagementLevel}</p>
              </div>
            )}
            {flags.showStats && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">XP</p>
                <p className="text-lg font-semibold text-[rgb(var(--fg))]">{xp}</p>
              </div>
            )}
            {flags.showStats && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">Swipes</p>
                <p className="text-lg font-semibold text-[rgb(var(--fg))]">{swipesTotal}</p>
              </div>
            )}
            {flags.showJoinDate && joinedAt && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">Mitglied seit</p>
                <p className="text-lg font-semibold text-[rgb(var(--fg))]">{joinedAt.toLocaleDateString("de-DE")}</p>
              </div>
            )}
          </section>
        )}

        {topTopics.length > 0 && (
          <section className="rounded-3xl bg-[rgb(var(--card))] p-6 shadow-sm ring-1 ring-[rgb(var(--border))]">
            <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Top-Themen</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {topTopics.map((topic) => (
                <div key={topic.title} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                  <p className="text-sm font-semibold text-[rgb(var(--fg))]">{topic.title}</p>
                  {topic.statement && <p className="text-xs text-[rgb(var(--muted))]">{topic.statement}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-5 text-xs text-[rgb(var(--muted))]">
          Dieses Profil wird nur angezeigt, wenn der/die Nutzer:in der öffentlichen Darstellung zugestimmt hat.
        </section>
      </div>
    </main>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
