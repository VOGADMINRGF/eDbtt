// features/user/types/UserType.ts
import { GamificationStats } from "../../contribution/types/GamificationStats";

// Haupt-Name: UserType
export interface UserType {
  _id?: string;
  roles: ("user" | "scout" | "moderator" | "kurator" | "redaktion" | "gast")[];
  xpStats: { [topic: string]: number };
  badgeIds?: string[];
  activityFeed?: UserActivity[];
  region?: {
    country?: string;
    state?: string;
    district?: string;
    municipality?: string;
    politicalAreaId?: string;
  };
  ageGroup?: "16-25" | "26-35" | "36-45" | "46-60" | "60+";
  profession?: string;
  educationLevel?: string;
  gender?: string;
  profileVerified?: boolean;
  payrollGroup?: string;
  department?: string;
  expectedTendency?: string;
  votingHistory?: string[];
  gamificationStats?: GamificationStats;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
  archived?: boolean;
  deleted?: boolean;
  version?: number;
}

// Backwards-Compat: alias
export type UserProfile = UserType;

// Falls UserActivity woanders liegt, importiere/definiere es hier:
export interface UserActivity {
  // minimal, damit TS nicht meckert
  type?: string;
  at?: string;
  payload?: any;
}
