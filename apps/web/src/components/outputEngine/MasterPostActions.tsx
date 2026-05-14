"use client";

import { useMemo, useState } from "react";

type MasterPostActionsProps = {
  dossierId: string;
  initialText: string;
  suggestedSlots: string[];
};

type SaveState = "idle" | "saved";

function storageKey(dossierId: string) {
  return `edebatte:studio:masterpost:${dossierId}`;
}

export default function MasterPostActions({
  dossierId,
  initialText,
  suggestedSlots,
}: MasterPostActionsProps) {
  const [editableText, setEditableText] = useState(initialText);
  const [editMode, setEditMode] = useState(false);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [draftState, setDraftState] = useState<SaveState>("idle");
  const [planState, setPlanState] = useState<SaveState>("idle");
  const [prepareState, setPrepareState] = useState<SaveState>("idle");
  const [reviewState, setReviewState] = useState<SaveState>("idle");

  const nextSlot = useMemo(() => suggestedSlots[0] ?? "Kein empfohlenes Zeitfenster", [suggestedSlots]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(editableText);
      setCopyNotice("Text in Zwischenablage kopiert.");
      setTimeout(() => setCopyNotice(null), 1800);
    } catch {
      setCopyNotice("Kopieren nicht möglich.");
      setTimeout(() => setCopyNotice(null), 1800);
    }
  };

  const onSaveDraft = () => {
    const payload = {
      savedAt: new Date().toISOString(),
      mode: "draft",
      text: editableText,
    };
    localStorage.setItem(storageKey(dossierId), JSON.stringify(payload));
    setDraftState("saved");
  };

  const onPlan = () => {
    const payload = {
      plannedAt: new Date().toISOString(),
      mode: "planned",
      slot: nextSlot,
      text: editableText,
    };
    localStorage.setItem(storageKey(dossierId), JSON.stringify(payload));
    setPlanState("saved");
  };

  const onRequestReview = () => {
    const payload = {
      reviewedAt: new Date().toISOString(),
      mode: "needs_review",
      text: editableText,
    };
    localStorage.setItem(storageKey(dossierId), JSON.stringify(payload));
    setReviewState("saved");
  };

  const onPreparePublication = () => {
    const payload = {
      preparedAt: new Date().toISOString(),
      mode: "prepared_review_required",
      text: editableText,
      publishLive: false,
    };
    localStorage.setItem(storageKey(dossierId), JSON.stringify(payload));
    setPrepareState("saved");
  };

  return (
    <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
      <h3 className="text-base font-semibold">Hauptaktionen</h3>
      <p className="mt-1 text-sm text-[rgb(var(--muted))]">
        Veröffentlichung bleibt review-gebunden. Keine Live-Veröffentlichung.
      </p>
      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
        LocalStorage-Arbeitsstände bleiben lokal im Browser und gelten nicht als produktive Behördenpersistenz.
      </p>

      {editMode ? (
        <textarea
          aria-label="Dossier-Post bearbeiten"
          value={editableText}
          onChange={(event) => setEditableText(event.target.value)}
          className="mt-3 min-h-[200px] w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 text-sm"
        />
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setEditMode((value) => !value)}
          className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-sm font-semibold"
        >
          Bearbeiten
        </button>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-sm font-semibold"
        >
          Kopieren
        </button>
        <button
          type="button"
          onClick={onSaveDraft}
          className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-sm font-semibold"
        >
          Als Entwurf speichern
        </button>
        <button
          type="button"
          onClick={onRequestReview}
          className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-sm font-semibold"
        >
          Review anfordern
        </button>
        <button
          type="button"
          onClick={onPlan}
          className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-sm font-semibold"
        >
          Zeitpunkt planen
        </button>
        <button
          type="button"
          onClick={onPreparePublication}
          className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-sm font-semibold"
        >
          Veröffentlichung vorbereiten
        </button>
      </div>

      <div className="mt-3 text-xs text-[rgb(var(--muted))]">
        {copyNotice ? <p>{copyNotice}</p> : null}
        {draftState === "saved" ? <p>Entwurf lokal gespeichert. Keine produktive Behördenpersistenz.</p> : null}
        {reviewState === "saved" ? <p>Review-Status lokal auf „needs_review“ gesetzt. Keine produktive Behördenpersistenz.</p> : null}
        {planState === "saved" ? <p>Planung lokal als Entwurf gespeichert ({nextSlot}). Keine produktive Behördenpersistenz.</p> : null}
        {prepareState === "saved" ? <p>Veröffentlichung lokal als review-pflichtiger Entwurf vorbereitet. Keine produktive Behördenpersistenz.</p> : null}
      </div>
    </section>
  );
}
