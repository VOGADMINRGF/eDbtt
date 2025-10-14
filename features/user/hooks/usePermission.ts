// features/user/hooks/usePermission.ts

import { useMemo } from "react";
import type { IUserProfile } from "../../../apps/web/src/models/pii/UserProfile";
import { useAuth } from "./useAuth";

/* ─────────────────────────────────────────────────────────────
 * Hook #1: Rollen-Check gegen aktiven User aus dem Auth-Context
 * ─────────────────────────────────────────────────────────────
 */
export function usePermission(required: string | string[]) {
  const { user } = useAuth();
  if (!user) return false;

  const active = user.roles?.[user.activeRole]?.role;
  if (!active) return false;

  return Array.isArray(required) ? required.includes(active) : active === required;
}

/* ─────────────────────────────────────────────────────────────
 * Aktionen-/Rechte-Definition
 * ─────────────────────────────────────────────────────────────
 */
export type PermissionAction =
  | "writePost"
  | "vote"
  | "comment"
  | "manageTeam"
  | "createEvent"
  | "report"
  | "editPost"
  | "startPolicyReport"
  | "analyze"
  | "publicRelations"
  | "voteInternal"
  | "premiumFeature"
  | "regionVote"
  | "adminPanel";

/* ─────────────────────────────────────────────────────────────
 * Hook #2: Policy-Check für einen übergebenen User (umbenannt)
 *  - Bitte diesen Namen verwenden, um den Doppel-Export zu vermeiden.
 * ─────────────────────────────────────────────────────────────
 */
export function usePermissionFromUser(user: IUserProfile | null) {
  return useMemo(() => {
    const can = (action: PermissionAction): boolean => {
      if (!user || user.status !== "active") return false;

      // Multi-Account: aktiver Eintrag oder Fallback
      const active = user.roles?.[user.activeRole] ?? { role: "user" as const };

      // Harte Admins
      if (active.role === "admin" || active.role === "superadmin") return true;

      // Bürger:innen
      if (active.role === "user" || active.role === "citizen") {
        if (action === "regionVote") return user.verification === "legitimized";
        if (action === "premiumFeature") return !!user.premium;
        return ["writePost", "vote", "comment"].includes(action);
      }

      // NGOs
      if (active.role === "ngo") {
        if (active.subRole === "admin" && ["manageTeam", "createEvent", "report"].includes(action)) return true;
        if (active.subRole === "editor" && ["writePost", "editPost"].includes(action)) return true;
        if (active.subRole === "user" && action === "writePost") return true;
        if (action === "premiumFeature") return !!user.premium;
        return false;
      }

      // Parteien/Politik
      if (active.role === "politics" || active.role === "party") {
        if (active.subRole === "admin" && ["manageTeam", "startPolicyReport", "analyze"].includes(action)) return true;
        if (active.subRole === "speaker" && ["writePost", "publicRelations"].includes(action)) return true;
        if (active.subRole === "user" && ["writePost", "voteInternal"].includes(action)) return true;
        if (action === "premiumFeature") return !!user.premium;
        return false;
      }

      return false;
    };

    return { can };
  }, [user]);
}
