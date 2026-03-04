import { redirect } from "next/navigation";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BeitraegePage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const query = new URLSearchParams();
  query.set("intent", "contribution");
  for (const [key, value] of Object.entries(params)) {
    if (key === "intent") continue;
    if (Array.isArray(value)) {
      value.forEach((v) => query.append(key, v));
    } else if (typeof value === "string") {
      query.set(key, value);
    }
  }
  const qs = query.toString();
  redirect(qs ? `/create?${qs}` : "/create?intent=contribution");

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-12">
      <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Beitraege</h1>
      <p className="text-sm text-[rgb(var(--muted))]">Du wirst zur Beitragsseite weitergeleitet.</p>
    </main>
  );
}
