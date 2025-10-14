import { AgendaItem } from "./AgendaItem";
import { ParticipantEntry } from "./ParticipantEntry";
import { VotingRule } from "./VotingRule";
import { EventAnalytics } from "./EventAnalytics";

export interface OrganizationEvent {
  _id?: string;
  organizationId: string;
  title: string;
  eventType: 'parteitag' | 'mitgliederversammlung' | 'kreistag' | 'bürgerversammlung' | 'mitarbeitermeeting' | 'team-event' | 'hybrid' | 'other';
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  streamUrl?: string;
  agendaItems: AgendaItem[];
  participants: ParticipantEntry[];
  quorum?: number;
  votingRules?: VotingRule[];
  allowedRoles?: string[];
  accessMode: 'public' | 'private' | 'invited' | 'org-internal';
  qrCodes?: string[];
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
  isActive: boolean;
  isVotingLive?: boolean;
  votingWindow?: {
    start: string;
    end: string;
  };
  analytics?: EventAnalytics;
  eventTags?: string[];
  notes?: string;
  archived?: boolean;
  deleted?: boolean;
  version?: number;
}
