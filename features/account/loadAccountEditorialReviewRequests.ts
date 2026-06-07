import { listEditorialReviewRequests } from "@features/editorialReviewQueue";

export async function loadAccountEditorialReviewRequests(userId: string, limit = 8) {
  return listEditorialReviewRequests({
    userId,
    limit,
  });
}
