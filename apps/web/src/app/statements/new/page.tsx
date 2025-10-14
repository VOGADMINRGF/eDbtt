"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewStatement() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>();
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(undefined);
    try {
      const r = await fetch("/api/statements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: "de" }), // <-- richtiges Feld
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Fehler beim Speichern");
      router.push(`/statements/${j.id}`);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Neues Anliegen</h1>
      <form onSubmit={submit} className="space-y-3">
        <textarea
          className="w-full border rounded px-3 py-2 min-h-[240px]"
          placeholder="Beschreibe dein Anliegen... (wir extrahieren automatisch prüfbare Aussagen)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
        {msg && <p className="text-red-600 text-sm">{msg}</p>}
        <button
          disabled={busy}
          className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {busy ? "…" : "Speichern"}
        </button>
        <p className="text-xs text-neutral-500">
          Hinweis: Du musst dich nicht einloggen. Wir erzeugen den Titel
          automatisch und prüfen dein Anliegen optional.
        </p>
      </form>
    </div>
  );
}
