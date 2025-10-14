// features/report/components/ReportDetails.tsx
import React from "react";
import type { Report } from "../types/Report";

export default function ReportDetails({ report }: { report: Report }) {
  return (
    <>
      <h2 className="font-bold text-2xl mb-2">{report.title}</h2>
      <div className="mb-2 text-sm text-gray-400">
        {report.region} · {report.topic} · {report.language}
      </div>
      <p className="mb-4">{report.description}</p>
      <div className="flex gap-4 mt-4 mb-4">
        <span className="bg-indigo-100 text-indigo-800 rounded px-2 py-1">{report.status}</span>
        <span>👍 {report.likes}</span>
        <span>🔖 {report.bookmarks}</span>
      </div>
      {/* ... */}
    </>
  );
}
