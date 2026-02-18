// packages/ui/src/components/LoadingOverlay.tsx
"use client";
import Spinner from "./Spinner";

interface LoadingOverlayProps {
  text?: string;
}

export default function LoadingOverlay({ text = "Lade…" }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 bg-[rgb(var(--card))] backdrop-blur-sm flex items-center justify-center">
      <Spinner size={40} text={text} />
    </div>
  );
}
