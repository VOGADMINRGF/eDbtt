import { useState } from "react";

export default function UniversalSearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ streams: [], reports: [], statements: [], news: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Simpler Demo-Handler für Suchvorschau + News/ARI-Call
  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.length > 2) {
      setLoading(true);

      // Simultane Suchen:
      const [streams, reports, statements, news] = await Promise.all([
        searchStreams(value),
        searchReports(value),
        searchStatements(value),
        searchARInews(value), // <--- Dein ARI News Call
      ]);
      setResults({ streams, reports, statements, news });
      setShowDropdown(true);
      setLoading(false);
    } else {
      setShowDropdown(false);
      setLoading(false);
    }
  };

  // Beispiel-ARI-Call (kannst du in /utils/ariNews.ts auslagern)
  async function searchARInews(query: string) {
    // Demo: Simuliere Call (ersetze mit echtem ARI-API-Call)
    try {
      const res = await fetch(`/api/ari-news?q=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.articles?.slice(0, 5) || [];
    } catch {
      return [];
    }
  }

  // Dummy-Funktionen für Streams, Reports, Statements
  async function searchStreams(q: string) { /* ... */ return []; }
  async function searchReports(q: string) { /* ... */ return []; }
  async function searchStatements(q: string) { /* ... */ return []; }

  return (
    <div className="relative w-full max-w-xl">
      <input
        className="w-full p-2 rounded-xl border border-gray-200 shadow-sm text-base outline-none"
        placeholder="Thema, Stream, Report, News, Statement …"
        value={query}
        onChange={e => handleSearch(e.target.value)}
      />
      {showDropdown && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
          {loading && <div className="p-4 text-sm text-gray-400">Suche …</div>}
          {/* Streams */}
          {results.streams.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-bold text-indigo-700">Streams</div>
              {results.streams.map(s => (
                <div key={s.id} className="px-4 py-2 hover:bg-indigo-50 cursor-pointer">{s.title}</div>
              ))}
            </div>
          )}
          {/* Reports */}
          {results.reports.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-bold text-green-700">Reports</div>
              {results.reports.map(r => (
                <div key={r.id} className="px-4 py-2 hover:bg-green-50 cursor-pointer">{r.title}</div>
              ))}
            </div>
          )}
          {/* Statements */}
          {results.statements.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-bold text-pink-700">Statements</div>
              {results.statements.map(st => (
                <div key={st.id} className="px-4 py-2 hover:bg-pink-50 cursor-pointer">{st.title}</div>
              ))}
            </div>
          )}
          {/* ARI-News */}
          {results.news.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-bold text-blue-700">News (aktuelle Themen, ARI)</div>
              {results.news.map(news => (
                <div key={news.url} className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex flex-col">
                  <span className="font-medium">{news.title}</span>
                  {news.source && (
                    <span className="text-xs text-neutral-500">{news.source}</span>
                  )}
                  <span
                    className="mt-1 text-xs text-coral font-semibold cursor-pointer hover:underline"
                    onClick={() => {/* Hier Statement/Beitrag zur News anlegen! */}}
                  >
                    Statement zu dieser News eröffnen
                  </span>
                </div>
              ))}
            </div>
          )}
          {/* Fallback, wenn nichts gefunden */}
          {results.streams.length === 0 &&
            results.reports.length === 0 &&
            results.statements.length === 0 &&
            results.news.length === 0 && (
              <div className="px-4 py-3 text-sm text-neutral-500">
                Kein Treffer – <span className="text-coral font-semibold cursor-pointer hover:underline">Jetzt Statement zum Thema eröffnen!</span>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
