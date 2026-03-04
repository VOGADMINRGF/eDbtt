import { redirect } from "next/navigation";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AussagenNeuPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const query = new URLSearchParams();
  query.set("intent", "statement");
  for (const [key, value] of Object.entries(params)) {
    if (key === "intent") continue;
    if (Array.isArray(value)) {
      value.forEach((v) => query.append(key, v));
    } else if (typeof value === "string") {
      query.set(key, value);
    }
  }
  const qs = query.toString();
  redirect(qs ? `/create?${qs}` : "/create?intent=statement");
  return (
    <main className="min-h-screen bg-[rgb(var(--bg))]">
      <h1 className="sr-only">Aussage anlegen</h1>
    </main>
  );
}
