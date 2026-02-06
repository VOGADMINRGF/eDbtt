import { NextRequest, NextResponse } from "next/server";
import { coreCol, piiCol } from "@core/db/db/triMongo";
import { ensureVerificationDefaults, upgradeVerificationLevel } from "@core/auth/verificationTypes";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import {
  applySessionCookies,
  CREDENTIAL_COLLECTION,
  type CoreUserAuthSnapshot,
  type PiiUserCredentials,
  sha256,
} from "../../../sharedAuth";
import type { UserRole } from "@/types/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 6;

function sanitizeNext(value?: string | null) {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (trimmed.includes("://")) return null;
  return trimmed;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?._id) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { code, next } = (await req.json().catch(() => ({}))) as {
      code?: string | number;
      next?: string | null;
    };
    const codeStr = typeof code === "string" || typeof code === "number" ? String(code).trim() : "";
    if (!codeStr) {
      return NextResponse.json({ ok: false, error: "CODE_REQUIRED" }, { status: 400 });
    }

    const Users =
      await coreCol<CoreUserAuthSnapshot & { email?: string | null }>("users");
    const userDoc = await Users.findOne(
      { _id: user._id },
      {
        projection: {
          verification: 1,
          role: 1,
          roles: 1,
          groups: 1,
          accessTier: 1,
          profile: 1,
          email: 1,
        },
      },
    );
    if (!userDoc) {
      return NextResponse.json({ ok: false, error: "USER_NOT_FOUND" }, { status: 404 });
    }

    const credsCol = await piiCol<PiiUserCredentials>(CREDENTIAL_COLLECTION);
    const creds = await credsCol.findOne({ coreUserId: user._id });
    if (!creds || !creds.identityEmailCodeHash) {
      return NextResponse.json({ ok: false, error: "NO_PENDING_CODE" }, { status: 400 });
    }

    const now = new Date();
    if (creds.identityEmailCodeExpiresAt && creds.identityEmailCodeExpiresAt < now) {
      return NextResponse.json({ ok: false, error: "CODE_EXPIRED" }, { status: 400 });
    }

    const attempts = Number(creds.identityEmailCodeAttempts ?? 0);
    if (attempts >= MAX_ATTEMPTS) {
      return NextResponse.json({ ok: false, error: "TOO_MANY_ATTEMPTS" }, { status: 429 });
    }

    const hashed = sha256(codeStr);
    if (hashed !== creds.identityEmailCodeHash) {
      await credsCol.updateOne(
        { _id: creds._id },
        { $inc: { identityEmailCodeAttempts: 1 } },
      );
      return NextResponse.json({ ok: false, error: "INVALID_CODE" }, { status: 400 });
    }

    const verification = ensureVerificationDefaults(userDoc.verification as any);
    const methods = new Set<string>(verification.methods ?? []);
    methods.add("email_code");
    const nextVerification: any = {
      ...verification,
      level: upgradeVerificationLevel(verification.level, "soft"),
      methods: Array.from(methods),
      lastVerifiedAt: now,
      twoFA: {
        ...(verification as any).twoFA,
        enabled: true,
        method: "email",
      },
    };

    await Users.updateOne(
      { _id: user._id },
      {
        $set: {
          verification: nextVerification,
          role: "verified",
          updatedAt: now,
        },
      },
    );

    await credsCol.updateOne(
      { _id: creds._id },
      {
        $set: {
          twoFactorEnabled: true,
          twoFactorMethod: "email",
          updatedAt: now,
        },
        $unset: {
          identityEmailCodeHash: "",
          identityEmailCodeExpiresAt: "",
          identityEmailCodeAttempts: "",
          identityEmailCodeSentAt: "",
        },
      },
    );

    const baseRoles: Array<UserRole | { role?: string; subRole?: string; premium?: boolean }> =
      Array.isArray(userDoc.roles) ? [...userDoc.roles] : [];
    if (userDoc.role) {
      const hasRole = baseRoles.some(
        (r: any) => (typeof r === "string" ? r : r?.role) === userDoc.role,
      );
      if (!hasRole) {
        baseRoles.push(userDoc.role as UserRole);
      }
    }
    const hasVerifiedRole = baseRoles.some(
      (r: any) => (typeof r === "string" ? r : r?.role) === "verified",
    );
    const nextRoles = hasVerifiedRole
      ? baseRoles
      : [...baseRoles, "verified" as UserRole];

    const sessionUser: CoreUserAuthSnapshot = {
      ...userDoc,
      _id: user._id,
      verification: nextVerification,
      role: "verified",
      roles: nextRoles,
    };
    await applySessionCookies(sessionUser);

    const nextUrl = sanitizeNext(next) ?? "/account?welcome=1";
    return NextResponse.json({ ok: true, next: nextUrl });
  } catch (err: any) {
    console.error("[identity-email] verify failed", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
