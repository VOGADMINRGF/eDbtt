// file: app/account/page.tsx
import { redirect } from "next/navigation";
import { AccountClient } from "./AccountClient";
import { getAccountOverview } from "@features/account/service";
import type { AccountOverview } from "@features/account/types";
import { readSession } from "@/utils/session";

export const metadata = {
  title: "Mein Konto & eDebatte · eDebatte",
};

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

function getDisplayName(overview: AccountOverview): string | undefined {
  const value = overview.displayName ?? undefined;
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export default async function AccountPage({ searchParams }: Props) {
  const params = await Promise.resolve(searchParams ?? {});
  const session = await readSession();
  const userId = session?.uid ?? null;

  if (!userId) {
    redirect(`/login?next=${encodeURIComponent("/account")}`);
  }

  const overview = await getAccountOverview(userId);
  if (!overview) {
    redirect(`/login?next=${encodeURIComponent("/account")}`);
  }

  const membershipNotice = readParam(params, "membership") === "thanks";
  const preorderNotice = readParam(params, "preorder") === "thanks";
  const welcomeParam = readParam(params, "welcome");
  const welcomeNotice = Boolean(welcomeParam && ["1", "true", "yes"].includes(welcomeParam));

  const displayName = getDisplayName(overview);
  const firstName = displayName?.trim().split(" ").filter(Boolean)[0] ?? undefined;
  const hasPackage = overview.edebatte?.status ? overview.edebatte.status !== "none" : false;
  const roleCount = overview.roles.length;
  const verificationLevel = overview.verificationLevel ?? "none";
  const preferredLocale = overview.preferredLocale ?? "de";
  const publicProfileReady = Boolean(overview.publicProfile?.bio) && Boolean(overview.publicProfile?.city);

  const accountHighlights = [
    {
      label: "eDebatte-Paket",
      value: hasPackage ? "Aktiv oder vorgemerkt" : "Noch nicht gewählt",
    },
    {
      label: "Verifikation",
      value: verificationLevel === "strong" ? "Vollständig" : verificationLevel === "soft" ? "Basis" : "Offen",
    },
    {
      label: "Öffentliches Profil",
      value: publicProfileReady ? "Vorbereitet" : "Teilweise ausgefüllt",
    },
    {
      label: "Sprache",
      value: preferredLocale === "en" ? "English" : "Deutsch",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white py-8 md:py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pb-12">
        <header className="space-y-2 md:space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600">Konto &amp; eDebatte</p>

          <h1 className="text-2xl font-semibold leading-tight text-[rgb(var(--fg))] md:text-3xl">
            {firstName ? (
              <>
                <span className="bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">{firstName}</span>
                <span className="text-[rgb(var(--fg))]">, dein Profil &amp; dein eDebatte-Paket</span>
              </>
            ) : (
              <span className="bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                Dein Profil &amp; dein eDebatte-Paket
              </span>
            )}
          </h1>

          <p className="max-w-2xl text-xs md:text-sm text-[rgb(var(--muted))]">
            Verwalte deinen Zugang zu eDebatte und dein gewähltes eDebatte-Paket <strong>(Basis, Start oder Pro)</strong>. Hier kannst du
            Profilangaben, Sprache und Benachrichtigungen anpassen.
          </p>
          <p className="text-[11px] text-[rgb(var(--muted))]">
            {roleCount > 0 ? `${roleCount} aktive Rolle(n)` : "Standard-Rolle aktiv"} · Details in
            „Mitgliedschaft & Rollen“.
          </p>
          <ul className="grid gap-2 pt-1 sm:grid-cols-2 lg:grid-cols-4" aria-label="Konto-Status">
            {accountHighlights.map((item) => (
              <li key={item.label} className="rounded-2xl bg-[rgb(var(--card))] px-3 py-2 text-[11px] ring-1 ring-[rgb(var(--border))]">
                <p className="font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">{item.label}</p>
                <p className="mt-1 text-[rgb(var(--fg))]">{item.value}</p>
              </li>
            ))}
          </ul>
          {!hasPackage && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
              Nächster Schritt: Wähle dein eDebatte-Paket (Basis, Start oder Pro).
            </p>
          )}
        </header>

        <AccountClient
          initialData={overview}
          membershipNotice={membershipNotice}
          preorderNotice={preorderNotice}
          welcomeNotice={welcomeNotice}
        />
      </div>
    </main>
  );
}
