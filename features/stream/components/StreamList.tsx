"use client";

import { useState, useEffect, useMemo } from "react";
import StreamCard from "./StreamCard";
import { getNationalFlag } from "@features/stream/utils/nationalFlag";
import { badgeColors } from "@ui/theme";

// Streams holen – später ersetzen durch echten API Call/Search/GraphDB
async function fetchStreams() {
  const res = await fetch("/api/streams");
  if (!res.ok) throw new Error("Fehler beim Laden der Streams");
  return res.json();
}

export default function StreamList({
  user,
  admin,
  presseView,
  politikView,
  ngoView,
  readOnly,
  accentColor = "#FF6F61",
  showIcons = true,
  language = "de",
}: {
  user?: { country?: string; region?: string; district?: string };
  admin?: boolean;
  presseView?: boolean;
  politikView?: boolean;
  ngoView?: boolean;
  readOnly?: boolean;
  accentColor?: string;
  showIcons?: boolean;
  language?: string;
}) {
  // --- States ---
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // User-bezogene Infos/Labels
  const userCountry = user?.country || "DE";
  const userRegion = user?.region;
  const flag = getNationalFlag(userCountry);

  const countryLabel = {
    DE: "Deutschland",
    FR: "Frankreich",
    IT: "Italien",
    UA: "Ukraine",
    IN: "Indien",
    CN: "China",
    US: "USA",
    RU: "Russland",
    PL: "Polen",
    ES: "Spanien",
    SE: "Schweden",
    NO: "Norwegen",
    DK: "Dänemark",
    GB: "Großbritannien",
    TR: "Türkei",
    // ... erweitern um weitere G20 etc.
  }[userCountry] || "National";

  // --- Filter-Definitionen ---
  const baseFilters = [
    { id: "all", label: "Alle", icon: showIcons ? "📋" : undefined },
    { id: "live", label: "Live", icon: showIcons ? "🔴" : undefined },
    userRegion
      ? { id: "district", label: "In meinem Wahlkreis", icon: showIcons ? "📍" : undefined }
      : { id: "district", label: "In meinem Wahlkreis", icon: showIcons ? "📍" : undefined, disabled: true },
    { id: "nation", label: countryLabel, icon: showIcons ? flag : undefined },
    { id: "global", label: "Global", icon: showIcons ? "🌍" : undefined },
  ];
  const extraFilters = [];
  if (presseView || politikView)
    extraFilters.push(
      { id: "g7", label: "G7", icon: showIcons ? "🌐" : undefined },
      { id: "eu", label: "EU", icon: showIcons ? "🇪🇺" : undefined }
    );

  // --- Streams laden ---
  useEffect(() => {
    fetchStreams()
      .then(setStreams)
      .catch(() => setStreams([]))
      .finally(() => setLoading(false));
  }, []);

  // Debounced Search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // --- Gefilterte Streams ---
  const filteredStreams = useMemo(() => {
    let data = streams;
    // Filter anwenden
    if (activeFilter === "live") data = data.filter(s => s.status === "Live");
    else if (activeFilter === "district" && userRegion)
      data = data.filter(s => s.region === userRegion || s.district === user?.district);
    else if (activeFilter === "nation")
      data = data.filter(s => s.country === userCountry);
    else if (activeFilter === "global")
      data = data.filter(s => ["EU", "G7", "G-Gipfel", "Sonstiges", "Global"].includes(s.category));
    else if (activeFilter === "g7") data = data.filter(s => s.category === "G7");
    else if (activeFilter === "eu") data = data.filter(s => s.category === "EU");

    // Suchfilter
    if (debouncedSearch.length > 2)
      data = data.filter(
        s =>
          s.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          (s.topic && s.topic.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
          (s.region && s.region.toLowerCase().includes(debouncedSearch.toLowerCase()))
      );

    // Live immer zuerst
    data = [...data].sort((a, b) => {
      const statusOrder = { "Live": 1, "Geplant": 2, "Replay": 3, "Vergangen": 4 };
      return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
    });
    return data;
  }, [streams, activeFilter, debouncedSearch, userCountry, userRegion, user?.district, politikView, presseView]);

  // --- Filter-Button-Komponente ---
  function FilterButton({ filter }: { filter: any }) {
    return (
      <button
        key={filter.id}
        className={[
          "flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border transition focus:outline-none",
          activeFilter === filter.id
            ? `bg-[${accentColor}] text-white border-[${accentColor}] shadow`
            : "bg-white text-coral border-coral hover:bg-coral hover:text-white",
          filter.disabled ? "opacity-50 cursor-not-allowed" : ""
        ].join(" ")}
        style={activeFilter === filter.id ? { background: accentColor, borderColor: accentColor } : {}}
        onClick={() => !filter.disabled && setActiveFilter(filter.id)}
        disabled={!!filter.disabled}
        type="button"
        aria-pressed={activeFilter === filter.id}
      >
        {filter.icon && <span>{filter.icon}</span>}
        <span>{filter.label}</span>
      </button>
    );
  }

  return (
    <div>
      {/* Suchleiste */}
      <div className="flex gap-2 mb-4 items-center">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Streams suchen (Thema, Region, ...)"
          className="w-full p-2 rounded-xl border border-gray-200 shadow-sm text-base outline-none focus:ring-2 focus:ring-coral"
        />
      </div>
      {/* Filter-Control */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[...baseFilters, ...extraFilters].map((filter) => (
          <FilterButton filter={filter} key={filter.id} />
        ))}
      </div>
      {/* Stream-Liste */}
      {loading ? (
        <div className="text-center text-gray-400 py-10">Lädt Streams...</div>
      ) : filteredStreams.length === 0 ? (
        <div className="text-center text-gray-400 py-10">
          <div style={{ fontSize: 48 }}>🔎</div>
          <p>Keine Streams gefunden.<br /><span className="text-xs">Schlag ein neues Thema vor oder informiere dein Netzwerk!</span></p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 w-full">
          {filteredStreams.map((stream) => (
            <StreamCard key={stream.id} {...stream} language={language} />
          ))}
        </div>
      )}
      {/* Planen-Button */}
      {(admin || presseView || politikView || ngoView) && !readOnly && (
        <div className="mt-6 flex justify-end">
          <button
            className="px-4 py-2 rounded bg-indigo-600 text-white font-bold shadow hover:bg-indigo-700 transition"
            onClick={() => window.location.href = "/stream/add"}
            type="button"
          >
            + Stream planen
          </button>
        </div>
      )}
    </div>
  );
}
