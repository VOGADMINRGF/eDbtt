export interface ExpectedTendency {
    basedOn: 'payroll' | 'department' | 'role' | 'historic';
    predictedOutcome?: string;
    confidence?: number;       // 0–1
    suggestionForUser?: string;
    suggestionEngineLog?: string;   // AI/Rule-Details für Transparenz
  }