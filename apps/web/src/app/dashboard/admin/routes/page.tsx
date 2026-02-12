// apps/web/src/app/dashboard/admin/routes/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

/**
 * Legacy route access dashboard.
 *
 * Route Policies are managed in the Admin Access Center now:
 * - UI: /admin/access
 * - API: /api/admin/access/routes
 */
export default function RoutesDashboardPage() {
  redirect("/admin/access");

  // Fallback content (primarily for semantics/page-contract checks).
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Admin Access</h1>
      <p className="text-sm text-slate-600">
        Diese Seite ist veraltet. Du wirst zur aktuellen Admin Access Ansicht weitergeleitet.
      </p>
      <Link
        href="/admin/access"
        className="inline-flex w-fit items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
      >
        Weiter zu /admin/access
      </Link>
    </main>
  );
}
