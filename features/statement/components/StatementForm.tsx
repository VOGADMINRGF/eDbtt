// apps/web/src/components/StatementForm.tsx
"use client";

import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
  type ChangeEvent,
} from "react";
import { FiPlus, FiX, FiCheckCircle, FiLoader } from "react-icons/fi";

// ✅ Import der Konstanten
// Wenn deine Konstanten im monorepo unter `features/statement/constants/...` liegen,
// nimm den Alias-Import unten (auskommentiert) und lösche die relative Variante.
import { MAIN_CATEGORIES, REGIONS } from "../constants/statementCategories";
// import { MAIN_CATEGORIES, REGIONS } from "@features/statement/constants/statementCategories";

type Option = { value: string; label: string };

// Erzeuge Options-Arrays robust (funktioniert für string[] ODER {value,label}[])
const CATEGORY_OPTIONS: Option[] = (MAIN_CATEGORIES as any[]).map((c: any) =>
  typeof c === "string" ? { value: c, label: c } : c
);
const REGION_OPTIONS: Option[] = (REGIONS as any[]).map((r: any) =>
  typeof r === "string" ? { value: r, label: r } : r
);

type Analysis =
  | {
      topics?: { name: string }[];
      level?: string;
      statements?: { text: string }[];
      suggestions?: string[];
      [k: string]: unknown;
    }
  | null;

type Props = {
  onSubmit?: () => void; // optionaler Callback nach Erfolg
  onCancel?: () => void;
};

export default function StatementForm({ onSubmit, onCancel }: Props) {
  const [category, setCategory] = useState<string>(
    CATEGORY_OPTIONS[0]?.value ?? ""
  );
  const [region, setRegion] = useState<string>(
    REGION_OPTIONS[0]?.value ?? ""
  );
  const [statement, setStatement] = useState<string>("");
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [alternative, setAlternative] = useState<string>("");

  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);

  const statementRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    statementRef.current?.focus();
  }, []);

  async function handleAnalyze() {
    if (!statement.trim()) return;
    setAnalyzing(true);
    setError("");
    setAnalysis(null);
    try {
      // ⬇️ Korrekte Route (Plural)
      const res = await fetch("/api/contributions/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: statement, userContext: { region } }),
      });
      const data = (await res.json()) as
        | ({ success?: boolean; message?: string } & Record<string, unknown>)
        | undefined;
      if (!res.ok || !data || (data as any).success === false) {
        throw new Error(
          (data as any)?.message || "Analyse fehlgeschlagen."
        );
      }
      setAnalysis((data as unknown) as Analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analyse fehlgeschlagen.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);
    try {
      const payload = {
        title: statement.slice(0, 80) || "Neues Statement",
        statement,
        category,
        regionScope: [{ name: region, type: "region" as const }],
        alternatives: alternatives.map((a) => ({ text: a })),
        analysis,
      };

      const res = await fetch("/api/statements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const { error: errMsg } = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errMsg || "Speichern fehlgeschlagen.");
      }

      setSuccess(true);
      setStatement("");
      setAlternatives([]);
      setAlternative("");
      setAnalysis(null);
      onSubmit?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  }

  function handleAddAlternative() {
    const trimmed = alternative.trim();
    if (trimmed) {
      setAlternatives((prev) => [...prev, trimmed]);
      setAlternative("");
    }
  }

  function handleRemoveAlternative(idx: number) {
    setAlternatives((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-10 max-w-xl bg-white p-8 rounded-2xl shadow-2xl"
      aria-label="Neues Statement einreichen"
    >
      <h2 className="text-2xl mb-6 font-bold">Neues Statement einreichen</h2>

      {success && (
        <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-2 rounded mb-3 flex gap-2 items-center">
          <FiCheckCircle /> Erfolgreich gespeichert!{" "}
          <a href="/beitraege" className="underline">
            Zur Übersicht
          </a>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded mb-3">
          {error}
        </div>
      )}

      {/* Kategorie */}
      <label className="font-bold">Thema / Kategorie</label>
      <select
        className="block w-full mb-2 border rounded p-2"
        value={category}
        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
          setCategory(e.target.value)
        }
      >
        {CATEGORY_OPTIONS.map((cat) => (
          <option key={cat.value} value={cat.value}>
            {cat.label}
          </option>
        ))}
      </select>

      {/* Region */}
      <label className="font-bold">Regionale Ebene</label>
      <select
        className="block w-full mb-2 border rounded p-2"
        value={region}
        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
          setRegion(e.target.value)
        }
      >
        {REGION_OPTIONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>

      {/* Statement */}
      <label className="font-bold">Statement</label>
      <textarea
        className="w-full mb-2 border rounded p-2"
        rows={4}
        maxLength={280}
        value={statement}
        ref={statementRef}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
          setStatement(e.target.value)
        }
        placeholder="Statement eingeben"
        required
        aria-label="Statement"
      />
      <div className="text-xs text-gray-400 text-right mb-2">
        {statement.length} / 280 Zeichen
      </div>

      {/* Alternativen */}
      <label className="font-bold">Alternative(n)</label>
      <div className="flex gap-2 mb-2">
        <input
          className="flex-1 border rounded p-2"
          value={alternative}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setAlternative(e.target.value)
          }
          placeholder="Kompromiss-/Alternativvorschlag"
        />
        <button
          type="button"
          onClick={handleAddAlternative}
          className="bg-indigo-600 text-white px-3 py-1 rounded disabled:opacity-50"
          disabled={!alternative.trim()}
          aria-label="Alternative hinzufügen"
          title="Alternative hinzufügen"
        >
          <FiPlus />
        </button>
      </div>

      <ul className="mb-4">
        {alternatives.map((alt, idx) => (
          <li key={`${alt}-${idx}`} className="text-xs flex gap-2 items-center">
            {alt}
            <button
              type="button"
              className="text-red-500 text-xs"
              onClick={() => handleRemoveAlternative(idx)}
              aria-label="Alternative entfernen"
              title="Alternative entfernen"
            >
              <FiX />
            </button>
          </li>
        ))}
      </ul>

      {/* Actions */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={handleAnalyze}
          className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={!statement.trim() || analyzing}
        >
          {analyzing ? (
            <FiLoader className="animate-spin" />
          ) : (
            "GPT-Analyse anzeigen"
          )}
        </button>
        <button
          type="submit"
          className="bg-emerald-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={saving}
        >
          {saving ? <FiLoader className="animate-spin" /> : "Speichern"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-200 px-4 py-2 rounded"
        >
          Abbrechen
        </button>
      </div>

      {/* Analyse-Box */}
      {analysis && (
        <div className="bg-gray-50 border rounded-xl p-4 text-sm mt-2">
          <div className="font-bold text-purple-700 mb-1">GPT-Analyse:</div>
          <div>
            <span className="font-semibold">Themen:</span>{" "}
            {analysis.topics?.map((t) => t.name).join(", ")}
          </div>
          <div>
            <span className="font-semibold">Ebene:</span> {analysis.level}
          </div>
          <div>
            <span className="font-semibold">Statements:</span>{" "}
            {analysis.statements?.map((s) => s.text).join(" | ")}
          </div>
          <div>
            <span className="font-semibold">Vorschläge:</span>{" "}
            {analysis.suggestions?.join(" | ")}
          </div>
        </div>
      )}
    </form>
  );
}
