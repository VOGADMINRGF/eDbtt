import { ModAction } from "../../common/types/ModAction"; // Nur falls du ein ModLog pflegst!

/**
 * Interner/Analytics Report für Auswertungen, Charts, Plattformstatistik.
 * Wird für Admin-/Systemauswertungen verwendet, nicht direkt für User.
 */
export interface ReportChart {
  type: 'bar' | 'line' | 'heatmap' | 'pie' | 'custom'; // Chart-Typen
  data: any;                         // Rohdaten für das Chart
  description?: string;               // Beschreibung der Grafik/Auswertung
}

export type AnalyticsReportStatus = 'draft' | 'published' | 'archived';

export interface AnalyticsReport {
  _id?: string;                       // Datenbank-ID (optional)
  contributionId: string;             // Bezug zum Beitrag
  summary: string;                    // Kurzbeschreibung/Fazit
  charts: ReportChart[];              // Auswertungs-Grafiken
  details: string;                    // Ausführliche Analyse
  publishedBy: string;                // User/Admin, der Report veröffentlicht hat
  status: AnalyticsReportStatus;      // Status
  relatedReportIds?: string[];        // Verknüpfte Reports
  createdAt?: string;                 // Erstellung
  updatedAt?: string;                 // Aktualisierung
  modLog?: ModAction[];               // Moderationsprotokoll
  tags?: string[];                    // Schlagworte
  organizationId?: string;            // Zugehörige Organisation
  archived?: boolean;                 // Soft-Delete
  deleted?: boolean;                  // Soft-Delete
  version?: number;                   // Versionierung
}
