import type { EditorialReviewRequest } from "@features/editorialReviewQueueClient";
import AccountEditorialReviewSection from "./AccountEditorialReviewSection";

type Props = {
  requests: EditorialReviewRequest[];
  onRefresh: () => void;
};

export default function AccountEditorialReviewSupplement({ requests, onRefresh }: Props) {
  return <AccountEditorialReviewSection requests={requests} onRefresh={onRefresh} />;
}
