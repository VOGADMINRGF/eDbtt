// OrgDashboard.tsx

import React from "react";
// ⬇️ V2: default statt named; type-only, damit bei Klassen/Interfaces kein Runtime-Import entsteht
import type Organization from "../models/Organization";
import { isOrgPremium, canAddMoreMembers } from "../utils/orgHelper";

interface OrgDashboardProps {
  org: Organization | null;
}

// Hilfstyp: Element-Typ aus Organization["members"], ohne Annahmen über ein externes Interface
type OrgMember = NonNullable<Organization> extends { members: infer M }
  ? M extends Array<infer T>
    ? T
    : never
  : never;

export default function OrgDashboard({ org }: OrgDashboardProps) {
  if (!org) {
    return <div className="max-w-xl mx-auto my-8 p-6 bg-white shadow rounded-xl">Keine Organisation ausgewählt.</div>;
  }

  const premium = isOrgPremium(org);
  const allowInvite = canAddMoreMembers(org);
  const members = Array.isArray(org.members) ? org.members : [];

  return (
    <div className="max-w-xl mx-auto my-8 p-6 bg-white shadow rounded-xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <div className="mt-2 text-sm text-neutral-700 leading-6">
            <div>
              Status:{" "}
              {org.verified ? (
                <span className="inline-flex items-center gap-1 text-green-700">
                  ✅ <span>Verifiziert</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-700">
                  ⚠️ <span>Nicht verifiziert</span>
                </span>
              )}
            </div>
            <div>
              Account:{" "}
              {premium ? (
                <span className="inline-flex items-center gap-1 text-violet-700">
                  🌟 <span>Premium</span>
                </span>
              ) : (
                <span>Standard</span>
              )}
            </div>
          </div>
        </div>

        {/* (Optional) kleines Badge rechts */}
        <div className="shrink-0">
          <span
            className={`px-2 py-1 rounded text-xs font-semibold border ${
              premium ? "bg-violet-50 border-violet-200 text-violet-700" : "bg-neutral-50 border-neutral-200 text-neutral-700"
            }`}
            aria-label={premium ? "Premium-Organisation" : "Standard-Organisation"}
          >
            {premium ? "Premium" : "Standard"}
          </span>
        </div>
      </header>

      <section className="mt-5">
        <h2 className="text-lg font-semibold">Mitglieder</h2>

        {members.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-600">Noch keine Mitglieder.</p>
        ) : (
          <ul className="list-disc ml-5 mt-2">
            {members.map((member: OrgMember, idx: number) => (
              <li key={(member as any)?.userId ?? idx} className="text-sm">
                {(member as any)?.userId ?? "unbekannt"}
                {((member as any)?.subRole && (
                  <span className="text-neutral-500"> ({(member as any).subRole})</span>
                )) ||
                  null}
              </li>
            ))}
          </ul>
        )}

        {allowInvite ? (
          <button
            className="mt-4 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded transition disabled:opacity-60"
            type="button"
            aria-label="Mitglied hinzufügen"
            onClick={() => {
              // TODO: Invite-Dialog öffnen
              alert("Mitglied hinzufügen (bald verfügbar)");
            }}
          >
            Mitglied hinzufügen
          </button>
        ) : (
          <p className="mt-4 text-red-600 text-sm">Maximale Mitgliederzahl erreicht.</p>
        )}
      </section>
    </div>
  );
}
