/**
 * Projekttyp/Event für Aktionen, Kampagnen, Veranstaltungen.
 */
export interface Project {
    id: string;
    name: string;
    description: string;
    startDate: string;                        // ISO-String
    endDate?: string;
    region?: string;
    organizerIds: string[];
    participants?: string[];
    status: 'planned' | 'active' | 'completed' | 'archived';
    createdAt: string;
    updatedAt?: string;
  }
  