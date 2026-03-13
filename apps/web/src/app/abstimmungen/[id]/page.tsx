import VoteDetailPage from "../../votes/[id]/page";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function AbstimmungDetailPage({ params }: PageProps) {
  return (
    <>
      <h1 className="sr-only">Abstimmungsdetail</h1>
      <VoteDetailPage params={params} />
    </>
  );
}
