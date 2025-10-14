"use client";
import ReportCard, { VoteType } from "./ReportCard";

const dummyReport = {
  title: "Soll Deutschland die Integration von Geflüchteten durch verpflichtende Sprachkurse fördern?",
  region: "Deutschland, Frankreich, EU, Global",
  createdAt: "2025-07-25",
  tags: ["Integration", "Migration"],
  votes: { agree: 8500, neutral: 1200, disagree: 1600 } as VoteType,
  imageUrl: "/dummy/dummy1.jpg",
};

export default function ReportView({ report = dummyReport }) {
  // Optional: API-Fetch, Context, etc.
  return (
    <div className="py-12">
      <ReportCard {...report} />
      {/* Weitere Details, Charts, Statistiken etc. */}
    </div>
  );
}
