import { redirect } from "next/navigation";
import { buildQrStudioEntryHref, validateQrPublicEntryTarget } from "@features/qr";

type SearchParams = Record<string, string | string[] | undefined>;

function readStringParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const resolvedSearch = searchParams ? await searchParams : {};
  const rawTarget = readStringParam(resolvedSearch.target);
  const validatedTarget = validateQrPublicEntryTarget(rawTarget);

  redirect(
    buildQrStudioEntryHref({
      target: validatedTarget?.target ?? undefined,
      source: "qrcodegenerator",
      invalidTarget: Boolean(rawTarget) && !validatedTarget,
    }),
  );

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))]">
      <h1 className="sr-only">QR-Code Generator</h1>
    </main>
  );
}
