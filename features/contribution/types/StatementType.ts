import { GamificationStats } from "./GamificationStats";
import { ModAction } from "../../common/types/ModAction";
import { FactBoxEntry } from "./FactBoxEntry";

export interface Statement {
  _id?: string;
  contributionId: string;
  text: string;
  createdBy: string;
  isMainStatement: boolean;
  votes: {
    agree: number;
    disagree: number;
    undecided: number;
    trends?: Record<string, number>;
  };
  swipeable: boolean;
  factCheckStatus: 'geprüft' | 'offen' | 'umstritten';
  sourceLinks?: string[];
  relatedStatementIds?: string[];
  gamificationStats?: GamificationStats;
  modLog?: ModAction[];
  factBox?: FactBoxEntry[];
  languages?: string[];
  organizationId?: string;
  archived?: boolean;
  deleted?: boolean;
  version?: number;
}
