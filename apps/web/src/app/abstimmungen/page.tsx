import VotesPage from "../votes/page";

export const dynamic = "force-dynamic";

export default async function AbstimmungenPage() {
  return (
    <>
      <h1 className="sr-only">Abstimmungen</h1>
      <VotesPage />
    </>
  );
}
