export type ProjectStatus = "planned" | "active" | "completed" | "archived";

export type ProjectOptionStatus = "approved" | "proposed";

export type ProjectOption = {
  id: string;
  label: string;
  status: ProjectOptionStatus;
  createdAt: string;
};

export type ProjectTopic = {
  id: string;
  title: string;
  description?: string;
  options: ProjectOption[];
};

/**
 * Projekttyp/Event für Aktionen, Kampagnen, Veranstaltungen.
 */
export type Project = {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  region?: string;
  organizerIds: string[];
  status: ProjectStatus;
  topics: ProjectTopic[];
  createdAt: string;
};
