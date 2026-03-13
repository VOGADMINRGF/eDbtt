import DemoVotesPage from "../votes/page";

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export default async function DemoAbstimmungenPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  return (
    <>
      <h1 className="sr-only">Demo Abstimmungen</h1>
      <DemoVotesPage searchParams={searchParams} />
    </>
  );
}
