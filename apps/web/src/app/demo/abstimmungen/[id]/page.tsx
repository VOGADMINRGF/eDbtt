import DemoVoteDetailPage from "../../votes/[id]/page";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DemoAbstimmungDetailPage({ params, searchParams }: PageProps) {
  return (
    <>
      <h1 className="sr-only">Demo Abstimmungsdetail</h1>
      <DemoVoteDetailPage params={params} searchParams={searchParams} />
    </>
  );
}
