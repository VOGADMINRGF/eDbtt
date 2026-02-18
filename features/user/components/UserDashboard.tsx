// features/user/components/UserDashboard.tsx

import type { IUserProfile } from "@features/user/types/UserProfile";
import { getNextOnboardingStep, getOnboardingProgress } from "../utils/onboarding";
import { usePermission } from "../hooks/usePermission";

interface UserDashboardProps {
  user: IUserProfile | null;
}

export default function UserDashboard({ user }: UserDashboardProps) {
  const onboardingStep = getNextOnboardingStep(user!);
  const progress = getOnboardingProgress(user!);
  const { can } = usePermission(user);

  if (!user) return <div>Bitte einloggen.</div>;

  return (
    <div className="max-w-lg mx-auto my-8 p-6 rounded-xl bg-[rgb(var(--card))] shadow">
      <h1 className="text-2xl font-bold mb-2">Willkommen, {user.username}!</h1>
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded bg-violet-100 text-violet-700">{user.status}</span>
          {user.premium && <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700">Premium</span>}
          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">{user.verification}</span>
        </div>
        <div className="my-3 h-2 rounded bg-gray-200">
          <div className="h-2 rounded bg-violet-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-sm text-gray-600">{onboardingStep}</div>
      </div>
      <ul className="space-y-2 text-base mt-6">
        {can("writePost") && <li>✍️ Beiträge verfassen</li>}
        {can("vote") && <li>🗳️ An Abstimmungen teilnehmen</li>}
        {can("comment") && <li>💬 Kommentare schreiben</li>}
        {can("premiumFeature") && <li>✨ Exklusive Premium-Statistiken & Auswertungen</li>}
        {can("regionVote") && <li>📍 Regionale Abstimmungen & Bürgerentscheide</li>}
        {can("manageTeam") && <li>👥 Team verwalten (als Orga/Admin)</li>}
      </ul>
      <div className="mt-8 text-sm text-gray-400">
        Deine TrustScore: <b>{user.trustScore}</b> | Badges: {user.badges.join(", ") || "keine"}
      </div>
    </div>
  );
}
