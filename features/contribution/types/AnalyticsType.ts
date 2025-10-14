/**
 * Analytics/Statistik-Eintrag (Events, Beiträge, Themen)
 */
export interface AnalyticsStats<T = any> {
  _id?: string;
  date: string;
  topic: string;
  region?: string;
  organizationId?: string;
  projectId?: string;
  userId?: string;
  count: number;
  breakdown?: T;                      // z. B. { beruf: number, altersgruppe: number }
  tags?: string[];
  calculatedFields?: Record<string, any>;
  confidenceScore?: number;
  dataSource?: string;
  createdAt?: string;
  updatedAt?: string;
  archived?: boolean;
  version?: number;
}
