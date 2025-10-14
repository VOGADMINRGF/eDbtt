import React, { useState } from "react";
const ALT_LABELS = {
  community: { text: "", color: "#51C5FF", icon: "🌐" },
  redaktion: { text: "", color: "#FF9056", icon: "📰" },
  ki: { text: "", color: "#8f36ae", icon: "🤖" }
};

export default function KompromissModal({ alternatives, onClose, onSelect }) {
  const [selected, setSelected] = useState(null);
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/30"
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-md w-full relative"
        onClick={e => e.stopPropagation()}
        style={{ outline: "2px solid #e7e7ef" }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-3 text-gray-400 hover:text-gray-700 text-2xl"
          aria-label="Schließen"
        >×</button>
        <h3 className="font-bold text-lg mb-4">Kompromiss finden</h3>
        <div className="space-y-3">
          {alternatives?.slice(0, 4).map((alt, i) => (
            <div
              key={alt.text}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer border
                ${selected === i ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}
              onClick={() => setSelected(i)}
              tabIndex={0}
              aria-pressed={selected === i}
            >
              <span className="font-semibold text-xs px-2 py-1 rounded"
                    style={{ background: ALT_LABELS[alt.type]?.color, color: "#fff" }}>
                {ALT_LABELS[alt.type]?.icon} {ALT_LABELS[alt.type]?.text}
              </span>
              <span className="flex-1">{alt.text}</span>
            </div>
          ))}
        </div>
        {/* Frage stellen */}
        {selected !== null && (
          <button
            className="mt-5 w-full py-2 rounded bg-turquoise text-white font-semibold text-base"
            style={{ background: "#00B3A6" }}
            onClick={() => onSelect(alternatives[selected])}
          >
            Diesen Kompromiss auswählen
          </button>
        )}
      </div>
    </div>
  );
}
