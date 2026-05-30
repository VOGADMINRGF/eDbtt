import LandingStart from "./LandingStart";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { userIsAdminDashboard } from "@/lib/server/auth/admin";
import { buildStartExperienceModel } from "@/features/start/startExperience";

export default async function StartPage() {
  const user = await getSessionUser();
  const isAdmin = user ? userIsAdminDashboard(user) : false;
  const experience = await buildStartExperienceModel({ user, isAdmin });

  return (
    <main className="min-h-screen">
      <h1 className="sr-only">Start</h1>
      <LandingStart experience={experience} />
    </main>
  );
}
