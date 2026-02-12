// apps/web/src/app/profile/page.tsx
import { redirect } from "next/navigation";
import { readSession } from "@/utils/session";
import { getAccountOverview } from "@features/account/service";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await readSession();
  const userId = session?.uid ?? null;
  if (!userId) {
    redirect("/login?next=/profile");
  }

  const overview = await getAccountOverview(userId);
  const shareId = overview?.publicProfile?.shareId ?? overview?.profile?.publicShareId ?? null;
  if (shareId) {
    redirect(`/profile/${shareId}`);
  }

  redirect("/account?profile=share");
}
