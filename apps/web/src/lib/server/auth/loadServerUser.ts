import type { Collection } from "mongodb";
import { ObjectId, getCol } from "@core/db/triMongo";
import type { AuthUser } from "@/hooks/auth";
import { readSession } from "@/utils/session";
import { normalizeAccessTier } from "@/config/accessTiers";

function normalizeInitialUserRoles(value: unknown): string[] {
  if (!Array.isArray(value)) return ["user"];
  const safeRoles = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean);
  return safeRoles.length > 0 ? safeRoles : ["user"];
}

export async function loadServerUser(): Promise<AuthUser | null | undefined> {
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

    const roles = normalizeInitialUserRoles(doc.roles);
    const accessTier = normalizeAccessTier(doc.accessTier ?? doc.b2cPlanId ?? null);
    return {
      id: String(doc._id),
      email: doc.email ?? null,
      name: doc.name ?? null,
      roles,
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
    return undefined;
  }
}
