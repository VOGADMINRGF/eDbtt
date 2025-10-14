// features/contribution/types/ContributionType.ts
// Persistente Domänen-Typen einer Contribution (DB/Transport)

import { FactBoxEntry } from "./FactBoxEntry";
import { GamificationStats } from "./GamificationStats";
import { ModAction } from "../../common/types/ModAction";
import { QRCodeEntry } from "./QRCodeEntry";
import { FeedReference } from "./FeedReference";
import { PoliticalArea } from "./PoliticalArea";

export type ContributionStatus = "offen" | "geschlossen" | "review" | "archiviert";

export interface Contribution {
  _id?: string;

  // Autorenschaft
  authorIds: string[]; // Haupt- & Co-Autoren (User-IDs)
  roles: { [userId: string]: "autor" | "coautor" | "redaktion" | "kurator" | "gast" };

  // Inhalte
  title: string;
  summary?: string;
  content: string;
  topicTags: string[];

  // Kontext
  region: PoliticalArea;
  language: string;

  // Medien
  media?: {
    image?: string;
    video?: string;
    externalLink?: string;
  };

  // Meta
  createdAt?: string;
  updatedAt?: string;
  status: ContributionStatus;
  version?: number;

  // Beziehungen
  relatedContributionIds?: string[];
  parentContributionId?: string;
  organizationId?: string;

  // Externe Quelle
  externalSource?: {
    name: string;
    url: string;
    reviewStatus: "geprüft" | "unbestätigt" | "umstritten" | "fehlt";
    tendency?: string;
  };

  // Zusatzinfos
  factsBox?: FactBoxEntry[];
  qrCodes?: QRCodeEntry[];
  feedReferences?: FeedReference[];

  // Moderation / Gamification
  modLog?: ModAction[];
  gamificationStats?: GamificationStats;

  // Interaktion
  commentsEnabled?: boolean;
  engagementStats: {
    votes: number;
    swipes: number;
    follows: number;
    bookmarks: number;
    shares: number;
    trending: boolean;
  };

  // Analyse / Statistik
  demographicStats?: { [key: string]: number };
  statementIds?: string[];
  politicalTendency?: string; // KI-/Redaktions-Tendenz

  // Lifecycle
  archived?: boolean;
  deleted?: boolean;

  // Flags
  isInfoOnly?: boolean;
}
