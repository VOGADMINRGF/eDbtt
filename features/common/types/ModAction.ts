/**
 * Moderations-/Prüf-Aktion (Audit-Trail, Nachvollziehbarkeit)
 */
export interface ModAction {
  _id?: string;
  action: string;                 // 'reviewed', 'flagged', ...
  date: string;
  by: string;                     // userId
  byRole?: string;
  organizationId?: string;
  reason?: string;
  statusAfter?: string;
  ipAddress?: string;
  deviceInfo?: string;
  notes?: string;
  legalReference?: string;
  archived?: boolean;
  version?: number;
}
