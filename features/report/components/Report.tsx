"use client";
import React from "react";
import { useParams } from "next/navigation";
import reportData from "../data/reportData";
import Swipe from "./Swipe";

export default function Report() {
  const params = useParams();
  const report = reportData.find(r => r.id === params.id);

  if (!report) return <div>Report nicht gefunden.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-2xl shadow">
      <h2 className="font-bold text-2xl mb-2">{report.title}</h2>
      <div className="mb-2 text-sm text-gray-400">{report.region} · {report.topic} · {report.language}</div>
      <p className="mb-4">{report.description}</p>
      <div className="flex gap-4 mt-4 mb-4">
        <span className="bg-indigo-100 text-indigo-800 rounded px-2 py-1">{report.status}</span>
        <span>👍 {report.likes}</span>
        <span>🔖 {report.bookmarks}</span>
      </div>
      <Swipe report={report} />
      <div className="mt-6">
        <h3 className="font-semibold mb-2">Abstimmungsergebnisse</h3>
        <ul>
          <li>✅ Zustimmung: {report.statements.agreed}</li>
          <li>❌ Ablehnung: {report.statements.rejected}</li>
          <li>🤔 Unbeantwortet: {report.statements.unanswered}</li>
        </ul>
      </div>
    </div>
  );
}
