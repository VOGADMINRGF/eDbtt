"use client";
import { useState } from "react";

export default function ReportForm() {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [statements, setStatements] = useState<{ statementId: string; agreed: number; rejected: number; neutral: number }[]>([]);

  async function handleSubmit() {
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, summary, statements }),
    });
    // Feedback/Weiterleitung
  }

  return (
    <form onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="max-w-xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold">Report erstellen</h2>
      <input
        className="border rounded px-3 py-2 w-full"
        placeholder="Titel"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />
      <textarea
        className="border rounded px-3 py-2 w-full"
        placeholder="Kurze Zusammenfassung"
        value={summary}
        onChange={e => setSummary(e.target.value)}
        required
      />
      {/* Statements-Selector nach Bedarf */}
      <button className="bg-turquoise text-white px-5 py-2 rounded">Report speichern</button>
    </form>
  );
}
