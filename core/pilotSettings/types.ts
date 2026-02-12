export type PilotCheckLevel = 0 | 1 | 2;

export interface PilotSettings {
  id?: string;
  settingsKey: "default";

  checkLevel: PilotCheckLevel;
  dailyBudget: number;
  perTopicBudget: number;
  autoRunEnabled: boolean;
  maxItemsPerFeed: number;

  updatedAt?: Date | string;
  updatedByUserId?: string | null;
}

export interface PilotSettingsChange {
  id?: string;
  settingsKey: "default";
  changedAt: Date | string;
  changedByUserId?: string | null;
  patch: Partial<Omit<PilotSettings, "id" | "settingsKey" | "updatedAt" | "updatedByUserId">>;
}

