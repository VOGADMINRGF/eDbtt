export type AcquisitionFeedStatus = "ok" | "empty" | "error";

export interface AcquisitionFeedSource {
  id?: string;
  sourceKey: string;
  feedUrl: string;
  regionCode?: string | null;
  topicHints?: string[];
  status?: AcquisitionFeedStatus;
  lastFetchedAt?: Date | string | null;
  lastItemAt?: Date | string | null;
  itemCount?: number;
  error?: string | null;
  topTopics?: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface AcquisitionFetchRun {
  id?: string;
  startedAt: Date | string;
  finishedAt?: Date | string;
  totalFeeds: number;
  okFeeds: number;
  emptyFeeds: number;
  errorFeeds: number;
}
