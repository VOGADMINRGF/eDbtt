

import { IUserProfile } from "../../../apps/web/src/models/pii/UserProfile";

/**
 * Berechnet den TrustScore basierend auf verschiedenen Faktoren.
 */
export function calculateTrustScore(user: IUserProfile): number {
  let score = 0;

  // Grundscore für aktive User
  if (user.status === "active") score += 10;

  // Verification Bonus
  if (user.verification === "verified") score += 20;
  else if (user.verification === "legitimized") score += 40;

  // Premium Bonus
  if (user.premium) score += 15;

  // Voting-Aktivität Bonus
  score += Math.min(user.votedStatements.length, 50);

  // Badges Bonus (je Badge +5)
  score += user.badges.length * 5;

  // Interessen & Regionen (Personalisierung Bonus)
  score += Math.min(user.interests.length * 2, 10);
  score += Math.min(user.regions.length * 2, 10);

  // TrustScore darf 100 nicht übersteigen
  return Math.min(score, 100);
}
