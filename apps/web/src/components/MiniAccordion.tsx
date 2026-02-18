import { useState } from "react";
import { colors } from "../theme";

export function MiniAccordion({ items }: { items: any[] }) {
  const [open, setOpen] = useState(-1);
  return (
    <div className="space-y-2">
      {items.map((item: any, idx: number) => (
        <div key={idx} className="rounded-lg border bg-[rgb(var(--card))] shadow">
          <button
            onClick={() => setOpen(open === idx ? -1 : idx)}
            className="w-full text-left flex items-center px-4 py-3 font-semibold"
            style={{ color: colors.coral }}
          >
            <span className="mr-2">{item.icon || "❔"}</span>
            {item.title}
            <span className="ml-auto">{open === idx ? "▲" : "▼"}</span>
          </button>
          {open === idx && (
            <div className="px-6 pb-4 text-gray-700">{item.content}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// Beispiel-Aufruf:
// <MiniAccordion items={[
//   { icon: "📍", title: "Regionale Ansprechpartner", content: "Hier findest du Kontakte vor Ort." },
//   { icon: "💡", title: "Tipp: Anliegen starten", content: "So reichst du ein Anliegen ein..." }
// ]} />
