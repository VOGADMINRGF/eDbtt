// features/analyze/components/AnalyzeForm.tsx
"use client";

import { ChangeEvent } from "react";

type Props = {
  text: string;
  locale: "de" | "en";
  loading: boolean;
  onChangeText: (value: string) => void;
  onChangeLocale: (loc: "de" | "en") => void;
  onAnalyze: () => void;
};

export function AnalyzeForm({
  text,
  locale,
  loading,
  onChangeText,
  onChangeLocale,
  onAnalyze,
}: Props) {
  function handleTextChange(e: ChangeEvent<HTMLTextAreaElement>) {
    onChangeText(e.target.value);
  }

  return (
    <section aria-label="Beitrag eingeben" className="space-y-3">
      <div className="text-center">
        <h2 className="text-xl font-bold text-[rgb(var(--fg))]">
          Dein Beitrag
        </h2>
        <p className="text-xs text-[rgb(var(--muted))]">
          Schreib frei heraus, was dich beschäftigt – wir zerlegen deinen Text
          in saubere Statements, Kontext, Fragen & Knoten.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.6fr_0.9fr]">
        {/* Links: kurze Erklärung / später Mini-Notes-Preview */}
        <div className="hidden text-[11px] text-[rgb(var(--muted))] lg:block">
          <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Kontext (Notizen)
          </h3>
          <p>
            Nach der Analyse tauchen hier kompak­te Abschnitts-Zusammenfassungen
            auf – dein „Was du wissen solltest“-Bereich.
          </p>
        </div>

        {/* Mitte: großes Textfeld (mehr Platz) */}
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-[rgb(var(--muted))]">
            <span>Dein Beitrag (klar & konkret)</span>
            <select
              value={locale}
              onChange={(e) =>
                onChangeLocale(
                  e.target.value === "en" ? "en" : "de",
                )
              }
              className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 text-[11px]"
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
          </div>

          <textarea
            value={text}
            onChange={handleTextChange}
            rows={8}
            className="w-full resize-none rounded-2xl border border-[rgb(var(--border))] bg-emerald-50/40 p-3 text-sm text-[rgb(var(--fg))] outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
            placeholder="Beispiel: Ich bin gegen die Klassenhaltung von Tieren nach Stufe 1–3 und finde, dass wir höhere Mindeststandards brauchen …"
          />

          <div className="mt-2 flex items-center justify-between text-[11px] text-[rgb(var(--muted))]">
            <span>{text.length}/4000 Zeichen</span>
            <span>
              Hinweis: Du kannst deinen Beitrag später jederzeit
              überarbeiten.
            </span>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={loading || !text.trim()}
              onClick={onAnalyze}
              className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow disabled:opacity-50"
            >
              {loading ? "Analysiere …" : "Analyse starten"}
            </button>
            <button
              type="button"
              onClick={() => onChangeText("")}
              disabled={loading}
              className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-xs font-semibold text-[rgb(var(--muted))] disabled:opacity-50"
            >
              Zurücksetzen
            </button>
          </div>
        </div>

        {/* Rechts: später Fragen/Knoten-Preview – im Level 1 ruhig klein */}
        <div className="hidden text-[11px] text-[rgb(var(--muted))] lg:block">
          <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Fragen & Knoten
          </h3>
          <p>
            Nach der Analyse erscheinen hier präzise Fragen und Themenhubs
            (Knoten) – passend zu deinem Beitrag.
          </p>
        </div>
      </div>
    </section>
  );
}
