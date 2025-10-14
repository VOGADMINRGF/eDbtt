// features/swipe/components/ImpactIndicator.ts

import React from "react";

/** V1: { type, description?: string | { einfach?, eloquent? } } */
type ImpactV1 =
  | { type: string; description?: string }
  | { type: string; description?: { einfach?: string; eloquent?: string } };

/** V2: nur Text-Payload, ohne type */
type ImpactV2 = { einfach?: string; eloquent?: string };

/** Vereinheitlichte Prop-Variante: entweder V1 (mit type) oder V2 (ohne type) */
type Impact = ImpactV1 | ImpactV2;

function isV1(x: Impact): x is ImpactV1 {
  return typeof (x as any)?.type === "string";
}

function pickText(x?: unknown): string {
  if (!x) return "";
  if (typeof x === "string") return x;
  const obj = x as { einfach?: string; eloquent?: string };
  return obj.einfach ?? obj.eloquent ?? "";
}

/** Normalizer → { label, text } für die Anzeige */
function normalizeImpact(impact: Impact): { label?: string; text: string } {
  if (isV1(impact)) {
    const text = pickText((impact as any).description);
    return { label: impact.type, text };
  }
  // V2
  return { label: undefined, text: pickText(impact) };
}

export default function ImpactIndicator({
  impact,
  className = "",
}: {
  impact: Impact;
  className?: string;
}) {
  const { label, text } = normalizeImpact(impact);
  if (!label && !text) return null; // nichts zu zeigen

  return (
    <div
      className={`p-3 bg-indigo-50 border-l-4 border-indigo-500 rounded mb-2 text-sm ${className}`}
      role="note"
      aria-label={label ? `Impact: ${label}` : "Impact"}
    >
      {label ? <strong className="capitalize">{label}:</strong> : null}{" "}
      <span>{text}</span>
    </div>
  );
}
