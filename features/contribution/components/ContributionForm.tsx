//Finale Version 04.August 2025
// features/contribute/ContributionForm.tsx
"use client";
import { useState, useRef, useEffect } from "react";

// Hilfsfunktion für Dateityp-Icons
const getFileIcon = (file: File) => {
  const type = file.type;
  if (type.startsWith("image/")) return "🖼️";
  if (type === "application/pdf") return "📄";
  if (type.includes("excel") || type.includes("spreadsheet")) return "📊";
  if (type.includes("csv")) return "📑";
  if (type.includes("word")) return "📝";
  return "📎";
};

export default function ContributionForm({ user }) {
  // Felder + Autosave-Key
  const AUTOSAVE_KEY = user?.id ? `vog_contribution_${user.id}` : null;

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("de");
  const [media, setMedia] = useState<File[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [success, setSuccess] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ----------- AUTOSAVE / RESTORE -----------
  useEffect(() => {
    if (AUTOSAVE_KEY) {
      // Restore on mount
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          setTitle(data.title || "");
          setSummary(data.summary || "");
          setContent(data.content || "");
          setLanguage(data.language || "de");
          setLinks(data.links || []);
          // media (Dateien) werden aus Sicherheitsgründen **nicht** im Autosave gehalten
        } catch {}
      }
    }
  }, [AUTOSAVE_KEY]);

  useEffect(() => {
    if (AUTOSAVE_KEY) {
      // Save draft after every relevant change
      const data = {
        title, summary, content, language, links
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
    }
  }, [title, summary, content, language, links, AUTOSAVE_KEY]);

  // ----------- Drag & Drop Datei-Upload -----------
  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) {
      setMedia([...media, ...Array.from(e.dataTransfer.files)]);
    }
  }

  // ----------- Datei-Input (Button & Hidden Input) -----------
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) setMedia([...media, ...Array.from(e.target.files)]);
  }

  // ----------- Link-Entfernung -----------
  function removeLink(idx: number) {
    setLinks(links.filter((_, i) => i !== idx));
  }

  // ----------- Datei-Entfernung -----------
  function removeFile(idx: number) {
    setMedia(media.filter((_, i) => i !== idx));
  }

  // ----------- Submit -----------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("summary", summary);
    formData.append("content", content);
    formData.append("language", language);
    links.forEach((link, i) => formData.append("links", link));
    media.forEach((file) => formData.append("media", file));

    const res = await fetch("/api/contributions", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
    setSuccess(res.ok);

    // Draft löschen, wenn erfolgreich
    if (res.ok && AUTOSAVE_KEY) localStorage.removeItem(AUTOSAVE_KEY);
  }

  // ----------- Zeichen-Zähler -----------
  useEffect(() => {
    setCharCount(content.length);
  }, [content]);

  // ----------- Tooltip-Komponente -----------
  const Tooltip = ({ text }: { text: string }) => (
    <span className="ml-1 text-xs text-coral cursor-help" title={text}>ℹ️</span>
  );

  // ----------- Sprachoptionen -----------
  const languageOptions = [
    { code: "de", label: "Deutsch 🇩🇪" },
    { code: "en", label: "Englisch 🇬🇧" },
    // Bei Bedarf weitere Sprachen ergänzen
  ];

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mt-8 bg-white p-8 rounded-xl shadow-lg space-y-6">
      <h2 className="text-2xl font-bold mb-4 text-coral">Neuen Beitrag erstellen</h2>

      {/* Spracheinstellung */}
      <div>
        <label className="font-semibold mr-2">Sprache
          <Tooltip text="Wähle die Hauptsprache deines Beitrags. Übersetzungen werden automatisch angeboten." />
        </label>
        <select
          className="border rounded px-2 py-1"
          value={language}
          onChange={e => setLanguage(e.target.value)}
        >
          {languageOptions.map(opt =>
            <option key={opt.code} value={opt.code}>{opt.label}</option>
          )}
        </select>
      </div>

      {/* Titel */}
      <input
        type="text"
        className="w-full border rounded px-3 py-2"
        placeholder="Titel (optional)"
        value={title}
        maxLength={100}
        onChange={e => setTitle(e.target.value)}
      />
      {/* Tooltip für Titel */}
      <span className="text-xs text-gray-400">Hilft beim Finden, z. B. für die Übersicht <Tooltip text="Gib deinem Beitrag eine Überschrift für mehr Sichtbarkeit." /></span>

      {/* Summary */}
      <input
        type="text"
        className="w-full border rounded px-3 py-2"
        placeholder="Kurzfassung / Summary (optional)"
        value={summary}
        maxLength={180}
        onChange={e => setSummary(e.target.value)}
      />
      <span className="text-xs text-gray-400">Fasse in 1–2 Sätzen dein Anliegen zusammen <Tooltip text="Kurzbeschreibung für Leser:innen – wird als Vorschau angezeigt." /></span>

      {/* Content / Haupttext */}
      <textarea
        className="w-full border rounded px-3 py-2"
        rows={6}
        required
        placeholder="Dein Beitrag, Anliegen oder Frage..."
        value={content}
        maxLength={2000}
        onChange={e => setContent(e.target.value)}
      />
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>Mindestens 20 Zeichen</span>
        <span>{charCount} / 2000 Zeichen</span>
      </div>
      {charCount > 100 && (
        <div className="text-xs text-turquoise mb-2">👍 Je konkreter dein Beitrag, desto besser die KI-Auswertung!</div>
      )}

      {/* Link-Feld */}
      <div>
        <input
          type="url"
          className="w-full border rounded px-3 py-2 mb-1"
          placeholder="Link hinzufügen (optional)"
          onBlur={e => {
            if (e.target.value) {
              setLinks([...links, e.target.value]);
              e.target.value = "";
            }
          }}
        />
        {/* Tags mit Entfernen */}
        <div className="flex flex-wrap gap-2 mb-2">
          {links.map((l, i) => (
            <span key={i} className="relative px-2 py-1 bg-indigo-50 rounded text-indigo-700 text-xs flex items-center">
              {l}
              <button
                type="button"
                className="ml-1 text-gray-400 hover:text-coral focus:outline-none"
                aria-label="Link entfernen"
                onClick={() => removeLink(i)}
              >×</button>
            </span>
          ))}
        </div>
      </div>

      {/* Drag & Drop FileUpload */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        className={`border-2 border-dashed rounded px-4 py-8 text-center cursor-pointer transition
          ${dragActive ? "border-turquoise bg-turquoise/10" : "border-gray-300 bg-gray-50"}`}
        onClick={() => fileInputRef.current?.click()}
        tabIndex={0}
        aria-label="Dateien hochladen"
      >
        <p className="text-sm text-gray-500">
          Dateien hierher ziehen oder <span className="text-turquoise font-bold underline">durchsuchen</span>
        </p>
        <input
          type="file"
          ref={fileInputRef}
          multiple
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,application/pdf,application/vnd.ms-excel,.xlsx,.csv,.doc,.docx"
        />
      </div>
      {/* Medien-Tags mit Icon und Entfernen */}
      <div className="flex flex-wrap gap-2 mb-2">
        {media.map((file, i) => (
          <span key={i} className="relative px-2 py-1 bg-turquoise/20 rounded text-turquoise-700 text-xs flex items-center">
            <span className="mr-1">{getFileIcon(file)}</span>
            {file.name}
            <button
              type="button"
              className="ml-1 text-gray-400 hover:text-coral focus:outline-none"
              aria-label="Datei entfernen"
              onClick={() => removeFile(i)}
            >×</button>
          </span>
        ))}
      </div>

      {/* Senden-Button */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || charCount < 20}
          className="bg-coral text-white px-6 py-2 rounded font-bold"
        >
          {loading ? "Hochladen & analysieren..." : "Beitrag einreichen"}
        </button>
        {AUTOSAVE_KEY && (
          <span className="text-xs text-turquoise mt-2 ml-2">📝 Entwurf wird automatisch gespeichert</span>
        )}
      </div>

      {/* Ergebnisanzeige */}
      {result && (
        <div className="bg-indigo-50 mt-6 p-4 rounded">
          {success ? (
            <>
              <b className="text-green-700">Beitrag gespeichert & analysiert!</b>
              <div className="mt-2 flex flex-col gap-2">
                <button type="button" className="underline text-turquoise" onClick={() => {
                  setTitle(""); setSummary(""); setContent(""); setLinks([]); setMedia([]); setResult(null); setSuccess(false);
                }}>Neuen Beitrag erstellen</button>
                <a href="/contributions" className="underline text-indigo-700">Zur Übersicht</a>
              </div>
              <pre className="text-xs mt-2 bg-white p-2 rounded border max-h-64 overflow-auto">{JSON.stringify(result, null, 2)}</pre>
            </>
          ) : (
            <>
              <b className="text-coral">Ein Fehler ist aufgetreten!</b>
              <pre className="text-xs mt-2 bg-white p-2 rounded border max-h-64 overflow-auto">{JSON.stringify(result, null, 2)}</pre>
            </>
          )}
        </div>
      )}
    </form>
  );
}
