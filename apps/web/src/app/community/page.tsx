import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from "@/config/locales";

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

const COPY = {
  kicker: {
    de: "Community",
    en: "Community",
  },
  title: {
    de: "Raeume & Austausch",
    en: "Rooms & Exchange",
  },
  lead: {
    de: "Raeume für konstruktive Debatten. Fokus auf Themen, klare Moderation, keine Echokammern.",
    en: "Rooms for constructive debate. Focus on topics, clear moderation, no echo chambers.",
  },
  hint: {
    de: "Sprache kannst du im Header umstellen. Inhalte folgen dem gleichen Neutralitaetsstandard wie Reports.",
    en: "You can switch language in the header. Content follows the same neutrality standard as reports.",
  },
  rulesTitle: {
    de: "Leitplanken",
    en: "Guardrails",
  },
  rulesBody: {
    de: "Offen für Fragen, Quellen und Optionen. Keine Hetze, keine Personalisierung.",
    en: "Open for questions, sources, and options. No hate, no personal attacks.",
  },
  actionStream: {
    de: "Zu den Streams",
    en: "Go to streams",
  },
  actionCampaigns: {
    de: "Campaigns ansehen",
    en: "Browse campaigns",
  },
  actionCode: {
    de: "Verhaltenskodex",
    en: "Code of conduct",
  },
  actionA11y: {
    de: "Barrierefreiheit",
    en: "Accessibility",
  },
  roomLabel: {
    de: "Raum",
    en: "Room",
  },
  rooms: [
    {
      id: "citizen",
      title: { de: "Bürger:innen Lounge", en: "Citizen lounge" },
      description: {
        de: "Offener Raum für Updates, Fragen und Koordination.",
        en: "Open room for updates, questions, and coordination.",
      },
    },
    {
      id: "staff",
      title: { de: "Redaktion & Staff", en: "Editorial & staff" },
      description: {
        de: "Koordination von Research, Eventualitaeten und Campaign-Updates.",
        en: "Coordination of research, eventualities, and campaign updates.",
      },
    },
  ],
};

function t(entry: { de: string; en: string }, locale: SupportedLocale) {
  return locale === "en" ? entry.en : entry.de;
}

export default function CommunityPage() {
  const locale = detectLocale();
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{t(COPY.kicker, locale)}</p>
        <h1 className="text-3xl font-bold text-[rgb(var(--fg))]">{t(COPY.title, locale)}</h1>
        <p className="text-sm text-[rgb(var(--muted))]">{t(COPY.lead, locale)}</p>
        <p className="text-xs text-[rgb(var(--muted))]">{t(COPY.hint, locale)}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {COPY.rooms.map((room) => (
          <RoomCard
            key={room.id}
            id={room.id}
            title={t(room.title, locale)}
            description={t(room.description, locale)}
            label={t(COPY.roomLabel, locale)}
            href="/chat"
          />
        ))}
      </section>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-sm shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{t(COPY.rulesTitle, locale)}</p>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">{t(COPY.rulesBody, locale)}</p>
      </section>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/stream" className="font-semibold text-[rgb(var(--muted))]">
          {t(COPY.actionStream, locale)}
        </Link>
        <Link href="/campaign" className="font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">
          {t(COPY.actionCampaigns, locale)}
        </Link>
        <Link href="/verhaltenskodex" className="font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">
          {t(COPY.actionCode, locale)}
        </Link>
        <Link href="/barrierefreiheit" className="font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">
          {t(COPY.actionA11y, locale)}
        </Link>
      </div>
    </main>
  );
}

function RoomCard({
  id,
  title,
  description,
  label,
  href,
}: {
  id: string;
  title: string;
  description: string;
  label: string;
  href: string;
}) {
  const descId = `${id}-desc`;
  return (
    <Link
      href={href}
      aria-describedby={descId}
      aria-label={`${label}: ${title}`}
      className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{label}</p>
      <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">{title}</h2>
      <p id={descId} className="mt-2 text-[rgb(var(--muted))]">{description}</p>
    </Link>
  );
}
