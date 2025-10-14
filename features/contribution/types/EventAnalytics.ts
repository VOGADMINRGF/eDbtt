export interface EventAnalytics {
    participationRate: number;
    votesCast: number;
    averageEngagement: number;
    departmentBreakdown?: { [department: string]: number };
    payrollBreakdown?: { [payrollGroup: string]: number };
    historicTendencies?: { [agendaItemId: string]: ExpectedTendency };
    feedbackScores?: number[];
    suggestionsAccepted?: number;
    suggestionsRejected?: number;
  }
  