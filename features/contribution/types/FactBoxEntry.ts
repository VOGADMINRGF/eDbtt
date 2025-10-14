/**
 * Eintrag für die Faktenbox (Quellen, Belege, Fact-Checking)
 */
import { ModAction } from "./ModAction";

export interface FactBoxEntry {
  _id?: string;
  fact: string;                   // Faktenaussage/Kerninformation
  source: string;                 // Klartext-Quelle
  sourceUrl?: string;             // URL/DOI, wenn verfügbar
  reviewStatus: 'geprüft' | 'offen' | 'umstritten';
  reviewLog?: ModAction[];        // Historie/Prüfer:innen
  addedBy: string;                // userId/Org
  addedByRole?: string;           // 'Redaktion', 'KI', ...
  organizationId?: string;
  isAiGenerated?: boolean;
  aiModelVersion?: string;
  tags?: string[];
  languages?: string[];
  confidenceScore?: number;       // KI: 0–1
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
  archived?: boolean;
  notes?: string;                 // Kontext/Hintergrund
  legalNotice?: string;           // Copyright, Lizenz etc.
  version?: number;               // Für Revisionierung
}
