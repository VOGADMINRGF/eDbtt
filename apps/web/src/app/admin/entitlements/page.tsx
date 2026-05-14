import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { userIsAdminDashboard } from "@/lib/server/auth/admin";
import { getRegionEntitlementRuntimeRepo } from "@features/region";
import { AdminEntitlementsClient } from "./AdminEntitlementsClient";

export const metadata = {
  title: "Entitlements · eDebatte",
};

export default async function AdminEntitlementsPage() {
  const user = await getSessionUser();
  if (!user || !user.sessionValid) {
    redirect(`/login?next=${encodeURIComponent("/admin/entitlements")}`);
  }
  if (!userIsAdminDashboard(user)) {
    redirect("/account/organization");
  }

  const repo = getRegionEntitlementRuntimeRepo();
  const entitlements = await repo.listEntitlementsForAdmin();

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Admin Freischaltung
        </p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">Paid Entitlements verwalten</h1>
        <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
          Entitlements ergänzen verifizierte Memberships, ersetzen sie aber nicht. Diese Oberfläche verwaltet
          Pilot-, Trial- und Admin-Grants ohne Checkout, automatische Abbuchung oder Rechnungslogik.
        </p>
      </header>
      <AdminEntitlementsClient initialEntitlements={entitlements} />
    </main>
  );
}
