"use client";
import { useState } from "react";

export default function TestInputPage() {
  const [value, setValue] = useState("");
  return (
    <main className="min-h-screen flex flex-col items-center bg-gray-50 pt-16">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="border px-3 py-2 rounded min-w-[320px] min-h-[80px]"
        placeholder="Teste hier, ob alles smooth läuft"
      />
      <div className="mt-4 text-gray-600">
        Wert: <span className="font-mono">{value}</span>
      </div>
    </main>
  );
}
