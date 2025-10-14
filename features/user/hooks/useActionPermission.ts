import { useMemo } from "react";
import { IUserProfile } from "../../../apps/web/src/models/pii/UserProfile";

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

export function useActionPermission(user: IUserProfile | null) {
  return useMemo(() => ({
    can: (action: PermissionAction) => {
      if (!user || user.status !== "active") return false;
      const active = user.roles[user.activeRole] || { role: "user" };

      // Admin/Mod always true
      if (["admin", "superadmin", "moderator"].includes(active.role)) return true;

      // Bürger:innen
      if (["user", "citizen"].includes(active.role)) {
        if (["writePost", "vote", "comment"].includes(action)) return true;
        if (action === "regionVote") return user.verification === "legitimized";
        if (action === "premiumFeature") return user.premium;
        return false;
      }

      // NGOs
      if (active.role === "ngo") {
        if (active.subRole === "admin" && ["manageTeam", "createEvent", "report"].includes(action)) return true;
        if (active.subRole === "editor" && ["writePost", "editPost"].includes(action)) return true;
        if (active.subRole === "user" && action === "writePost") return true;
        if (action === "premiumFeature") return user.premium;
        return false;
      }

      // Politik/Partei
      if (["politics", "party"].includes(active.role)) {
        if (active.subRole === "admin" && ["manageTeam", "startPolicyReport", "analyze"].includes(action)) return true;
        if (active.subRole === "speaker" && ["writePost", "publicRelations"].includes(action)) return true;
        if (active.subRole === "user" && ["writePost", "voteInternal"].includes(action)) return true;
        if (action === "premiumFeature") return user.premium;
        return false;
      }
      return false;
    }
  }), [user]);
}
