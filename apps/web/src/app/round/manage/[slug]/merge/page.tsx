import { notFound } from "next/navigation";
import {
  canManageTopicRoundMerge,
  getLatestRoundAssistSnapshot,
  getRoundBySlug,
  getTopicBySlug,
} from "@features/topicRound";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import MergeWorkspaceClient from "./MergeWorkspaceClient";

type Params = {
  params: Promise<{ slug: string }>;
};

export default async function RoundMergeWorkspacePage({ params }: Params) {
  const { slug } = await params;
  const round = getRoundBySlug(slug);
  if (!round) notFound();
  const topic = getTopicBySlug(round.topicSlug);
  if (!topic) notFound();

  const sessionUser = await getSessionUser().catch(() => null);
  const roles = Array.isArray(sessionUser?.roles) ? sessionUser.roles.map((item) => String(item).toLowerCase()) : [];
  const canManage = canManageTopicRoundMerge(roles);
  const snapshot = getLatestRoundAssistSnapshot(round.slug);

  return (
    <>
      <h1 className="sr-only">Runden-Zusammenführung</h1>
      <MergeWorkspaceClient
        round={round}
        topic={topic}
        initialSnapshot={snapshot}
        canManage={canManage}
      />
    </>
  );
}
