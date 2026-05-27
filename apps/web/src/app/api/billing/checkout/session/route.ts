import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  canStartSelfServiceCheckout,
  resolvePaymentProviderContract,
} from "@features/pricing";
import { getRegionOrganizationRuntimeRepo } from "@features/region";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { getCheckoutSessionsRepo } from "@features/pricing/server/checkoutSessionsRepo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    planId: z.string().trim().min(1),
    organizationId: z.string().trim().min(1),
    amount: z.number().nonnegative(),
    currency: z.string().trim().length(3).optional(),
    returnUrl: z.string().trim().min(1),
    cancelUrl: z.string().trim().min(1),
    orderRecordId: z.string().trim().min(1).optional(),
  })
  .strict();

function sanitizeInternalPath(value: string): string | null {
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.includes("://")) return null;
  return value;
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  const userId = user?._id?.toHexString?.() ?? null;
  if (!user || !user.sessionValid || !userId) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const provider = resolvePaymentProviderContract();
  if (!canStartSelfServiceCheckout(provider)) {
    return NextResponse.json(
      {
        ok: false,
        error: "checkout_unavailable",
        provider,
        fallback: "manual_invoice",
      },
      { status: 409 },
    );
  }

  const memberships = await getRegionOrganizationRuntimeRepo().listMembershipsForUser(userId);
  const allowed = memberships.some(
    (membership) =>
      membership.organizationId === parsed.data.organizationId &&
      membership.verificationStatus !== "rejected" &&
      membership.verificationStatus !== "revoked",
  );
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "organization_scope_forbidden" }, { status: 403 });
  }

  const returnUrl = sanitizeInternalPath(parsed.data.returnUrl);
  const cancelUrl = sanitizeInternalPath(parsed.data.cancelUrl);
  if (!returnUrl || !cancelUrl) {
    return NextResponse.json({ ok: false, error: "invalid_redirect_target" }, { status: 400 });
  }

  const session = await getCheckoutSessionsRepo().createCheckoutSession({
    provider: provider.provider,
    planId: parsed.data.planId,
    organizationId: parsed.data.organizationId,
    userId,
    amount: parsed.data.amount,
    currency: (parsed.data.currency ?? "EUR").toUpperCase(),
    returnUrl,
    cancelUrl,
    orderRecordId: parsed.data.orderRecordId ?? null,
  });

  return NextResponse.json({
    ok: true,
    provider,
    session,
  });
}
