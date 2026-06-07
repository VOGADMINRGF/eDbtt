import { listGraphMergeCandidates } from "@features/graphMergeCandidates";

export async function loadAccountGraphMergeCandidates(
  userId: string,
  limit = 8,
) {
  return listGraphMergeCandidates({
    userId,
    limit,
  });
}
