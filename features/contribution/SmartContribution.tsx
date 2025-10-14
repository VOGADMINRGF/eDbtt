"use client";

import { useState } from "react";
import { useErrorToast } from "@/hooks/useErrorToast";

export default function SmartContribution() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const showError = useErrorToast();

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contribution/analyze", {
        method: "POST",
        body: JSON.stringify({
          text,
          userContext: {
            region: "Sachsen", // später dynamisch
            locale: "de"
          }
        }),
        headers: { "Content-Type": "application/json" }
      });

      const data = await res.json();
      if (!res.ok || data.error) throw data;

      setResult(data);
    } catch (err) {
      showError(err, "Analyse fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  // Platzhalter für Speicherung – kommt im nächsten Schritt
  const handleConfirm = async () => {
    alert("Speichern-Logik folgt – API /api/contribution/save kommt als nächstes");
  };

  return (
    <section className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Neuen Beitrag verfassen</h1>

      <textarea
        className="w-full p-4 border rounded text-gray-800"
        rows={6}
        placeholder="Beschreibe dein Anliegen, Missstand oder Thema..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        onClick={handleAnalyze}
        disabled={loading || !text}
        className="bg-coral text-white px-6 py-2 rounded hover:opacity-90 transition"
      >
        {loading ? "Analysiere..." : "Absenden & analysieren"}
      </button>

      {result?.success && (
        <div className="bg-white border rounded p-4 space-y-4 mt-6">
          <h2 className="font-semibold text-lg">Erkannte Themen</h2>
          <div className="flex flex-wrap gap-2">
            {result.topics.map((t: any, i: number) => (
              <span key={i} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded text-sm">
                {t.name}
              </span>
            ))}
          </div>

          <h2 className="font-semibold text-lg">Ebene</h2>
          <p className="italic">{result.level}</p>

          <h2 className="font-semibold text-lg">Vorgeschlagene Statements</h2>
          <ul className="list-disc list-inside">
            {result.statements.map((s: string, i: number) => (
              <li key={i}>{s}</li>
            ))}
          </ul>

          <h2 className="font-semibold text-lg">Kontext</h2>
          <p>{result.context === "neu" ? "Neues Thema erkannt" : "Bestehendes Thema"}</p>

          <h2 className="font-semibold text-lg">Vorschläge</h2>
          <ul className="list-disc list-inside text-sm text-gray-600">
            {result.suggestions.map((s: string, i: number) => (
              <li key={i}>{s}</li>
            ))}
          </ul>

          <div className="flex gap-4 mt-4">
            <button onClick={handleConfirm} className="bg-green-600 text-white px-4 py-2 rounded hover:opacity-90">
              Bestätigen
            </button>
            <button className="bg-yellow-500 text-white px-4 py-2 rounded hover:opacity-90">Bearbeiten</button>
            <button className="bg-gray-500 text-white px-4 py-2 rounded hover:opacity-90">Zur Prüfung</button>
          </div>
        </div>
      )}
    </section>
  );
}
