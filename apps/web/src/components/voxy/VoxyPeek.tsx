"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { VoxySmartPresenceAction, VoxySmartPresenceContext } from "@/features/voxy/smartPresenceContract";
import VoxyInlineHint from "./VoxyInlineHint";

const EXPLANATIONS: Record<VoxySmartPresenceContext["helpTopic"], string> = {
  unclear_claim:
    "Diese Aussage enthält noch eine dokumentierte Unsicherheit oder keinen gesicherten Belegstatus.",
  contradicting_source:
    "Diese Quelle steht im dokumentierten Dossier in Widerspruch zu mindestens einer Aussage oder Quelle.",
  unreviewed_source:
    "Für diese Quelle ist noch kein abgeschlossener Prüfstatus dokumentiert.",
  open_question:
    "Diese Frage ist offen. Voxy erklärt nur den sichtbaren Stand und beantwortet sie nicht selbst.",
  review_status:
    "Der angezeigte Antwort- oder Prüfstand ist dokumentiert, aber nicht automatisch fachlich freigegeben.",
  surface_help:
    "Voxy hilft bei der Orientierung in diesem Dossier, ohne Inhalte oder Entscheidungen zu verändern.",
};

type Props = {
  context: VoxySmartPresenceContext;
  open: boolean;
  onClose: () => void;
  onAction?: (action: VoxySmartPresenceAction) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  panelId: string;
};

export default function VoxyPeek({
  context,
  open,
  onClose,
  onAction,
  triggerRef,
  panelId,
}: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
      triggerRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open, triggerRef]);

  if (!open) return null;

  return (
    <aside
      id={panelId}
      role="dialog"
      aria-modal="false"
      aria-label={`Voxy-Hilfe zu ${context.objectLabel}`}
      data-voxy-peek=""
      data-voxy-surface={context.surface}
      data-voxy-object-type={context.objectType}
      data-voxy-object-id={context.objectId}
      lang={context.languageContext.interfaceLanguage}
      dir={context.languageContext.direction}
      className="mt-3 max-w-xl rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 shadow-lg motion-reduce:transition-none"
    >
      <VoxyInlineHint title="Voxy erklärt" compact={false}>
        <p>{EXPLANATIONS[context.helpTopic]}</p>
        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
          Status: {context.status}
        </p>
      </VoxyInlineHint>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {context.allowedActions.slice(0, 3).map((action) => (
          <button
            key={action.id}
            type="button"
            className="btn-secondary min-h-10 px-3 py-2 text-xs"
            onClick={() => onAction?.(action)}
          >
            {action.label}
          </button>
        ))}
        <button
          ref={closeRef}
          type="button"
          className="min-h-10 rounded-lg px-3 py-2 text-xs font-semibold text-[rgb(var(--muted))] underline underline-offset-4"
          onClick={() => {
            onClose();
            triggerRef.current?.focus();
          }}
        >
          Hilfe schließen
        </button>
      </div>
    </aside>
  );
}
