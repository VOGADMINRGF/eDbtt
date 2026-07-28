import type { Metadata } from "next";
import QrStudioBuilderClient from "./QrStudioBuilderClient";
import {
  buildQrEntryMetadata,
  renderResolvedQrCodeEntry,
  renderResolvedQrTargetEntry,
} from "@/features/qr/publicEntry";

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

  if (code) {
    return renderResolvedQrCodeEntry(code);
  }
  if (target) {
    return renderResolvedQrTargetEntry(target);
  }
  if (readParam(resolved.invalidTarget)) {
    return renderResolvedQrTargetEntry("");
  }

  return <QrStudioBuilderClient />;
}
