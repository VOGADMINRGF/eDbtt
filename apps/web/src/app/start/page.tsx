import LandingStart from "./LandingStart";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { userIsAdminDashboard } from "@/lib/server/auth/admin";
import { buildStartExperienceModel } from "@/features/start/startExperience";

/* page-contract: delegated-h1 */

export default async function StartPage() {
  const user = await getSessionUser();
  const isAdmin = user ? userIsAdminDashboard(user) : false;
  const experience = await buildStartExperienceModel({ user, isAdmin });

  return (
    <main className="min-h-[100svh]">
      <LandingStart experience={experience} />
    </main>
  );
}
