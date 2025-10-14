"use client";
console.log("UserAdminList RENDERT");

import { useEffect, useState, useMemo } from "react";
import { IUserProfile } from "../../../apps/web/src/models/pii/UserProfile";

export default function UserAdminList({
  admin,
  moderator,
  orgView,
  readOnly,
  onEdit,
}: {
  admin?: boolean;
  moderator?: boolean;
  orgView?: boolean;
  readOnly?: boolean;
  onEdit?: (user: IUserProfile) => void;
}) {
  const [users, setUsers] = useState<IUserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Lade alle User (Admin/Mod) oder eigene Orga (orgView)
  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  // Filter nach Rolle/Suche/Orga
  const filteredUsers = useMemo(() => {
    let list = users;
    if (orgView) {
      // Annahme: user.roles[0].orgId existiert im Context/Prop
      list = list.filter((u) => 
        u.roles.some(r => r.orgId === users[0]?.roles[0]?.orgId)
      );
    }
    if (search.length > 2) {
      list = list.filter(
        (u) =>
          u.username?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase()) ||
          (u.roles && u.roles.some(r => r.role?.toLowerCase().includes(search.toLowerCase())))
      );
    }
    return list;
  }, [users, orgView, search]);

  return (
    <div>
      <div className="flex gap-2 mb-4 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="User suchen (Name, E-Mail, Rolle)"
          className="w-full p-2 rounded-xl border border-gray-200 shadow-sm text-base outline-none focus:ring-2 focus:ring-coral"
        />
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-10">Lädt User…</div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center text-gray-400 py-10">
          <div style={{ fontSize: 48 }}>👤</div>
          <p>Keine passenden User gefunden.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsers.map((user) => (
            <div
              key={user._id}
              className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm flex flex-col gap-1"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">{user.username}</span>
                <span className="text-xs px-2 py-1 rounded bg-violet-100 text-violet-700">{user.status}</span>
                {user.premium && (
                  <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700">Premium</span>
                )}
                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                  {user.verification}
                </span>
              </div>
              <div className="text-sm text-gray-500 mb-2">{user.email}</div>
              <div className="text-xs mb-2">Rollen: {user.roles.map((r) => r.role).join(", ")}</div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span>TrustScore: <b>{user.trustScore}</b></span>
                <span>Badges: {user.badges.join(", ") || "–"}</span>
                <span>Region(en): {user.regions?.join(", ") || "–"}</span>
                <span>Sprache(n): {user.languages?.join(", ") || "–"}</span>
              </div>
              {onEdit && !readOnly && (
                <button
                  onClick={() => onEdit(user)}
                  className="mt-2 px-3 py-1 rounded bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                >
                  Bearbeiten
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
