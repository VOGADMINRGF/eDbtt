export interface VotingRule {
  type: 'simple-majority' | 'absolute-majority' | 'two-thirds' | 'unanimity' | 'weighted' | 'payroll-weighted' | 'custom';
  description?: string;
  weightMap?: { [role: string]: number }; // z. B. NGO: 2, Wissenschaft: 1.5, Bürger: 1
  minQuorum?: number; // Mindestbeteiligung (optional)
}