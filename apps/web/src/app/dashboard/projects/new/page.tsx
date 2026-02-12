import { redirect } from "next/navigation";
import { ObjectId, getCol } from "@core/db/triMongo";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { sessionHasPassedTwoFactor, userRequiresTwoFactor } from "@/lib/server/auth/twoFactor";
import { userIsAdminDashboard } from "@/lib/server/auth/roles";
import ProjectForm from "@features/event/components/ProjectForm";

async function ensureProAccess() {
  const user = await getSessionUser();
  if (!user || !user.sessionValid) {
    redirect("/login?next=/dashboard/projects/new");
  }

  // Pro self-serve requires 2FA setup + a session that has passed 2FA.
  if (!userRequiresTwoFactor(user)) {
    redirect("/auth/2fa-setup?next=/dashboard/projects/new");
  }
  if (!sessionHasPassedTwoFactor(user)) {
    redirect("/login?next=/dashboard/projects/new");
  }

  // Admin/Staff duerfen immer
  if (userIsAdminDashboard(user)) return { userId: String(user._id) };

  // Pro-Paket aktiv?
  const Users = await getCol("users");
  const row = await Users.findOne(
    { _id: new ObjectId(String(user._id)) },
    { projection: { edebatte: 1, roles: 1, role: 1 } },
  );
  const pkg = (row as any)?.edebatte?.package;
  const status = (row as any)?.edebatte?.status;
  const roles = Array.isArray((row as any)?.roles) ? (row as any)?.roles : (row as any)?.role ? [(row as any).role] : [];
  const isOrgAdmin = roles.includes("org_admin");

  if (pkg === "pro" && status === "active") return { userId: String(user._id) };
  if (isOrgAdmin && status === "active") return { userId: String(user._id) };

  redirect("/pricing?from=projects");
}

export default async function NewProjectPage() {
  const { userId } = await ensureProAccess();

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-4xl py-10">
        <h1 className="sr-only">Neues Projekt</h1>
        <ProjectForm creatorId={userId} />
      </section>
    </main>
  );
}
