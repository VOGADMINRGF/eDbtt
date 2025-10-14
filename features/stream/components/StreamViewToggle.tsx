// features/stream/components/StreamViewToggle.tsx
"use client";

import { useState } from "react";
import { Grid, List } from "lucide-react";

interface Props {
  onChange: (view: "grid" | "list") => void;
}

export default function StreamViewToggle({ onChange }: Props) {
  const [view, setView] = useState<"grid" | "list">("grid");

  const toggle = (newView: "grid" | "list") => {
    setView(newView);
    onChange(newView);
  };

  return (
    <div className="inline-flex rounded-md border overflow-hidden shadow-sm">
      <button
        onClick={() => toggle("grid")}
        className={`px-3 py-2 flex items-center gap-1 ${
          view === "grid" ? "bg-coral text-white" : "bg-white text-gray-600"
        }`}
        title="Rasteransicht"
      >
        <Grid size={16} />
      </button>
      <button
        onClick={() => toggle("list")}
        className={`px-3 py-2 flex items-center gap-1 ${
          view === "list" ? "bg-coral text-white" : "bg-white text-gray-600"
        }`}
        title="Listenansicht"
      >
        <List size={16} />
      </button>
    </div>
  );
}
