// features/stream/components/StreamForm.tsx
"use client";
import { useState, useRef, useEffect } from "react";

export default function StreamForm({
  stream,
  onSave,
  onCancel,
  user,
}: {
  stream?: any;
  onSave: () => void;
  onCancel: () => void;
  user?: any;
}) {
  // Multilingual State für Titel und Thema
  const [title, setTitle] = useState(stream?.title || { de: "", en: "" });
  const [topic, setTopic] = useState(stream?.topic || { de: "", en: "" });
  const [activeLang, setActiveLang] = useState<"de" | "en">("de");
  const [status, setStatus] = useState(stream?.status || "Geplant");
  const [date, setDate] = useState(stream?.date ? stream.date.slice(0, 10) : "");
  const [category, setCategory] = useState(stream?.category || "");
  // File Upload
  const [file, setFile] = useState<File | null>(null);
  const [uploadUrl, setUploadUrl] = useState(stream?.imageUrl || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Autofocus und ESC zum Abbrechen
  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    titleRef.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onCancel]);

  // File-Upload Handler (Backend-Endpunkt muss `/api/upload` sein und eine URL zurückgeben)
  async function handleUpload() {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      setUploadUrl(data.url);
    } catch {
      setError("Fehler beim Hochladen");
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate
    if (!title.de.trim() || !topic.de.trim() || !date) {
      setError("Bitte alle Felder korrekt ausfüllen.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...stream,
        title,
        topic,
        status,
        category,
        imageUrl: uploadUrl,
        date: date ? new Date(date).toISOString() : undefined,
        // Geo/profil-Infos aus User
        region: user?.region,
        district: user?.district,
        country: user?.country,
        createdByUserId: user?._id,
        createdByOrgId: user?.roles?.[user.activeRole]?.orgId,
      };

      const res = await fetch("/api/streams", {
        method: stream?._id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Fehler beim Speichern");
      onSave();
    } catch (err: any) {
      setError(err.message || "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-xl mb-6 max-w-lg mx-auto">
      <h2 className="font-semibold text-lg mb-4">
        {stream?._id ? "Stream bearbeiten" : "Stream anlegen"}
      </h2>
      {error && <div className="mb-3 text-red-500">{error}</div>}
      <div className="mb-3">
        <label className="block text-sm mb-1">Titel</label>
        <div className="flex gap-2 mb-2">
          {["de", "en"].map((lang) => (
            <button
              key={lang}
              type="button"
              className={`px-2 py-1 rounded ${activeLang === lang ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
              onClick={() => setActiveLang(lang as "de" | "en")}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
        <input
          ref={titleRef}
          value={title[activeLang]}
          onChange={e => setTitle({ ...title, [activeLang]: e.target.value })}
          className="w-full border rounded p-2"
          required={activeLang === "de"}
        />
      </div>
      <div className="mb-3">
        <label className="block text-sm mb-1">Thema</label>
        <input
          value={topic[activeLang]}
          onChange={e => setTopic({ ...topic, [activeLang]: e.target.value })}
          className="w-full border rounded p-2"
          required={activeLang === "de"}
        />
      </div>
      <div className="mb-3">
        <label>Kategorie</label>
        <input
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full border rounded p-2"
          placeholder="z. B. EU, G7, Kommune…"
        />
      </div>
      <div className="mb-3">
        <label>Status</label>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option value="Geplant">Geplant</option>
          <option value="Live">Live</option>
          <option value="Replay">Replay</option>
          <option value="Vergangen">Vergangen</option>
        </select>
      </div>
      <div className="mb-3">
        <label>Datum *</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
          className="w-full border rounded p-2"
        />
      </div>
      {/* File Upload */}
      <div className="mb-3">
        <label>Bild/Anhang</label>
        <input type="file" accept="image/*,application/pdf,video/*" onChange={e => setFile(e.target.files?.[0] || null)} />
        {file && (
          <button type="button" onClick={handleUpload} disabled={loading} className="ml-2 px-2 py-1 bg-indigo-500 text-white rounded text-xs">
            Hochladen
          </button>
        )}
        {uploadUrl && (
          <div className="mt-2">
            <img src={uploadUrl} alt="Preview" className="max-h-32 rounded border" />
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-4">
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Speichert..." : "Speichern"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-200 px-4 py-2 rounded"
          disabled={loading}
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
