"use client";
import { useState } from "react";

export default function LanguageSwitcher() {
  const [lang, setLang] = useState("DE");

  const toggleLang = () => {
    setLang((prev) => (prev === "DE" ? "EN" : "DE"));
  };

  return (
    <button
      onClick={toggleLang}
      className="text-sm text-gray-600 hover:underline"
      title="Sprache wechseln"
    >
      {lang}
    </button>
  );
}
