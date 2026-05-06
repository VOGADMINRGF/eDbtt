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

function firstParam(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return "";
}

export default async function SwipesPage({ searchParams }: Props) {
  const cookieStore = await cookies();
  const session = await readSession();
  const userId = cookieStore.get("u_id")?.value || session?.uid;

  const initialTopic = firstParam(searchParams?.topic);
  const initialClaim = firstParam(searchParams?.claim);
  const initialStance = firstParam(searchParams?.stance);
  const fromCreate = firstParam(searchParams?.from) === "create";
  if (!userId) {
    const context = resolveSurfaceContext({ mode: "live", audience: "none", viewerRole: "public", dataSource: "live" });
    const fromDraftId = parseFromDraftParam(searchParams?.fromDraft);
    const showWelcomeHint = searchParams?.welcome === "1";
    return (
      <>
        <h1 className="sr-only">Swipes</h1>
        <SwipesSurface
          context={context}
          initialTopic={initialTopic}
          initialClaim={initialClaim}
          initialStance={initialStance}
          fromCreate={fromCreate}
          fromDraftId={fromDraftId}
          requireAuthAfterFreeVotes
          showWelcomeHint={showWelcomeHint}
        />
      </>
    );
  }

  const fromDraftId = parseFromDraftParam(searchParams?.fromDraft);
  const showWelcomeHint = searchParams?.welcome === "1";
  const context = resolveSurfaceContext({ mode: "live", audience: "none", dataSource: "live" });

  return (
    <>
      <h1 className="sr-only">Swipes</h1>
      <SwipesSurface
        context={context}
        initialTopic={initialTopic}
        initialClaim={initialClaim}
        initialStance={initialStance}
        fromCreate={fromCreate}
        fromDraftId={fromDraftId}
        requireAuthAfterFreeVotes={false}
        showWelcomeHint={showWelcomeHint}
      />
    </>
  );
}
