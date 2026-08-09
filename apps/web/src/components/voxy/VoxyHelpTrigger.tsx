"use client";

import { useId, useRef, useState } from "react";
import type { VoxySmartPresenceAction, VoxySmartPresenceContext } from "@/features/voxy/smartPresenceContract";
import VoxyPeek from "./VoxyPeek";

type Props = {
  context: VoxySmartPresenceContext | null;
  blockId: string;
  onAction?: (action: VoxySmartPresenceAction) => void;
};

export default function VoxyHelpTrigger({ context, blockId, onAction }: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const generatedId = useId();
  const panelId = `voxy-peek-${generatedId.replace(/:/g, "")}`;

  if (!context) return null;

  return (
    <div data-voxy-help-block-id={blockId} className="mt-3">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-violet-300 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 dark:border-violet-700 dark:bg-violet-950/30 dark:text-violet-100"
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">?</span>
        Voxy-Hilfe zu {context.objectLabel}
      </button>
      <VoxyPeek
        context={context}
        open={open}
        onClose={() => setOpen(false)}
        onAction={onAction}
        triggerRef={triggerRef}
        panelId={panelId}
      />
    </div>
  );
}
