import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

type RegistryPageProps = {
  searchParams?: SearchParams;
};

function firstString(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

function sanitizeInternalRoute(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (trimmed.includes("://")) return null;
  return trimmed;
}

export default function RegistryPage({ searchParams }: RegistryPageProps) {
  const next = sanitizeInternalRoute(firstString(searchParams?.next));
  const lang = firstString(searchParams?.lang);
  const paket = firstString(searchParams?.paket);
  const segment = firstString(searchParams?.segment);

  const params = new URLSearchParams();
  if (next) params.set("next", next);
  if (paket) params.set("paket", paket);
  if (segment) params.set("segment", segment);
  if (lang) params.set("lang", lang);
  params.set("source", "registry");

  redirect(`/register?${params.toString()}`);

  return (
    <main className="sr-only">
      <h1>Registry Redirect</h1>
    </main>
  );
}
