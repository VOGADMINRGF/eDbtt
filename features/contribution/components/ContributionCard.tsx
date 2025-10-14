// ContributionCard.tsx

import { Contribution } from "../types/ContributionType";

interface ContributionCardProps {
  contribution: Contribution;
}

export default function ContributionCard({ contribution }: ContributionCardProps) {
  return (
    <div className="border rounded-lg shadow-sm p-4 hover:shadow-md transition">
      <h2 className="font-semibold text-lg">{contribution.title}</h2>
      <p className="text-sm text-gray-600">{contribution.summary || contribution.content.slice(0, 100)}</p>
      <div className="mt-2 text-xs text-gray-500">
        🗳️ {contribution.engagementStats.votes} Votes | 🔖 {contribution.engagementStats.bookmarks} Bookmarks
      </div>
    </div>
  );
}
