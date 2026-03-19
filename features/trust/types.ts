export const PERSON_TRUST_LEVELS = [
  "anonymous",
  "registered",
  "verified",
  "institutional",
  "editorial",
] as const;
export type PersonTrustLevel = (typeof PERSON_TRUST_LEVELS)[number];

export const CONTENT_TRUST_LEVELS = [
  "unverified",
  "source_based",
  "disputed",
  "checked",
] as const;
export type ContentTrustLevel = (typeof CONTENT_TRUST_LEVELS)[number];

export const ROOM_TYPES = [
  "public",
  "community",
  "official",
  "editorial",
  "internal",
  "hybrid",
] as const;
export type RoomType = (typeof ROOM_TYPES)[number];

export const GOVERNANCE_ACTOR_ROLES = [
  "community",
  "editor",
  "reviewer",
  "admin",
  "institutional_actor",
  "editorial_actor",
] as const;
export type GovernanceActorRole = (typeof GOVERNANCE_ACTOR_ROLES)[number];

export type GovernanceActor = {
  userId: string;
  role: GovernanceActorRole;
  personTrust?: PersonTrustLevel | null;
  isAdmin?: boolean;
  scopedOwnerIds?: string[];
  scopedEntityIds?: string[];
};
