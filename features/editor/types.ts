// features/editor/types.ts
export type ItemKind = "SWIPE" | "EVENT" | "SUNDAY_POLL";
export type PublishStatus = "draft" | "review" | "published" | "archived";

export type Region = { id: string; code: string; name: string; level: number };

export type AnswerOption = {
  id?: string;
  label: string;
  value: string;
  exclusive?: boolean;
  order?: number;
};

export type Topic = { id: string; slug: string; title: string };

export type Item = {
  id: string;
  kind: ItemKind;
  status: PublishStatus;
  locale: string;
  title: string | null;
  text: string;
  richText: string | null;
  topicId: string;
  topic?: Topic | null;
  regionMode: "AUTO" | "MANUAL";
  regionManualId?: string | null;
  regionEffective?: Region | null;
  publishAt?: string | null;
  expireAt?: string | null;
  validation?: any;
  answerOptions: AnswerOption[];
  createdAt?: string;
  updatedAt?: string;
};
