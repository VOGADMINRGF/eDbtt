import type { Metadata } from "next";
import {
  buildQrEntryMetadata,
  renderResolvedQrCodeEntry,
} from "@/features/qr/publicEntry";

/* page-contract: delegated-h1 */

type PageProps = {
  params: Promise<{ qrId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { qrId } = await params;
  return buildQrEntryMetadata(`Teilnahme · ${qrId}`);
}

export default async function PublicQrEntryPage({ params }: PageProps) {
  const { qrId } = await params;
  return renderResolvedQrCodeEntry(qrId);
}
