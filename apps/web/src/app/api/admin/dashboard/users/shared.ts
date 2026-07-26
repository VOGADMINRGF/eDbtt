import type { PiiUserCredentials } from "@/app/api/auth/sharedAuth";
import type { UserRole } from "@/types/user";
import type { AccessTier } from "@features/pricing/types";
import type { ObjectId } from "@core/db/triMongo";

export type AdminDashboardUserDoc = {
  _id: ObjectId;
  email: string;
  email_lc?: string | null;
  name?: string | null;
  roles?: UserRole[];
  role?: UserRole | null;
  createdAt?: Date;
  lastLoginAt?: Date;
  accessTier?: string | null;
  b2cPlanId?: string | null;
  tier?: string | null;
  stats?: { lastSeenAt?: Date };
  membership?: any;
  settings?: { newsletterOptIn?: boolean | null };
  newsletterOptIn?: boolean | null;
  verifiedEmail?: boolean | null;
  emailVerified?: boolean | null;
  suspended?: boolean | null;
  suspendedAt?: Date | null;
  disabledAt?: Date | null;
  sessionRevokedAt?: Date | null;
  accountPurpose?: string | null;
  isQaAccount?: boolean | null;
  verification?: {
    twoFA?: {
      enabled?: boolean | null;
      secret?: string | null;
    } | null;
    [key: string]: unknown;
  } | null;
};

export type AdminDashboardCredentialDoc = Pick<
  PiiUserCredentials,
  "coreUserId" | "passwordHash" | "twoFactorEnabled" | "otpSecret" | "twoFactorMethod"
>;

export type AdminDashboardUser = {
  id: string;
  email: string;
  name?: string | null;
  roles: string[];
  packageCode?: string | null;
  membershipStatus?: string | null;
  newsletterOptIn: boolean;
  accessTier?: AccessTier | string | null;
  planCode?: string | null;
  createdAt?: string | null;
  lastSeenAt?: string | null;
  lastLoginAt?: string | null;
  emailVerified: boolean;
  credentialsPresent: boolean;
  twoFactorEnabled: boolean;
  accountDisabled: boolean;
  accountPurpose: string | null;
  isQaAccount: boolean;
};

export const MANAGED_USER_ROLES: UserRole[] = [
  "guest",
  "user",
  "verified",
  "editor",
  "journalist",
  "redaktion",
  "moderator",
  "staff",
  "admin",
  "ngo",
  "politics",
  "legitimized",
  "owner",
  "premium",
  "superadmin",
  "kurator",
  "creator",
];

export function resolveUserRoles(doc: Pick<AdminDashboardUserDoc, "roles" | "role">) {
  return Array.isArray(doc.roles) ? doc.roles : doc.role ? [doc.role] : [];
}

export function normalizeManagedRoles(input: string[]): UserRole[] {
  const deduped = new Set<UserRole>();
  for (const raw of input) {
    const value = String(raw || "").trim() as UserRole;
    if (MANAGED_USER_ROLES.includes(value)) {
      deduped.add(value);
    }
  }
  return Array.from(deduped);
}

export function hasAdminAccess(roles: string[]) {
  return roles.includes("admin") || roles.includes("superadmin");
}

export function hasSuperadminRole(roles: string[]) {
  return roles.includes("superadmin");
}

export function activeAccountFilter() {
  return {
    suspended: { $ne: true },
    $and: [
      { $or: [{ suspendedAt: null }, { suspendedAt: { $exists: false } }] },
      { $or: [{ disabledAt: null }, { disabledAt: { $exists: false } }] },
    ],
  };
}

export function adminAccessFilter() {
  return {
    $or: [{ roles: { $in: ["admin", "superadmin"] } }, { role: { $in: ["admin", "superadmin"] } }],
  };
}

export function superadminAccessFilter() {
  return {
    $or: [{ roles: "superadmin" }, { role: "superadmin" }],
  };
}

export function resolveAccountPurpose(doc: Pick<AdminDashboardUserDoc, "accountPurpose" | "isQaAccount">) {
  const purpose = typeof doc.accountPurpose === "string" ? doc.accountPurpose.trim() : "";
  if (purpose) return purpose;
  return doc.isQaAccount ? "qa" : null;
}

export function isQaAccountDoc(doc: Pick<AdminDashboardUserDoc, "accountPurpose" | "isQaAccount">) {
  const purpose = resolveAccountPurpose(doc);
  return Boolean(doc.isQaAccount || purpose === "qa" || purpose === "test");
}

export function isAccountDisabled(doc: Pick<AdminDashboardUserDoc, "suspended" | "suspendedAt" | "disabledAt">) {
  return Boolean(doc.suspended || doc.suspendedAt || doc.disabledAt);
}

export function credentialsPresent(credentials?: AdminDashboardCredentialDoc | null) {
  if (!credentials) return false;
  return Boolean(
    String(credentials.passwordHash || "").trim() ||
      String(credentials.otpSecret || "").trim() ||
      credentials.twoFactorEnabled,
  );
}

export function mapAdminDashboardUser(
  doc: AdminDashboardUserDoc,
  credentials?: AdminDashboardCredentialDoc | null,
): AdminDashboardUser {
  const roles = resolveUserRoles(doc);
  const pkg = doc.membership?.edebatte?.planKey ?? null;
  const membershipStatus = doc.membership?.status ?? null;
  const lastSeen = doc.stats?.lastSeenAt ?? doc.lastLoginAt ?? null;
  const newsletterOptIn = Boolean(doc.settings?.newsletterOptIn ?? doc.newsletterOptIn);
  const planCode = doc.membership?.planCode ?? null;
  const accessTier = doc.accessTier ?? doc.b2cPlanId ?? doc.tier ?? null;
  const accountPurpose = resolveAccountPurpose(doc);

  return {
    id: String(doc._id),
    email: doc.email,
    name: doc.name ?? null,
    roles,
    packageCode: pkg,
    membershipStatus,
    newsletterOptIn,
    accessTier,
    planCode,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : null,
    lastSeenAt: lastSeen ? new Date(lastSeen).toISOString() : null,
    lastLoginAt: doc.lastLoginAt ? new Date(doc.lastLoginAt).toISOString() : null,
    emailVerified: Boolean(doc.verifiedEmail ?? doc.emailVerified),
    credentialsPresent: credentialsPresent(credentials),
    twoFactorEnabled: Boolean(
      credentials?.twoFactorEnabled ||
        credentials?.otpSecret ||
        doc.verification?.twoFA?.enabled ||
        doc.verification?.twoFA?.secret,
    ),
    accountDisabled: isAccountDisabled(doc),
    accountPurpose,
    isQaAccount: isQaAccountDoc(doc),
  };
}
