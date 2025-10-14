// Platzhalter-/Shim-Typen für den Public-Typecheck

export const ContentKind = {
  STATEMENT: "STATEMENT",
  REPORT: "REPORT",
  POST: "POST",
} as const;

export const RegionMode = {
  AUTO: "AUTO",
  MANUAL: "MANUAL",
} as const;

export const Locale = {
  de: "de",
  en: "en",
  fr: "fr",
} as const;

export const PublishStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;

// prisma nur als Platzhalter
export const prisma: any = {};
export type Prisma = any;

// ✅ Alias für alte Call-Sites
export const prismaWeb = prisma;
