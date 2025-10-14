export interface ParticipantEntry {
    userId: string;
    displayName?: string;
    email?: string;
    role?: string;                 // z. B. 'Vorstand', 'Beisitzer', 'Employee', 'Delegate'
    payrollGroup?: string;         // z. B. 'A12', 'BAT4', 'Tarif E5', 'Azubi'
    department?: string;
    joinTime?: string;
    leaveTime?: string;
    votingRights: boolean;
    present: boolean;
    votesCast?: number;
    isRemote?: boolean;
  }
  