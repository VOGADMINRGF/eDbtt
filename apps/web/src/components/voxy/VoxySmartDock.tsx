"use client";

import { useEffect, useState } from "react";
import type { VoxySmartPresenceAction, VoxySmartPresenceContext } from "@/features/voxy/smartPresenceContract";
import { VOXY_SMART_PRESENCE_LAYOUT_GUARD } from "@/features/voxy/smartPresenceContract";
import VoxyInlineHint from "./VoxyInlineHint";

const STORAGE_KEY = "edebatte.voxy.smart-presence";

type Props = {
  context: VoxySmartPresenceContext;
  onAction?: (action: VoxySmartPresenceAction) => void;
};

export default function VoxySmartDock({ context, onAction }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      const preference = window.localStorage.getItem(STORAGE_KEY);
      setMuted(preference === "muted");
      setHidden(preference === "hidden");
    } catch {
      // Storage is optional; the controls continue to work for this page view.
    }
  }, []);

  function persist(value: "active" | "muted" | "hidden") {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Storage is optional; retain the in-memory preference.
    }
  }

  if (hidden) {
    return (
      <div className={`mt-5 ${VOXY_SMART_PRESENCE_LAYOUT_GUARD.mobileSafeAreaClassName}`} data-voxy-smart-dock="hidden">
        <button
          type="button"
          className="min-h-10 rounded-full border border-[rgb(var(--border))] px-3 py-2 text-xs font-semibold text-[rgb(var(--muted))]"
          onClick={() => {
            setHidden(false);
            persist("active");
          }}
        >
          Voxy wieder anzeigen
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Voxy-Hilfe"
      data-voxy-smart-dock={expanded ? "expanded" : "minimized"}
      data-voxy-muted={muted ? "true" : "false"}
      data-voxy-surface={context.surface}
      data-voxy-object-type={context.objectType}
      data-voxy-object-id={context.objectId}
      data-full-screen-overlay="false"
      lang={context.languageContext.interfaceLanguage}
      dir={context.languageContext.direction}
      className={`mt-5 w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 xl:sticky xl:bottom-4 xl:ms-auto xl:max-w-sm ${VOXY_SMART_PRESENCE_LAYOUT_GUARD.shellClassName} ${VOXY_SMART_PRESENCE_LAYOUT_GUARD.mobileSafeAreaClassName}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          aria-expanded={expanded}
          className="min-h-10 rounded-full px-3 py-2 text-sm font-semibold text-[rgb(var(--fg))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Voxy minimieren" : "Voxy-Hilfe öffnen"}
        </button>
        <div className="flex gap-1">
          <button
            type="button"
            aria-pressed={muted}
            className="min-h-10 rounded-lg px-2 text-xs text-[rgb(var(--muted))]"
            onClick={() => {
              const next = !muted;
              setMuted(next);
              persist(next ? "muted" : "active");
            }}
          >
            {muted ? "Hinweise aktivieren" : "Hinweise stummschalten"}
          </button>
          <button
            type="button"
            className="min-h-10 rounded-lg px-2 text-xs text-[rgb(var(--muted))]"
            onClick={() => {
              setHidden(true);
              persist("hidden");
            }}
          >
            Ausblenden
          </button>
        </div>
      </div>
      {expanded ? (
        <div className="mt-3">
          <VoxyInlineHint title={context.objectLabel} compact={false}>
            <p>Ich kann den dokumentierten Stand erklären und zu den verknüpften Stellen führen.</p>
          </VoxyInlineHint>
          {context.allowedActions.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
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
            </div>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
