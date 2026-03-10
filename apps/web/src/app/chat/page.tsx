import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from "@/config/locales";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { userIsAdminDashboard } from "@/lib/server/auth/roles";

export const metadata: Metadata = {
  title: "Community Chat",
  description: "Sachlicher Community-Chat fuer Themenarbeit und Moderation.",
  openGraph: {
    title: "Community Chat",
    description: "Sachlicher Community-Chat fuer Themenarbeit und Moderation.",
    url: `${BRAND.baseUrl}/chat`,
    siteName: BRAND.name,
  },
  twitter: {
    title: "Community Chat",
    description: "Sachlicher Community-Chat fuer Themenarbeit und Moderation.",
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
  kicker: { de: "Chat", en: "Chat" },
  title: { de: "Community Chat", en: "Community chat" },
  lead: {
    de: "Read-only Grundgerüst für den Austausch. Realtime-Provider und Moderation folgen in einem separaten Block.",
    en: "Read-only foundation for exchange. Realtime provider and moderation will follow in a separate block.",
  },
  statusTitle: { de: "Status", en: "Status" },
  statusBody: {
    de: "Der Chat ist bewusst reduziert, damit Moderation und Regeln zuerst sauber definiert werden.",
    en: "The chat is intentionally reduced until moderation and rules are clearly defined.",
  },
  nextTitle: { de: "Nächste Schritte", en: "Next steps" },
  nextItems: {
    de: [
      "Moderationsrichtlinien und Meldelogik.",
      "Themen- und Regionsräume mit klaren Rollen.",
      "A11y-Checks für Tastatur und Screenreader.",
    ],
    en: [
      "Moderation rules and reporting logic.",
      "Topic and region rooms with clear roles.",
      "A11y checks for keyboard and screen readers.",
    ],
  },
  actionRooms: { de: "Zurück zu den Räumen", en: "Back to rooms" },
  actionStreams: { de: "Streams ansehen", en: "View streams" },
};

function t(entry: { de: string; en: string }, locale: SupportedLocale) {
  return locale === "en" ? entry.en : entry.de;
}

export default async function ChatPage() {
  if (process.env.LIVE_CHAT_ENABLED !== "true") {
    notFound();
  }

  const user = await getSessionUser();
  if (!user || !userIsAdminDashboard(user)) {
    redirect("/");
  }

  const locale = detectLocale();
  const localeKey = locale === "en" ? "en" : "de";

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{t(COPY.kicker, locale)}</p>
        <h1 className="text-3xl font-bold text-[rgb(var(--fg))]">{t(COPY.title, locale)}</h1>
        <p className="text-sm text-[rgb(var(--muted))]">{t(COPY.lead, locale)}</p>
      </header>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 text-sm shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{t(COPY.statusTitle, locale)}</p>
        <p className="mt-2 text-[rgb(var(--muted))]">{t(COPY.statusBody, locale)}</p>
      </section>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 text-sm shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{t(COPY.nextTitle, locale)}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[rgb(var(--muted))]">
          {COPY.nextItems[localeKey].map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <div className="flex gap-4 text-sm">
        <Link href="/community" className="font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">
          {t(COPY.actionRooms, locale)}
        </Link>
        <Link href="/stream" className="font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--muted))]">
          {t(COPY.actionStreams, locale)}
        </Link>
      </div>
    </main>
  );
}
