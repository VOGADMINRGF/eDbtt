// features/report/data/listReports.ts
import "server-only";
import { prisma } from "@db-core";

export type ListReportsOptions = {
  forUserId?: string;
  roles?: string[];
  tenantId?: string;
  language?: string;
  q?: string;
  tag?: string;
  region?: string;
  status?: "draft" | "published" | "archived" | "active";
  visibility?: "public" | "private";
  limit?: number;
  cursor?: string;
  includeStatements?: boolean;
};

export type ReportRowE150 = {
  id: string;
  slug?: string;
  title: string;
  subtitle?: string;
  summary?: string;
  tags?: string[];
  imageUrl?: string;
  language?: string;
  status?: string;
  visibility?: string;
  regionScope?: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
  statements?: string[]; // nur wenn includeStatements = true
};

export async function listReports(opts: ListReportsOptions = {}): Promise<ReportRowE150[]> {
  const {
    roles = [],
    tenantId = process.env.TENANT_ID || undefined,
    language,
    q,
    tag,
    region,
    status,
    visibility,
    limit = 30,
    cursor,
    includeStatements = false,
  } = opts;

  const canSeePrivate = roles.includes("admin") || roles.includes("editor");

  const where: any = {
    ...(tenantId ? { tenantId } : {}),
    ...(language ? { language } : {}),
    ...(status ? { status } : {}),
    ...(!canSeePrivate ? { visibility: "public" } : (visibility ? { visibility } : {})),
    ...(tag ? { tags: { has: tag } } : {}),
    ...(region ? { regionScope: { has: region } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { subtitle: { contains: q, mode: "insensitive" } },
            { summary: { contains: q, mode: "insensitive" } },
            { tags: { has: q } }
          ]
        }
      : {})
  };

  const baseSelect = {
    id: true,
    slug: true,
    title: true,
    subtitle: true,
    summary: true,
    tags: true,
    imageUrl: true,
    language: true,
    status: true,
    visibility: true,
    regionScope: true,
    createdAt: true,
    updatedAt: true
  } as const;

  const select = includeStatements
    ? { ...baseSelect, statements: { select: { id: true } } }
    : baseSelect;

  const rows = await prisma.report.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    select
  });

  return rows.map((r: any) => ({
    ...r,
    ...(includeStatements && r.statements ? { statements: r.statements.map((s: any) => s.id) } : {})
  }));
}
