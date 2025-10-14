// features/stream/components/StreamFilters.tsx
"use client";

import { useState } from "react";

interface Filter {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface Props {
  filters: Filter[];
  active: string[];
  onToggle: (id: string) => void;
  className?: string;
}

export default function StreamFilters({ filters, active, onToggle, className }: Props) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      onToggle(inputValue.trim().toLowerCase());
      setInputValue("");
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Abstand zwischen Suchleiste und Filtern */}
      <div className="h-2" />

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onToggle(filter.id)}
            className={`px-2 py-1 rounded text-sm border ${
              active.includes(filter.id)
                ? "bg-coral text-white border-coral"
                : "bg-gray-100 text-gray-700 border-gray-300"
            }`}
          >
            {filter.icon} {filter.label}
          </button>
        ))}
      </div>

      {/* Optional: Eingabe für benutzerdefinierte Tags */}
      <input
        type="text"
        placeholder="Weitere Filter hinzufügen (z. B. Österreich, Energie...)"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="mt-2 border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-coral"
      />
    </div>
  );
}
