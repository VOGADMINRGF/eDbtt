import { redirect } from "next/navigation";
import { normalizePackageId } from "@features/pricing";

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  searchParams?: SearchParams;
};

function firstValue(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

function sanitizeNext(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (trimmed.includes("://")) return null;
  return trimmed;
}

export default function RegisterPreorderAliasPage({ searchParams }: Props) {
  const plan = firstValue(searchParams?.plan);
  const paket = firstValue(searchParams?.paket);
  const segment = firstValue(searchParams?.segment);
  const next = sanitizeNext(firstValue(searchParams?.next));

  const normalizedPackage = normalizePackageId(paket ?? plan);
  const params = new URLSearchParams();

  if (normalizedPackage) params.set("paket", normalizedPackage);
  if (segment) params.set("segment", segment);
  if (next) params.set("next", next);
  params.set("source", "register");

  redirect(`/order?${params.toString()}`);

  return (
    <main className="mx-auto min-h-[60vh] max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Paketstart</h1>
      <p className="mt-2 text-sm text-[rgb(var(--muted))]">Du wirst zum Paketstart auf `/order` weitergeleitet.</p>
    </main>
  );
}
