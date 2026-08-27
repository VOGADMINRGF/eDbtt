import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { STUDIO_PATH } from "@/features/qr/security";

/* page-contract: delegated-h1 legacy redirect only */

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Studio · eDebatte",
  description: "Weiterleitung in das eDebatte Studio für QR, Events, Live und Auswertung.",
};

function appendParam(params: URLSearchParams, key: string, value: string | string[] | undefined) {
  if (typeof value === "string" && value.trim()) {
    params.set(key, value.trim());
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      if (item.trim()) params.append(key, item.trim());
    }
  }
}

export default async function LegacyQrStudioPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const params = new URLSearchParams();

  for (const key of [
    "code",
    "target",
    "caller",
    "invalidTarget",
    "targetState",
    "legacy",
  ]) {
    appendParam(params, key, resolved[key]);
  }

  const query = params.toString();
  redirect(query ? `${STUDIO_PATH}?${query}` : STUDIO_PATH);
}
