"use client";
import { useState } from "react";

export default function NewStatement() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [createdId, setCreatedId] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(""); setCreatedId(null);
    try {
      const t = (await (await fetch("/api/csrf", { cache: "no-store" })).json()).token;
      const res = await fetch("/api/statements", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": t ?? "" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json().catch(()=>({}));
      if (res.ok && data?.ok && data?.id) {
        setCreatedId(String(data.id));
        setMsg("✅ erfolgreich gespeichert (inkl. KI-Analyse).");
        setText("");
      } else {
        setMsg(`❌ Fehler: ${data?.error || res.statusText}`);
      }
    } catch (e:any) {
      setMsg(`❌ Client/Netzwerk: ${e?.message || e}`);
    } finally { setBusy(false); }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Neues Anliegen</h1>
      <form onSubmit={submit} className="space-y-3">
        <textarea className="w-full h-56 border rounded px-3 py-2"
          placeholder="Dein Text…"
          value={text}
          onChange={e=>setText(e.target.value)}
          required
        />
        <button disabled={busy} className="border rounded px-4 py-2 disabled:opacity-50" type="submit">
          {busy ? "Sende…" : "Statement einreichen"}
        </button>
      </form>
      <div className="mt-3 text-sm">
        {msg && <div>{msg}</div>}
        {createdId && (
          <div className="mt-2">
            ID: <code>{createdId}</code> – <a className="underline" href={`/api/statements/${createdId}`}>API</a>
          </div>
        )}
      </div>
    </div>
  );
}
