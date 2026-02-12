export type UserRole =
  | "guest"
  | "user"
  | "verified"
  | "editor"
  | "journalist"
  | "redaktion"
  | "moderator"
  | "staff"
  | "admin"
  | "ngo"
  | "politics"
  | "legitimized"
  | "owner"
  | "premium"
  | "superadmin"
  | "kurator"
  | "creator";

export const SUPERADMIN_ONLY_ROLES: UserRole[] = ["superadmin"];
