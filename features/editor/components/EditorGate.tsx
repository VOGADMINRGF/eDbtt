// apps/web/src/app/dashboard/editor/components/EditorGate.tsx
"use client";

import { useEffect, useState } from "react";

export default function EditorGate({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("EDITOR_TOKEN") || "";
    if (t) setOk(true);
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    localStorage.setItem("EDITOR_TOKEN", input.trim());
    setOk(true);
  };

  if (!ok) {
    return (
      <div className="mx-auto max-w-md p-6">
        <h1 className="text-xl font-semibold mb-4">Redaktionszugang</h1>
        <p className="text-sm text-gray-600 mb-4">
          Bitte Token eingeben. Du erhältst diesen intern.
        </p>
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            type="password"
            className="flex-1 border rounded px-3 py-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Editor Token"
          />
          <button className="border rounded px-4 py-2">Weiter</button>
        </form>
      </div>
    );
  }
  return <>{children}</>;
}
