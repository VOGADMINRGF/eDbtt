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

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] py-8 md:py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-7 px-4 pb-28 md:pb-14">
        <header className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-500">Profil-Hub</p>
          <h1 className="text-[1.85rem] font-semibold leading-tight text-[rgb(var(--fg))] md:text-3xl">
            {firstName ? (
              <>
                <span className="bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">{firstName}</span>
                <span className="text-[rgb(var(--fg))]">, dein Profil</span>
              </>
            ) : (
              "Dein Profil"
            )}
          </h1>
          <p className="max-w-xl text-sm text-[rgb(var(--muted))]">
            Mein Profil, meine Interessen und meine Kontakte an einem Ort.
          </p>
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
