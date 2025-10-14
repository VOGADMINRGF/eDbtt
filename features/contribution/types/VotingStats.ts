export interface VotingStats {
    votesTotal: number;
    votesByOption: { [option: string]: number };
    votesByRole?: { [role: string]: number };
    votesByPayroll?: { [payrollGroup: string]: number };
    timeSeries?: { [timestamp: string]: number };
  }