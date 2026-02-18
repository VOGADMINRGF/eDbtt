// apps/web/src/app/report/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/getServerUser";
import ReportPage from "@features/report/components/ReportPage";
import UserHydrator, {
  type User as HydratorUser,
} from "@features/user/components/UserHydrator";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Reports – eDebatte",
  description:
    "Deine Reports zu Dossiers, Themen und Kampagnen. Verifizierte Accounts sehen den vollständigen Export.",
  openGraph: {
    title: "Reports – eDebatte",
    description:
      "Deine Reports zu Dossiers, Themen und Kampagnen. Verifizierte Accounts sehen den vollständigen Export.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Reports – eDebatte",
    description:
      "Deine Reports zu Dossiers, Themen und Kampagnen. Verifizierte Accounts sehen den vollständigen Export.",
  },
};

/** Server→Client User-Shape sicher mappen (id oder _id) */
type UserLike = {
  id?: string;
  _id?: unknown;
  email?: string;
  name?: string | null;
  roles?: string[];
};

/** Server→Client User-Shape sicher mappen (id oder _id) */
function toHydratorUser(u: UserLike | null): HydratorUser | null {
  if (!u) return null;
  return {
    id: String(u.id ?? u._id ?? ""),
    email: u.email ?? "",
    name: u.name ?? null,
    roles: Array.isArray(u.roles) ? u.roles : ["user"],
  };
}

export default async function Page() {
  const user = await getServerUser();
  if (!user || !user.verified) {
    redirect("/login?next=/report&reason=verified-only");
  }

  // TODO: Falls du echte Reports laden willst, hier via triMongo befüllen:
  // const initial = await coreCol("reports").then(col => col.find({ ownerId: user.id }).limit(20).toArray());
  const initial: Array<{ id: string; title: string }> = [];

  return (
    <UserHydrator initialUser={toHydratorUser(user)}>
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white py-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4">
          <header className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600">Reports</p>
            <h1 className="text-2xl font-semibold text-[rgb(var(--fg))] md:text-3xl">Deine Reports</h1>
            <p className="text-sm text-[rgb(var(--muted))]">Berichte zu Dossiers, Themen und Kampagnen. Verifizierte Accounts sehen den vollständigen Export.</p>
          </header>
          <ReportPage initial={initial} />
        </div>
      </main>
    </UserHydrator>
  );
}
