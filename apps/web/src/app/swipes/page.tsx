import { cookies } from "next/headers";
import { getAccountOverview } from "@features/account/service";
import { readSession } from "@/utils/session";
import type { EDebattePackage } from "@/features/swipes/types";
import { resolveSurfaceContext } from "@/features/surface";
import { SwipesSurface } from "@/features/surfaces/swipes";

export const metadata = {
  title: "Swipes · eDebatte",
};

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function SwipesPage({ searchParams }: Props) {
  const cookieStore = await cookies();
  const session = await readSession();
  const userId = cookieStore.get("u_id")?.value || session?.uid;

  if (!userId) {
    const context = resolveSurfaceContext({ mode: "live", audience: "none", viewerRole: "public", dataSource: "live" });
    return (
      <>
        <h1 className="sr-only">Swipes</h1>
        <SwipesSurface
          context={context}
          edebattePackage="none"
          initialTopic={typeof searchParams?.topic === "string" ? searchParams.topic : ""}
          requireAuthAfterFreeVotes
        />
      </>
    );
  }

  const overview = await getAccountOverview(userId).catch(() => null);
  const edebattePkg: EDebattePackage = (overview as any)?.edebatte?.package ?? "none";

  const initialTopic = typeof searchParams?.topic === "string" ? searchParams.topic : "";
  const context = resolveSurfaceContext({ mode: "live", audience: "none", dataSource: "live" });

  return (
    <>
      <h1 className="sr-only">Swipes</h1>
      <SwipesSurface
        context={context}
        edebattePackage={edebattePkg}
        initialTopic={initialTopic}
        requireAuthAfterFreeVotes={false}
      />
    </>
  );
}
