// apps/web/src/app/dashboard/admin/routes/page.tsx
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
}
