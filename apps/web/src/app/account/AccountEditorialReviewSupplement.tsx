import type { EditorialReviewRequest } from "@features/editorialReviewQueue";
import AccountEditorialReviewSection from "./AccountEditorialReviewSection";

type Props = {
  requests: EditorialReviewRequest[];
  onRefresh: () => void;
};

export default function AccountEditorialReviewSupplement({ requests, onRefresh }: Props) {
  return <AccountEditorialReviewSection requests={requests} onRefresh={onRefresh} />;
}
