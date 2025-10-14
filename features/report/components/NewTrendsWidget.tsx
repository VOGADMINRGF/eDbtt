// features/report/components/NewsTrendsWidget.tsx
// (Demo, zeigt dynamisch Trends und News, kann easy per Ari/GPT/API erweitert werden)

import { useEffect, useState } from "react";
import { FiGlobe, FiTrendingUp } from "react-icons/fi";

// Dummy: Diese Daten idealerweise per API/Ari laden!
const DUMMY_NEWS = [
  { title: "Integration: EU plant mehr Förderung", source: "tagesschau.de", time: "vor 1h" },
  { title: "OECD: Mehr Teilhabe fördert Zusammenhalt", source: "SZ", time: "vor 3h" }
];

export default function NewsTrendsWidget({ region }) {
  const [news, setNews] = useState(DUMMY_NEWS);

  // Platzhalter für echte API
  useEffect(() => {
    // TODO: ARI/Backend laden nach Region
  }, [region]);

  return (
    <div className="mt-3">
      <div className="font-bold text-xs text-neutral-700 mb-1 flex items-center gap-1">
        <FiGlobe className="text-indigo-600" /> News & Trends
      </div>
      <ul className="text-xs space-y-1">
        {news.map((n, i) => (
          <li key={n.url || n.id || i} className="flex justify-between items-center">
            <span>{n.title}</span>
            <span className="text-neutral-400 text-[10px]">{n.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
