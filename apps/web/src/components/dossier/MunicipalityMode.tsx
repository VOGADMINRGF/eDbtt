"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RegionalSuggestions = {
  municipality: string;
  suggestions: string[];
};

type ViewerRole =
  | "citizen"
  | "journalist"
  | "administration"
  | "research"
  | "organization"
  | "admin"
  | "staff";

export default function MunicipalityMode({
  regionalSuggestions,
  viewerRole,
}: {
  regionalSuggestions?: RegionalSuggestions;
  viewerRole: ViewerRole;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  if (!regionalSuggestions?.suggestions?.length) return null;
  const canCreate =
    viewerRole === "admin" ||
    viewerRole === "staff" ||
    viewerRole === "journalist";

  return (
    <section className="vog-card p-6 space-y-4">
      <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">
        Aktuelle Themenvorschläge für {regionalSuggestions.municipality}
      </h3>
      <ul className="ml-5 list-disc text-sm text-[rgb(var(--fg))]">
        {regionalSuggestions.suggestions.map((s) => (
          <li key={s} className="flex flex-wrap items-center justify-between gap-3">
            <span>{s}</span>
            {canCreate ? (
              <button
                type="button"
                className="btn btn-ghost text-xs"
                onClick={async () => {
                  if (loading) return;
                  setLoading(s);
                  try {
                    const res = await fetch("/api/dossier/create-from-suggestion", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({
                        municipality: regionalSuggestions.municipality,
                        title: s,
                      }),
                    });
                    const json = (await res.json()) as { dossierId?: string };
                    if (json?.dossierId) {
                      router.push(`/dossier/${json.dossierId}`);
                    }
                  } finally {
                    setLoading(null);
                  }
                }}
              >
                {loading === s ? "Erstelle…" : "Dossier anlegen"}
              </button>
            ) : (
              <span className="text-[11px] text-[rgb(var(--muted))]">Nur Redaktion/Admin</span>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs text-[rgb(var(--muted))]">
        Vorschläge basieren auf kommunalen Haushalts- und Sitzungsdaten.
      </p>
    </section>
  );
}
