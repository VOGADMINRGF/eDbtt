"use client";

import * as React from "react";
import { readCreateHandoffDraft, type CreateHandoffDraft } from "@/features/create/createHandoff";

export function useCreateHandoffDraft(handoffId: string | null | undefined): CreateHandoffDraft | null {
  const [draft, setDraft] = React.useState<CreateHandoffDraft | null>(null);

  React.useEffect(() => {
    setDraft(readCreateHandoffDraft(handoffId));
  }, [handoffId]);

  return draft;
}
