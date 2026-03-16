import VotesPage from "../votes/page";

export const dynamic = "force-dynamic";

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export default async function AbstimmungenPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  return (
    <>
      <h1 className="sr-only">Abstimmungen</h1>
      <VotesPage searchParams={searchParams} />
    </>
  );
}
