"use client";
import { useEffect, useState } from "react";

type Item = {
  id: string;
  title: string;
  text: string;
  category?: string;
  createdAt?: string;
  author?: string;
};

export default function BeitraegePage() {
  const [list, setList] = useState<Item[]>([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    setList(await fetch("/api/statements").then((r) => r.json()));
  }
  useEffect(() => {
    load();
  }, []);

  async function create() {
    setErr("");
    const r = await fetch("/api/statements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, text }),
    });
    if (!r.ok) {
      setErr((await r.json()).error || "Fehlgeschlagen");
      return;
    }
    setTitle("");
    setText("");
    await load();
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Beiträge</h1>

      <div className="space-y-2">
        <input
          className="border w-full p-2"
          placeholder="Titel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="border w-full p-2"
          rows={4}
          placeholder="Was möchtest du vorschlagen?"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button
          className="bg-black text-white px-3 py-2 rounded"
          onClick={create}
        >
          Beitrag erstellen
        </button>
      </div>

      <ul className="divide-y">
        {list.map((it) => (
          <li key={it.id} className="py-3">
            <div className="font-medium">{it.title}</div>
            <div className="text-sm text-gray-600">{it.text}</div>
            <div className="text-xs text-gray-400">
              {new Date(it.createdAt ?? Date.now()).toLocaleString()} ·{" "}
              {it.author ?? "?"}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
