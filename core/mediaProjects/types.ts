export type MediaProjectStatus = "draft" | "active" | "archived";
export type MediaProjectOptionStatus = "approved" | "proposed" | "rejected";

export type MediaProject = {
  id: string;
  title: string;
  summary?: string | null;
  status: MediaProjectStatus;
  minOptions: number;
  createdAt: Date;
  updatedAt: Date;
};

export type MediaProjectTopic = {
  id: string;
  projectId: string;
  title: string;
  order?: number;
  createdAt: Date;
  updatedAt: Date;
};

export type MediaProjectOption = {
  id: string;
  projectId: string;
  topicId: string;
  label: string;
  labelKey: string;
  status: MediaProjectOptionStatus;
  votes: number;
  proposedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
};
