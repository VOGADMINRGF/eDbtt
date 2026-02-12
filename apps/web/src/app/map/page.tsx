export const dynamic = "force-dynamic";
import MapClientWrapper from "./ClientWrapper";
export default function Page() {
  return (
    <main className="min-h-screen">
      <h1 className="sr-only">Karte</h1>
      <MapClientWrapper />
    </main>
  );
}
