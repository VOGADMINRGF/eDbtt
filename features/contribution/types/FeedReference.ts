/**
 * Referenz auf externe Feeds/Quellen (BND, Correctiv, Media, Social)
 */
export interface FeedReference {
  _id?: string;
  source: string;                       // z. B. 'Correctiv', 'BND'
  url: string;
  sourceType?: 'rss' | 'api' | 'html' | 'social' | 'custom';
  fetchedAt: string;
  reviewed?: boolean;
  reviewedBy?: string;
  reviewStatus?: 'geprüft' | 'ausstehend' | 'abgelehnt' | 'umstritten';
  notes?: string;
  tags?: string[];
  organizationId?: string;
  importedBy?: string;
  confidenceScore?: number;
  languages?: string[];
  legalNotice?: string;
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
  archived?: boolean;
  version?: number;
}
