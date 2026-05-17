import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { userIsAdminDashboard } from "@/lib/server/auth/admin";
import { getRegionOrganizationRuntimeRepo } from "@features/region";
import { AdminOrganizationClaimsClient } from "./AdminOrganizationClaimsClient";

export const metadata = {
  title: "Organisationsanträge prüfen · eDebatte",
};

export default async function AdminOrganizationClaimsPage() {
  const user = await getSessionUser();
  if (!user || !user.sessionValid) {
    redirect(`/login?next=${encodeURIComponent("/admin/organization-claims")}`);
  }
  if (!userIsAdminDashboard(user)) {
    redirect("/account/organization");
  }

  const repo = getRegionOrganizationRuntimeRepo();
  const claims = await repo.listOrganizationClaimsForReview();

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Admin Review
        </p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">Organisationsanträge prüfen</h1>
        <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
          Selbstauskünfte bleiben ohne Rechte. Erst Review erzeugt persistierte Memberships und
          verifizierte Regionenzuordnung.
        </p>
        <p className="text-sm text-[rgb(var(--muted))]">
          Freischaltungen werden getrennt verwaltet.{" "}
          <Link className="font-semibold text-[rgb(var(--fg))]" href="/admin/entitlements">
            Zur Freischaltungsverwaltung
          </Link>
        </p>
      </header>
      <AdminOrganizationClaimsClient initialClaims={claims} />
    </main>
  );
}
