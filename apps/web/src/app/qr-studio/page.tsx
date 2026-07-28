import type { Metadata } from "next";
import QrStudioBuilderClient from "./QrStudioBuilderClient";
import {
  buildQrEntryMetadata,
  renderResolvedQrCodeEntry,
  renderResolvedQrTargetEntry,
} from "@/features/qr/publicEntry";

/* page-contract: delegated-h1 */

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return "";
}

export const metadata: Metadata = buildQrEntryMetadata("Öffentlicher Einstieg");

export default async function QrStudioPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const code = readParam(resolved.code);
  const target = readParam(resolved.target);
  const caller = readParam(resolved.caller);

  if (code) {
    return renderResolvedQrCodeEntry(code);
  }
  if (target) {
    return renderResolvedQrTargetEntry(target, { caller });
  }
  if (
    readParam(resolved.invalidTarget) ||
    readParam(resolved.targetState) === "blocked"
  ) {
    return renderResolvedQrTargetEntry("", { caller });
  }

  return <QrStudioBuilderClient />;
}
