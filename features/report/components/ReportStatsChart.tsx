import { CountryResult } from "../types/Report";

export default function ReportStatsChart({ results }: { results: CountryResult[] }) {
  return (
    <div className="mt-5 bg-gray-50 rounded-2xl p-6">
      <div className="font-bold text-gray-700 mb-2">Vergleich nach Ländern:</div>
      <div className="flex flex-wrap gap-4">
        {results.map(r => {
          const total = r.agree + r.neutral + r.disagree;
          return (
            <div key={r.country} className="text-sm font-mono">
              <span className="font-semibold">{r.country}: </span>
              <span className="text-green-700">{r.agree} ({((r.agree/total)*100).toFixed(1)}%)</span>{" "}
              <span className="text-yellow-700">{r.neutral} ({((r.neutral/total)*100).toFixed(1)}%)</span>{" "}
              <span className="text-rose-600">{r.disagree} ({((r.disagree/total)*100).toFixed(1)}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
