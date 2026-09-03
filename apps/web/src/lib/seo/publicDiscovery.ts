import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const DEFAULT_OPENGRAPH_IMAGE_PATH = "/opengraph-image";

export const PUBLIC_DISCOVERY_PATHS = [
  "/",
  "/warum-edebatte",
  "/vergleich/consul",
  "/themen",
  "/runden",
  "/beteiligung",
  "/factcheck",
  "/pricing",
  "/pricing/institutionen",
] as const;

export const NOINDEX_ROBOTS = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
} as const;

type BuildPublicPageMetadataInput = {
  path: string;
  title: string;
  description: string;
  ogType?: "website" | "article";
};

type SitemapEntry = {
  url: string;
  changeFrequency: "daily" | "weekly";
  priority: number;
};

function normalizePath(path: string): string {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

function publicPriority(path: string): number {
  if (path === "/") return 1;
  if (path === "/warum-edebatte") return 0.9;
  if (path.startsWith("/vergleich/")) return 0.8;
  return 0.7;
}

export function resolveSeoImageUrl(path = DEFAULT_OPENGRAPH_IMAGE_PATH): string {
  return new URL(normalizePath(path), BRAND.baseUrl).toString();
}

export function buildPublicPageMetadata(input: BuildPublicPageMetadataInput): Metadata {
  const canonicalPath = normalizePath(input.path);
  const imageUrl = resolveSeoImageUrl();

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: new URL(canonicalPath, BRAND.baseUrl).toString(),
      siteName: BRAND.name,
      type: input.ogType ?? "website",
      locale: "de_DE",
      images: [{ url: imageUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [imageUrl],
    },
  };
}

export function buildPublicDiscoverySitemap(): SitemapEntry[] {
  return PUBLIC_DISCOVERY_PATHS.map((path) => ({
    url: new URL(path, BRAND.baseUrl).toString(),
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: publicPriority(path),
  }));
}

export function buildHomeStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND.name,
    url: BRAND.baseUrl,
    inLanguage: "de-DE",
    description: BRAND.tagline_de,
    about: [
      "digitale Bürgerbeteiligung",
      "gesellschaftliche Willensbildung",
      "evidenzbasierte Deliberation",
      "Agenda-Setting",
    ],
    publisher: {
      "@type": "Organization",
      name: BRAND.name,
      url: BRAND.baseUrl,
      email: BRAND.contactEmail,
    },
  };
}
