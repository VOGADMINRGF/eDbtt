"use client";
console.log("ContributiontList RENDERT");

import { useEffect, useState, useMemo } from "react";
import ContributionCard from "./ContributionCard"; // Deine Karten-Komponente für einzelne Beiträge

export default function ContributionList({
  admin,
  ngoView,
  presseView,
  politikView,
  readOnly,
  user,
  onEdit,
}: {
  admin?: boolean;
  ngoView?: boolean;
  presseView?: boolean;
  politikView?: boolean;
  readOnly?: boolean;
  user?: any;
  onEdit?: (contribution: any) => void;
}) {
  const [contributions, setContributions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Beiträge vom Server laden
  useEffect(() => {
    fetch("/api/contributions")
      .then((res) => res.json())
      .then((data) => setContributions(data))
      .catch(() => setContributions([]))
      .finally(() => setLoading(false));
  }, []);

  // Filterlogik (Rollen, Suche etc.)
  const filteredContributions = useMemo(() => {
    let list = contributions;

    // Rollenbasierte Filter (optional erweitern)
    if (ngoView && user?.orgId) {
      list = list.filter((c) => c.orgId === user.orgId);
    }
    if (politikView && user?.district) {
      list = list.filter((c) => c.district === user.district);
    }
    // Presse könnte z.B. nur veröffentlichte Beiträge sehen
    if (presseView) {
      list = list.filter((c) => c.status === "published");
    }

    // Suche
    if (search.length > 2) {
      list = list.filter(
        (c) =>
          c.title?.toLowerCase().includes(search.toLowerCase()) ||
          c.summary?.toLowerCase().includes(search.toLowerCase()) ||
          c.content?.toLowerCase().includes(search.toLowerCase())
      );
    }
    return list;
  }, [contributions, ngoView, politikView, presseView, user, search]);

  return (
    <div>
      <div className="flex gap-2 mb-4 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Beiträge suchen (Titel, Inhalt, ...)"
          className="w-full p-2 rounded-xl border border-gray-200 shadow-sm text-base outline-none focus:ring-2 focus:ring-coral"
        />
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-10">Lädt Beiträge…</div>
      ) : filteredContributions.length === 0 ? (
        <div className="text-center text-gray-400 py-10">
          <div style={{ fontSize: 48 }}>📄</div>
          <p>Keine passenden Beiträge gefunden.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredContributions.map((contribution) => (
            <ContributionCard
              key={contribution._id || contribution.id}
              contribution={contribution}
              admin={admin}
              readOnly={readOnly}
              onEdit={onEdit ? () => onEdit(contribution) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
