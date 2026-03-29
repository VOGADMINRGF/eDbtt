import { cookies } from "next/headers";
import { readSession } from "@/utils/session";
import { resolveSurfaceContext } from "@/features/surface";
import { SwipesSurface } from "@/features/surfaces/swipes";
import { parseFromDraftParam } from "@/features/swipes/fromDraftParam";

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
    const fromDraftId = parseFromDraftParam(searchParams?.fromDraft);
    return (
      <>
        <h1 className="sr-only">Swipes</h1>
        <SwipesSurface
          context={context}
          initialTopic={typeof searchParams?.topic === "string" ? searchParams.topic : ""}
          fromDraftId={fromDraftId}
          requireAuthAfterFreeVotes
        />
      </>
    );
  }

  const initialTopic = typeof searchParams?.topic === "string" ? searchParams.topic : "";
  const fromDraftId = parseFromDraftParam(searchParams?.fromDraft);
  const context = resolveSurfaceContext({ mode: "live", audience: "none", dataSource: "live" });

  return (
    <>
      <h1 className="sr-only">Swipes</h1>
      <SwipesSurface
        context={context}
        initialTopic={initialTopic}
        fromDraftId={fromDraftId}
        requireAuthAfterFreeVotes={false}
      />
    </>
  );
}
