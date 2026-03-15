const MANAGEMENT_ROLES = new Set([
  "admin",
  "superadmin",
  "staff",
  "moderator",
  "editor",
  "journalist",
  "redaktion",
  "creator",
  "owner",
]);

export function canManageTopicRoundMerge(roles?: string[] | null) {
  if (!Array.isArray(roles) || roles.length === 0) return false;
  return roles.some((role) => MANAGEMENT_ROLES.has(String(role).toLowerCase()));
}

export function canManageTopicRoundGovernance(roles?: string[] | null) {
  return canManageTopicRoundMerge(roles);
}
