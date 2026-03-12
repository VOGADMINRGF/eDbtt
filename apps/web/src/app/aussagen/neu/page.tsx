import { redirect } from "next/navigation";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function AussagenNeuPage({ searchParams }: PageProps) {
  const params = new URLSearchParams();
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      } else if (typeof value === "string") {
        params.set(key, value);
      }
    }
  }
  if (!params.has("intent")) params.set("intent", "claim");
  const query = params.toString();
  redirect(query ? `/create?${query}` : "/create?intent=claim");
  return (
    <main className="min-h-screen bg-[rgb(var(--bg))]">
      <h1 className="sr-only">Aussage anlegen</h1>
    </main>
  );
}
