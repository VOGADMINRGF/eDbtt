// apps/web/src/app/api/factcheck/status/[jobId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@db/web";
import { z, ZodError } from "zod";
import { formatError } from "@core/errors/formatError";
import { logger } from "@core/observability/logger";
import { hasPermission, PERMISSIONS, type Role } from "@core/auth/rbac";

export const runtime = "nodejs";
// optional: gegen statische Zwischen-Caches
export const dynamic = "force-dynamic";
// Hilfsfunktion: Kompatibel mit Next 13/14 (Objekt) und Next 15 (Promise)
async function resolveParams(p: any): Promise<{ jobId: string }> {
  const val = p && typeof p.then === "function" ? await p : p;
  return ParamsSchema.parse(val);
}

export async function GET(
  req: NextRequest,
  ctx:
    | { params: { jobId: string } } // <= Next 13/14
    | { params: Promise<{ jobId: string }> }, // <= Next 15
) {
  const t0 = Date.now();
  try {
    // Rolle: Cookie > Header; im DEV zusätzlich via ?role=… überschreibbar
    const cookieRole = req.cookies.get("u_role")?.value as Role | undefined;
    const headerRole = (req.headers.get("x-role") as Role) || undefined;
    let role: Role = cookieRole ?? headerRole ?? "guest";

    if (process.env.NODE_ENV !== "production") {
      const url = new URL(req.url);
      const qRole = url.searchParams.get("role") as Role | null;
      if (qRole) role = qRole;
    }

    if (!hasPermission(role, PERMISSIONS.FACTCHECK_STATUS)) {
      const fe = formatError("FORBIDDEN", "Permission denied", { role });
      logger.warn({ fe }, "FACTCHECK_STATUS_FORBIDDEN");
      return NextResponse.json(fe, { status: 403 });
    }

    const { jobId } = await resolveParams((ctx as any).params);

    const job = await prisma.factcheckJob.findFirst({ where: { jobId } });
    if (!job) {
      const fe = formatError("NOT_FOUND", "Job not found", { jobId });
      logger.warn({ fe }, "FACTCHECK_STATUS_NOT_FOUND");
      return NextResponse.json(fe, { status: 404 });
    }

    const claims = await prisma.factcheckClaim.findMany({
      where: { jobId: job.id },
      include: { consensus: true, evidences: true, providerRuns: true },
      orderBy: { createdAt: "asc" },
    });

    const res = NextResponse.json(
      {
        ok: true,
        job: {
          id: job.id,
          jobId: job.jobId,
          status: job.status,
          tokensUsed: (job as any).tokensUsed ?? null,
          durationMs: (job as any).durationMs ?? null,
          createdAt: (job as any).createdAt ?? undefined,
          updatedAt: (job as any).updatedAt ?? undefined,
        },
        claims,
      },
      { status: 200 },
    );

    // keine Zwischen-Caches
    res.headers.set("Cache-Control", "no-store");

    logger.info(
      { jobId, claimCount: claims.length, tookMs: Date.now() - t0 },
      "FACTCHECK_STATUS_OK",
    );
    return res;
  } catch (e: any) {
    if (e instanceof ZodError) {
      const details = e.issues.map(
        (i) => `${i.path.join(".") || "(root)"}: ${i.message}`,
      );
      const fe = formatError("VALIDATION_FAILED", "Invalid jobId", { details });
      logger.warn({ fe }, "FACTCHECK_STATUS_VALIDATION_FAIL");
      return NextResponse.json(fe, { status: 400 });
    }
    const fe = formatError(
      "INTERNAL_ERROR",
      "Unexpected failure",
      e?.message ?? String(e),
    );
    logger.error({ fe, e }, "FACTCHECK_STATUS_FAIL");
    return NextResponse.json(fe, { status: 500 });
  }
}
