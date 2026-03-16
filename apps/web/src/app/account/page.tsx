// file: app/account/page.tsx
import { redirect } from "next/navigation";
import { AccountClient } from "./AccountClient";
import { getAccountOverview } from "@features/account/service";
import type { AccountOverview } from "@features/account/types";
import { readSession } from "@/utils/session";
import {
  FiCheckCircle,
  FiGlobe,
  FiPackage,
  FiShield,
  FiSearch,
} from "react-icons/fi";
import type { IconType } from "react-icons";

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
      icon: FiPackage,
      tone: hasPackage ? "text-emerald-300 bg-emerald-500/10 ring-emerald-400/30" : "text-sky-300 bg-sky-500/10 ring-sky-400/30",
    },
    {
      label: "Verifikation",
      value: verificationLevel === "strong" ? "Vollständig" : verificationLevel === "soft" ? "Basis" : "Offen",
      icon: FiShield,
      tone: verificationLevel === "strong" ? "text-emerald-300 bg-emerald-500/10 ring-emerald-400/30" : "text-amber-300 bg-amber-500/10 ring-amber-400/30",
    },
    {
      label: "Öffentliches Profil",
      value: publicProfileReady ? "Vorbereitet" : "Teilweise ausgefüllt",
      icon: FiGlobe,
      tone: publicProfileReady ? "text-cyan-300 bg-cyan-500/10 ring-cyan-400/30" : "text-slate-300 bg-slate-500/10 ring-slate-400/30",
    },
    {
      label: "Sprache",
      value: preferredLocale === "en" ? "English" : "Deutsch",
      icon: FiCheckCircle,
      tone: "text-sky-300 bg-sky-500/10 ring-sky-400/30",
    },
  ] satisfies Array<{ label: string; value: string; icon: IconType; tone: string }>;

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] py-8 md:py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-7 px-4 pb-28 md:pb-14">
        <header className="space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600">Konto &amp; eDebatte</p>

          <h1 className="text-[1.9rem] font-semibold leading-tight text-[rgb(var(--fg))] md:text-3xl">
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
            Verwalte deinen Zugang zu eDebatte und dein gewähltes eDebatte-Paket <strong>(Basis, Start oder Pro)</strong>. Im Fokus stehen hier
            deine Selbstdarstellung, Interessen und Kontakte.
          </p>
          <p className="text-[11px] text-[rgb(var(--muted))]">
            {roleCount > 0 ? `${roleCount} aktive Rolle(n)` : "Standard-Rolle aktiv"} · Profil, Interessen und Inbox zentral gepflegt.
          </p>
          <ul className="flex gap-2 overflow-x-auto pb-1 pt-0.5" aria-label="Konto-Status">
            {accountHighlights.map((item) => (
              <li
                key={item.label}
                className="shrink-0 rounded-full bg-[rgb(var(--card))] px-2.5 py-1.5 text-[11px] ring-1 ring-[rgb(var(--border))]"
              >
                <div className="flex items-center gap-2">
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ring-1 ${item.tone}`}>
                    <item.icon className="h-3 w-3" aria-hidden />
                  </span>
                  <p className="font-medium text-[rgb(var(--fg))]">
                    <span className="text-[rgb(var(--muted))]">{item.label}:</span> {item.value}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {!hasPackage && (
            <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-[rgb(var(--card))] px-3 py-1.5 text-[11px] font-semibold text-[rgb(var(--muted))] ring-1 ring-[rgb(var(--border))]">
              <FiSearch className="h-3.5 w-3.5 shrink-0 text-sky-400" aria-hidden />
              <span className="truncate">Nächster Schritt: Profiltext, Interessen und erste Kontakte.</span>
            </div>
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
