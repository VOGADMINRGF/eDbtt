// features/factcheck/components/JurisdictionToggle.tsx
import React from "react";

export default function JurisdictionToggle({
  value, onChange,
}: { value: "national" | "eu" | "global"; onChange: (v: "national" | "eu" | "global") => void }) {
  const opts: Array<["national"|"eu"|"global", string]> = [
    ["national", "National"],
    ["eu", "EU"],
    ["global", "Global"],
  ];
  return (
    <div className="inline-flex rounded-xl border overflow-hidden">
      {opts.map(([k, label]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={`px-3 py-1 text-xs ${value===k ? "bg-indigo-600 text-white" : "bg-white"}`}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
