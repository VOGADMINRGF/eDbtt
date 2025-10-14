/**
 * Fortschritt und Auszeichnungen (Badges, XP, Levels) für User/Beitrag
 */
export interface GamificationStats {
  _id?: string;
  badges: string[];                       // z. B. ['TopVoter', 'Profi']
  xp: number;
  levels: { [topic: string]: number; };   // XP/Level pro Thema
  milestones: string[];
  userId?: string;
  contributionId?: string;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
  eventsLog?: GamificationEvent[];
  archived?: boolean;
  version?: number;
}

export interface GamificationEvent {
  type: 'badge' | 'level' | 'milestone' | 'xp' | 'quest' | 'challenge' | 'team';
  value: string | number;
  date: string;
  details?: string;
  causedBy?: string;      // Wer/was hat ausgelöst?
}
