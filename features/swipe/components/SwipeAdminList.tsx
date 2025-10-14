// features/swipe/components/SwipeAdminList.tsx
"use client";
import { useEffect, useState, useMemo, ChangeEvent } from "react";
import SwipeCard from "./SwipeCard";

type UserLite = { orgId?: string; district?: string };
type Swipe = {
  _id?: string; id?: string;
  title?: string; statement?: string;
  orgId?: string; district?: string;
};

type Props = {
  admin?: boolean;
  moderator?: boolean;
  ngoView?: boolean;
  politikView?: boolean;
  readOnly?: boolean;
  user?: UserLite;
  onEdit?: (swipe: Swipe) => void;
};

export default function SwipeAdminList({
  admin, moderator, ngoView, politikView, readOnly, user, onEdit,
}: Props) {
  const [swipes, setSwipes] = useState<Swipe[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/swipes")
      .then((res) => res.json())
      .then((data: Swipe[]) => setSwipes(data))
      .catch(() => setSwipes([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredSwipes = useMemo(() => {
    let list = swipes;
    if (ngoView && user?.orgId) list = list.filter((s) => s.orgId === user.orgId);
    if (politikView && user?.district) list = list.filter((s) => s.district === user.district);
    if (search.length > 2) {
      const needle = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.title?.toLowerCase().includes(needle) ||
          s.statement?.toLowerCase().includes(needle)
      );
    }
    return list;
  }, [swipes, ngoView, politikView, user, search]);

  return (
    <div>
      <div className="flex gap-2 mb-4 items-center">
        <input
          type="text"
          value={search}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          placeholder="Swipes suchen (Kernbotschaft, ...)"
          className="w-full p-2 rounded-xl border border-gray-200 shadow-sm text-base outline-none focus:ring-2 focus:ring-coral"
        />
      </div>
      {loading ? (
        <div className="text-center text-gray-400 py-10">Lädt Swipes…</div>
      ) : filteredSwipes.length === 0 ? (
        <div className="text-center text-gray-400 py-10">
          <div style={{ fontSize: 48 }}>🧭</div>
          <p>Keine passenden Swipes gefunden.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSwipes.map((swipe) => (
            <SwipeCard
              key={swipe._id || swipe.id}
              swipe={swipe}
              admin={admin}
              moderator={moderator}
              readOnly={readOnly}
              onEdit={onEdit ? () => onEdit(swipe) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
