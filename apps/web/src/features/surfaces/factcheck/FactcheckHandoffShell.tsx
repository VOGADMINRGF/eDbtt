"use client";

import * as React from "react";
import type { SurfaceContext } from "@/features/surface";
import type { DemoPersona } from "@/features/demo/personas";
import { FactcheckSurface } from "@/features/surfaces/factcheck";
import { CreateHandoffPanel } from "@/features/create/CreateHandoffPanel";
import { useCreateHandoffDraft } from "@/features/create/useCreateHandoffDraft";

export function FactcheckHandoffShell(props: {
  context: SurfaceContext;
  persona: DemoPersona;
  handoffId?: string | null;
  access: {
    isAuthenticated: boolean;
    canDeepResearch: boolean;
  };
}) {
  const draft = useCreateHandoffDraft(props.handoffId ?? null);

  return (
    <div className="space-y-4">
      {draft ? (
        <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6">
          <CreateHandoffPanel draft={draft} title="Faktencheck-Handoff aus /create" showClaimPreview />
          <p className="mt-2 text-xs text-[rgb(var(--muted))]">
            Recherche startet nicht automatisch. Kein Factcheck-Siegel, keine DeepSearch und keine Kostenbuchung ohne weitere Bestätigung.
          </p>
        </div>
      ) : null}
      <FactcheckSurface
        context={props.context}
        persona={props.persona}
        access={props.access}
      />
    </div>
  );
}
