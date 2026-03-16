import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SwipesClient } from "../SwipesClient";
import { readSession } from "@/utils/session";

export const metadata = {
  title: "Swipe-Karte · eDebatte",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SwipeDetailPage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const session = await readSession();
  const userId = cookieStore.get("u_id")?.value || session?.uid;
  const nextUrl = `/swipes/${id}`;

  if (!userId) {
    redirect(`/login?next=${encodeURIComponent(nextUrl)}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white pb-12">
      <h1 className="sr-only">Swipe-Karte</h1>
      <SwipesClient focusStatementId={id} variant="solo" />
    </main>
  );
}
