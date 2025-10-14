import { VotingRule } from "./VotingRule";
import { ExpectedTendency } from "./ExpectedTendency";
import { VotingStats } from "./VotingStats";

export interface AgendaItem {
  _id?: string;
  title: string;
  description?: string;
  speakerIds?: string[];
  relatedContributionIds?: string[];
  votingEnabled: boolean;
  votingType: 'statement-swipe' | 'single-choice' | 'multiple-choice' | 'score' | 'ranking' | 'open';
  votingQuorum?: number;
  votingRules?: VotingRule[];
  suggestionEngineEnabled?: boolean;
  expectedTendency?: ExpectedTendency;
  liveResultsVisible?: boolean;
  votingStats?: VotingStats;
  notes?: string;
  archived?: boolean;
  deleted?: boolean;
  version?: number;
}
