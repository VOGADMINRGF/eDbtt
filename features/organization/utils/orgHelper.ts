
import Organization from "../models/Organization";

export function isOrgPremium(org: Organization): boolean {
  return org.premium && org.verified;
}

export function getOrgMemberLimit(org: Organization): number {
  return org.limits?.teamSize ?? 5;
}

export function canAddMoreMembers(org: Organization): boolean {
  return org.members.length < getOrgMemberLimit(org);
}
