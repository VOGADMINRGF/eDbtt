import type { EditorialReviewRequest } from "@features/editorialReviewQueue";

export type AccountEditorialReviewSlice = {
  editorialReviewRequests?: EditorialReviewRequest[];
};

export function readAccountEditorialReviewSlice(src: unknown): AccountEditorialReviewSlice {
  if (!src || typeof src !== "object" || Array.isArray(src)) {
    return { editorialReviewRequests: [] };
  }
  const record = src as Record<string, unknown>;
  return {
    editorialReviewRequests: Array.isArray(record.editorialReviewRequests)
      ? (record.editorialReviewRequests as EditorialReviewRequest[])
      : [],
  };
}
