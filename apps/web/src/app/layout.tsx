// E200: Public root layout with locale bootstrap and consent banner.
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import type { Collection } from "mongodb";
import { ObjectId, getCol } from "@core/db/triMongo";
import type { AuthUser } from "@/hooks/auth";
import { readSession } from "@/utils/session";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import { LocaleProvider } from "@/context/LocaleContext";
import { DEFAULT_LOCALE, type SupportedLocale, isSupportedLocale } from "@/config/locales";
import { SiteHeader } from "./(components)/SiteHeader";
import { getPrivacyStrings } from "./privacyStrings";
import { CookieConsentBanner } from "@/components/privacy/CookieConsentBanner";
import { AnalyticsTracker } from "@/components/privacy/AnalyticsTracker";
import { CONSENT_COOKIE_NAME, LEGACY_CONSENT_COOKIE_NAME, parseConsentCookie } from "@/lib/privacy/consent";
import SiteFooter from "@/components/SiteFooter";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ReadingModeProvider } from "@/components/providers/reading-mode-provider";
import { normalizeAccessTier } from "@/config/accessTiers";
import { MobileAppShellChrome } from "@/components/mobile/MobileAppShellChrome";

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.baseUrl),
  applicationName: BRAND.name,
  manifest: "/manifest.webmanifest",
  title: {
    default: BRAND.name,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.tagline_de,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: BRAND.name,
  },
  openGraph: {
    title: BRAND.name,
    description: BRAND.tagline_de,
    url: BRAND.baseUrl,
    siteName: BRAND.name,
  },
  twitter: {
    title: BRAND.name,
    description: BRAND.tagline_de,
    site: BRAND.domain,
  },
};
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#06b6d4",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const initialLocale = await detectInitialLocale(cookieStore);
  const initialConsent = parseConsentCookie(
    cookieStore.get(CONSENT_COOKIE_NAME)?.value ?? cookieStore.get(LEGACY_CONSENT_COOKIE_NAME)?.value,
  );
  const privacyStrings = getPrivacyStrings(initialLocale);
  const initialUser = await loadServerUser(cookieStore);

  return (
    <html lang={initialLocale} className="h-full" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <ReadingModeProvider>
            <LocaleProvider initialLocale={initialLocale}>
              <div className="flex min-h-screen flex-col">
                <SiteHeader initialUser={initialUser} />
                <main data-site-main="true" className="flex-1">
                  {children}
                </main>
                <SiteFooter />
                <MobileAppShellChrome />
                <div data-site-safe-area-spacer="true" />
                <AnalyticsTracker />
                <CookieConsentBanner strings={privacyStrings} initialConsent={initialConsent} />
              </div>
            </LocaleProvider>
          </ReadingModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

async function detectInitialLocale(cookieStore: Awaited<ReturnType<typeof cookies>>): Promise<SupportedLocale> {
  const cookieLocale = cookieStore.get("lang")?.value;
  if (isSupportedLocale(cookieLocale)) return cookieLocale;

  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language");
  if (acceptLanguage) {
    const primary = acceptLanguage.split(",")[0]?.split(";")[0]?.trim();
    if (primary) {
      const short = primary.slice(0, 2).toLowerCase();
      if (isSupportedLocale(short)) return short;
    }
  }

  return DEFAULT_LOCALE;
}

async function loadServerUser(cookieStore: Awaited<ReturnType<typeof cookies>>): Promise<AuthUser | null> {
  try {
    const session = await readSession();
    const uid = session?.uid;
    if (!uid || !ObjectId.isValid(uid)) return null;
    const users = (await getCol("users")) as Collection<any>;
    const doc = await users.findOne(
      { _id: new ObjectId(uid) },
      { projection: { email: 1, name: 1, roles: 1, accessTier: 1, b2cPlanId: 1, profile: 1 } },
    );
    if (!doc) return null;
    const roles = Array.isArray(doc.roles) ? doc.roles : [];
    const accessTier = normalizeAccessTier(doc.accessTier ?? doc.b2cPlanId ?? null);
    return {
      id: String(doc._id),
      email: doc.email ?? null,
      name: doc.name ?? null,
      roles: roles.length ? roles : ["user"],
      accessTier,
      b2cPlanId: doc.b2cPlanId ?? null,
      engagementXp: null,
      engagementLevel: null,
      contributionCredits: null,
      planSlug: doc.b2cPlanId ?? null,
      vogMembershipStatus: null,
      avatarUrl: doc.profile?.avatarUrl ?? null,
      avatarStyle: doc.profile?.avatarStyle ?? null,
    };
  } catch {
    return null;
  }
}
