"use client";
import {usePipeline} from "@/store/pipeline";

export default function PipelineHUD(){
  const { analyzing, steps } = usePipeline();
  const show = analyzing || steps.some((s) => s.status === "run");

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-[60] rounded-xl bg-[rgb(var(--card))] backdrop-blur shadow-lg border border-gray-200 p-3 w-[320px]">
      <div className="text-sm font-medium mb-2">Analyse läuft…</div>
      <ul className="space-y-2">
        {steps.map((s) => {
          const dot =
            s.status === "ok"
              ? "✅"
              : s.status === "run"
                ? "🟢"
                : s.status === "err"
                  ? "⛔️"
                  : "⏸️";
          return (
            <li key={s.id} className="flex items-start gap-2 text-sm">
              <span className="mt-[2px]">{dot}</span>
              <span>{s.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
