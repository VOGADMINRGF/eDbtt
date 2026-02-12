import type { ObjectId } from "@core/db/triMongo";

export type ProjectStatus = "planned" | "active" | "completed" | "archived";
export type ProjectOptionStatus = "approved" | "proposed";

export type ProjectOption = {
  id: string;
  label: string;
  status: ProjectOptionStatus;
  createdAt: Date;
  createdBy?: string | null;
};

export type ProjectTopic = {
  id: string;
  title: string;
  description?: string | null;
  options: ProjectOption[];
  createdAt: Date;
  updatedAt: Date;
};

export interface ProjectDoc {
  _id?: ObjectId;
  title: string;
  description?: string | null;
  regionCode?: string | null;
  orgId?: string | null;
  status: ProjectStatus;
  topics: ProjectTopic[];
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectVoteDoc {
  _id?: ObjectId;
  projectId: ObjectId;
  topicId: string;
  optionId: string;
  voterKey: string;
  createdAt: Date;
}
